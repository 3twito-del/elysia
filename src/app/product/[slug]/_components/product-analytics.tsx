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
  const analyticsAllowed = useCookieConsentValue() === "all";

  useEffect(() => {
    if (!analyticsAllowed) return;

    const sessionKey = safeGetCartSessionKey();

    writeRecentlyViewed(productSlug);

    void sendAnalyticsEvent("/api/events/product-view", {
      productSlug,
      sessionKey,
      path,
    });

    if (query) {
      void sendAnalyticsEvent("/api/events/product-click", {
        productSlug,
        query,
        position,
        sessionKey,
      });
    }
  }, [analyticsAllowed, path, position, productSlug, query]);

  return null;
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

async function sendAnalyticsEvent(
  path: string,
  body: Record<string, string | number | undefined>,
) {
  try {
    await fetch(path, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
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
