"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const FeedbackButton = dynamic(
  () => import("~/components/feedback-button").then((mod) => mod.FeedbackButton),
  { ssr: false },
);

export function DeferredFeedbackButton() {
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

  return canRender ? <FeedbackButton /> : null;
}
