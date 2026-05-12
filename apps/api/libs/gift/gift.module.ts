import { Module } from '@nestjs/common';
import { GiftService } from './gift.service';
import { LeaderboardServiceModule } from '@modules/leaderboard/leaderboard.module';
import { GiftProcessor } from './gift.processor';
import { WalletModule } from '@modules/wallet/wallet.module';
import { BullModule } from '@nestjs/bullmq';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Gift } from './entities/gift.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Gift]),
    LeaderboardServiceModule,
    WalletModule,
    BullModule.registerQueue({
      name: 'gifts',
    }),
  ],
  providers: [GiftService, GiftProcessor],
  exports: [GiftService, GiftProcessor],
})
export class GiftServiceModule {}
