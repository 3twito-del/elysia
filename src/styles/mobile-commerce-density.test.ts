import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

describe("mobile commerce density", () => {
  it("keeps the home mobile hero shorter so quick search is visible sooner", () => {
    const source = read("src/app/page.tsx");

    expect(source).toContain("[--home-hero-height:clamp(20rem,54svh,28rem)]");
    expect(source).toContain(
      "sm:[--home-hero-height:clamp(30rem,calc(66svh-4rem),34rem)]",
    );
    expect(countOccurrences(source, "min-h-[var(--home-hero-height)]")).toBe(4);
    expect(indexOf(source, 'id="quick-search"')).toBeLessThan(
      indexOf(source, 'id="categories"'),
    );
    expect(indexOf(source, 'id="categories"')).toBeLessThan(
      indexOf(source, 'id="featured"'),
    );
  });

  it("hides catalog hero media and metrics on mobile before filters or search controls", () => {
    const css = read("src/styles/globals.css");
    const hero = read("src/components/commerce-page-hero.tsx");

    expect(css).toMatch(
      /@media \(max-width: 767px\)[\s\S]*commerce-page-hero\[data-commerce-hero="catalog"\] \.commerce-page-hero-inner[\s\S]*min-height: auto;/,
    );
    expect(css).toMatch(
      /commerce-page-hero\[data-commerce-hero="catalog"\] \.commerce-page-hero-aside,[\s\S]*commerce-page-hero\[data-commerce-hero="catalog"\] \.commerce-page-hero-media,[\s\S]*commerce-page-hero\[data-commerce-hero="catalog"\]\s+\.commerce-page-hero-metrics \{[\s\S]*display: none;/,
    );
    expect(hero).toContain(
      "data-commerce-density={density ?? densityByHeroVariant[variant]}",
    );
    expect(hero).toContain(
      "data-route-intent={intent ?? intentByHeroVariant[variant]}",
    );
  });

  it("keeps non-home commerce heroes compact on desktop", () => {
    const css = read("src/styles/globals.css");

    expect(css).toMatch(
      /commerce-page-hero\[data-commerce-hero="catalog"\] \.commerce-page-hero-inner \{[\s\S]*min-height: auto;/,
    );
    expect(css).toContain(
      'commerce-page-hero[data-commerce-hero="catalog"][data-has-aside="true"]',
    );
    expect(css).toContain("minmax(16rem, 28%)");
  });

  it("keeps product and result sections tighter on mobile", () => {
    const home = read("src/app/page.tsx");
    const category = read("src/app/category/[slug]/page.tsx");
    const search = read("src/app/search/page.tsx");
    const productCard = read("src/components/product-card.tsx");

    expect(home).toContain("py-7 sm:px-6 sm:py-10");
    expect(home).toContain("min-h-[220px] w-full");
    expect(category).toContain(
      "px-[var(--ui-page-x)] py-[var(--ui-section-y-tight)]",
    );
    expect(category).toContain(
      "mb-5 hidden border-b border-[var(--glass-border)] pb-4 lg:block",
    );
    expect(category).toContain("grid gap-3 sm:grid-cols-2 sm:gap-4");
    expect(search).toContain(
      "px-[var(--ui-page-x)] py-[var(--ui-section-y-tight)]",
    );
    expect(search).toContain("mt-5 grid gap-3 sm:mt-8");
    expect(productCard).toContain("relative aspect-[5/4] overflow-hidden");
    expect(productCard).toContain("flex min-h-40 flex-1 flex-col");
    expect(productCard).toContain("line-clamp-1 min-h-5");
  });
});

function read(relativePath: string) {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

function indexOf(source: string, pattern: string) {
  const index = source.indexOf(pattern);
  expect(index, pattern).toBeGreaterThanOrEqual(0);
  return index;
}

function countOccurrences(source: string, pattern: string) {
  return source.split(pattern).length - 1;
}
