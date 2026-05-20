import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthModule } from '@modules/auth/src/auth.module';
import { UsersModule } from '@modules/users/src';
import { WalletModule } from '@modules/wallet/wallet.module';
import { TermiiModule } from '@modules/termii/termii.module';
import { OtpServiceModule } from '@modules/otp/otp.module';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    WalletModule,
    TermiiModule,
    OtpServiceModule,
  ],
  controllers: [AuthController],
})
export class AuthControllerModule {}
