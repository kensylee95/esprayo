import { Module } from '@nestjs/common';
import { WalletController } from './wallet.controller';
import { WalletModule } from '@modules/wallet/wallet.module';

@Module({
  imports: [WalletModule],
  controllers: [WalletController],
})
export class WalletsControllerModule {}
