"use client";

import dynamic from "next/dynamic";
import { useEffect, useSyncExternalStore, type ReactNode } from "react";

const pwaCachePrefix = "elysia-";
const retiredPwaCachePrefixes = [
  [97, 112, 104, 114, 111, 100, 105, 116, 101, 45],
  [97, 102, 114, 111, 100, 105, 116, 101, 45],
].map((codes) => String.fromCharCode(...codes));
const pwaCachePrefixes = [pwaCachePrefix, ...retiredPwaCachePrefixes];
const pwaDevCleanupStorageKey = "elysia:pwa-dev-cleanup";
const pwaE2eOptInStorageKey = "elysia:pwa-e2e";

type BrowserRuntime = typeof globalThis & {
  caches?: CacheStorage;
  localStorage?: Storage;
  location?: Location;
  navigator?: Navigator;
  sessionStorage?: Storage;
};

type PwaProviderProps = {
  children: ReactNode;
};

const PwaRuntime = dynamic(
  () => import("~/components/pwa-runtime").then((mod) => mod.PwaRuntime),
  { ssr: false },
);

export function PwaProvider({ children }: PwaProviderProps) {
  const enabled = useSyncExternalStore(
    subscribeToPwaRegistrationStore,
    shouldEnablePwaRegistration,
    getServerPwaRegistrationSnapshot,
  );
  const hydrated = useSyncExternalStore(
    subscribeToPwaRegistrationStore,
    getClientHydrationSnapshot,
    getServerPwaRegistrationSnapshot,
  );

  useEffect(() => {
    if (!hydrated) return;
    if (enabled || process.env.NODE_ENV === "production") return;

    void unregisterDevelopmentServiceWorkers();
  }, [enabled, hydrated]);

  useEffect(() => {
    if (!enabled) return;

    void registerServiceWorker();
  }, [enabled]);

  return enabled ? <PwaRuntime>{children}</PwaRuntime> : children;
}

function getBrowserRuntime() {
  return globalThis as BrowserRuntime;
}

function subscribeToPwaRegistrationStore() {
  return () => undefined;
}

function getServerPwaRegistrationSnapshot() {
  return false;
}

function getClientHydrationSnapshot() {
  return true;
}

function shouldEnablePwaRegistration() {
  const runtime = getBrowserRuntime();
  const nav = runtime.navigator;

  if (!nav) return false;

  if (process.env.NODE_ENV !== "production" && !nav.webdriver) {
    return false;
  }

  if (!nav.webdriver) return true;

  try {
    return runtime.localStorage?.getItem(pwaE2eOptInStorageKey) === "1";
  } catch {
    return false;
  }
}

async function unregisterDevelopmentServiceWorkers() {
  const runtime = getBrowserRuntime();
  const nav = runtime.navigator;
  const origin = runtime.location?.origin;

  if (!nav || !("serviceWorker" in nav) || !origin) return;

  const registrations = await nav.serviceWorker.getRegistrations();
  const sameOriginRegistrations = registrations.filter((registration) =>
    registration.scope.startsWith(origin),
  );

  const removedRegistrations = await Promise.all(
    sameOriginRegistrations.map((registration) => registration.unregister()),
  );

  const caches = runtime.caches;

  if (caches) {
    const cacheNames = await caches.keys();

    await Promise.all(
      cacheNames
        .filter((cacheName) => {
          const normalizedCacheName = cacheName.toLowerCase();

          return pwaCachePrefixes.some((prefix) =>
            normalizedCacheName.startsWith(prefix),
          );
        })
        .map((cacheName) => caches.delete(cacheName)),
    );
  }

  if (!nav.serviceWorker.controller) return;
  if (!removedRegistrations.some(Boolean)) return;

  try {
    if (runtime.sessionStorage?.getItem(pwaDevCleanupStorageKey) === "1") {
      return;
    }

    runtime.sessionStorage?.setItem(pwaDevCleanupStorageKey, "1");
  } catch {
    return;
  }

  runtime.location?.reload();
}

async function registerServiceWorker() {
  const runtime = getBrowserRuntime();
  const nav = runtime.navigator;

  if (!nav || !("serviceWorker" in nav)) return;

  try {
    await nav.serviceWorker.register("/serwist/sw.js", { scope: "/" });
  } catch (error) {
    console.error("[pwa:register-failed]", error);
  }
}
