import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("homepage discovery to commerce balance", () => {
  it("adds commerce shortcuts after category discovery without changing the hero", () => {
    const home = read("src/app/page.tsx");

    expect(home).toContain("const homeCommerceShortcuts = [");
    expect(home).toContain('data-testid="home-commerce-shortcuts"');
    expect(home).toContain('href: "/search"');
    expect(home).toContain('href: "/gifts"');
    expect(home).toContain('href: "/size-guide"');
    expect(home).toContain('href: "/service"');
    expect(indexOf(home, 'data-testid="home-category-tile"')).toBeLessThan(
      indexOf(home, 'data-testid="home-commerce-shortcuts"'),
    );
    expect(indexOf(home, 'data-testid="home-commerce-shortcuts"')).toBeLessThan(
      indexOf(home, 'id="materials"'),
    );
    expect(indexOf(home, 'id="quick-search"')).toBeLessThan(
      indexOf(home, 'id="featured"'),
    );
    expect(home).not.toContain('href="#featured"');
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
