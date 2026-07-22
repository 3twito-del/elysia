import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

describe("checkout empty cart recovery", () => {
  it("keeps an empty checkout route-backed without unavailable payment actions", () => {
    const source = read("src/app/checkout/_components/cart-checkout-form.tsx");
    const emptyState = extractBetween(
      source,
      "function CheckoutEmptyCartState()",
      "\n}",
    );

    expect(source).toContain("shouldShowEmptyCartState");
    expect(source).toContain("<CheckoutEmptyCartState />");
    expect(source).toContain("checkoutEmptyRecommendedProducts");
    expect(source).toContain('href: "/product/hera-bracelet"');
    expect(source).toContain('href: "/product/muse-pearl-earrings"');
    expect(source).toContain('href: "/product/venus-line-ring"');
    expect(emptyState).toContain('data-testid="checkout-empty-cart"');
    expect(emptyState).toContain('href="/search"');
    expect(emptyState).not.toContain('href="/gifts"');
    expect(emptyState).toContain("התחילי מהנמכרים ביותר");
    expect(emptyState).toContain("שלושה תכשיטים שנבחרים שוב ושוב");
    expect(emptyState).toContain("checkoutEmptyRecommendedProducts.map");
    expect(emptyState).toContain(
      'data-testid="checkout-empty-recommended-product"',
    );
    expect(emptyState).not.toContain('href="/service"');
    expect(emptyState).not.toContain('type="submit"');
    expect(emptyState).not.toContain("local-checkout-submit-button");
    expect(emptyState).not.toContain("shopify-dropship-checkout-button");
  });
});

function read(relativePath: string) {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

function extractBetween(source: string, start: string, end: string) {
  const startIndex = source.indexOf(start);
  expect(startIndex).toBeGreaterThanOrEqual(0);

  const endIndex = source.indexOf(end, startIndex);
  expect(endIndex).toBeGreaterThan(startIndex);

  return source.slice(startIndex, endIndex + end.length);
}
