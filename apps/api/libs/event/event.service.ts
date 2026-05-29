import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';

import Redis from 'ioredis';
import { customAlphabet } from 'nanoid';

import { Event, EventStatus } from './entities/event.entity';
import { EventCreateDTO } from './dtos/event.dto';
import { EventRedisKeys } from '@app/redis-keys';
import {
  ApplyGiftParams,
  ApplyGiftResult,
  EventStats,
  EventRedisHash,
  EventBalanceRedisUpdate,
  ActivateEventResponse,
  EndEventResponse,
  TopGifter,
  brandSlug,
} from './dtos/event.dto';
import { Gift } from '@modules/gift/entities/gift.entity';
import { Socket } from 'socket.io';
import { REDIS_CLIENT } from '@modules/redis/redis.module';

const nanoid = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 5);

@Injectable()
export class EventService {
  constructor(
    @Inject(REDIS_CLIENT)
    private readonly redis: Redis,
    @InjectRepository(Event)
    private readonly eventRepo: Repository<Event>,

    @InjectRepository(Gift)
    private readonly giftRepo: Repository<Gift>,

    private readonly dataSource: DataSource,
  ) {}

  // ─── Create ──────────────────────────────────────────────────────────────

  async createEvent(hostId: string, dto: EventCreateDTO): Promise<Event> {
    const slug = brandSlug(await this.generateUniqueSlug());

    const entity: Partial<Event> = {
      ...dto,
      hostId,
      welcomeMessage: dto.welcomeMessage,
      slug,
      startsAt: new Date(),
      endsAt: new Date(),
      status: EventStatus.DRAFT,
      tokenBalance: 0,
      nairaBalance: 0,
      giftCount: 0,
      gifterCount: 0,
      tokenRateNaira: 10,
    };

    const saved: Event = await this.eventRepo.save(
      this.eventRepo.create(entity),
    );

    // EventRedisHash.status is EventStatus enum — cast to string for ioredis
    const redisHash: Record<string, string> = {
      title: saved.title,
      hostId: saved.hostId,
      status: saved.status as string,
      slug: saved.slug,
      tokenBalance: '0',
      nairaBalance: '0',
      giftCount: '0',
      gifterCount: '0',
    } satisfies Record<keyof EventRedisHash, string>;

    await this.redis.hset(EventRedisKeys.event(saved.id), redisHash);

    return saved;
  }

  // ─── Activate ────────────────────────────────────────────────────────────

  async activateEvent(
    eventId: string,
    hostId: string,
  ): Promise<ActivateEventResponse> {
    const event = await this.findOrFail(eventId);
    this.assertHost(event, hostId);

    if (event.status !== EventStatus.DRAFT) {
      throw new BadRequestException(
        `Event is already ${event.status}. Only draft events can be activated.`,
      );
    }

    event.status = EventStatus.ACTIVE;
    const saved: Event = await this.eventRepo.save(event);

    await this.redis.hset(EventRedisKeys.event(eventId), {
      status: EventStatus.ACTIVE as string,
    });

    const ttl = Math.max(
      86400,
      Math.floor((new Date(event.endsAt).getTime() - Date.now()) / 1000) +
        86400,
    );
    await this.redis.expire(EventRedisKeys.leaderboard(eventId), ttl);

    const response: ActivateEventResponse = {
      id: saved.id,
      status: saved.status,
      slug: saved.slug,
      startsAt: saved.startsAt,
      endsAt: saved.endsAt,
    };
    return response;
  }

  // ─── End event ───────────────────────────────────────────────────────────

  async endEvent(eventId: string, hostId: string): Promise<EndEventResponse> {
    const event = await this.findOrFail(eventId);
    this.assertHost(event, hostId);

    if (event.status !== EventStatus.ACTIVE) {
      throw new BadRequestException('Only active events can be ended.');
    }

    event.status = EventStatus.ENDED;
    const saved: Event = await this.eventRepo.save(event);

    await this.redis.hset(EventRedisKeys.event(eventId), {
      status: EventStatus.ENDED as string,
    });

    const response: EndEventResponse = {
      id: saved.id,
      status: saved.status,
      tokenBalance: Number(saved.tokenBalance),
      nairaBalance: Number(saved.nairaBalance),
      giftCount: saved.giftCount,
      gifterCount: saved.gifterCount,
    };
    return response;
  }

  // ─── Apply a gift ────────────────────────────────────────────────────────

