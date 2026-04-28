import NameScreen from "@/ui/NameScreen/NameScreen";

interface Props {
  params: Promise<{ eventId: string }>;
}
export default async function Page({ params }: Props) {
  const { eventId } = await params;
  return <NameScreen eventId={eventId} />;
}
