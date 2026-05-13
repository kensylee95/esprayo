import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { LeaderboardService } from '@modules/leaderboard/leaderboard.service';
import { GiftService } from './gift.service';
import { RealtimeGatewayService } from '@modules/RealtimeGateway/RealtimeGateway.service';
import { SocketEvents } from '@app/socket-events';
import { BROADCAST_GIFT_EVENT } from './job.constants';
import { BroadcastGiftJob } from './dtos/gift.dto';
import { REDIS_CLIENT } from '@modules/redis/redis.module';
import Redis from 'ioredis';

@Processor('gifts')
export class GiftProcessor extends WorkerHost {
  private readonly logger = new Logger(GiftProcessor.name);

  constructor(
    private readonly leaderboardService: LeaderboardService,
    private readonly giftService: GiftService,
    private readonly realtime: RealtimeGatewayService,
    @Inject(REDIS_CLIENT)
    private readonly redis: Redis,
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
      transactionId,
    } = job.data;

    const lock = await this.redis.set(
      `gift:processed:${transactionId}`,
      '1',
      'EX',
      86400,
      'NX',
    );

    if (!lock) return;

    try {
      // 1. State mutation — leaderboard + persist
      const [updated] = await Promise.all([
        this.leaderboardService.addGift(
          eventId,
          userId,
          displayName,
          tokens,
          giftEmoji,
        ),
        this.giftService.saveGift(job.data),
      ]);

      // 2. Read side
      const [leaderboard, totalTokens] = await Promise.all([
        this.leaderboardService.getTop(eventId, 20),
        this.leaderboardService.getTotalTokens(eventId),
      ]);

      // 3. Broadcast
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
      console.error('Gift processing failed', { jobId: job.id, err });
      throw err;
    }
  }
} 