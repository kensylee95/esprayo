import { Module } from '@nestjs/common';
import { PushController } from './push.controller';
import { PushModule } from '@modules/push/push.module';

@Module({
  imports: [PushModule],
  controllers: [PushController],
})
export class PushControllerModule {}
