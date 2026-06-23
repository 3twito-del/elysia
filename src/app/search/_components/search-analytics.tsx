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
  const consent = useCookieConsentValue();
  const analyticsAllowed = consent !== "essential";

  useEffect(() => {
    if (!analyticsAllowed) return;
    if (!query && Object.values(filters).every((value) => !value)) return;

    const body = JSON.stringify({
      type: "search_performed",
      visitorKey: readVisitorKey(),
      sessionKey: safeGetCartSessionKey(),
      source: "client",
      url: window.location.href,
      title: document.title,
      path: window.location.pathname + window.location.search,
      consentMode: consent === "all" ? "measurement" : "essential",
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
  }, [analyticsAllowed, consent, filters, query, resultCount]);

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
