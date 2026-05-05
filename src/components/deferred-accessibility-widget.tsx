"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const AccessibilityWidget = dynamic(
  () =>
    import("~/components/accessibility-widget").then(
      (mod) => mod.AccessibilityWidget,
    ),
  { ssr: false },
);

export function DeferredAccessibilityWidget() {
  const [canRender, setCanRender] = useState(false);

  useEffect(() => {
    const idleWindow = window as Window & {
      requestIdleCallback?: (
        callback: IdleRequestCallback,
        options?: IdleRequestOptions,
      ) => number;
      cancelIdleCallback?: (handle: number) => void;
    };

    if (idleWindow.requestIdleCallback && idleWindow.cancelIdleCallback) {
      const idleId = idleWindow.requestIdleCallback(() => setCanRender(true), {
        timeout: 1200,
      });

      return () => idleWindow.cancelIdleCallback?.(idleId);
    }

    const timeout = window.setTimeout(() => setCanRender(true), 250);

    return () => window.clearTimeout(timeout);
  }, []);

  return canRender ? <AccessibilityWidget /> : null;
}
