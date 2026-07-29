import { cookies } from "next/headers";
import eventService from "@/services/Event/Event";
import { EventStatus } from "@/services/Event/Event.dto";
import ErrorPage from "./ErrorPage";
import GiftRoomPage from "./GiftRoom";

interface Props {
  params: Promise<{ giftRoomSlug: string }>;
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
export default async function Page({ params }: Props) {
  const { giftRoomSlug } = await params;
  const event = await getEvent(giftRoomSlug);
  console.log(`eventId: ${event?.id}`);
  if (!event) return null;

  const eventData = {
    eventId: event.id,
    eventName: event.title,
  };
  if (event.status === EventStatus.DRAFT) {
    return <ErrorPage error="This event has not yet started" />;
  }
  return <GiftRoomPage eventData={eventData} />;
}
