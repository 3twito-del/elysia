import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("account wishlist decision support", () => {
  it("keeps wishlist shortlist cues compact and non-checkout oriented", () => {
    const accountPage = read("src/app/account/page.tsx");
    const helper = read("src/app/account/_lib/wishlist-shortlist.ts");

    expect(accountPage).toContain(
      'data-testid="account-wishlist-decision-support"',
    );
    expect(accountPage).toContain("getWishlistDecisionSupport");
    expect(accountPage).toContain('href="/size-guide"');
    expect(accountPage).toContain("wishlistDecisionSupport.categoryHref");
    expect(accountPage).toContain("wishlistDecisionSupport.serviceHref");
    expect(accountPage).toContain("<GuestWishlistMergeNotice />");
    expect(accountPage).toContain("{wishlistItems.map");
    expect(indexOf(accountPage, "<GuestWishlistMergeNotice />")).toBeLessThan(
      indexOf(accountPage, "{wishlistItems.map"),
    );
    expect(indexOf(accountPage, "wishlistDecisionSupport ?")).toBeLessThan(
      indexOf(accountPage, "{wishlistItems.map"),
    );
    expect(accountPage).not.toContain('href="/checkout"');
    expect(helper).not.toContain("/checkout");
  });

  it("records high-jewelry benchmark support for the shortlist change", () => {
    const benchmark = read(
      "docs/qa/wishlist-shortlist-decision-support-benchmark.md",
    );

    expect(benchmark).toContain("Weighted Score`: 12.0");
    expect(benchmark).toContain("Decision`: Supported");
    expect(benchmark).toContain("Boucheron");
    expect(benchmark).toContain("De Beers");
  });
});

function read(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

function indexOf(source: string, pattern: string) {
  const index = source.indexOf(pattern);
  expect(index, pattern).toBeGreaterThanOrEqual(0);
  return index;
}
