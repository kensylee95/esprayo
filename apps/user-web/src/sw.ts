import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { CacheFirst, NetworkFirst, Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope & typeof globalThis;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // API routes — network-first
    {
      matcher: /^https?.+\/api\/.+/,
      handler: new NetworkFirst({
        cacheName: "api-cache",
        networkTimeoutSeconds: 10,
        plugins: [
          {
            cacheWillUpdate: async ({ response }) =>
              response?.status === 0 || response?.status === 200
                ? response
                : null,
          },
        ],
      }),
    },
    // Images — cache-first
    {
      matcher: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
      handler: new CacheFirst({
        cacheName: "image-cache",
        plugins: [
          {
            cacheWillUpdate: async ({ response }) =>
              response?.status === 0 || response?.status === 200
                ? response
                : null,
          },
        ],
      }),
    },
    // Fonts — cache-first, long TTL
    {
      matcher: /\.(?:woff|woff2|ttf|otf|eot)$/i,
      handler: new CacheFirst({
        cacheName: "font-cache",
      }),
    },
    ...defaultCache,
  ],
  fallbacks: {
    entries: [
      {
        url: "/~offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

serwist.addEventListeners();

// ── Push Notifications ─────────────────────────────────────────────────────

self.addEventListener("push", (event) => {
  const data = event.data?.json();

  event.waitUntil(
    self.registration.showNotification(data?.title ?? "New notification", {
      body: data?.body,
      icon: "/icons/icon-192x192.png",
      badge: "/icons/badge-72x72.png",
      data: { url: data?.url ?? "/" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        const url = event.notification.data.url;
        for (const client of clientList) {
          if (client.url === url && "focus" in client) {
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(url);
        }
      }),
  );
});
