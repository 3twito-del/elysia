"use client";

import { useEffect } from "react";

import { getOrCreateCartSessionKey } from "~/lib/cart-session";

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
  useEffect(() => {
    const sessionKey = getOrCreateCartSessionKey();

    window.localStorage.setItem(
      "aphrodite_recently_viewed",
      JSON.stringify(
        [
          productSlug,
          ...readRecentlyViewed().filter((slug) => slug !== productSlug),
        ].slice(0, 8),
      ),
    );

    void fetch("/api/events/product-view", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ productSlug, sessionKey, path }),
    });

    if (query) {
      void fetch("/api/events/product-click", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ productSlug, query, position, sessionKey }),
      });
    }
  }, [path, position, productSlug, query]);

  return null;
}

function readRecentlyViewed() {
  try {
    const parsed: unknown = JSON.parse(
      window.localStorage.getItem("aphrodite_recently_viewed") ?? "[]",
    );

    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === "string")
      : [];
  } catch {
    return [];
  }
}
