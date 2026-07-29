// hooks/useEvent.ts
"use client";

import { useCallback, useState } from "react";
import eventService, {
  type EventDTO,
  type UpdateEventDto,
} from "@/services/Event/Event";

export function useEvent() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async <T>(fn: () => Promise<T>) => {
    try {
      setLoading(true);
      setError(null);

      const data = await fn();
      return data;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";

      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,

    createEvent: (payload: EventDTO, token: string) =>
      run(() => eventService(token).createEvent(payload)),

    getEvent: (eventId: string, token: string) =>
      run(() => eventService(token).getEvent(eventId)),

    getBySlug: (slug: string, token: string) =>
      run(() => eventService(token).getBySlug(slug)),

    getMyEvents: (token: string) =>
      run(() => eventService(token).getMyEvents()),

    getStats: (eventId: string, token: string) =>
      run(() => eventService(token).getStats(eventId)),

    updateEvent: (eventId: string, payload: UpdateEventDto, token: string) =>
      run(() => eventService(token).updateEvent(eventId, payload)),

    activateEvent: (eventId: string, token: string) =>
      run(() => eventService(token).activateEvent(eventId)),

    endEvent: (eventId: string, token: string) =>
      run(() => eventService(token).endEvent(eventId)),

    clearError: () => setError(null),
  };
}
