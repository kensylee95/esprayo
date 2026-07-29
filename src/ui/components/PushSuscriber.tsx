"use client";
import { useEffect } from "react";
import { request } from "@/helpers/request";

export default function PushSubscriber({ token }: { token: string }) {
  useEffect(() => {
    async function registerPush() {
      try {
        if (typeof window === "undefined") return;
        if (!("serviceWorker" in navigator)) return;
        if (!("Notification" in window)) return;
        if (!("PushManager" in window)) return;

        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;

        const registration = await navigator.serviceWorker.ready;

        const existing = await registration.pushManager.getSubscription();
        if (existing) return; // already subscribed

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: process.env.NEXT_PUBLIC_VAPID_KEY,
        });

        const sub = subscription.toJSON();

        const device = /android/i.test(navigator.userAgent)
          ? "android"
          : /iphone|ipad|ipod/i.test(navigator.userAgent) ||
              (navigator.platform === "MacIntel" &&
                navigator.maxTouchPoints > 1)
            ? "ios"
            : "web";

        await request("/push/subscribe", {
          method: "POST",
          token,
          body: JSON.stringify({
            subscription: {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.keys?.p256dh,
                auth: sub.keys?.auth,
              },
            },
            device,
          }),
        });
      } catch (error) {
        console.error("Push registration failed:", error);
      }
    }

    registerPush();
  }, [token]);

  return null;
}
