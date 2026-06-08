import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("PDP purchase fact placement", () => {
  it("keeps the I-025 benchmark gate attached to the PDP implementation", () => {
    const benchmark = read(
      "docs/qa/pdp-size-care-fit-fact-placement-benchmark.md",
    );

    expect(benchmark).toContain("`Backlog Item`: I-025");
    expect(benchmark).toContain("`Weighted Score`: 16.5");
    expect(benchmark).toContain("`Decision`: Supported");
    expect(benchmark).toContain(
      "Append care and warranty facts to the existing service confidence item",
    );
  });

  it("passes existing care and warranty facts into the purchase panel", () => {
    const productPage = read("src/app/product/[slug]/page.tsx");

    expect(productPage).toContain("<ProductPurchasePanel");
    expect(productPage).toContain(
      "careInstructions={product.careInstructions}",
    );
    expect(productPage).toContain("warranty={product.warranty}");
    expect(productPage).toContain('data-testid="product-commerce-details"');
  });

  it("keeps facts inside the existing purchase-confidence area", () => {
    const purchasePanel = read(
      "src/app/product/[slug]/_components/product-purchase-panel.tsx",
    );
    const purchaseUtils = read(
      "src/app/product/[slug]/_components/product-purchase-utils.ts",
    );

    expect(purchasePanel).toContain('data-testid="product-commerce-trust"');
    expect(purchasePanel).toContain(
      'data-testid="product-before-order-summary"',
    );
    expect(purchasePanel).toContain("careInstructions?: string");
    expect(purchasePanel).toContain("warranty?: string");
    expect(purchasePanel).toContain("getBeforeOrderSummaryItems({");
    expect(purchasePanel).toContain("beforeOrderSummaryItems.map");
    expect(purchasePanel).toContain("getPurchaseConfidenceItems({");
    expect(purchasePanel).toContain("careInstructions,");
    expect(purchasePanel).toContain("warranty,");
    expect(purchaseUtils).toContain("ProductBeforeOrderSummaryItem");
    expect(purchaseUtils).toContain('key: "delivery"');
    expect(purchaseUtils).toContain('key: "returns"');
    expect(purchaseUtils).toContain('key: "warranty"');
    expect(purchaseUtils).toContain('key: "care"');
    expect(purchaseUtils).toContain('key: "gift"');
    expect(purchaseUtils).toContain("מסירה, טיפול ואחריות");
    expect(purchaseUtils).toContain("אחריות: ${input.warranty}");
    expect(purchaseUtils).toContain("טיפול: ${input.careInstructions}");
    expect(purchasePanel).not.toContain(
      'data-testid="product-purchase-fact-grid"',
    );
  });
});

function read(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}
