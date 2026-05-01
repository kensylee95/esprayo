import NameScreen from "@/ui/NameScreen/NameScreen";

interface Props {
  params: Promise<{ giftRoomSlug: string }>;
}
export default async function Page({ params }: Props) {
  const { giftRoomSlug } = await params;
  return <NameScreen eventId={giftRoomSlug} />;
}
