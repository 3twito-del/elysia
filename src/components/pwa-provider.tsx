"use client";

import { SerwistProvider } from "@serwist/turbopack/react";
import { useEffect, useSyncExternalStore, type ReactNode } from "react";

import { PwaLifecycle } from "~/components/pwa-lifecycle";

const pwaCachePrefix = "elysia-";
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

export function PwaProvider({ children }: PwaProviderProps) {
  const enabled = useSyncExternalStore(
    subscribeToPwaRegistrationStore,
    shouldEnablePwaRegistration,
    getServerPwaRegistrationSnapshot,
  );

  useEffect(() => {
    if (enabled || process.env.NODE_ENV === "production") return;

    void unregisterDevelopmentServiceWorkers();
  }, [enabled]);

  return (
    <SerwistProvider
      cacheOnNavigation
      disable={!enabled}
      options={{ scope: "/" }}
      register={enabled}
      reloadOnOnline={false}
      swUrl="/serwist/sw.js"
    >
      {children}
      {enabled ? <PwaLifecycle /> : null}
    </SerwistProvider>
  );
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
        .filter((cacheName) => cacheName.startsWith(pwaCachePrefix))
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
