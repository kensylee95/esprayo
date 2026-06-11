import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import eventService from "@/services/Event/Event";
import LeaderboardDisplayPage from "./LeaderboardDisplay";

interface PageProps {
  params: Promise<{ eventSlug: string }>;
}
async function getEvent(eventSlug: string) {
  try {
    const token = (await cookies()).get("accessToken")?.value;
    if (!token) return;
    const service = eventService(token);
    return await service.getBySlug(eventSlug);
  } catch (e) {
    console.log(e);
  }
}

export default async function Page({ params }: PageProps) {
  const { eventSlug } = await params;
  const event = await getEvent(eventSlug);
  if (!event) return notFound();
  return <LeaderboardDisplayPage event={event} />;
}
