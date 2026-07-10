import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("search empty-state guided recovery", () => {
  it("records benchmark support before changing the public search empty state", () => {
    const benchmark = read(
      "docs/QA_EVIDENCE.md",
    );

    expect(benchmark).toContain("Weighted Score`: 16.5");
    expect(benchmark).toContain("Decision`: Supported");
    expect(benchmark).toContain("not a content page");
    expect(benchmark).toContain("Do not add service");
  });

  it("keeps guided recovery compact and tied to count-backed search actions", () => {
    const searchPage = read("src/app/search/page.tsx");

    // Recovery was de-duplicated: the guided-recovery text list and the
    // redundant first-category button were removed; the single count-backed
    // recovery-actions row (with result totals) remains the recovery affordance.
    expect(searchPage).not.toContain('data-testid="search-guided-recovery"');
    expect(searchPage).toContain("recoveryActions.map((action) => (");
    expect(searchPage).toContain("formatPlpResultCount(action.total)");
    expect(searchPage).toContain('data-testid="search-recovery-actions"');
    expect(searchPage).not.toContain('href="/service"');
    expect(searchPage).not.toContain('href="/size-guide"');
    expect(searchPage).not.toContain('href="/checkout"');
  });
});

function read(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}
