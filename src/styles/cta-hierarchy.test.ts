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
