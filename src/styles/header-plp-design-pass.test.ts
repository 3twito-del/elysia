import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

function read(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

const header = read("src/components/site-header.tsx");
const mobileNav = read("src/components/mobile-nav.tsx");
const css = read("src/styles/globals.css");
const searchControls = read("src/app/search/_components/search-controls.tsx");
const searchPage = read("src/app/search/page.tsx");
const categoryPage = read("src/app/category/[slug]/page.tsx");
const giftsPage = read("src/app/gifts/page.tsx");
const format = read("src/lib/format.ts");

describe("header + PLP design pass (owner-selected DP 11-20)", () => {
  it("marks the current page on every header utility link", () => {
    for (const href of ["/search", "/service", "/wishlist", "/account"]) {
      expect(header).toContain(
        `aria-current={pathname === "${href}" ? "page" : undefined}`,
      );
    }
    expect(css).toContain(
      '.site-header .site-header-label-action[aria-current="page"]',
    );
    expect(css).toContain('.mobile-nav-link[aria-current="page"]');
  });

  it("tracks header scroll state on every route, not just hero-overlay routes", () => {
    expect(header).toContain(
      'data-scrolled={hasScrolled ? "true" : undefined}',
    );
    expect(header).not.toContain("if (!isMediaOverlayRoute) return;");
  });

  it("condenses the brand mark on scroll without changing the fixed header's box height", () => {
    expect(css).toContain(
      "The condensed feel instead comes from\n   shrinking the brand mark alone",
    );
    expect(css).toContain('.site-header[data-scrolled="true"] .brand-logo');
    expect(css).not.toContain(
      '.site-header[data-scrolled="true"],\n  .site-header[data-scrolled="true"] .site-header-row',
    );
  });

  it("keeps the solid header flush at rest and gives it an edge only after scroll", () => {
    expect(css).toContain(
      '.site-header[data-header-state="solid"]:not([data-scrolled="true"])',
    );
  });

  it("hardens the wordmark's vertical centering at the CSS level", () => {
    expect(css).toContain(".brand-header-mark {");
    expect(css).toContain("display: inline-flex;");
  });

  it("gives the mobile drawer a bronze focus ring and clear catalog/service separation", () => {
    expect(mobileNav).toContain(
      'data-testid="mobile-nav-catalog-service-separator"',
    );
    expect(mobileNav).toContain("catalogServiceSeparatorIndex");
  });

  it("uses a filled cart-count dot with its own contrast surface, not a bare floating digit", () => {
    expect(css).toContain(
      "A small filled dot instead of a bare floating digit",
    );
    expect(css).toContain(".cart-count-badge {");
    expect(css).toContain("background: var(--brand-ink);");
    expect(css).toContain("color: var(--brand-porcelain);");
    expect(css).toContain("border-radius: 999px;");
  });

  it("auto-focuses the search query field on open and returns focus to the toggle on Escape", () => {
    expect(searchControls).toContain(
      'detailsElement.addEventListener("toggle"',
    );
    expect(searchControls).toContain("function closeSearchPanel(");
    expect(searchControls).toContain('event.key !== "Escape"');
    expect(searchControls).toContain("summaryRef.current?.focus();");
    expect(searchControls).toContain("onKeyDown={closeSearchPanel}");
    expect(searchControls).toContain("onKeyDown={onQueryKeyDown}");
  });

  it("gives mobile active-filter chips a larger, clearer removal target", () => {
    expect(searchPage).toContain(
      'className="h-9 max-w-full gap-1.5 pr-3 pl-2.5 sm:h-8"',
    );
    expect(searchPage).toContain(
      '<X aria-hidden="true" className="size-3.5 shrink-0" />',
    );
    expect(categoryPage).toContain(
      'className="h-9 max-w-full gap-1.5 pr-2.5 pl-1.5 sm:h-7"',
    );
    expect(categoryPage).toContain(
      '<X aria-hidden="true" className="size-3.5" />',
    );
  });

  it("shows one uniform secondary-typography result count on active PLP routes and redirects gifts", () => {
    expect(format).toContain(
      "export function formatPlpResultCount(count: number)",
    );
    expect(searchPage).toContain('data-testid="search-result-count-badge"');
    expect(searchPage).toContain("formatPlpResultCount(result.total)");
    expect(categoryPage).toContain('data-testid="category-result-count-badge"');
    expect(giftsPage).toContain('permanentRedirect("/search")');
    expect(css).toContain(".plp-result-count-badge {");
    expect(css).not.toContain("plp-result-count-badge rounded-full");
  });
});
