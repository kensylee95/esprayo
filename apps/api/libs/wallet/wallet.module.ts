import { Module } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Wallet } from './entities/wallet.entity';
import { RedisProviderModule } from '@modules/redis/redis.module';
import { BullModule } from '@nestjs/bullmq';
import { WalletProcessor } from './wallet.processor';

@Module({
  imports: [
    TypeOrmModule.forFeature([Wallet]),
    RedisProviderModule,
    BullModule.registerQueue({
      name: 'wallet',
    }),
  ],
  providers: [WalletService, WalletProcessor],
  exports: [WalletService],
})
export class WalletModule {}
