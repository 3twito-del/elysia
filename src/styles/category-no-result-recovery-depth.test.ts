import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("category no-result recovery depth", () => {
  it("records benchmark support before changing category empty recovery", () => {
    const benchmark = read(
      "docs/qa/category-no-result-recovery-depth-benchmark.md",
    );

    expect(benchmark).toContain("Weighted Score`: 16.5");
    expect(benchmark).toContain("Decision`: Supported");
    expect(benchmark).toContain("route-backed category continuations");
    expect(benchmark).toContain("Do not add service");
  });

  it("keeps category no-result recovery compact and route-backed", () => {
    const categoryPage = read("src/app/category/[slug]/page.tsx");
    const categoryState = read(
      "src/app/category/[slug]/_lib/category-filter-state.ts",
    );

    expect(categoryPage).toContain('data-testid="category-no-result-recovery"');
    expect(categoryPage).toContain('data-testid="category-recovery-actions"');
    expect(categoryPage).toContain(
      'data-testid="category-search-recovery-link"',
    );
    expect(categoryPage).toContain("actions.map((action) => (");
    expect(categoryPage).toContain("{action.description}");
    expect(categoryPage).toContain(
      "formatCategoryRecoveryResultCount(action.total)",
    );
    expect(categoryState).toContain("noResultRecoveryActions");
    expect(categoryState).toContain("createCategorySearchRecoveryHref");
    expect(categoryState).toContain(
      "createCategoryHref(category.slug, filters)",
    );
    expect(categoryPage).not.toContain('href="/service"');
    expect(categoryPage).not.toContain('href="/size-guide"');
    expect(categoryPage).not.toContain('href="/checkout"');
  });
});

function read(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}
