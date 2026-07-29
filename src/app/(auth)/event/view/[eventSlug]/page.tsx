import { cookies } from "next/headers";
import eventService from "@/services/Event/Event";
import EventDetailPage from "./EventDetails/EventDetails";

interface PageProps {
  params: Promise<{ eventSlug: string }>;
}
async function getEvent(eventId: string) {
  try {
    const token = (await cookies()).get("accessToken")?.value;
    if (!token) return;
    const service = eventService(token);
    return await service.getEvent(eventId);
  } catch (e) {
    console.log(e);
  }
}

export default async function Page({ params }: PageProps) {
  const { eventSlug } = await params;
  const event = await getEvent(eventSlug);
  if (!event) return null;
  return <EventDetailPage event={event} />;
}
