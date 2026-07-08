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
    // Design sweep A5 (approved): the page-level product-commerce-details
    // accordions were removed as a duplicate — delivery/returns/warranty/care now
    // live once, in the panel's product-before-order-summary.
    expect(productPage).not.toContain('data-testid="product-commerce-details"');
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
    expect(purchaseUtils).toContain("משלוח, טיפול ואחריות");
    expect(purchaseUtils).toContain("אחריות: ${input.warranty}");
    expect(purchaseUtils).toContain("טיפול: ${input.careInstructions}");
    expect(purchasePanel).not.toContain(
      'data-testid="product-purchase-fact-grid"',
    );
  });

  it("keeps the decision summary directly before the primary purchase action", () => {
    const purchasePanel = read(
      "src/app/product/[slug]/_components/product-purchase-panel.tsx",
    );

    expect(purchasePanel).toContain(
      'data-testid="product-purchase-decision-summary"',
    );
    expect(purchasePanel).toContain("purchaseDecisionSummaryItems.map");
    expect(purchasePanel).toContain('label: "בחירה"');
    expect(purchasePanel).toContain('label: "מחיר"');
    expect(purchasePanel).toContain('label: "זמינות"');
    expect(purchasePanel).toContain("formatPrice(selectedVariantPrice)");
    // Design-restraint pass (E2): the decision summary is a passive recap only.
    // Its duplicated action buttons — a second "מדריך מידות" (the size header
    // already links it) and a redundant service link (the trust panel below
    // keeps the single "שאלה לפני הזמנה") — were removed so add-to-cart stays the
    // one primary action. The summary still sits directly before the primary CTA.
    expect(purchasePanel).not.toContain("שירות אישי על הפריט");
    expect(
      indexOf(purchasePanel, 'data-testid="product-purchase-decision-summary"'),
    ).toBeLessThan(
      indexOf(purchasePanel, 'className="product-primary-cta h-12 w-full"'),
    );
    expect(
      indexOf(purchasePanel, 'className="product-primary-cta h-12 w-full"'),
    ).toBeLessThan(
      indexOf(purchasePanel, 'data-testid="product-commerce-trust"'),
    );
  });
});

function read(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

function indexOf(source: string, pattern: string) {
  const index = source.indexOf(pattern);
  expect(index, pattern).toBeGreaterThanOrEqual(0);
  return index;
}
