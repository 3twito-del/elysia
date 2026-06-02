import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("homepage discovery to commerce balance", () => {
  it("keeps homepage shortcuts useful without duplicating product navigation", () => {
    const home = read("src/app/page.tsx");

    expect(home).toContain("const homeCommerceShortcuts = [");
    expect(home).toContain('data-testid="home-commerce-shortcuts"');
    expect(home).toContain("const homeHeroMediaCaption =");
    expect(home).toContain('data-testid="home-hero-media-caption"');
    expect(home).toContain('data-testid="home-hero-slide-progress"');
    expect(home).toContain('data-testid="home-hero-trust-notes"');
    expect(home).toContain('data-testid="home-hero-media-fallback"');
    expect(home).toContain('data-testid="home-hero-cta-row"');
    expect(home).toContain("home-hero-help-cta");
    expect(home).toContain('href="/stylist"');
    expect(home).not.toContain("listCatalogProducts()");
    expect(home).not.toContain("homeCategoryChips");
    expect(home).not.toContain("formatHomeCategoryCount");
    expect(home).not.toContain("homeProductRailTabs");
    expect(home).not.toContain('data-testid="home-product-rail-tabs"');
    expect(home).not.toContain('data-testid="home-product-rail-tab"');
    expect(home).not.toContain('data-home-rail-active={tab.current ? "true"');
    expect(home).not.toContain('data-testid="home-category-count-chips"');
    expect(home).not.toContain('data-testid="home-category-count-chip"');
    expect(home).toContain('data-testid="home-service-strip"');
    expect(home).toContain('href="/service?topic=general"');
    expect(home).toContain('href: "/search"');
    expect(home).toContain('href: "/gifts"');
    expect(home).toContain('href: "/size-guide"');
    expect(home).toContain('href: "/service"');
    expect(indexOf(home, 'data-testid="home-category-tile"')).toBeLessThan(
      indexOf(home, 'data-testid="home-commerce-shortcuts"'),
    );
    expect(indexOf(home, 'data-testid="home-commerce-shortcuts"')).toBeLessThan(
      indexOf(home, 'data-testid="home-service-strip"'),
    );
    expect(indexOf(home, 'data-testid="home-service-strip"')).toBeLessThan(
      indexOf(home, 'id="materials"'),
    );
    expect(indexOf(home, 'id="quick-search"')).toBeLessThan(
      indexOf(home, 'id="featured"'),
    );
    expect(indexOf(home, 'id="featured"')).toBeLessThan(
      indexOf(home, 'data-layout-equal-group="home-featured-products"'),
    );
    expect(copyBlock(home, "const homeCommerceShortcuts = [")).not.toContain(
      'href: "#featured"',
    );
    expect(home).not.toContain('href="#categories"');
  });

  it("records benchmark support for the restrained homepage shortcut rail", () => {
    const benchmark = read(
      "docs/qa/homepage-discovery-commerce-balance-benchmark.md",
    );

    expect(benchmark).toContain("Weighted Score`: 12.0");
    expect(benchmark).toContain("Decision`: Supported");
    expect(benchmark).toContain("Cartier");
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

function copyBlock(source: string, startPattern: string) {
  const start = indexOf(source, startPattern);
  const end = source.indexOf("] as const;", start);
  expect(end).toBeGreaterThan(start);
  return source.slice(start, end);
}
