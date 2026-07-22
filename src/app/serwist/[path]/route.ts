import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";

type SerwistRoute = {
  dynamic: "auto" | "force-dynamic" | "error" | "force-static";
  dynamicParams: boolean;
  revalidate: false | number;
  generateStaticParams: () =>
    | Array<{ path: string | string[] }>
    | Promise<Array<{ path: string | string[] }>>;
  GET: (
    request: Request,
    context: { params: Promise<{ path: string }> },
  ) => Promise<Response> | Response;
};

const missingSerwistAssetStatus = 404;
const serwistPrecacheIgnores = ["**/node_modules/**/*"] as const;
const shouldUseLocalSerwistFallback =
  process.env.SERWIST_LOCAL_FALLBACK === "1";
const shouldUseProductionSerwistRoute =
  process.env.NODE_ENV === "production" &&
  !shouldUseLocalSerwistFallback &&
  process.env.E2E_SKIP_SERWIST_BUILD !== "1";

const serwistRoute = shouldUseProductionSerwistRoute
  ? await createProductionSerwistRoute()
  : shouldUseLocalSerwistFallback
    ? createLocalFallbackSerwistRoute()
    : createDevelopmentSerwistRoute();

export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } =
  serwistRoute;

async function createProductionSerwistRoute(): Promise<SerwistRoute> {
  const { createSerwistRoute } = await import("@serwist/turbopack");
  const revision =
    spawnSync("git", ["rev-parse", "HEAD"], {
      encoding: "utf-8",
    }).stdout?.trim() || randomUUID();

  return createSerwistRoute({
    additionalPrecacheEntries: [{ url: "/offline", revision }],
    cwd: process.cwd(),
    globDirectory: process.cwd(),
    globIgnores: [...serwistPrecacheIgnores],
    swSrc: "src/app/sw.ts",
    useNativeEsbuild: true,
  });
}

function createLocalFallbackSerwistRoute(): SerwistRoute {
  return {
    dynamic: "force-static",
    dynamicParams: false,
    revalidate: false,
    generateStaticParams: () => [{ path: "sw.js" }],
    GET: async (_, { params }) => {
      const { path: filePath } = await params;

      if (filePath !== "sw.js") {
        return new Response(null, {
          headers: {
            "Cache-Control": "no-store",
          },
          status: missingSerwistAssetStatus,
        });
      }

      return new Response(localFallbackServiceWorkerSource, {
        headers: {
          "Cache-Control": "no-store",
          "Content-Type": "application/javascript; charset=utf-8",
          "Service-Worker-Allowed": "/",
        },
      });
    },
  };
}

function createDevelopmentSerwistRoute(): SerwistRoute {
  return {
    dynamic: "force-dynamic",
    dynamicParams: true,
    revalidate: 0,
    generateStaticParams: () => [],
    GET: () =>
      new Response(null, {
        headers: {
          "Cache-Control": "no-store",
        },
        status: missingSerwistAssetStatus,
      }),
  };
}

const localFallbackServiceWorkerSource = String.raw`
const publicPagesCacheName = "elysia-v2-public-pages";
const publicPagePattern =
  /^\/(?:$|category\/|product\/|search|branches|about|faq|privacy|terms|accessibility|shipping-returns|warranty|jewellery-care|service|elys-ai|size-guide|offline)/;
const liveOnlyPattern =
  /^\/(?:api\/|admin(?:\/|$)|account(?:\/|$)|checkout(?:\/|$))/;

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(claimAndCacheControlledClients());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) return;
  if (!isDocumentNavigation(request)) return;

  const path = url.pathname;

  if (liveOnlyPattern.test(path)) return;
  if (!publicPagePattern.test(path)) return;

  event.respondWith(cachePublicPageRequest(request));
});

function isDocumentNavigation(request) {
  return (
    request.mode === "navigate" ||
    request.destination === "document" ||
    (request.headers.get("accept") || "").includes("text/html")
  );
}

async function cachePublicPageRequest(request) {
  const cache = await caches.open(publicPagesCacheName);

  try {
    const response = await fetch(request);

    if (response.ok && response.type !== "opaqueredirect") {
      await cache.put(request, response.clone());
    }

    return response;
  } catch {
    const cached =
      (await cache.match(request)) ??
      (await cache.match(new URL(request.url).pathname)) ??
      (await cache.match("/offline"));

    return (
      cached ??
      new Response("Offline", {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
        status: 503,
      })
    );
  }
}

async function claimAndCacheControlledClients() {
  await self.clients.claim();

  const clients = await self.clients.matchAll({
    includeUncontrolled: true,
    type: "window",
  });

  await Promise.allSettled(
    clients.map(async (client) => {
      const url = new URL(client.url);
      const path = url.pathname;

      if (url.origin !== self.location.origin) return;
      if (liveOnlyPattern.test(path)) return;
      if (!publicPagePattern.test(path)) return;

      await cachePublicPageRequest(new Request(url.href, { method: "GET" }));
    }),
  );
}
`;
