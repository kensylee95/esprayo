import GiftRoomPage from "./GiftRoom";

interface Props {
  params: Promise<{ eventId: string }>;
}

export default async function Page({ params }: Props) {
  const { eventId } = await params;
  const eventData = {
    eventId,
    eventName: "Ade's Wedding",
  };

  return <GiftRoomPage eventData={eventData} />;
}
