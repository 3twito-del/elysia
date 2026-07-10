import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("search view mode contract", () => {
  it("keeps grid and row view controls visibly distinct", () => {
    const searchPage = read("src/app/search/page.tsx");
    const styles = read("src/styles/globals.css");

    expect(searchPage).toContain('data-testid="search-view-toggle"');
    expect(searchPage).toContain("data-view-mode={viewMode}");
    expect(searchPage).toContain("data-search-view-option={view.value}");
    expect(searchPage).toContain(
      'data-search-view-state={active ? "active" : "inactive"}',
    );
    expect(searchPage).not.toContain("data-search-view-active-marker");
    expect(searchPage).toContain('data-active={active ? "true" : "false"}');
    expect(searchPage).toContain('label: "רשת"');
    expect(searchPage).toContain('label: "רשימה"');
    expect(searchPage).toContain(
      'active\n                ? "border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]',
    );
    expect(searchPage).toContain(
      "text-muted-foreground hover:text-foreground border-[var(--glass-border)] hover:border-[var(--glass-border-strong)]",
    );
    expect(styles).toContain(
      '[data-slot="button"][data-search-view-state="active"]',
    );
    expect(styles).toContain("background: var(--foreground);");
    expect(styles).toContain("color: var(--background);");
    expect(searchPage).toContain(
      'return viewMode === "list" ? "רשימה" : "רשת";',
    );
  });

  it("keeps row results different from the product-card grid on mobile", () => {
    const searchPage = read("src/app/search/page.tsx");

    expect(searchPage).toContain('data-testid="search-results-grid"');
    expect(searchPage).toContain("sm:grid-cols-2 lg:grid-cols-4");
    expect(searchPage).toContain('data-testid="search-results-list"');
    expect(searchPage).toContain('data-testid="search-result-list-item"');
    expect(searchPage).toContain("grid-cols-[7.25rem_minmax(0,1fr)]");
    expect(searchPage).toContain("sm:grid-cols-[9rem_minmax(0,1fr)]");
    expect(searchPage).toContain('sizes="(min-width: 1024px) 14rem');
    expect(searchPage).toContain("bg-[var(--brand-ivory)]");
    expect(searchPage).toContain("text-foreground");
    expect(searchPage).toContain('variant="ghost"');
    expect(searchPage).not.toContain("backdrop-blur");
    expect(searchPage).not.toContain("bg-emerald-500");
    expect(searchPage).not.toContain("text-red-700");
    expect(searchPage).not.toContain(
      "brand-product-media glass-inset relative block aspect-[5/4] overflow-hidden md:aspect-square",
    );
  });
});

function read(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}
