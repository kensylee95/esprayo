import { Module } from '@nestjs/common';
import { EventServiceModule } from '@modules/event/event.module';
import { EventController } from './event.controller';
import { SupabaseStorageModule } from '@modules/superbase-storage/superbase-storage.module';

@Module({
  imports: [EventServiceModule, SupabaseStorageModule],
  controllers: [EventController],
})
export class EventControllerModule {}
