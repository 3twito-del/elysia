import { describe, expect, it } from "vitest";

import robots from "./robots";

describe("robots", () => {
  it("points crawlers at the real sitemap and host", () => {
    const result = robots();

    expect(result.host).toBe("https://elysia-jewellery.com");
    expect(result.sitemap).toBe("https://elysia-jewellery.com/sitemap.xml");
  });

  it("disallows all crawling — intentional pre-launch policy, not a bug", () => {
    // No verified legal identity yet (ADR 0014, J-08 open) and 0 of 300
    // catalog products are publish-ready (I-341) -- indexing an incomplete,
    // unverified site would be worse than not being indexed at all. This
    // matches layout.tsx's root metadata (`robots: { index: false, follow:
    // false }`), so the policy is consistent site-wide, not an oversight in
    // just this one file. When J-08/I-341 close and a real launch date is
    // set, this test (and layout.tsx's metadata) must be updated together --
    // don't "fix" one without the other.
    const result = robots();
    const rules = Array.isArray(result.rules) ? result.rules : [result.rules];

    expect(rules).toEqual([{ userAgent: "*", disallow: "/" }]);
  });
});
