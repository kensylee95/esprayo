import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import pushConfig from './push.config';
import { PushService } from './push.service';
import { PushSubscription } from './entities/push.subscription.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forFeature([PushSubscription]),
    ConfigModule.forFeature(pushConfig),
  ],
  providers: [PushService],
  exports: [PushService],
})
export class PushModule {}
