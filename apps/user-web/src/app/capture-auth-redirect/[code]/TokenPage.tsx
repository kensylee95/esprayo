"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { saveToken } from "@/helpers/request";
import authService from "@/services/Auth/Auth";
import LoadingPage from "@/ui/components/LoadingPage/LoadingPage";

export default function TokenPage({ code }: { code: string }) {
  const router = useRouter();

  useEffect(() => {
    const run = async () => {
      try {
        // Swap the short-lived one-time redirect code for the real access
        // token — the real JWT is never present in the URL.
        const { accessToken } = await authService().exchangeCode({ code });
        await saveToken(accessToken);
        router.replace("/home");
      } catch (err) {
        console.error("Failed to exchange auth code:", err);
        router.replace("/login");
      }
    };
    run();
  }, [code, router]);

  return <LoadingPage />;
}
