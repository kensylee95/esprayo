import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { LeaderboardService } from '@modules/leaderboard/leaderboard.service';
import { GiftService } from './gift.service';
import { RealtimeGatewayService } from '@modules/RealtimeGateway/RealtimeGateway.service';
import { SocketEvents } from '@app/socket-events';
import { BROADCAST_GIFT_EVENT } from './job.constants';
import { BroadcastGiftJob } from './dtos/gift.dto';

@Processor('gifts')
export class GiftProcessor extends WorkerHost {
  private readonly logger = new Logger(GiftProcessor.name);

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
      newScore,
      giftId,
    } = job.data;

    // 1. Persist gift record — isolated so a DB failure doesn't block broadcast
    try {
      await this.giftService.saveGift(job.data);
      console.log('🎁 Processing job', job.name, job.data.eventId);
    } catch (err) {
      this.logger.error(
        `saveGift failed — continuing to broadcast | eventId=${eventId}`,
        err instanceof Error ? err.stack : err,
      );
    }

    // 2. Fetch fresh leaderboard + total tokens concurrently
    const [leaderboard, totalTokens] = await Promise.all([
      this.leaderboardService.getTop(eventId, 20),
      this.leaderboardService.getTotalTokens(eventId),
    ]);

    // 3. Broadcast leaderboard update to all clients in the room
    this.realtime.emitTo(
      `gift-room:${eventId}`,
      SocketEvents.leaderboardUpdate,
      {
        leaderboard,
        totalTokens,
      },
    );

    // 4. Broadcast gift notification separately so all clients can show
    //    the gift animation/banner, not just the sender
    this.realtime.emitTo(`gift-room:${eventId}`, SocketEvents.giftReceived, {
      displayName,
      giftName,
      giftEmoji,
      tokens,
      newScore,
      giftId,
    });
  }
}
