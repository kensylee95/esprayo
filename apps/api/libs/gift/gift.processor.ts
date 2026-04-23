import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { LeaderboardService } from '@modules/leaderboard/leaderboard.service';
import { GiftService } from './gift.service';
import { RealtimeGatewayService } from '@modules/RealtimeGateway/RealtimeGateway.service';
@Processor('gifts')
export class GiftProcessor extends WorkerHost {
  constructor(
    private readonly leaderboardService: LeaderboardService,
    private readonly giftService: GiftService,
    private readonly realtime: RealtimeGatewayService,
  ) {
    super();
  }

  async process(job: Job<any>): Promise<void> {
    const { eventId, displayName, giftName, giftEmoji, tokens } = job.data;

    // 1. Persist gift (IMPORTANT)
    await this.giftService.saveGift(job.data);

    // 2. Fetch fresh leaderboard
    const leaderboard = await this.leaderboardService.getTop(eventId, 20);
    const totalTokens = await this.leaderboardService.getTotalTokens(eventId);

    // 3. Emit realtime update
    this.realtime.emitToEvent(eventId, 'leaderboard:update', {
      leaderboard,
      totalTokens,
      latestGift: { displayName, giftName, giftEmoji, tokens },
    });
  }
}