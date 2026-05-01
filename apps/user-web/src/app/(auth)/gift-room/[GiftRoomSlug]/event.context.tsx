'use client';

import { createContext, useContext } from 'react';

type EventContextType = {
  slug: string;
};

const EventContext = createContext<EventContextType | null>(null);

export function EventProvider({
  slug,
  children,
}: {
  slug: string;
  children: React.ReactNode;
}) {
  return (
    <EventContext.Provider value={{ slug }}>
      {children}
    </EventContext.Provider>
  );
}

export function useEvent() {
  const ctx = useContext(EventContext);

  if (!ctx) {
    throw new Error('useEvent must be used inside EventProvider');
  }

  return ctx;
}