import { EventServiceModule } from '@modules/event/event.module';
import { LeaderboardServiceModule } from '@modules/leaderboard/leaderboard.module';
import { Module } from '@nestjs/common';
import { EventGateway } from './event.gateway';
import { WalletModule } from '@modules/wallet/wallet.module';
import { RedisProviderModule } from '@modules/redis/redis.module';
import { GiftServiceModule } from '@modules/gift/gift.module';

@Module({
  imports: [
    EventServiceModule,
    LeaderboardServiceModule,
    WalletModule,
    RedisProviderModule,
    GiftServiceModule,
  ],
  providers: [EventGateway],
})
export class EventGatewayModule {}
