"use client";

import { useEffect } from "react";

import { getOrCreateCartSessionKey } from "~/lib/cart-session";
import { RECENTLY_VIEWED_STORAGE_KEY } from "~/lib/cookie-consent";
import { useCookieConsentValue } from "~/lib/use-cookie-consent";

type ProductAnalyticsProps = {
  productSlug: string;
  query?: string;
  position?: number;
  path: string;
};

export function ProductAnalytics({
  path,
  position,
  productSlug,
  query,
}: ProductAnalyticsProps) {
  const consent = useCookieConsentValue();
  const analyticsAllowed = consent === "all";

  useEffect(() => {
    if (!analyticsAllowed) return;

    const sessionKey = safeGetCartSessionKey();
    const visitorKey = readVisitorKey();

    writeRecentlyViewed(productSlug);

    const events: Array<Record<string, unknown>> = [
      {
        type: "product_view",
        productSlug,
        visitorKey,
        sessionKey,
        source: "client",
        url: window.location.href,
        title: document.title,
        path,
        consentMode: consent === "all" ? "measurement" : "essential",
        idempotencyKey: `product-view:${productSlug}:${path}:${Date.now()}`,
      },
    ];

    if (query) {
      events.push({
        type: "product_click",
        productSlug,
        visitorKey,
        sessionKey,
        source: "client",
        url: window.location.href,
        title: document.title,
        path,
        consentMode: consent === "all" ? "measurement" : "essential",
        idempotencyKey: `product-click:${productSlug}:${query}:${position ?? 0}:${Date.now()}`,
        payload: {
          query,
          position: position ?? null,
        },
      });
    }

    void sendAnalyticsBatch(events);
  }, [analyticsAllowed, consent, path, position, productSlug, query]);

  return null;
}

function readVisitorKey() {
  try {
    return window.localStorage.getItem("elysia_analytics_visitor") ?? undefined;
  } catch {
    return undefined;
  }
}

function safeGetCartSessionKey() {
  try {
    return getOrCreateCartSessionKey();
  } catch {
    return undefined;
  }
}

function writeRecentlyViewed(productSlug: string) {
  try {
    window.localStorage.setItem(
      RECENTLY_VIEWED_STORAGE_KEY,
      JSON.stringify(
        [
          productSlug,
          ...readRecentlyViewed().filter((slug) => slug !== productSlug),
        ].slice(0, 8),
      ),
    );
  } catch {
    // Analytics history is optional and should not block product pages.
  }
}

async function sendAnalyticsBatch(events: Array<Record<string, unknown>>) {
  try {
    await fetch("/api/analytics/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ events }),
      keepalive: true,
    });
  } catch {
    // Fire-and-forget analytics must not surface network failures to users.
  }
}

function readRecentlyViewed() {
  try {
    const parsed: unknown = JSON.parse(
      window.localStorage.getItem(RECENTLY_VIEWED_STORAGE_KEY) ?? "[]",
    );

    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === "string")
      : [];
  } catch {
    return [];
  }
}
