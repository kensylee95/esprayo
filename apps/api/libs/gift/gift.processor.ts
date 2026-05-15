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
import { giftCountKey } from '../../constants';

@Processor('gifts', { concurrency: 2 })
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

    // Idempotency check — if already processed, skip everything including broadcast
    // Use SET NX so only the first worker through does the work
    const lock = await this.redis.set(
      `gift:processed:${transactionId}`,
      '1',
      'EX',
      86400,
      'NX',
    );

    if (!lock) {
      this.logger.log('gift.already.processed', {
        jobId: job.id,
        transactionId,
      });
      return;
    }

    try {
      // 1. State mutation — leaderboard + persist concurrently
      // saveGift uses ON CONFLICT DO NOTHING so safe on retry
      // leaderboardService.addGift uses Redis ZADD so also idempotent
      const [updated] = await Promise.all([
        this.leaderboardService.addGift(
          eventId,
          userId,
          displayName,
          tokens,
          giftEmoji,
        ),
        this.giftService.saveGift(job.data),
        this.redis.incr(giftCountKey(eventId)),
      ]);

      // 2. Read side
      const [leaderboard, totalTokens, totalGifts] = await Promise.all([
        this.leaderboardService.getTop(eventId, 20),
        this.leaderboardService.getTotalTokens(eventId),
        this.giftService.getEventGiftCount(eventId),
      ]);

      // 3. Broadcast
      this.realtime.emitTo(
        `gift-room:${eventId}`,
        SocketEvents.leaderboardUpdate,
        { leaderboard, totalTokens, totalGifts },
      );

      this.realtime.emitTo(`gift-room:${eventId}`, SocketEvents.giftReceived, {
        displayName,
        giftName,
        giftEmoji,
        tokens,
        newScore: updated.score,
        giftId,
      });
    } catch (err: unknown) {
      // Release lock on failure so the job can be retried cleanly
      await this.redis.del(`gift:processed:${transactionId}`).catch((e) => {
        if (e instanceof Error) {
          this.logger.error(e.message, { e });
        }
        this.logger.error('gift.lock.cleanup.failed');
      });

      this.logger.error(
        `Gift processing failed (jobId=${job.id})`,
        err instanceof Error ? err.stack : String(err),
      );

      throw err;
    }
  }
}
