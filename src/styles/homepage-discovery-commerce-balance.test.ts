import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("homepage discovery to commerce balance", () => {
  it("keeps the homepage as a boutique brand entry rather than a catalog index", () => {
    const home = read("src/app/page.tsx");

    expect(home).toContain(
      'const boutiqueHeroImage = "/brand/boutique/lifestyle-hero.avif";',
    );
    expect(home).toContain("const collectionImageBySlug");
    expect(home).toContain("const homeTrustNotes = [");
    expect(home).toContain("const storyPrinciples = [");
    expect(home).toContain('data-testid="home-hero-statement"');
    expect(home).toContain('data-testid="home-hero-primary-cta"');
    expect(home).toContain('data-testid="home-hero-cta-row"');
    expect(home).toContain('href="#collections"');
    expect(home).toContain('id="collections"');
    expect(home).toContain("boutique-collection-card");
    expect(home).toContain('id="featured"');
    expect(home).toContain("featuredProducts.slice(0, 4)");
    expect(home).toContain('display={index < 2 ? "editorial" : "standard"}');
    expect(home).toContain('id="trust"');
    expect(home).toContain('data-testid="home-service-strip"');
    expect(home).toContain('id="story"');
    expect(home).toContain('id="boutique-cta"');
    expect(home).not.toContain("listCatalogProducts()");
    expect(home).not.toContain("const homeCommerceShortcuts = [");
    expect(home).not.toContain('data-testid="home-commerce-shortcuts"');
    expect(home).not.toContain('data-testid="home-hero-trust-notes"');
    expect(home).not.toContain("home-hero-help-cta");
    expect(home).not.toContain('href="/stylist"');
    expect(home).not.toContain('data-testid="home-product-rail-tabs"');
    expect(home).not.toContain('id="quick-search"');
    expect(indexOf(home, 'id="collections"')).toBeLessThan(
      indexOf(home, 'id="featured"'),
    );
    expect(indexOf(home, 'id="featured"')).toBeLessThan(
      indexOf(home, 'id="trust"'),
    );
    expect(indexOf(home, 'id="trust"')).toBeLessThan(
      indexOf(home, 'id="story"'),
    );
    expect(indexOf(home, 'id="story"')).toBeLessThan(
      indexOf(home, 'id="boutique-cta"'),
    );
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
