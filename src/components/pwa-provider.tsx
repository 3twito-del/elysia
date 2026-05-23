"use client";

import { SerwistProvider } from "@serwist/turbopack/react";
import { useState, type ReactNode } from "react";

import { PwaLifecycle } from "~/components/pwa-lifecycle";

const pwaE2eOptInStorageKey = "elysia:pwa-e2e";

type PwaProviderProps = {
  children: ReactNode;
};

export function PwaProvider({ children }: PwaProviderProps) {
  const [enabled] = useState(shouldEnablePwaRegistration);

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

function shouldEnablePwaRegistration() {
  if (typeof navigator === "undefined") return false;

  if (!navigator.webdriver) return true;

  try {
    return window.localStorage.getItem(pwaE2eOptInStorageKey) === "1";
  } catch {
    return false;
  }
}
