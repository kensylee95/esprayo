import { EventServiceModule } from '@modules/event/event.module';
import { LeaderboardServiceModule } from '@modules/leaderboard/leaderboard.module';
import { Module } from '@nestjs/common';
import { EventGateway } from './event.gateway';
import { WalletModule } from '@modules/wallet/wallet.module';

@Module({
  imports: [EventServiceModule, LeaderboardServiceModule, WalletModule],
  providers: [EventGateway],
})
export class EventGatewayModule {}
