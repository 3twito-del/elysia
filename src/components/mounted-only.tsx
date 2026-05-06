"use client";

import { useSyncExternalStore, type ReactNode } from "react";

type MountedOnlyProps = {
  children: ReactNode;
  fallback?: ReactNode;
};

export function MountedOnly({ children, fallback = null }: MountedOnlyProps) {
  const mounted = useSyncExternalStore(
    subscribeToNoopStore,
    getClientSnapshot,
    getServerSnapshot,
  );

  return mounted ? <>{children}</> : <>{fallback}</>;
}

function subscribeToNoopStore() {
  return () => undefined;
}

function getClientSnapshot() {
  return true;
}

function getServerSnapshot() {
  return false;
}
