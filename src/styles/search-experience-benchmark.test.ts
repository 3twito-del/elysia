import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

describe("search experience benchmark contract", () => {
  it("documents at least one hundred measurable search-control benchmark parameters", () => {
    const benchmark = read("docs/qa/search-control-benchmark/benchmark.md");
    const parameterCount = benchmark.match(/^\d+\./gm)?.length ?? 0;

    expect(parameterCount).toBeGreaterThanOrEqual(100);
    expect(benchmark).toContain("Control height");
    expect(benchmark).toContain("Button press animation");
    expect(benchmark).toContain("Official sites opened");
  });

  it("keeps the home quick search compact without appearing before editorial content", () => {
    const home = read("src/app/page.tsx");

    expect(home).toContain("quickSearchSuggestions");
    expect(home).toContain('data-testid="home-quick-search-form"');
    expect(home).toContain('data-testid="home-quick-search-suggestions"');
    expect(home).toContain("/search?maxPrice=700");
    expect(home).toContain("h-[3.25rem]");
    expect(home).toContain("pointer-events-none");
    expect(home).toContain(
      "transition-[background-color,border-color,color,outline-color,opacity]",
    );
    expect(home).not.toContain("brand-control-panel grid gap-2 p-1.5");
    expect(home).not.toContain("active:translate-y-px");
    expect(indexOf(home, 'id="categories"')).toBeLessThan(
      indexOf(home, 'id="quick-search"'),
    );
  });

  it("keeps search controls complete across query, facets, availability, sort, and view state", () => {
    const controls = read("src/app/search/_components/search-controls.tsx");

    expect(controls).toContain("FacetSearchFields");
    expect(controls).toContain("AvailabilityField");
    expect(controls).toContain('name="material"');
    expect(controls).toContain('name="stone"');
    expect(controls).toContain('name="collection"');
    expect(controls).toContain('name="availableOnly"');
    expect(controls).toContain('name="mode"');
    expect(controls).toContain('name="view"');
    expect(controls).toContain('data-testid="mobile-search-filter-sheet"');
  });

  it("keeps grid and list result presentations addressable by URL", () => {
    const page = read("src/app/search/page.tsx");
    const state = read("src/app/search/_lib/search-state.ts");

    expect(state).toContain('type SearchViewMode = "grid" | "list"');
    expect(page).toContain("SearchViewToggle");
    expect(page).toContain("SearchModeToggle");
    expect(page).toContain('data-testid="search-results-grid"');
    expect(page).toContain('data-testid="search-results-list"');
    expect(page).toContain('data-testid="search-result-list-item"');
    expect(page).toContain('data-testid="semantic-search-signals"');
    expect(state).toContain('params.set("view", input.view)');
    expect(state).toContain('params.set("mode", input.mode)');
    expect(state).toContain('value === "list" ? "list" : "grid"');
  });

  it("treats natural-language budget searches as measured filter state", () => {
    const state = read("src/app/search/_lib/search-state.ts");

    expect(state).toContain("resolveAiCatalogSearchIntent");
    expect(state).toContain("normalizeBudgetAwareQuery");
    expect(state).toContain("intent?.maxPrice");
    expect(state).toContain("isGenericGiftSearch");
  });

  it("keeps search result cards benchmark-safe for public commerce", () => {
    const page = read("src/app/search/page.tsx");

    expect(page).toContain("getPublicProductCommerceStatus");
    expect(page).toContain("product.availabilityMode");
    expect(page).toContain(
      "const productDetails = [product.material, product.stone]",
    );
    expect(page).not.toContain("product.commerceHighlights");
    expect(page).not.toContain("product.categoryName");
    expect(page).not.toContain("matchReason");
    expect(page).not.toContain("getProductAvailabilityLabel");
    expect(page).not.toContain("visibleFacets");
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
