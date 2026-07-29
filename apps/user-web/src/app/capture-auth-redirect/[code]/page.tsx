import { notFound } from "next/navigation";
import TokenPage from "./TokenPage";

interface PageProps {
  params: Promise<{ code: string }>;
}

export default async function Page({ params }: PageProps) {
  const { code } = await params;
  if (!code) return notFound();

  return <TokenPage code={code} />;
}
