// src/app/(protected)/layout.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { TOKEN_NAME } from "@/constants";
import PushSubscriber from "@/ui/components/PushSuscriber";

export default async function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const token = (await cookies()).get(TOKEN_NAME)?.value;
  if (!token) return redirect("/login");
  return (
    <>
      <PushSubscriber token={token} />
      {children}
    </>
  );
}
