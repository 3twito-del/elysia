import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("public floating chrome contract", () => {
  it("hides accessibility triggers while sticky commerce bars are visible", () => {
    const css = read("src/styles/globals.css");

    expect(css).toContain(
      'html[data-public-floating-bar-visible="true"] .public-floating-trigger',
    );
    expect(css).toContain(
      'html[data-cookie-banner-open="true"] .public-floating-trigger',
    );
    expect(css).toContain(
      'html[data-public-floating-collision="true"]\n  .public-floating-trigger:not([data-accessibility-widget-trigger="true"])',
    );
    expect(css).toContain(
      'html[data-public-floating-collision="true"]\n  .public-floating-trigger[data-accessibility-widget-trigger="true"]',
    );
    expect(css).toContain(
      "top: calc(var(--site-header-height) + 1rem + env(safe-area-inset-top))",
    );
  });

  it("observes both mobile and desktop floating corners for collisions", () => {
    const provider = read("src/components/public-motion-provider.tsx");

    expect(provider).toContain("const floatingGuardAreas = [");
    expect(provider).toContain("left: 0");
    expect(provider).toContain("left: window.innerWidth - guardSize");
  });

  it("keeps product sticky purchase hidden until the main CTA has left view", () => {
    const purchasePanel = read(
      "src/app/product/[slug]/_components/product-purchase-panel.tsx",
    );

    expect(purchasePanel).toContain("setShowStickyBar(rect.bottom <= 0)");
    expect(purchasePanel).toContain('rootMargin: "0px"');
    expect(purchasePanel).toContain('data-public-floating-avoid="true"');
  });
});

function read(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}
