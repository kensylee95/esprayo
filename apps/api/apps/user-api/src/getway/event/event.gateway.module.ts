import { EventServiceModule } from '@modules/event/event.module';
import { LeaderboardServiceModule } from '@modules/leaderboard/leaderboard.module';
import { Module } from '@nestjs/common';
import { EventGateway } from './event.gateway';

@Module({
  imports: [EventServiceModule, LeaderboardServiceModule],
  providers: [EventGateway],
})
export class EventGatewayModule {}
