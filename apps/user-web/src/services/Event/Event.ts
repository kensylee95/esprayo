// services/event.service.ts

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export type EventDTO = {
  title: string;
  type: string;
  venue?: string;
  welcomeMessage?: string;
};

export type UpdateEventDto = Partial<EventDTO>;

async function request<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw new Error(error?.message || "Something went wrong");
  }

  return res.json();
}

 const eventService = {
  // CREATE EVENT
  createEvent(payload: EventDTO) {
    return request("/events", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  // GET SINGLE EVENT
  getEvent(eventId: string) {
    return request(`/events/${eventId}`);
  },

  // GET EVENT BY SLUG
  getBySlug(slug: string) {
    return request(`/events/slug/${slug}`);
  },

  // GET MY EVENTS
  getMyEvents() {
    return request("/events/host/me");
  },

  // GET EVENT STATS
  getStats(eventId: string) {
    return request(`/events/${eventId}/stats`);
  },

  // UPDATE EVENT
  updateEvent(eventId: string, payload: UpdateEventDto) {
    return request(`/events/${eventId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  // ACTIVATE EVENT
  activateEvent(eventId: string) {
    return request(`/events/${eventId}/activate`, {
      method: "POST",
    });
  },

  // END EVENT
  endEvent(eventId: string) {
    return request(`/events/${eventId}/end`, {
      method: "POST",
    });
  },
};
export default eventService