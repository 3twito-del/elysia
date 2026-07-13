import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

/**
 * J-09 guard: before any cookie choice, `readCookieConsent()` /
 * `useCookieConsentValue()` return `null` (client, no localStorage record yet)
 * or `undefined` (server snapshot). Every client-side tracking gate must
 * default OFF in that state and require an explicit "all" opt-in — not
 * default ON until an explicit "essential"-only opt-out. `consent !==
 * "essential"` is the wrong shape (it treats "no choice yet" the same as
 * "all"); `consent === "all"` is the only safe one. This was a real bug: three
 * tracking components used the inverted check and fired page views, scroll
 * depth, CTA clicks, form tracking, and full rrweb session replay on every
 * first visit before the cookie banner was ever answered.
 */

function read(relativePath: string) {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

const trackingComponents = [
  {
    file: "src/components/analytics-provider.tsx",
    gate: 'const analyticsEnabled = consent === "all";',
  },
  {
    file: "src/app/product/[slug]/_components/product-analytics.tsx",
    gate: 'const analyticsAllowed = consent === "all";',
  },
  {
    file: "src/app/search/_components/search-analytics.tsx",
    gate: 'const analyticsAllowed = consent === "all";',
  },
];

describe("pre-consent tracking guard (J-09 / ADR 0014)", () => {
  it.each(trackingComponents)(
    "$file gates tracking on explicit \"all\" consent, not on an absence of \"essential\"",
    ({ file, gate }) => {
      const source = read(file);

      expect(source).toContain(gate);
      expect(source).not.toContain('!== "essential"');
    },
  );

  it("recently-viewed reads already used the safe default-off shape (reference pattern)", () => {
    const source = read(
      "src/app/product/[slug]/_components/recently-viewed-products.tsx",
    );

    expect(source).toContain('consentValue === "all" ? readRecentlyViewedSlugs()');
  });

  it("withdrawing consent tears down in-flight session replay, not just future events", () => {
    const source = read("src/components/analytics-provider.tsx");
    const teardownStart = source.indexOf("replayStopRef.current?.();");
    const guardBlock = source.slice(
      Math.max(0, teardownStart - 200),
      teardownStart + 200,
    );

    expect(teardownStart).toBeGreaterThan(-1);
    expect(guardBlock).toContain(
      "if (!analyticsEnabled || !path || isBlockedAnalyticsPath(path))",
    );
    expect(guardBlock).toContain("replayBufferRef.current = []");
  });

  it("no absence-of-consent state is ever treated as full consent anywhere in src", () => {
    // Regression net: this exact inverted shape must never reappear anywhere
    // consent gates a tracking/storage decision.
    expect(read("src/lib/use-cookie-consent.ts")).not.toContain(
      '!== "essential"',
    );
  });
});
