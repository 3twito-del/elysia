import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("public CTA hierarchy", () => {
  it("keeps the default button variant as the single aqua primary treatment", () => {
    const buttonSource = read("src/components/ui/button.tsx");

    expect(buttonSource).toMatch(
      /default:\s*"[^"]*bg-\[var\(--brand-aqua\)\][^"]*text-\[var\(--brand-aqua-deep\)\]/,
    );
    expect(buttonSource).toMatch(/outline:\s*"[^"]*bg-background/);
    expect(buttonSource).toMatch(/secondary:\s*"[^"]*bg-background/);
    expect(buttonSource).not.toMatch(
      /(outline|secondary):\s*"[^"]*shadow-\[0_6px/,
    );
    expect(buttonSource).not.toMatch(
      /(outline|secondary|ghost):\s*"[^"]*hover:bg-\[rgb\(66_201_190/,
    );
  });

  it("keeps public surface tokens light, neutral, and separate from aqua CTAs", () => {
    const css = read("src/styles/globals.css");

    expect(css).toContain("--secondary: #f6f8f9;");
    expect(css).toContain("--muted: #f6f8f9;");
    expect(css).toContain("--accent: #f4f7f8;");
    expect(css).toContain("--glass-border: #e2e8ec;");
    expect(css).toContain("--glass-border-strong: #b8c5cc;");
    expect(css).toContain(".glass-control:not(:disabled)");
    expect(css).toContain('[data-slot="button"][data-variant="secondary"]');
    expect(css).not.toContain("--secondary: var(--brand-aqua-soft);");
    expect(css).not.toContain("--glass-border-strong: var(--brand-aqua);");
    expect(css).not.toContain("--muted: oklch(0.96 0 0);");
    expect(css).not.toContain("--accent: oklch(0.94 0 0);");
  });

  it("keeps floating home hero CTA buttons visually static on hover", () => {
    const css = read("src/styles/globals.css");
    const home = read("src/app/page.tsx");

    expect(home).toContain("home-hero-actions");
    expect(css).toContain('.home-hero-actions [data-slot="button"]');
    expect(css).toContain(
      '.home-hero-actions [data-slot="button"]:not(:disabled):hover',
    );
    expect(css).toContain(
      '.home-hero-actions [data-slot="button"]:not(:disabled):active',
    );
    expect(css).toContain("box-shadow: none !important;");
    expect(css).toContain("transform: none !important;");
    expect(css).toContain(
      "background-color, border-color, color, outline-color",
    );
    expect(css).toContain(
      '.home-hero-actions [data-slot="button"]:focus-visible',
    );
    expect(css).toContain("outline: 2px solid currentColor !important;");
    expect(css).toContain("--tw-ring-color: transparent !important;");
  });

  it("keeps product purchase actions to one aqua primary and one neutral secondary action", () => {
    const source = read(
      "src/app/product/[slug]/_components/product-purchase-panel.tsx",
    );
    const wishlistSource = read(
      "src/app/product/[slug]/_components/wishlist-button.tsx",
    );

    expect(countOccurrences(source, "product-primary-cta")).toBe(2);
    expect(source).toContain('className="product-primary-cta h-12 w-full"');
    expect(source).toContain('className="product-primary-cta order-1"');
    expect(wishlistSource).toContain('variant="outline"');
  });

  it("keeps listing card CTA states white and out of aqua or warm treatments", () => {
    const css = read("src/styles/globals.css");
    const baseBlock = extractCssBlock(css, ".product-card-cta:not(:disabled)");
    const hoverBlock = extractCssBlock(
      css,
      ".product-card-cta:not(:disabled):hover",
    );

    expect(baseBlock).toContain("border-color: rgb(16 24 28 / 12%)");
    expect(baseBlock).toContain("background: #ffffff");
    expect(hoverBlock).toContain("--tw-ring-color: rgb(16 24 28 / 14%)");
    expect(hoverBlock).toContain("border-color: rgb(16 24 28 / 24%)");
    expect(hoverBlock).toContain("background: #ffffff");
    expect(hoverBlock).toContain("rgb(16 24 28 / 4%)");
    expect(`${baseBlock}\n${hoverBlock}`).not.toMatch(
      /brand-aqua|66 201 190|#42c9be|125 87 70|#fffaf7|#fff3ec/i,
    );
  });

  it("keeps recovery and filter action groups from presenting two default CTAs", () => {
    const searchSource = read("src/app/search/page.tsx");
    const categorySource = read("src/app/category/[slug]/page.tsx");

    expect(searchSource).not.toContain(
      'variant={hasActiveFilters ? "outline" : "default"}',
    );
    expect(categorySource).not.toContain(
      'variant={hasActiveFilters ? "default" : "outline"}',
    );
    expect(categorySource).toMatch(
      /<Button\s+type="button"\s+variant="secondary">/,
    );
  });
});

function read(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

function countOccurrences(source: string, pattern: string) {
  return source.split(pattern).length - 1;
}

function extractCssBlock(source: string, selector: string) {
  const start = source.indexOf(selector);

  if (start === -1) return "";

  const openBrace = source.indexOf("{", start);
  const closeBrace = source.indexOf("}", openBrace);

  return source.slice(start, closeBrace + 1);
}
