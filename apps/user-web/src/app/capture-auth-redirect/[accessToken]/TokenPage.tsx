"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { saveToken } from "@/helpers/request";
import LoadingPage from "@/ui/components/LoadingPage/LoadingPage";

export default function TokenPage({ accessToken }: { accessToken: string }) {
  const router = useRouter();

  useEffect(() => {
    const run = async () => {
      try {
        await saveToken(accessToken);
        router.replace("/home");
      } catch (err) {
        console.error("Failed to save token:", err);
        router.replace("/login");
      }
    };
    run();
  }, [accessToken, router]);

  return <LoadingPage />;
}
