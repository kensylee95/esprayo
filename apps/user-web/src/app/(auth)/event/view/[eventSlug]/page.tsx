interface PageProps {
  params: Promise<{ eventSlug: string }>;
}
export default async function Page({ params }: PageProps) {
  const { eventSlug } = await params;
  console.log(eventSlug);
  return <div></div>;
}
