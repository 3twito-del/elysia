import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("benchmark policy enforcement", () => {
  it("renders non-home route heroes through the benchmark policy gate", () => {
    const hero = read("src/components/commerce-page-hero.tsx");

    expect(hero).toContain('shouldRenderPublicElement("routeHeroMedia")');
    expect(hero).toContain('shouldRenderPublicElement("heroMetrics")');
  });

  it("keeps AI out of primary public commerce entry points", () => {
    const files = [
      "src/app/page.tsx",
      "src/components/site-header.tsx",
      "src/components/mobile-nav.tsx",
      "src/components/site-footer.tsx",
      "src/app/category/[slug]/page.tsx",
      "src/app/search/page.tsx",
      "src/app/product/[slug]/page.tsx",
      "src/app/gifts/page.tsx",
      "src/app/faq/page.tsx",
    ];

    const violations = files.filter((file) => read(file).includes('href="/ai'));

    expect(violations).toEqual([]);
  });

  it("removes exact customer-facing inventory and benchmark-failing counts", () => {
    const productPanel = read(
      "src/app/product/[slug]/_components/product-purchase-panel.tsx",
    );
    const categoryFilters = read(
      "src/app/category/[slug]/_lib/category-filter-state.ts",
    );
    const search = read("src/app/search/page.tsx");
    const category = read("src/app/category/[slug]/page.tsx");

    expect(productPanel).toContain("getPublicStockStatusLabel");
    expect(productPanel).not.toContain("getStockQuantityLabel");
    expect(productPanel).not.toContain(" במלאי");
    expect(categoryFilters).not.toContain("meta: getFilterCountLabel");
    expect(search).not.toContain("visibleFacets");
    expect(category).not.toContain("${filteredProducts.length}/${baseProducts.length}");
  });

  it("removes repeated collection badges from product cards", () => {
    const productCard = read("src/components/product-card.tsx");

    expect(productCard).not.toContain("{product.collection}</span>");
    expect(productCard).not.toContain("max-w-[68%]");
  });
});

function read(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}
