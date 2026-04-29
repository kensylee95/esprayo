import { CurrentUser } from '@modules/auth/src';
import { EventService } from '@modules/event/event.service';
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import type { EventDTO, UpdateEventDto } from './dtos/event.controller.dtos';
import { EventStatus } from '@modules/event/entities/event.entity';


@Controller('events')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  // CREATE EVENT
  @Post()
  createEvent(@CurrentUser("id") userId:string, @Body() dto: EventDTO) {    
    return this.eventService.createEvent(userId, dto);
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
  getMyEvents(@CurrentUser("id") userId: string) {
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
    @CurrentUser("id") userId: string,
    @Body() dto: UpdateEventDto,
  ) {
    return this.eventService.updateEvent(eventId, userId, dto);
  }

  // ACTIVATE EVENT
  @Post(':eventId/activate')
  activateEvent(
    @Param('eventId') eventId: string,
    @CurrentUser("id") userId: string,
  ) {
    return this.eventService.activateEvent(eventId, userId);
  }

  // END EVENT
  @Post(':eventId/end')
  endEvent(
    @Param('eventId') eventId: string,
    @CurrentUser("id") userId: string,
  ) {
    return this.eventService.endEvent(eventId, userId);
  }
}