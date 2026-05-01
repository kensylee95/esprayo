import { Module } from '@nestjs/common';
import { EventServiceModule } from '@modules/event/event.module';
import { EventController } from './event.controller';

@Module({
  imports: [EventServiceModule],
  controllers: [EventController],
})
export class EventControllerModule {}
