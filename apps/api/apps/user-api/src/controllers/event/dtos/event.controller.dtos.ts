import { EventStatus, EventType } from "@modules/event/entities/event.entity";

export interface EventDTO {
  title: string;
  description?: string | undefined;
  type: EventType;
  welcomeMessage?: string;
  venue?: string;
}

export interface UpdateEventDto {
  slug: string; 
  title:string; 
  description:string; 
  status: EventStatus;  
  type: EventType; 
  welcomeMessage: string; 
}