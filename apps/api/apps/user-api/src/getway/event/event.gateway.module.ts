import { EventServiceModule } from '@modules/event/event.module';
import { LeaderboardServiceModule } from '@modules/leaderboard/leaderboard.module';
import { RealtimeModule } from '@modules/RealtimeGateway/RealtimeGateway.module';
import { Module } from '@nestjs/common';
import { EventGateway } from './event.gateway';

@Module({
  imports: [EventServiceModule, LeaderboardServiceModule, RealtimeModule],
  providers: [EventGateway],
})
export class EventGatewayModule {}