  async applyGift(params: ApplyGiftParams): Promise<ApplyGiftResult> {
    const {
      eventId,
      guestId,
      displayName,
      nairaValue,
      cumulativeScore,
      rankAtTime,
      isNewGifter,
    } = params;

    return this.dataSource.transaction(async (manager) => {
      const event = await manager
        .createQueryBuilder(Event, 'e')
        .where('e.id = :id', { id: eventId })
        .setLock('pessimistic_write')
        .getOne();

      if (!event) throw new NotFoundException('Event not found');
      if (event.status !== EventStatus.ACTIVE) {
        throw new BadRequestException('Event is not currently active');
      }

      const gift = manager.create(Gift);
      Object.assign(gift, {
        eventId,
        guestId: guestId ?? undefined,
        displayName,
        nairaValue,
        cumulativeTokens: cumulativeScore,
        rankAtTime,
      });
      await manager.save(Gift, gift);

      await manager.increment(
        Event,
        { id: eventId },
        'nairaBalance',
        nairaValue,
      );
      await manager.increment(Event, { id: eventId }, 'giftCount', 1);
      if (isNewGifter) {
        await manager.increment(Event, { id: eventId }, 'gifterCount', 1);
      }

      const updated = await manager.findOneByOrFail(Event, { id: eventId });

      const balanceUpdate: EventBalanceRedisUpdate = {
        tokenBalance: String(updated.tokenBalance),
        nairaBalance: String(updated.nairaBalance),
        giftCount: String(updated.giftCount),
        gifterCount: String(updated.gifterCount),
      };
      await this.redis.hset(EventRedisKeys.event(eventId), balanceUpdate);

      // Event and Gift entities satisfy IEvent and IGift structurally
      return { event: updated, gift };
    });
  }

  // ─── Queries ─────────────────────────────────────────────────────────────

  async getEvent(eventId: string): Promise<Event> {
    return this.findOrFail(eventId);
  }

  async getEventBySlug(slug: string): Promise<Event> {
    const event = await this.eventRepo.findOneBy({ slug: slug.toUpperCase() });
    if (!event) throw new NotFoundException(`No event found with code ${slug}`);
    return event;
  }

  async getHostEvents(hostId: string): Promise<Event[]> {
    return this.eventRepo.find({
      where: { hostId },
      order: { createdAt: 'DESC' },
    });
  }

  async getEventStats(eventId: string): Promise<EventStats> {
    const event = await this.findOrFail(eventId);

    const topGifterRaw = await this.giftRepo
      .createQueryBuilder('g')
      .select('g."displayName"', 'displayName')
      .addSelect('SUM(g.tokens)', 'total')
      .where('g."eventId" = :eventId', { eventId })
      .groupBy('g."displayName"')
      .orderBy('total', 'DESC')
      .limit(1)
      .getRawOne<{ displayName: string; total: string }>();

    const recentGifts = await this.giftRepo.find({
      where: { eventId },
      order: { createdAt: 'DESC' },
      take: 10,
    });

    const topGifter: TopGifter | null = topGifterRaw
      ? {
          displayName: topGifterRaw.displayName,
          total: Number(topGifterRaw.total),
        }
      : null;

    const stats: EventStats = {
      tokenBalance: Number(event.tokenBalance),
      nairaBalance: Number(event.nairaBalance),
      giftCount: event.giftCount,
      gifterCount: event.gifterCount,
      topGifter,
      recentGifts,
    };
    return stats;
  }

  async updateEvent(
    eventId: string,
    hostId: string,
    dto: EventCreateDTO,
  ): Promise<Event> {
    const event = await this.findOrFail(eventId);
    this.assertHost(event, hostId);

    if (event.status === EventStatus.ENDED) {
      throw new BadRequestException('Cannot update an ended event');
    }

    Object.assign(event, dto);
    return this.eventRepo.save(event);
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  private async findOrFail(id: string): Promise<Event> {
    const event = await this.eventRepo.findOneBy({ id });
    if (!event) throw new NotFoundException('Event not found');
    return event;
  }

  private assertHost(event: Event, hostId: string): void {
    if (event.hostId !== hostId) {
      throw new ForbiddenException(
        'Only the event host can perform this action',
      );
    }
  }

  private async generateUniqueSlug(): Promise<string> {
    let slug: string;
    let exists = true;
    do {
      slug = nanoid();
      exists = !!(await this.eventRepo.findOneBy({ slug }));
    } while (exists);
    return slug;
  }

  async validateAndReseedEvent(eventId: string, client: Socket) {
    // ── 1. Check event status from Redis (O(1), no DB) ──────────────────────
    const status = await this.redis.hget(
      EventRedisKeys.event(eventId),
      'status',
    );

    // ── 2. Redis miss — re-hydrate from Postgres then re-check ───────────────
    if (status !== EventStatus.ACTIVE) {
      const event = await this.getEvent(eventId).catch(() => null);

      if (!event) {
        client.emit('room:error', { message: 'Event not found.' });
        return;
      }

      // Re-seed Redis so future joins are fast
      await this.redis.hset(
        EventRedisKeys.event(EventRedisKeys.event(eventId)),
        {
          title: event.title,
          hostId: event.hostId,
          status: event.status as string,
          slug: event.slug,
          tokenBalance: String(event.tokenBalance),
          nairaBalance: String(event.nairaBalance),
          giftCount: String(event.giftCount),
          gifterCount: String(event.gifterCount),
        },
      );
      return event.status;
    }
    return status;
  }
}
