import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { LeaderboardService } from '@modules/leaderboard/leaderboardmodule.service';

@Processor('gifts')
export class GiftProcessor extends WorkerHost {
  @WebSocketServer()
  server: Server;

  constructor(private readonly leaderboardService: LeaderboardService) {
    super();
  }

  /**
   * Every gift goes through this processor.
   * It fetches the fresh leaderboard and emits to all clients in the event room.
   */
  async process(job: Job<{
    eventId: string;
    userId: string;
    displayName: string;
    giftName: string;
    giftEmoji: string;
    tokens: number;
    newScore: number;
  }>): Promise<void> {
    const { eventId, displayName, giftName, giftEmoji, tokens } = job.data;

    // Fetch the fresh top-20 leaderboard
    const leaderboard = await this.leaderboardService.getTop(eventId, 20);
    const totalTokens = await this.leaderboardService.getTotalTokens(eventId);

    // Emit to the event room — all connected clients (guests + display screen) receive this
    if (this.server) {
      this.server.to(`event:${eventId}`).emit('leaderboard:update', {
        leaderboard,
        totalTokens,
        latestGift: { displayName, giftName, giftEmoji, tokens },
      });
    }
  }
}