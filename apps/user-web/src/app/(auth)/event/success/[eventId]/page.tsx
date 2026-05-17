import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import eventService from "@/services/Event/Event";
import SuccessPage from "./SuccessPage";

interface PageProps {
  params: Promise<{ eventId: string }>;
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

export default async function page({ params }: PageProps) {
  const { eventId } = await params;
  const event = await getEvent(eventId);
  if (!event) return notFound();
  return <SuccessPage event={event} />;
}
