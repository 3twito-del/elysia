import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

function read(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

const home = read("src/app/page.tsx");
const css = read("src/styles/globals.css");
const productCard = read("src/components/product-card.tsx");
const actions = read("src/app/actions.ts");

describe("home design pass (owner-selected DP 1-10)", () => {
  it("keeps the hero balanced on short viewports", () => {
    expect(css).toContain("@media (max-height: 640px)");
    expect(css).toContain("--home-hero-height: max(26rem, 100svh);");
  });

  it("keeps hero hierarchy tuned by spacing and tone, not size", () => {
    expect(css).toContain(
      "/* Hero hierarchy: a quieter statement and one breath more separation",
    );
    expect(css).toContain("rgb(255 250 244 / 84%)");
  });

  it("keeps one hairline language between the home bands", () => {
    expect(css).toContain(
      "One shared hairline language at every home band boundary",
    );
    expect(css).toContain("border-top: 1px solid var(--glass-border);");
  });

  it("caps the featured rail at 8 with a view-all path", () => {
    expect(home).toContain("getFeaturedCatalogProducts(8)");
    expect(home).toContain('data-testid="home-featured-view-all"');
    expect(home).toContain('href="/search"');
  });

  it("anchors a scrim layer to the hero copy corner for bright frames", () => {
    expect(css).toContain(
      ".home-cinematic-hero .storefront-hero-scrim::after",
    );
    expect(css).toContain(
      '.home-cinematic-hero[data-hero-title-direction="rtl"]',
    );
    expect(css).toContain("120% 90% at 12% 88%");
    expect(css).toContain("120% 90% at 88% 88%");
  });

  it("emphasizes the primary hero CTA with a bronze frame on hover", () => {
    expect(css).toContain("border-color: var(--glass-focus) !important;");
  });

  it("aligns the final-panel newsletter to a reading column with warm success copy", () => {
    expect(css).toContain(".storefront-final-newsletter .newsletter-form");
    expect(css).toContain("max-width: 26rem;");
    expect(actions).toContain(
      "תודה שהצטרפת! נעדכן אותך ראשונה על קולקציות ופריטים חדשים.",
    );
  });

  it("keeps category tiles on one uniform ratio with per-tile focal points", () => {
    expect(css).toContain("aspect-ratio: 4 / 5;");
    expect(home).toContain("const categoryImagePosition");
    expect(home).toContain("objectPosition");
  });

  it("keeps the new badge data-driven, single, and ahead of material labels", () => {
    expect(productCard).toContain("PRODUCT_CARD_NEW_WINDOW_DAYS = 30");
    const newBadgeIndex = productCard.indexOf('key: "new"');
    const materialBadgeIndex = productCard.indexOf('key: "gold-plated"');
    expect(newBadgeIndex).toBeGreaterThan(-1);
    expect(materialBadgeIndex).toBeGreaterThan(-1);
    expect(newBadgeIndex).toBeLessThan(materialBadgeIndex);
  });
});
