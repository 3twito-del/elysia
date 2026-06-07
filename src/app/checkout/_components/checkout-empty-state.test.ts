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
    expect(source).toContain('href: "/category/rings"');
    expect(source).toContain('href: "/category/necklaces"');
    expect(source).toContain('href: "/gifts"');
    expect(source).toContain('href: "/service"');
    expect(emptyState).toContain('data-testid="checkout-empty-cart"');
    expect(emptyState).toContain('href="/search"');
    expect(emptyState).toContain('href="/service"');
    expect(emptyState).toContain("הסל שלך ממתין לתכשיט הראשון");
    expect(emptyState).toContain("חזרה לקולקציה");
    expect(emptyState).toContain("שאלה לפני הזמנה");
    expect(emptyState).toContain("checkoutEmptyLinks.map");
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
