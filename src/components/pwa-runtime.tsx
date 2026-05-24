"use client";

import { SerwistProvider } from "@serwist/turbopack/react";
import type { ReactNode } from "react";

import { PwaLifecycle } from "~/components/pwa-lifecycle";

type PwaRuntimeProps = {
  children: ReactNode;
};

export function PwaRuntime({ children }: PwaRuntimeProps) {
  return (
    <SerwistProvider
      cacheOnNavigation
      disable={false}
      options={{ scope: "/" }}
      register
      reloadOnOnline={false}
      swUrl="/serwist/sw.js"
    >
      {children}
      <PwaLifecycle />
    </SerwistProvider>
  );
}
