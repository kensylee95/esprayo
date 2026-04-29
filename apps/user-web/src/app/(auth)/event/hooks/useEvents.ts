// hooks/useEvent.ts
"use client";

import eventService, { EventDTO, UpdateEventDto } from "@/services/Event/Event";
import { useCallback, useState } from "react"

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

    createEvent: (payload: EventDTO) =>
      run(() => eventService.createEvent(payload)),

    getEvent: (eventId: string) =>
      run(() => eventService.getEvent(eventId)),

    getBySlug: (slug: string) =>
      run(() => eventService.getBySlug(slug)),

    getMyEvents: () =>
      run(() => eventService.getMyEvents()),

    getStats: (eventId: string) =>
      run(() => eventService.getStats(eventId)),

    updateEvent: (eventId: string, payload: UpdateEventDto) =>
      run(() => eventService.updateEvent(eventId, payload)),

    activateEvent: (eventId: string) =>
      run(() => eventService.activateEvent(eventId)),

    endEvent: (eventId: string) =>
      run(() => eventService.endEvent(eventId)),

    clearError: () => setError(null),
  };
}