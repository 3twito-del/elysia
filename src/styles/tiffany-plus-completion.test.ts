import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("Tiffany plus completion guardrails", () => {
  it("keeps the remaining plan stages represented in product cards and footer trust", () => {
    const productCard = read("src/components/product-card.tsx");
    const footer = read("src/components/site-footer.tsx");
    const css = read("src/styles/globals.css");
    const plan = read("docs/DESIGN.md");
    const visualQa = read("docs/QA_EVIDENCE.md");

    expect(plan).toContain("Product Cards Luxury Pass");
    expect(plan).toContain("Trust Layer");
    expect(plan).toContain("Visual QA Mobile First");
    expect(plan).toContain("Guardrails");

    expect(productCard).toContain("getProductCardLabel");
    expect(productCard).toContain('data-testid="product-card-badge"');
    expect(productCard).toContain("data-product-card-badge={badge.key}");
    expect(productCard).toContain("data-product-card-availability=");
    expect(productCard).toContain("data-product-card-sale=");
    expect(css).not.toContain(".product-card-decision-facts");
    expect(css).not.toContain(".product-card-decision-fact::before");

    expect(footer).toContain("const footerTrustSignals");
    expect(footer).toContain('data-testid="footer-trust-layer"');
    expect(footer).toContain('data-testid="footer-trust-link"');
    expect(footer).toContain('href: "/shipping-returns"');
    expect(footer).toContain('href: "/size-guide"');
    expect(footer).toContain('href: "/warranty"');
    expect(footer).toContain('href: "/service"');
    expect(indexOf(footer, "<FooterTrustLayer />")).toBeLessThan(
      indexOf(footer, "<SiteFooterDisclosures />"),
    );
    expect(css).toContain(".footer-trust-layer");
    expect(css).toContain(".footer-trust-link");

    expect(visualQa).toContain("Mobile viewport`: 390x844");
    expect(visualQa).toContain("Desktop viewport`: 1440x900");
    expect(visualQa).toContain("/product/selene-chain");
    expect(visualQa).toContain("Footer trust layer");
  });
});

function read(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

function indexOf(source: string, needle: string) {
  const index = source.indexOf(needle);
  expect(index).toBeGreaterThanOrEqual(0);

  return index;
}
