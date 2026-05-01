import type { ReactNode } from "react";
import LayoutClient from "./layout.client";

type Props = {
  params: Promise<{ giftRoomSlug: string }>;
  children: ReactNode;
};

export default async function Layout({ params, children }: Props) {
  const { giftRoomSlug } = await params;

  return <LayoutClient slug={giftRoomSlug}>{children}</LayoutClient>;
}
