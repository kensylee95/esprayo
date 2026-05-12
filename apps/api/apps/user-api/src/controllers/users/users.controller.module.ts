import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersModule } from '@modules/users/src';
import { AuthModule } from '@modules/auth/src/auth.module';
import { WalletModule } from '@modules/wallet/wallet.module';

@Module({
  imports: [UsersModule, AuthModule, WalletModule],
  controllers: [UsersController],
})
export class UsersControllerModule {}
