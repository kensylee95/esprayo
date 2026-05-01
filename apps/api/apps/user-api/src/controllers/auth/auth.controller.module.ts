import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthModule } from '@modules/auth/src/auth.module';
import { UsersModule } from '@modules/users/src';

@Module({
  imports: [AuthModule, UsersModule],
  controllers: [AuthController],
})
export class AuthControllerModule {}
