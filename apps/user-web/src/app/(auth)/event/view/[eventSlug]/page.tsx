import SplashScreen from "@/ui/Splash/Splash";

interface PageProps {
  params: Promise<{ eventSlug: string }>;
}
export default async function Page({ params }: PageProps) {
  const { eventSlug } = await params;
  console.log(eventSlug);
  return <SplashScreen />;
}
