import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthModule } from '@modules/auth/src/auth.module';
import { UsersModule } from '@modules/users/src';
import { WalletModule } from '@modules/wallet/wallet.module';

@Module({
  imports: [AuthModule, UsersModule, WalletModule],
  controllers: [AuthController],
})
export class AuthControllerModule {}
