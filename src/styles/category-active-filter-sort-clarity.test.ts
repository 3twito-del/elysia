import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("category active filter and sort clarity", () => {
  it("records benchmark support for the category clarity pass", () => {
    const benchmark = read(
      "docs/QA_EVIDENCE.md",
    );

    expect(benchmark).toContain("Weighted Score`: 16.5");
    expect(benchmark).toContain("Decision`: Supported");
    expect(benchmark).toContain("Surface the current sort");
    expect(benchmark).toContain("Use explicit reset copy");
  });

  it("keeps category sort and reset clarity visible without adding new content sections", () => {
    const categoryPage = read("src/app/category/[slug]/page.tsx");
    const filterPanel = read(
      "src/app/category/[slug]/_components/deferred-category-filter-panel.tsx",
    );

    expect(categoryPage).toContain(
      'data-testid="category-mobile-filter-sort-summary"',
    );
    expect(categoryPage).toContain(
      'data-testid="category-active-sort-summary"',
    );
    expect(categoryPage).toContain("מיון: {currentSortLabel}");
    expect(categoryPage).toContain("איפוס הכל");
    expect(filterPanel).toContain("איפוס הכל");
    expect(categoryPage).not.toContain(
      'data-testid="category-sort-control-row"',
    );
  });
});

function read(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}
