import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { LeaderboardService } from '@modules/leaderboard/leaderboard.service';
import { GiftService } from './gift.service';
import { RealtimeGatewayService } from '@modules/RealtimeGateway/RealtimeGateway.service';
import { SocketEvents } from '@app/socket-events';
import { EventRedisKeys } from '@app/redis-keys';
import { BROADCAST_GIFT_EVENT } from './job.constants';
import { BroadcastGiftJob } from './dtos/gift.dto';
@Processor('gifts')
export class GiftProcessor extends WorkerHost {
  constructor(
    private readonly leaderboardService: LeaderboardService,
    private readonly giftService: GiftService,
    private readonly realtime: RealtimeGatewayService,
  ) {
    super();
  }

  async process(job: Job<BroadcastGiftJob>): Promise<void> {
    if (job.name === BROADCAST_GIFT_EVENT) {
      const { eventId, displayName, giftName, giftEmoji, tokens } = job.data;

      // 1. Persist gift (IMPORTANT)
      await this.giftService.saveGift(job.data);

      // 2. Fetch fresh leaderboard
      const leaderboard = await this.leaderboardService.getTop(eventId, 20);
      const totalTokens = await this.leaderboardService.getTotalTokens(eventId);

      // 3. Emit realtime update
      this.realtime.emitTo(
        EventRedisKeys.event(eventId),
        SocketEvents.leaderboardUpdate,
        {
          leaderboard,
          totalTokens,
          latestGift: { displayName, giftName, giftEmoji, tokens },
        },
      );
    }
  }
}
