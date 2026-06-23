"use client";

import { useEffect } from "react";

import { getOrCreateCartSessionKey } from "~/lib/cart-session";
import { useCookieConsentValue } from "~/lib/use-cookie-consent";

type SearchAnalyticsProps = {
  filters: Record<string, string | number | boolean | null | undefined>;
  query?: string;
  resultCount: number;
};

export function SearchAnalytics({
  filters,
  query,
  resultCount,
}: SearchAnalyticsProps) {
  const analyticsAllowed = useCookieConsentValue() === "all";

  useEffect(() => {
    if (!analyticsAllowed) return;
    if (!query && Object.values(filters).every((value) => !value)) return;

    const body = JSON.stringify({
      type: "search_performed",
      sessionKey: safeGetCartSessionKey(),
      path: window.location.pathname + window.location.search,
      consentMode: "measurement",
      payload: {
        query: query ?? "",
        filters,
        resultCount,
      },
      idempotencyKey: `search:${window.location.pathname}${window.location.search}`,
    });

    void fetch("/api/analytics/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {
      // Optional analytics must not surface failures.
    });
  }, [analyticsAllowed, filters, query, resultCount]);

  return null;
}

function safeGetCartSessionKey() {
  try {
    return getOrCreateCartSessionKey();
  } catch {
    return undefined;
  }
}
