import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("discovery filter density", () => {
  it("keeps search active refinements compact and removable", () => {
    const searchPage = read("src/app/search/page.tsx");

    expect(searchPage).toContain(
      'data-testid="search-active-refinement-summary"',
    );
    expect(searchPage).toContain('data-testid="search-active-refinement-list"');
    expect(searchPage).toContain("formatActiveSelectionPreview(activeFilters)");
    expect(searchPage).toContain("formatActiveSelectionCount");
    expect(searchPage).toContain('<X aria-hidden="true"');
  });

  it("keeps category active refinements visible across desktop and mobile", () => {
    const categoryPage = read("src/app/category/[slug]/page.tsx");

    expect(categoryPage).toContain(
      'data-testid="category-mobile-active-refinement-summary"',
    );
    expect(categoryPage).toContain(
      'data-testid="category-mobile-filter-sort-summary"',
    );
    expect(categoryPage).toContain(
      'data-testid="category-active-refinement-summary"',
    );
    expect(categoryPage).toContain(
      'data-testid="category-active-sort-summary"',
    );
    expect(categoryPage).toContain(
      'data-testid="category-active-refinement-list"',
    );
    expect(categoryPage).toContain("max-w-[13rem] truncate text-xs");
    expect(categoryPage).toContain("formatCategoryActiveSelectionPreview");
  });

  it("keeps benchmark support evidence available after backlog replacement", () => {
    const benchmark = read(
      "docs/qa/search-category-filter-density-benchmark.md",
    );

    expect(benchmark).toContain("Weighted Score`: 16.5");
    expect(benchmark).toContain("Decision`: Supported");
    expect(benchmark).toContain("Cartier");
    expect(benchmark).toContain("Graff");
  });
});

function read(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}
