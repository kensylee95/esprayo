import { cookies } from "next/headers";
import eventService from "@/services/Event/Event";
import EventsList from "./EventList/EventList";
export const dynamic = "force-dynamic";

export default async function Page() {
  async function getEvents() {
    const cookie = await cookies();
    try {
      const token = cookie.get("accessToken")?.value;
      if (!token) return [];

      const service = eventService(token);
      return await service.getMyEvents();
    } catch (e) {
      console.error(e);
      return [];
    }
  }
  const userEvents = await getEvents();
  return <EventsList userEvents={userEvents} />;
}
