import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

function read(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

const searchControls = read("src/app/search/_components/search-controls.tsx");
const searchPage = read("src/app/search/page.tsx");
const categoryPage = read("src/app/category/[slug]/page.tsx");
const productGallery = read(
  "src/app/product/[slug]/_components/product-gallery.tsx",
);
const commercePageHero = read("src/components/commerce-page-hero.tsx");
const compactPageIntro = read("src/components/compact-page-intro.tsx");
const css = read("src/styles/globals.css");

describe("PLP + PDP design pass (owner-selected DP 21-30)", () => {
  it("gives the mobile search filter sheet a sticky footer with a result-backed submit", () => {
    expect(searchControls).toContain('id="mobile-search-filter-form"');
    expect(searchControls).toContain('form="mobile-search-filter-form"');
    expect(searchControls).toContain(
      'className="bg-popover sticky bottom-0 grid gap-2 border-t border-[var(--glass-border)] p-4"',
    );
    expect(searchControls).toContain("formatPlpResultCount(resultTotal)");
  });

  it("does not retain a loading surface for the redirected gifts route", () => {
    expect(existsSync(path.join(root, "src/app/gifts/loading.tsx"))).toBe(
      false,
    );
    expect(
      existsSync(path.join(root, "src/app/category/[slug]/loading.tsx")),
    ).toBe(false);
  });

  it("puts no-results recovery ahead of the repeated search field", () => {
    const emptyStateIndex = searchPage.indexOf('testId="search-empty-state"');
    const firstControlsPanelIndex = searchPage.indexOf(
      'data-testid="search-controls-panel"',
    );
    expect(emptyStateIndex).toBeGreaterThan(-1);
    expect(firstControlsPanelIndex).toBeGreaterThan(-1);
    expect(emptyStateIndex).toBeLessThan(firstControlsPanelIndex);
    expect(searchPage).toContain("No-results hierarchy inversion");
  });

  it("shows the current sort selection on the compact filter triggers instead of a generic label", () => {
    expect(searchControls).toContain("function getCompactSortLabel(");
    expect(searchControls).toContain(
      'data-testid="mobile-search-filter-trigger-sort"',
    );
    expect(categoryPage).toContain("CATEGORY_DEFAULT_SORT_LABEL");
    expect(categoryPage).toContain(
      'data-testid="category-filter-trigger-sort"',
    );
  });

  it("caps the category description to one line via an isolated prop, not a shared class", () => {
    expect(commercePageHero).toContain("descriptionClassName?:");
    expect(compactPageIntro).toContain("descriptionClassName?:");
    expect(categoryPage).toContain('descriptionClassName="line-clamp-1"');
  });

  it("uses a direction-safe icon for the breadcrumb separator instead of a static glyph", () => {
    expect(categoryPage).toContain("ChevronLeft");
    expect(categoryPage).not.toContain(">›<");
    expect(categoryPage).toContain('data-testid="category-breadcrumbs"');
  });

  it("adds a subtle mobile position-dot indicator while keeping the aria-live announcement in the a11y tree", () => {
    expect(productGallery).toContain(
      'data-testid="product-gallery-position-dots"',
    );
    expect(productGallery).toContain("data-gallery-dot-active");
    expect(productGallery).toContain("galleryImageCount <= 8");
    // The numeric badge must stay sr-only (not display:none) below lg so
    // aria-live position announcements keep firing for mobile screen readers.
    expect(productGallery).toContain("sr-only lg:not-sr-only");
    expect(productGallery).toContain('aria-live="polite"');
    expect(css).toContain(".product-gallery-position-dot {");
    expect(css).toContain(
      '.product-gallery-position-dot[data-gallery-dot-active="true"]',
    );
  });

  it("keeps desktop hover-zoom wired to real source images (audit: already shipped)", () => {
    expect(productGallery).toContain("canUseGalleryHoverZoom");
    expect(productGallery).toContain("hoverFinePointerQuery");
    expect(css).toContain(
      '.product-gallery-main-frame[data-gallery-hover-zoom="true"]',
    );
    expect(css).toContain("--gallery-hover-zoom-scale: 1.42;");
  });
});
