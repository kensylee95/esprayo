"use client";

import { EventProvider } from "./event.context";

export default function LayoutClient({
  slug,
  children,
}: {
  slug: string;
  children: React.ReactNode;
}) {
  return <EventProvider slug={slug}>{children}</EventProvider>;
}
