import { request } from "@/helpers/request";
import { type IEvent, MAX_RECENT, RECENT_EVENT_IDS_KEY } from "./Event.dto";

export type EventDTO = {
  title: string;
  type: string;
  venue?: string;
  coverImageUrl?: string | undefined;
  welcomeMessage?: string;
};

export type UpdateEventDto = Partial<EventDTO>;

const eventService = (token?: string) => ({
  // CREATE EVENT
  createEvent(payload: EventDTO): Promise<IEvent> {
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
  getMyEvents(): Promise<IEvent[]> {
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

  saveRecentEventId(id: string) {
    const existing: string[] = JSON.parse(
      localStorage.getItem(RECENT_EVENT_IDS_KEY) || "[]",
    );

    // Remove duplicate, add to front, trim to max
    const updated = [id, ...existing.filter((e) => e !== id)].slice(
      0,
      MAX_RECENT,
    );

    localStorage.setItem(RECENT_EVENT_IDS_KEY, JSON.stringify(updated));
  },

  getRecentEventIds(): string[] {
    return JSON.parse(localStorage.getItem(RECENT_EVENT_IDS_KEY) || "[]");
  },
});

export default eventService;
