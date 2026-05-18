import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

describe("mobile commerce density", () => {
  it("keeps the home mobile hero shorter so quick search is visible sooner", () => {
    const source = read("src/app/page.tsx");

    expect(source).toContain("[--home-hero-height:clamp(22rem,58svh,29rem)]");
    expect(source).toContain(
      "sm:[--home-hero-height:clamp(29rem,calc(76svh-4rem),38rem)]",
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

    expect(css).toMatch(
      /@media \(max-width: 767px\)[\s\S]*commerce-page-hero\[data-commerce-hero="catalog"\] \.commerce-page-hero-inner[\s\S]*min-height: auto;/,
    );
    expect(css).toMatch(
      /commerce-page-hero\[data-commerce-hero="catalog"\] \.commerce-page-hero-aside,[\s\S]*commerce-page-hero\[data-commerce-hero="catalog"\] \.commerce-page-hero-media,[\s\S]*commerce-page-hero\[data-commerce-hero="catalog"\]\s+\.commerce-page-hero-metrics \{[\s\S]*display: none;/,
    );
  });

  it("keeps product and result sections tighter on mobile", () => {
    const home = read("src/app/page.tsx");
    const category = read("src/app/category/[slug]/page.tsx");
    const search = read("src/app/search/page.tsx");

    expect(home).toContain("py-7 sm:px-6 sm:py-10");
    expect(home).toContain("min-h-[220px] w-full");
    expect(category).toContain("py-4 sm:px-6 sm:py-6");
    expect(category).toContain("grid gap-3 sm:grid-cols-2 sm:gap-4");
    expect(search).toContain("px-4 py-4 sm:px-6 sm:py-10");
    expect(search).toContain("mt-5 grid gap-3 sm:mt-8");
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
