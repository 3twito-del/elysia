import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

function read(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

const productPage = read("src/app/product/[slug]/page.tsx");
const purchasePanel = read(
  "src/app/product/[slug]/_components/product-purchase-panel.tsx",
);
const purchaseUtils = read(
  "src/app/product/[slug]/_components/product-purchase-utils.ts",
);
const gallery = read(
  "src/app/product/[slug]/_components/product-gallery.tsx",
);
const css = read("src/styles/globals.css");

describe("PDP design pass 2 (owner-selected DP 31-40)", () => {
  it("gives selected size buttons a filled state, not just a border (audit: already the default button variant)", () => {
    expect(purchasePanel).toContain(
      'variant={isSelected ? "default" : "outline"}',
    );
  });

  it("tightens the eyebrow-to-title spacing so the product name reads as its own group", () => {
    expect(productPage).toContain(
      'className="product-title-mixed-script mt-2 max-w-[17ch]',
    );
  });

  it("keeps each trust-block note to a single line", () => {
    expect(productPage).toContain('data-testid="product-trust-block"');
    expect(productPage).toContain('<span className="line-clamp-1">{note.label}</span>');
  });

  it("caps the similar-products rail at 3 items with a matching 3-column desktop grid (no orphaned card)", () => {
    expect(productPage).toContain(
      'className="ui-equal-grid mt-5 grid gap-x-7 gap-y-10 sm:grid-cols-2 lg:grid-cols-3"',
    );
    expect(productPage).toContain("rail.products.slice(0, 3)");
  });

  it("gives the mobile sticky purchase bar a real top shadow instead of the ineffective shadow-none it carried", () => {
    expect(purchasePanel).not.toContain("motion-sticky-purchase glass-chrome fixed inset-x-2 bottom-[calc(var(--floating-stack-bottom,0px)+0.625rem+env(safe-area-inset-bottom))] z-40 rounded-md border p-2.5 shadow-none");
    expect(css).toContain("box-shadow: 0 -10px 22px var(--elysia-border-soft);");
    expect(css).toContain(".dark .motion-sticky-purchase {");
    expect(css).toContain("box-shadow: 0 -10px 22px oklch(0 0 0 / 24%);");
  });

  it("labels the selected variant explicitly, directly above the primary purchase button", () => {
    expect(purchaseUtils).toContain("export function getSelectedVariantLabel(");
    expect(purchasePanel).toContain('data-testid="product-selected-variant-label"');
    expect(purchasePanel).toContain("getSelectedVariantLabel({");
    const labelIndex = purchasePanel.indexOf(
      'data-testid="product-selected-variant-label"',
    );
    const ctaIndex = purchasePanel.indexOf(
      'className="product-primary-cta h-12 w-full"',
    );
    expect(labelIndex).toBeGreaterThan(-1);
    expect(ctaIndex).toBeGreaterThan(-1);
    expect(labelIndex).toBeLessThan(ctaIndex);
  });

  it("keeps the spec table on divide-y system-token dividers with uniform row spacing (audit: already correct)", () => {
    expect(productPage).toContain('<dl className="grid divide-y">');
    expect(productPage).toContain(
      'className="grid gap-1 py-3 text-sm sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-4"',
    );
  });

  it("turns the personal-advice line into a subtle inline link instead of a bordered banner box", () => {
    expect(productPage).toContain('data-testid="product-support-context-link"');
    expect(productPage).not.toContain(
      'hidden flex-col gap-3 rounded-md border border-[var(--glass-border)] p-3 text-sm leading-6 sm:flex sm:flex-row sm:items-center sm:justify-between',
    );
    expect(productPage).toMatch(
      /<p\s+className="text-muted-foreground mt-4 hidden items-center gap-1\.5 text-sm sm:flex"\s+data-testid="product-support-context-link"/,
    );
  });

  it("keeps full keyboard navigation and a X/Y position indicator across the gallery (audit: already implemented)", () => {
    expect(gallery).toContain("function handleThumbnailKeyDown(");
    expect(gallery).toContain("function handleViewerKeyDown(");
    expect(gallery).toContain("ArrowRight: index + 1");
    expect(gallery).toContain("ArrowRight: activeImageIndex + 1");
    expect(gallery).toContain("Home: 0");
    expect(gallery).toContain("{activeImagePosition}/{galleryImageCount}");
  });
});
