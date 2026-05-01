import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersModule } from '@modules/users/src';
import { AuthModule } from '@modules/auth/src/auth.module';

@Module({
  imports: [UsersModule, AuthModule],
  controllers: [UsersController],
})
export class UsersControllerModule {}
