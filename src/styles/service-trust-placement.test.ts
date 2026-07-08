import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("commerce service trust placement", () => {
  it("keeps product service trust directly after the purchase actions", () => {
    const purchasePanel = read(
      "src/app/product/[slug]/_components/product-purchase-panel.tsx",
    );

    expect(purchasePanel).toContain('data-testid="product-commerce-trust"');
    expect(purchasePanel).toContain(
      'data-testid="product-before-order-summary"',
    );
    expect(purchasePanel).toContain("beforeOrderSummaryItems.map");
    expect(purchasePanel).toContain("purchaseConfidenceItems.map");
    expect(purchasePanel).toContain("product-purchase-confidence-${item.key}");
    expect(purchasePanel).toContain("getPurchaseConfidenceItems");
    expect(purchasePanel).toContain("getBeforeOrderSummaryItems");
    expect(purchasePanel).toContain("ShieldCheck");
    expect(purchasePanel).toContain("Ruler");
    expect(purchasePanel).toContain("RotateCcw");
    expect(
      indexOf(purchasePanel, 'className="product-primary-cta h-12 w-full"'),
    ).toBeLessThan(
      indexOf(purchasePanel, 'data-testid="product-commerce-trust"'),
    );
    expect(
      indexOf(purchasePanel, 'data-testid="product-commerce-trust"'),
    ).toBeLessThan(
      indexOf(purchasePanel, 'data-testid="product-before-order-summary"'),
    );
    expect(
      indexOf(purchasePanel, 'data-testid="product-before-order-summary"'),
    ).toBeLessThan(indexOf(purchasePanel, "purchaseConfidenceItems.map"));
    expect(
      indexOf(purchasePanel, 'data-testid="product-commerce-trust"'),
    ).toBeLessThan(indexOf(purchasePanel, "{cartMessage ?"));
    expect(
      indexOf(purchasePanel, 'data-testid="product-commerce-trust"'),
    ).toBeLessThan(indexOf(purchasePanel, "data-material-swatch"));
  });

  it("consolidates product detail reassurance into the buy panel, not duplicated below it", () => {
    const productPage = read("src/app/product/[slug]/page.tsx");
    const purchasePanel = read(
      "src/app/product/[slug]/_components/product-purchase-panel.tsx",
    );

    expect(productPage).toContain("<ProductPurchasePanel");
    // Design sweep A5 (approved override): the two duplicated below-buy-area
    // reassurance blocks — the product-commerce-details accordions and the
    // ServiceRow service summary — were removed. Delivery/returns/warranty/care
    // now live once, in the panel's before-order summary; below the buy area the
    // page keeps only the distinct spec + FAQ.
    expect(productPage).not.toContain('data-testid="product-commerce-details"');
    expect(productPage).not.toContain("<ServiceRow");
    expect(purchasePanel).toContain(
      'data-testid="product-before-order-summary"',
    );
    expect(productPage).toContain('data-testid="product-faq"');
    expect(indexOf(productPage, "<ProductPurchasePanel")).toBeLessThan(
      indexOf(productPage, 'data-testid="product-faq"'),
    );
  });

  it("keeps product availability copy from repeating in the buy area", () => {
    const productPage = read("src/app/product/[slug]/page.tsx");
    const purchasePanel = read(
      "src/app/product/[slug]/_components/product-purchase-panel.tsx",
    );

    expect(productPage).not.toContain("value: commerceStatus.label");
    expect(purchasePanel).not.toContain("<Badge");
    expect(purchasePanel).toContain("const selectedVariantStatusLabel =");
    expect(purchasePanel).toContain(
      'selectedVariant ? selectedVariantStatusLabel : "בחרי אפשרות"',
    );
    expect(
      countOccurrences(
        purchasePanel,
        "selectedVariant ? selectedVariantStatusLabel",
      ),
    ).toBe(1);
    expect(purchasePanel).not.toContain(
      "selectedVariantAvailable\n                ? commerceStatus.label",
    );
  });

  it("keeps checkout task content first and trust details before the save action", () => {
    const checkoutPage = read("src/app/checkout/page.tsx");
    const checkoutForm = read(
      "src/app/checkout/_components/cart-checkout-form.tsx",
    );

    expect(checkoutPage).not.toContain('href="#checkout-service"');
    expect(checkoutPage).toContain('<div id="checkout-service" />');
    expect(checkoutPage).toContain("<CartCheckoutForm />");
    expect(checkoutForm).toContain("getCheckoutFulfillmentSummaryRows");
    expect(checkoutForm).toContain('data-testid="checkout-line-total"');
    expect(checkoutForm).toContain(
      'data-testid="checkout-delivery-confidence-summary"',
    );
    expect(
      indexOf(checkoutForm, "checkoutFulfillmentSummaryRows.map"),
    ).toBeLessThan(
      indexOf(checkoutForm, 'data-testid="local-checkout-submit-button"'),
    );
    expect(
      indexOf(checkoutForm, "checkoutFulfillmentSummaryRows.map"),
    ).toBeLessThan(
      indexOf(checkoutForm, 'data-testid="shopify-dropship-checkout-button"'),
    );
  });

  it("keeps the service route action-led and connected to customer support", () => {
    const servicePage = read("src/app/service/page.tsx");

    expect(servicePage).not.toContain('href="#service-form"');
    expect(servicePage).toContain("href={contact.phoneHref}");
    expect(servicePage).toContain("const serviceTracks");
    expect(servicePage).toContain(
      '<section aria-labelledby="service-form" id="service-form">',
    );
    expect(indexOf(servicePage, "const serviceTracks")).toBeLessThan(
      indexOf(servicePage, '<section aria-labelledby="service-form"'),
    );
  });

  it("keeps footer service support visible in commerce navigation", () => {
    const footer = read("src/components/site-footer.tsx");

    expect(footer).toContain('href: "/checkout"');
    expect(footer).toContain('href: "/service"');
    expect(footer).toContain('href: "/faq"');
    expect(footer).toContain("שאלות ותשובות");
    expect(footer).not.toContain("שאלות נפוצות");
    expect(footer).toContain('title="קולקציות"');
    expect(footer).toContain('title="תמיכה"');
    expect(footer).toContain('title="Elysia"');
    expect(countOccurrences(footer, 'title="קולקציות"')).toBe(1);
    expect(countOccurrences(footer, 'title="תמיכה"')).toBe(1);
    expect(countOccurrences(footer, 'title="Elysia"')).toBe(1);
    expect(countOccurrences(footer, 'href: "/search"')).toBe(1);
    expect(countOccurrences(footer, 'href: "/search?sort=newest"')).toBe(1);
    expect(footer).not.toContain('href="/search"');
    expect(footer).not.toContain("primaryServiceLinks");
    expect(footer).not.toContain("secondaryServiceLinks");
    expect(footer).not.toContain("שירות - המשך");
    expect(footer).not.toContain("footer-online-service");
    expect(footer).not.toContain('href: "/ai"');
    expect(countOccurrences(footer, 'href: "/category/rings"')).toBe(1);
    expect(countOccurrences(footer, 'href: "/category/necklaces"')).toBe(1);
    expect(countOccurrences(footer, 'href: "/category/earrings"')).toBe(1);
    expect(countOccurrences(footer, 'href: "/category/bracelets"')).toBe(1);
    expect(countOccurrences(footer, 'href: "/gifts"')).toBe(1);
    expect(footer).not.toContain('href="/gifts"');
    expect(footer).toContain("links={footerPolicyLinks}");
    expect(footer).toContain("policyLinks");
    expect(footer).toContain("cookiePreferencesLink");
    expect(footer).toContain("footerBusinessDetails");
    expect(footer).not.toContain('href="/terms"');
    expect(footer).not.toContain('href="/privacy"');
    expect(footer).not.toContain('href="/accessibility"');
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

function countOccurrences(source: string, pattern: string) {
  return source.split(pattern).length - 1;
}
