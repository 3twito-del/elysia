/// <reference lib="esnext" />
/// <reference lib="webworker" />

import type {
  PrecacheEntry,
  RuntimeCaching,
  SerwistGlobalConfig,
} from "serwist";
import {
  CacheFirst,
  CacheableResponsePlugin,
  ExpirationPlugin,
  NetworkFirst,
  NetworkOnly,
  registerQuotaErrorCallback,
  Serwist,
  StaleWhileRevalidate,
} from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const publicPagePattern =
  /^\/(?:$|category\/|product\/|search|gifts|branches|about|faq|privacy|terms|accessibility|shipping-returns|warranty|jewellery-care|service|ai|stylist|size-guide|offline)/;
const liveOnlyPattern =
  /^\/(?:api\/|admin(?:\/|$)|account(?:\/|$)|checkout(?:\/|$))/;
const runtimeCachePrefix = "elysia-v2";
const runtimeCacheNames = {
  fonts: `${runtimeCachePrefix}-fonts`,
  icons: `${runtimeCachePrefix}-icons`,
  images: `${runtimeCachePrefix}-images`,
  nextStatic: `${runtimeCachePrefix}-next-static`,
  publicPages: `${runtimeCachePrefix}-public-pages`,
  staticDocuments: `${runtimeCachePrefix}-static-documents`,
} as const;
const activeRuntimeCacheNames: ReadonlySet<string> = new Set(
  Object.values(runtimeCacheNames),
);
const trustedImageHosts = new Set([
  "images.unsplash.com",
  "res.cloudinary.com",
  "upload.wikimedia.org",
]);

const expiration = (maxEntries: number, maxAgeSeconds: number) =>
  new ExpirationPlugin({
    maxAgeFrom: "last-used",
    maxAgeSeconds,
    maxEntries,
    purgeOnQuotaError: true,
  });

const okResponse = new CacheableResponsePlugin({
  statuses: [0, 200],
});

const runtimeCaching: RuntimeCaching[] = [
  {
    matcher: ({ sameOrigin, url }) =>
      sameOrigin && url.pathname.startsWith("/_next/static/"),
    handler: new CacheFirst({
      cacheName: runtimeCacheNames.nextStatic,
      plugins: [okResponse, expiration(160, 365 * 24 * 60 * 60)],
    }),
  },
  {
    matcher: ({ sameOrigin, url }) =>
      sameOrigin &&
      /\/(?:favicon\.(?:ico|svg)|apple-touch-icon\.png|pwa\/icons\/.+\.png)$/i.test(
        url.pathname,
      ),
    handler: new CacheFirst({
      cacheName: runtimeCacheNames.icons,
      plugins: [okResponse, expiration(24, 365 * 24 * 60 * 60)],
    }),
  },
  {
    matcher: ({ sameOrigin, url }) =>
      sameOrigin && /\.(?:woff2?|ttf|otf|eot)$/i.test(url.pathname),
    handler: new CacheFirst({
      cacheName: runtimeCacheNames.fonts,
      plugins: [okResponse, expiration(24, 365 * 24 * 60 * 60)],
    }),
  },
  {
    matcher: ({ sameOrigin, url }) =>
      (sameOrigin &&
        (url.pathname.startsWith("/_next/image") ||
          /^\/(?:brand|pwa\/screenshots)\/.+\.(?:avif|webp|png|jpg|jpeg)$/i.test(
            url.pathname,
          ))) ||
      trustedImageHosts.has(url.hostname),
    handler: new StaleWhileRevalidate({
      cacheName: runtimeCacheNames.images,
      plugins: [okResponse, expiration(180, 30 * 24 * 60 * 60)],
    }),
  },
  {
    matcher: ({ sameOrigin, url }) =>
      sameOrigin && liveOnlyPattern.test(url.pathname),
    handler: new NetworkOnly(),
  },
  {
    matcher: ({ request, sameOrigin, url }) =>
      sameOrigin &&
      (request.mode === "navigate" || request.headers.get("RSC") === "1") &&
      publicPagePattern.test(url.pathname),
    handler: new NetworkFirst({
      cacheName: runtimeCacheNames.publicPages,
      networkTimeoutSeconds: 4,
      plugins: [okResponse, expiration(72, 7 * 24 * 60 * 60)],
    }),
  },
  {
    matcher: ({ sameOrigin, url }) =>
      sameOrigin && /\.(?:css|js|json|webmanifest)$/i.test(url.pathname),
    handler: new StaleWhileRevalidate({
      cacheName: runtimeCacheNames.staticDocuments,
      plugins: [okResponse, expiration(80, 24 * 60 * 60)],
    }),
  },
  {
    matcher: /.*/i,
    method: "GET",
    handler: new NetworkOnly(),
  },
];

registerQuotaErrorCallback(async () => {
  await Promise.all(
    [runtimeCacheNames.images, runtimeCacheNames.publicPages].map((cacheName) =>
      self.caches.delete(cacheName),
    ),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(activateUpdatedServiceWorker());
});

const serwist = new Serwist({
  clientsClaim: true,
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
  navigationPreload: true,
  precacheEntries: self.__SW_MANIFEST,
  runtimeCaching,
  skipWaiting: true,
});

self.addEventListener("push", (event) => {
  const data = readPushPayload(event);
  const title = data.title ?? "Elysia";

  event.waitUntil(
    self.registration.showNotification(title, {
      badge: "/pwa/icons/icon-192.png",
      body: data.body,
      data: { url: normalizeNotificationUrl(data.url) },
      icon: "/pwa/icons/icon-192.png",
      tag: data.tag ?? data.url ?? "elysia",
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = normalizeNotificationUrl(
    (event.notification.data as { url?: string } | undefined)?.url,
  );

  event.waitUntil(openNotificationUrl(url));
});

serwist.addEventListeners();

async function activateUpdatedServiceWorker() {
  await deleteRetiredRuntimeCaches();
  await self.clients.claim();
}

async function deleteRetiredRuntimeCaches() {
  const cacheNames = await self.caches.keys();

  await Promise.all(
    cacheNames
      .filter(
        (cacheName) =>
          cacheName.startsWith("elysia-") &&
          !activeRuntimeCacheNames.has(cacheName),
      )
      .map((cacheName) => self.caches.delete(cacheName)),
  );
}

function readPushPayload(event: PushEvent) {
  try {
    return (event.data?.json() ?? {}) as {
      body?: string;
      tag?: string;
      title?: string;
      url?: string;
    };
  } catch {
    return {};
  }
}

function normalizeNotificationUrl(value: string | undefined) {
  if (!value) return "/";

  try {
    const url = new URL(value, self.location.origin);

    return url.origin === self.location.origin
      ? `${url.pathname}${url.search}${url.hash}`
      : "/";
  } catch {
    return "/";
  }
}

async function openNotificationUrl(path: string) {
  const targetUrl = new URL(path, self.location.origin).href;
  const windows = await self.clients.matchAll({
    includeUncontrolled: true,
    type: "window",
  });

  for (const client of windows) {
    if ("focus" in client && client.url === targetUrl) {
      return client.focus();
    }
  }

  return self.clients.openWindow(targetUrl);
}
