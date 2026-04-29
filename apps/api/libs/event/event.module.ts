import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EventService } from './event.service';

import { Event} from './entities/event.entity';
import { Gift } from '@modules/gift/entities/gift.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Event, Gift])
  ],
  providers: [EventService],
  exports: [EventService],
})
export class EventServiceModule {}