import { CurrentUser } from '@modules/auth/src';
import { EventService } from '@modules/event/event.service';
import { SupabaseStorageService } from '@modules/superbase-storage/superbase-storage.service';
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { EventDTO, UpdateEventDto } from './dtos/event.controller.dtos';

@Controller('events')
export class EventController {
  constructor(
    private readonly eventService: EventService,
    private readonly storage: SupabaseStorageService,
  ) {}

  // CREATE EVENT
  @Post()
  @UseInterceptors(
    FileInterceptor('coverImage', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  @Post()
  createEvent(@CurrentUser('id') userId: string, @Body() dto: EventDTO) {
    return this.eventService.createEvent(userId, { ...dto });
  }

  // GET SINGLE EVENT
  @Get(':eventId')
  getEvent(@Param('eventId') eventId: string) {
    return this.eventService.getEvent(eventId);
  }

  // GET EVENT BY SLUG
  @Get('slug/:slug')
  getBySlug(@Param('slug') slug: string) {
    return this.eventService.getEventBySlug(slug);
  }

  // GET HOST EVENTS
  @Get('host/me')
  getMyEvents(@CurrentUser('id') userId: string) {
    return this.eventService.getHostEvents(userId);
  }

  // GET EVENT STATS
  @Get(':eventId/stats')
  getStats(@Param('eventId') eventId: string) {
    return this.eventService.getEventStats(eventId);
  }

  // UPDATE EVENT
  @Patch(':eventId')
  updateEvent(
    @Param('eventId') eventId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateEventDto,
  ) {
    return this.eventService.updateEvent(eventId, userId, dto);
  }

  // ACTIVATE EVENT
  @Post(':eventId/activate')
  activateEvent(
    @Param('eventId') eventId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.eventService.activateEvent(eventId, userId);
  }

  // END EVENT
  @Post(':eventId/end')
  endEvent(
    @Param('eventId') eventId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.eventService.endEvent(eventId, userId);
  }
}
