import { request } from "@/helpers/request";
import type { IEvent } from "./Event.dto";

export type EventDTO = {
  title: string;
  type: string;
  venue?: string;
  welcomeMessage?: string;
};

export type UpdateEventDto = Partial<EventDTO>;

const eventService = (token?: string) => ({
  // CREATE EVENT
  createEvent(payload: EventDTO) {
    return request("/events", {
      method: "POST",
      body: JSON.stringify(payload),
      token,
    });
  },

  // GET SINGLE EVENT
  getEvent(eventId: string): Promise<IEvent> {
    return request(`/events/${eventId}`, { token });
  },

  // GET EVENT BY SLUG
  getBySlug(slug: string): Promise<IEvent> {
    return request(`/events/slug/${slug}`, { token });
  },

  // GET MY EVENTS
  getMyEvents() {
    return request("/events/host/me", { token });
  },

  // GET EVENT STATS
  getStats(eventId: string) {
    return request(`/events/${eventId}/stats`, { token });
  },

  // UPDATE EVENT
  updateEvent(eventId: string, payload: UpdateEventDto) {
    return request(`/events/${eventId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
      token,
    });
  },

  // ACTIVATE EVENT
  activateEvent(eventId: string) {
    return request(`/events/${eventId}/activate`, {
      method: "POST",
      token,
    });
  },

  // END EVENT
  endEvent(eventId: string) {
    return request(`/events/${eventId}/end`, {
      method: "POST",
      token,
    });
  },
});

export default eventService;
