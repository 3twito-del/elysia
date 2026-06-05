import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("public CTA hierarchy", () => {
  it("keeps the default and explicit accent button variants neutral", () => {
    const buttonSource = read("src/components/ui/button.tsx");

    expect(buttonSource).toMatch(
      /default:\s*"[^"]*bg-\[var\(--action-primary\)\][^"]*text-\[var\(--action-primary-foreground\)\]/,
    );
    expect(buttonSource).toMatch(
      /brandAccent:\s*"[^"]*bg-\[var\(--brand-accent\)\][^"]*text-\[var\(--action-primary-foreground\)\]/,
    );
    expect(buttonSource).toMatch(/outline:\s*"[^"]*bg-background/);
    expect(buttonSource).toMatch(/secondary:\s*"[^"]*bg-background/);
    expect(buttonSource).not.toMatch(
      /default:\s*"[^"]*bg-\[var\(--brand-aqua\)\]/,
    );
    expect(buttonSource).not.toMatch(
      /(outline|secondary):\s*"[^"]*shadow-\[0_6px/,
    );
    expect(buttonSource).not.toMatch(
      /(outline|secondary|ghost):\s*"[^"]*hover:bg-\[rgb\(66_201_190/,
    );
  });

  it("keeps public surface tokens light, neutral, and separate from aqua CTAs", () => {
    const css = read("src/styles/globals.css");

    expect(css).toContain("--secondary: #f3eee8;");
    expect(css).toContain("--muted: #f2eee9;");
    expect(css).toContain("--accent: #ead8d2;");
    expect(css).toContain("--glass-border: #e4dbd0;");
    expect(css).toContain("--glass-border-strong: #c4b19c;");
    expect(css).toContain("--action-primary: var(--brand-ink);");
    expect(css).toContain(".glass-control:not(:disabled)");
    expect(css).toContain('[data-slot="button"][data-variant="secondary"]');
    expect(css).not.toContain("--secondary: var(--brand-aqua-soft);");
    expect(css).not.toContain("--glass-border-strong: var(--brand-aqua);");
    expect(css).not.toContain("--muted: oklch(0.96 0 0);");
    expect(css).not.toContain("--accent: oklch(0.94 0 0);");
  });

  it("keeps the floating home hero CTA focused on the pre-launch waitlist action", () => {
    const css = read("src/styles/globals.css");
    const home = read("src/app/page.tsx");

    expect(home).toContain("home-hero-actions");
    expect(home).toContain("home-hero-cta-primary");
    expect(home).toContain('data-testid="home-hero-primary-cta"');
    expect(home).toContain('href="#waitlist"');
    expect(home).toContain("הצטרפות לקולקציה הראשונה");
    expect(home).toContain("First collection coming soon");
    expect(home).not.toContain("home-hero-service-link");
    expect(home).not.toContain('href="/service"');
    expect(home).not.toContain('href="/search"');
    expect(home).not.toContain("home-hero-cta-secondary");
    expect(home).not.toContain("home-hero-help-cta");
    expect(home).not.toContain('data-testid="home-hero-trust-notes"');
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

  it("keeps product purchase actions to one explicit accent primary and one neutral secondary action", () => {
    const source = read(
      "src/app/product/[slug]/_components/product-purchase-panel.tsx",
    );
    const wishlistSource = read(
      "src/app/product/[slug]/_components/wishlist-button.tsx",
    );

    expect(countOccurrences(source, "product-primary-cta")).toBe(4);
    expect(source).toContain('className="product-primary-cta h-12 w-full"');
    expect(source).toContain('className="product-primary-cta order-1"');
    expect(source).toContain("commerceStatus.ctaLabel");
    expect(source).toContain("serviceHref");
    expect(read("src/styles/globals.css")).toContain(
      "background: var(--action-primary) !important;",
    );
    expect(wishlistSource).toContain('variant="outline"');
  });

  it("keeps listing cards browse-first with quick add limited to eligible cards", () => {
    const css = read("src/styles/globals.css");
    const productCard = read("src/components/product-card.tsx");
    const quickAdd = read("src/components/product-card-quick-add-button.tsx");
    const searchSource = read("src/app/search/page.tsx");

    expect(productCard).toContain("group/product-link block min-w-0");
    expect(productCard).toContain("ProductCardFavoriteButton");
    expect(productCard).toContain("function getProductCardQuickAddVariant");
    expect(productCard).toContain("<ProductCardQuickAddButton");
    expect(productCard).toContain('input.product.source !== "OWN"');
    expect(productCard).toContain("input.product.variants.length !== 1");
    expect(productCard).not.toContain('className="product-card-cta');
    expect(productCard).not.toContain("<Button");
    expect(productCard).not.toContain("ShoppingBag");
    expect(quickAdd).toContain('data-testid="product-card-quick-add-button"');
    expect(quickAdd).toContain('fetch("/api/cart/items"');
    expect(searchSource).not.toContain("product-card-cta");
    expect(searchSource).not.toContain("ShoppingBag");
    expect(css).not.toContain(".product-card-cta");
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
