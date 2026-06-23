"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { getOrCreateCartSessionKey } from "~/lib/cart-session";
import { useCookieConsentValue } from "~/lib/use-cookie-consent";

type AnalyticsEventPayload = {
  type: "page_view";
  path: string;
  referrer?: string;
  sessionKey?: string;
  consentMode: "measurement";
  utm: Record<string, string>;
  device: {
    class: "mobile" | "tablet" | "desktop";
    language?: string;
    viewport?: string;
  };
  payload: {
    title?: string;
  };
};

export function AnalyticsProvider() {
  const consent = useCookieConsentValue();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const previousPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (consent !== "all") return;
    if (!pathname || pathname.startsWith("/admin")) return;

    const search = searchParams.toString();
    const path = search ? `${pathname}?${search}` : pathname;

    if (previousPathRef.current === path) return;

    const referrer =
      previousPathRef.current ??
      (document.referrer &&
      new URL(document.referrer).origin !== location.origin
        ? document.referrer
        : undefined);
    previousPathRef.current = path;

    const event: AnalyticsEventPayload = {
      type: "page_view",
      path,
      referrer,
      sessionKey: safeGetCartSessionKey(),
      consentMode: "measurement",
      utm: readUtmParams(searchParams),
      device: {
        class: getDeviceClass(),
        language: navigator.language,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
      },
      payload: {
        title: document.title,
      },
    };

    sendAnalyticsBatch([event]);
  }, [consent, pathname, searchParams]);

  return null;
}

function safeGetCartSessionKey() {
  try {
    return getOrCreateCartSessionKey();
  } catch {
    return undefined;
  }
}

function readUtmParams(searchParams: URLSearchParams) {
  const utm: Record<string, string> = {};

  for (const key of ["source", "medium", "campaign", "term", "content"]) {
    const value = searchParams.get(`utm_${key}`);

    if (value) utm[key] = value.slice(0, 120);
  }

  return utm;
}

function getDeviceClass(): "mobile" | "tablet" | "desktop" {
  const width = window.innerWidth;

  if (width < 768) return "mobile";
  if (width < 1024) return "tablet";

  return "desktop";
}

function sendAnalyticsBatch(events: AnalyticsEventPayload[]) {
  const body = JSON.stringify({ events });

  try {
    if (navigator.sendBeacon) {
      const sent = navigator.sendBeacon(
        "/api/analytics/events",
        new Blob([body], { type: "application/json" }),
      );

      if (sent) return;
    }

    void fetch("/api/analytics/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      keepalive: true,
    });
  } catch {
    // First-party analytics must never break navigation.
  }
}
