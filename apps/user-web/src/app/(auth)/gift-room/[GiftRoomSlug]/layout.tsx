import { ReactNode } from 'react';
import LayoutClient from './layout.client';

// In Next.js 15, params is a Promise — must be typed and awaited correctly
type Props = {
  params:   Promise<{ giftRoomSlug: string }>;
  children: ReactNode;
};

export default async function Layout({ params, children }: Props) {
  // await the params Promise first, then destructure
  const { giftRoomSlug } = await params;

  return (
    <LayoutClient slug={giftRoomSlug}>
      {children}
    </LayoutClient>
  );
}