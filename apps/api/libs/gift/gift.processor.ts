import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { LeaderboardService } from '@modules/leaderboard/leaderboard.service';
import { GiftService } from './gift.service';
import { RealtimeGatewayService } from '@modules/RealtimeGateway/RealtimeGateway.service';
import { SocketEvents } from '@app/socket-events';
import { BROADCAST_GIFT_EVENT } from './job.constants';
import { BroadcastGiftJob } from './dtos/gift.dto';
import Redis from 'ioredis';
import { RedisService } from '@liaoliaots/nestjs-redis';

@Processor('gifts')
export class GiftProcessor extends WorkerHost {
  private readonly logger = new Logger(GiftProcessor.name);
  private readonly redis: Redis;
  constructor(
    private readonly leaderboardService: LeaderboardService,
    private readonly giftService: GiftService,
    private readonly realtime: RealtimeGatewayService,

  ) {
    super();
  }

async process(job: Job<BroadcastGiftJob>): Promise<void> {
  if (job.name !== BROADCAST_GIFT_EVENT) return;

  const {
    eventId,
    displayName,
    giftName,
    giftEmoji,
    tokens,
    giftId,
    userId,
  } = job.data;

  const lock = await this.redis.set(
    `gift:processed:${giftId}`,
    '1',
    'EX',
    86400,
    'NX',
  );

  if (!lock) return;

  try {
    // 1. state mutation (safe, once only)
    const updated = await this.leaderboardService.addGift(
      eventId,
      userId,
      displayName,
      tokens,
      giftEmoji,
    );

    await this.giftService.saveGift(job.data);

    // 2. read side
    const [leaderboard, totalTokens] = await Promise.all([
      this.leaderboardService.getTop(eventId, 20),
      this.leaderboardService.getTotalTokens(eventId),
    ]);

    // 3. broadcast
    this.realtime.emitTo(
      `gift-room:${eventId}`,
      SocketEvents.leaderboardUpdate,
      { leaderboard, totalTokens },
    );

    this.realtime.emitTo(
      `gift-room:${eventId}`,
      SocketEvents.giftReceived,
      {
        displayName,
        giftName,
        giftEmoji,
        tokens,
        newScore: updated.score,
        giftId,
      },
    );
  } catch (err) {
    this.logger.error('Gift processing failed', err);
  }
}
}
