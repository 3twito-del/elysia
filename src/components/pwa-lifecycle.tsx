"use client";

import { useEffect } from "react";

import { installPwaOfflineSync } from "~/lib/pwa-offline";

export function PwaLifecycle() {
  useEffect(() => installPwaOfflineSync(), []);

  useEffect(() => {
    const root = document.documentElement;
    const syncOnlineState = () => {
      if (navigator.onLine) {
        delete root.dataset.pwaOffline;
      } else {
        root.dataset.pwaOffline = "true";
      }
    };

    syncOnlineState();
    window.addEventListener("online", syncOnlineState);
    window.addEventListener("offline", syncOnlineState);

    return () => {
      window.removeEventListener("online", syncOnlineState);
      window.removeEventListener("offline", syncOnlineState);
      delete root.dataset.pwaOffline;
    };
  }, []);

  return null;
}
