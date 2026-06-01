import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("product recommendation rail return context", () => {
  it("keeps benchmark support evidence available", () => {
    const benchmark = read(
      "docs/qa/product-recommendation-rail-return-context-benchmark.md",
    );

    expect(benchmark).toContain("I-038");
    expect(benchmark).toContain("Weighted Score`: 16.5");
    expect(benchmark).toContain("Decision`: Supported");
    expect(benchmark).toContain("Cartier");
    expect(benchmark).toContain("Tiffany");
  });

  it("adds route-backed recommendation context without moving the rails above details", () => {
    const productPage = read("src/app/product/[slug]/page.tsx");
    const railHelper = read(
      "src/app/product/[slug]/_lib/product-recommendation-rails.ts",
    );
    const productCard = read("src/components/product-card.tsx");

    expect(productPage).toContain(
      'data-testid="product-discovery-return-context"',
    );
    expect(productPage).toContain(
      'data-testid="product-recommendation-rail-context"',
    );
    expect(productPage).toContain("createSearchReturnHref");
    expect(productPage).toContain("rail.continuationHref");
    expect(productPage).toContain("rail.cardContextLabel");
    expect(productPage).toContain("contextLabel={rail.cardContextLabel}");
    expect(productCard).toContain("contextLabel?: string");
    expect(productCard).toContain('data-testid="product-card-context-label"');
    expect(railHelper).toContain("continuationHref");
    expect(railHelper).toContain("continuationLabel");
    expect(railHelper).toContain("reason");
    expect(railHelper).toContain("cardContextLabel");
    expect(railHelper).toContain("createSearchContinuationHref");
    expect(railHelper).toContain(
      "continuationHref: `/category/${product.categorySlug}`",
    );
    expect(railHelper).toContain(
      'return query ? `/search?${query}` : "/search"',
    );

    expect(indexOf(productPage, 'id="product-details"')).toBeLessThan(
      indexOf(productPage, "<ProductRecommendationRails"),
    );
  });

  it("keeps recommendation rails free of checkout or urgency actions", () => {
    const productPage = read("src/app/product/[slug]/page.tsx");
    const railBlock = sliceBetween(
      productPage,
      "function ProductRecommendationRails",
      "function createSearchReturnHref",
    );

    expect(railBlock).not.toContain("/checkout");
    expect(railBlock).not.toContain("limited");
    expect(railBlock).not.toContain("urgent");
  });

  it("keeps recently viewed cards aligned to the same PDP rail width", () => {
    const productPage = read("src/app/product/[slug]/page.tsx");
    const recentlyViewed = read(
      "src/app/product/[slug]/_components/recently-viewed-products.tsx",
    );

    expect(productPage).toContain('className="mx-auto mt-10 grid max-w-7xl');
    expect(recentlyViewed).toContain(
      'className="border-border mx-auto mt-9 max-w-7xl border-t pt-7"',
    );
    expect(recentlyViewed).not.toContain("max-w-[96rem]");
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

function sliceBetween(source: string, start: string, end: string) {
  const startIndex = indexOf(source, start);
  const endIndex = indexOf(source, end);

  return source.slice(startIndex, endIndex);
}
