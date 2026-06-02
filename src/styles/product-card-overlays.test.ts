import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

describe("product card overlay budget", () => {
  it("keeps product image overlays limited to one decision-critical badge", () => {
    const source = read("src/components/product-card.tsx");

    expect(countOccurrences(source, "<Badge")).toBe(1);
    expect(source).not.toContain("product.collection");
    expect(source).not.toContain("discountPercent");
    expect(source).toContain("product-card-status-badge");
    expect(source).toContain("product-card-badge-stack");
    expect(source).toContain('data-testid="product-card-badge"');
    expect(source).toContain("data-product-card-badge={badge.key}");
    expect(source).toContain("function getProductCardBadge");
    expect(source).toContain('key: "sale"');
    expect(source).toContain('key: "low-stock"');
    expect(source).not.toContain('key: "source"');
    expect(source).not.toContain('key: "unavailable"');
    expect(source).not.toContain("flex-col items-start gap-1.5");
    expect(source).toContain("isPublicSellableQuantityLowStock");
    expect(source).toContain("מלאי מוגבל");
    expect(source).toContain('data-testid="product-card-image-skeleton"');
    expect(source).toContain("product-card-image-skeleton absolute inset-0");
    expect(source).toContain("לייעוץ");
    expect(source).not.toContain("absolute inset-x-2.5 bottom-2.5");
    expect(source).not.toContain(
      '<Badge className="max-w-full font-normal" variant="outline">',
    );
  });

  it("keeps sale price and hover media data-backed and restrained", () => {
    const source = read("src/components/product-card.tsx");
    const css = read("src/styles/globals.css");

    expect(source).toContain("function getProductCardSale");
    expect(source).toContain("product.compareAt <= product.price");
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
    expect(css).toContain(".product-card-hover-image");
    expect(css).toContain("z-index: 2;");
  });

  it("keeps material cues visible, accessible, and separate from product names", () => {
    const source = read("src/components/product-card.tsx");

    expect(source).toContain("getProductCardMaterialBadgeLabel(product)");
    expect(source).toContain("getProductCardSwatches(product)");
    expect(source).toContain('data-testid="product-card-material-cues"');
    expect(source).toContain('data-testid="product-card-material-badge"');
    expect(source).toContain('data-testid="product-card-swatches"');
    expect(source).toContain('data-material-swatch="true"');
    expect(source).toContain('role="img"');
    expect(source).toContain("aria-label={swatch.label}");
    expect(source).toContain("גוון מתכת:");
    expect(source).toContain("return product.material || product.stone");
    expect(source).not.toContain("materialBadgeLabel || product.name");
  });

  it("keeps card quick add limited to simple in-stock own products", () => {
    const source = read("src/components/product-card.tsx");
    const quickAdd = read("src/components/product-card-quick-add-button.tsx");
    const route = read("src/app/api/cart/items/route.ts");

    expect(source).toContain("function getProductCardQuickAddVariant");
    expect(source).toContain('input.product.source !== "OWN"');
    expect(source).toContain(
      'input.product.availabilityMode !== "READY_TO_ORDER"',
    );
    expect(source).toContain("input.product.variants.length !== 1");
    expect(source).toContain("input.product.sizes.length > 1");
    expect(source).toContain("input.product.metalColors.length > 1");
    expect(source).toContain("<ProductCardQuickAddButton");
    expect(source).toContain("variantSku={quickAddVariant.sku}");
    expect(quickAdd).toContain('"use client"');
    expect(quickAdd).toContain('data-testid="product-card-quick-add-button"');
    expect(quickAdd).toContain("getOrCreateCartSessionKey");
    expect(quickAdd).toContain("dispatchCartUpdated");
    expect(quickAdd).toContain('queueOfflineJsonAction("cart.addItem"');
    expect(quickAdd).toContain('fetch("/api/cart/items"');
    expect(route).toContain("addCartItemInputSchema.safeParse");
    expect(route).toContain("addCartItem(parsed.data)");
  });

  it("keeps product cards minimal with material and stone as quiet metadata", () => {
    const source = read("src/components/product-card.tsx");

    expect(source).toContain(
      "const productDetails = [product.material, product.stone]",
    );
    expect(source).toContain('const productMeta = productDetails.join(" · ")');
    expect(source).toContain("const productQuickFacts = [");
    expect(source).toContain("commerceStatus.label");
    expect(source).toContain('product.source === "DROPSHIP_SHOPIFY"');
    expect(source).toContain('data-testid="product-card-attributes"');
    expect(source).not.toContain("product.shortDescription");
    expect(source).not.toContain("commerceHighlights");
    expect(source).not.toContain('data-testid="product-card-highlights"');
    expect(source).not.toContain("matchReason");
    expect(source).not.toContain("productDetails.map");
    expect(source).toContain("{productQuickFactsLabel}");
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
