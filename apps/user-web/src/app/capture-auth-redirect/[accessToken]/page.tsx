import { notFound } from "next/navigation";
import TokenPage from "./TokenPage";

interface PageProps {
  params: Promise<{ accessToken: string }>;
}

export default async function Page({ params }: PageProps) {
  const { accessToken } = await params;
  if (!accessToken) return notFound();

  return <TokenPage accessToken={accessToken} />;
}
