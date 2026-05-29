import { Inject, Injectable, Logger } from '@nestjs/common';

import { InjectQueue } from '@nestjs/bullmq';

import { Queue } from 'bullmq';

import Redis from 'ioredis';

import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { WalletService } from '../wallet/wallet.service';

import {
  LeaderboardService,
  type LeaderboardEntry,
} from '@modules/leaderboard/leaderboard.service';

import { Gift } from './entities/gift.entity';

import {
  BroadcastGiftJob,
  GiftPayload,
  GiftResult,
  SaveGiftInput,
} from './dtos/gift.dto';

import { GIFTS_PERSIST_QUEUE, PERSIST_GIFT_EVENT } from './job.constants';

import { REDIS_CLIENT } from '@modules/redis/redis.module';

import { giftCountKey, giftLockKey } from '../../constants';
import { RealtimeGatewayService } from '@modules/RealtimeGateway/RealtimeGateway.service';
import { SocketEvents } from '@app/socket-events';

@Injectable()
export class GiftService {
  private readonly logger = new Logger(GiftService.name);

  constructor(
    @Inject(REDIS_CLIENT)
    private readonly redis: Redis,

    @InjectRepository(Gift)
    private readonly giftRepo: Repository<Gift>,

    private readonly realtime: RealtimeGatewayService,

    @InjectQueue(GIFTS_PERSIST_QUEUE)
    private readonly persistQueue: Queue,

    private readonly walletService: WalletService,

    private readonly leaderboardService: LeaderboardService,
  ) {}

  async sendGift(payload: GiftPayload): Promise<GiftResult | null> {
    const locked = await this.redis.set(
      giftLockKey(payload.reference),
      '1',
      'EX',
      86400,
      'NX',
    );
    if (!locked) return null;

    const jobData: BroadcastGiftJob = {
      eventId: payload.eventId,
      userId: payload.userId,
      displayName: payload.displayName,
      denomination: payload.denomination,
      nairaValue: payload.amount,
      transactionId: payload.reference,
    };

    try {
      const newBalance = await this.walletService.debit({
        userId: payload.userId,
        amount: payload.amount,
        reference: payload.reference,
      });

      // 1. persist first — debit succeeded, we must not lose this
      await this.persistQueue.add(PERSIST_GIFT_EVENT, jobData, {
        attempts: 10,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: true,
      });

      // 2. leaderboard update
      const { score, rank, totalScore, totalGifts } =
        await this.leaderboardService.addGiftFull(
          payload.eventId,
          payload.userId,
          payload.displayName,
          payload.amount,
          payload.denomination,
          giftCountKey(payload.eventId),
        );

      // 3. broadcast — best-effort, never throws up
      try {
        this.realtime.emitTo(
          `gift-room:${payload.eventId}`,
          SocketEvents.giftReceived,
          {
            displayName: payload.displayName,
            newScore: score,
            newRank: rank,
          },
        );

        this.realtime.emitTo(
          `gift-room:${payload.eventId}`,
          SocketEvents.leaderboardUpdate,
          {
            patch: {
              userId: payload.userId,
              displayName: payload.displayName,
              newScore: score,
              newRank: rank,
            },
            totalScore,
            totalGifts,
          },
        );
      } catch (broadcastErr) {
        this.logger.warn(
          'realtime broadcast failed — gift persisted and leaderboard updated',
          broadcastErr instanceof Error
            ? broadcastErr.stack
            : String(broadcastErr),
        );
      }

      return { success: true, newBalance };
    } catch (err) {
      await this.redis
        .del(giftLockKey(payload.reference))
        .catch((cleanupErr: unknown) => {
          this.logger.error(
            'gift.cleanup failed',
            cleanupErr instanceof Error ? cleanupErr.stack : String(cleanupErr),
          );
        });

      throw err;
    }
  }

  async creditUserAccount(
    userId: string,
    tokens: number,
    paymentReference: string,
  ): Promise<number> {
    return this.walletService.credit({
      userId,
      amount: tokens,
      reference: paymentReference,
    });
  }

  async saveGift(input: SaveGiftInput): Promise<Gift> {
    const result = await this.giftRepo
      .createQueryBuilder()
      .insert()
      .into(Gift)
      .values({
        eventId: input.eventId,
        guestId: input.userId,
        displayName: input.displayName,
        nairaValue: input.nairaValue,
        cumulativeTokens: input.cumulativeTokens ?? 0,
        transactionId: input.transactionId,
        rankAtTime: input.rankAtTime,
      })
      .orIgnore()
      .returning('*')
      .execute();
    const raw = result.raw as Gift[];

    if (raw.length > 0) {
      const savedGift = raw[0];
      return savedGift;
    }

    return this.giftRepo.findOneByOrFail({
      transactionId: input.transactionId,
    });
  }

  async getEventGiftCount(eventId: string): Promise<number> {
    const value = await this.redis.get(giftCountKey(eventId));

    return Number(value ?? '0');
  }

  async getLeaderBoard(
    eventId: string,
    limit: number,
  ): Promise<{
    leaderboard: LeaderboardEntry[];
    totalTokens: number;
  }> {
    const [leaderboard, totalTokens] = await Promise.all([
      this.leaderboardService.getTop(eventId, limit),
      this.leaderboardService.getTotalScore(eventId),
    ]);

    return {
      leaderboard,
      totalTokens,
    };
  }

  async setExpiry(eventId: string, ttlSeconds = 86400): Promise<void> {
    await this.redis.expire(giftCountKey(eventId), ttlSeconds);
  }
}
