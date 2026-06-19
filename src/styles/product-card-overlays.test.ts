import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

describe("product card overlay budget", () => {
  it("keeps product image overlays limited to one clear product label", () => {
    const source = read("src/components/product-card.tsx");

    expect(countOccurrences(source, "<Badge")).toBe(1);
    expect(source).toContain("getPublicCollectionName(product.collection)");
    expect(source).not.toContain("discountPercent");
    expect(source).toContain("product-card-status-badge");
    expect(source).toContain("product-card-badge-stack");
    expect(source).toContain('data-testid="product-card-badge"');
    expect(source).toContain("data-product-card-badge={badge.key}");
    expect(source).toContain("function getProductCardBadge");
    expect(source).toContain("function getProductCardLabel");
    expect(source).toContain('key: "new"');
    expect(source).toContain('key: "gift"');
    expect(source).toContain('key: "silver-925"');
    expect(source).toContain('key: "gold-plated"');
    expect(source).toContain("כסף 925");
    expect(source).toContain("ציפוי זהב");
    expect(source).not.toContain('key: "source"');
    expect(source).not.toContain('key: "unavailable"');
    expect(source).not.toContain('key: "availability"');
    expect(source).not.toContain("flex-col items-start gap-1.5");
    expect(source).toContain('data-testid="product-card-image-skeleton"');
    expect(source).toContain("product-card-image-skeleton absolute inset-0");
    expect(source).not.toContain("לייעוץ");
    expect(source).not.toContain("commerceStatus.label");
    expect(source).not.toContain("absolute inset-x-2.5 bottom-2.5");
    expect(source).not.toContain(
      '<Badge className="max-w-full font-normal" variant="outline">',
    );
  });

  it("keeps sale price and hover media data-backed and restrained", () => {
    const source = read("src/components/product-card.tsx");
    const display = read("src/lib/product-card-display.ts");
    const css = read("src/styles/globals.css");

    expect(display).toContain("function getProductCardSale");
    expect(display).toContain("product.compareAt <= product.price");
    expect(source).toContain("sale.compareAt");
    expect(source).toContain('data-testid="product-card-price"');
    expect(source).toContain('data-sale={sale ? "true" : "false"}');
    expect(source).toContain("line-through");
    expect(source).toContain("מחיר קודם");
    expect(source).toContain("function getProductCardSecondaryImage");
    expect(source).toContain("product.images.find");
    expect(source).toContain("product-card-hover-image");
    expect(source).toContain("group-hover/card:opacity-100");
    expect(source).toContain("group-focus-within/card:opacity-100");
    expect(source).toContain("group-hover/card:scale-[1.045]");
    expect(source).toContain("group-hover/card:scale-[1.055]");
    expect(source).toContain("group-focus-within/card:scale-[1.055]");
    expect(css).toContain(".product-card-hover-image");
    expect(css).toContain("z-index: 2;");
    expect(css).toContain(".product-card-shell:hover .product-card-image");
  });

  it("keeps material visible as quiet product metadata", () => {
    const source = read("src/components/product-card.tsx");
    const display = read("src/lib/product-card-display.ts");

    expect(display).toContain("const productDetails = [product.material");
    expect(source).toContain("publicCollectionName");
    expect(display).toContain("const productMeta = productDetails.join");
    expect(source).toContain('data-testid="product-card-attributes"');
    expect(source).not.toContain('data-testid="product-card-material-cues"');
    expect(source).not.toContain('data-testid="product-card-swatches"');
    expect(source).not.toContain('data-material-swatch="true"');
    expect(source).not.toContain("materialBadgeLabel || product.name");
  });

  it("keeps listing cards clean and routes fitting to the product page", () => {
    const source = read("src/components/product-card.tsx");
    const css = read("src/styles/globals.css");

    expect(source).not.toContain("ProductCardQuickAddButton");
    expect(source).toContain("ProductCardFavoriteButton");
    expect(source).toContain('data-testid="product-card-hover-actions"');
    expect(source).not.toContain("function getProductCardQuickAddVariant");
    expect(source).not.toContain("product-card-decision-facts");
    expect(source).not.toContain("בירור התאמה");
    expect(source).toContain("product-card-cta");
    expect(css).toContain(".product-card-hover-actions");
    expect(css).toContain(
      ".product-card-shell:hover .product-card-hover-actions",
    );
    expect(source).toContain("לפרטי התכשיט");
  });

  it("keeps product cards minimal with product facts as quiet metadata", () => {
    const source = read("src/components/product-card.tsx");
    const display = read("src/lib/product-card-display.ts");

    expect(display).toContain("const productDetails = [product.material");
    expect(source).toContain("product.material");
    expect(source).toContain("publicCollectionName");
    expect(display).toContain("const productMeta = productDetails.join");
    expect(source).not.toContain("const productQuickFacts = [");
    expect(source).not.toContain("commerceStatus.label");
    expect(source).not.toContain('product.source === "DROPSHIP_SHOPIFY"');
    expect(source).not.toContain("DROPSHIP_SHOPIFY");
    expect(source).toContain('data-testid="product-card-attributes"');
    expect(source).not.toContain("product.shortDescription");
    expect(source).not.toContain("commerceHighlights");
    expect(source).not.toContain('data-testid="product-card-highlights"');
    expect(source).not.toContain("matchReason");
    expect(source).not.toContain("productDetails.map");
    expect(source).toContain("{productMeta}");
  });

  it("keeps quick facts benchmark evidence available", () => {
    const benchmark = read(
      "docs/qa/product-card-quick-facts-density-benchmark.md",
    );

    expect(benchmark).toContain("Weighted Score`: 12.0");
    expect(benchmark).toContain("Decision`: Supported");
    expect(benchmark).toContain("Cartier");
    expect(benchmark).toContain("Mikimoto");
  });
});

function read(relativePath: string) {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

function countOccurrences(source: string, pattern: string) {
  return source.split(pattern).length - 1;
}
