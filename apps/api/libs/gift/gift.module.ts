import { Module } from '@nestjs/common';

import { BullModule } from '@nestjs/bullmq';

import { TypeOrmModule } from '@nestjs/typeorm';

import { GiftService } from './gift.service';

import { GiftPersistProcessor } from './gift-persist.processor';

import { WalletModule } from '@modules/wallet/wallet.module';

import { RedisProviderModule } from '@modules/redis/redis.module';

import { LeaderboardServiceModule } from '@modules/leaderboard/leaderboard.module';

import { Gift } from './entities/gift.entity';
import { GIFTS_PERSIST_QUEUE } from './job.constants';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Gift]),

    LeaderboardServiceModule,

    WalletModule,

    RedisProviderModule,

    BullModule.registerQueue({
      name: GIFTS_PERSIST_QUEUE,
    }),
  ],

  providers: [GiftService, GiftPersistProcessor],

  exports: [GiftService],
})
export class GiftServiceModule {}
