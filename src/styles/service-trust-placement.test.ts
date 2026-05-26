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
    expect(purchasePanel).toContain("ShieldCheck");
    expect(purchasePanel).toContain("RotateCcw");
    expect(
      indexOf(purchasePanel, 'className="product-primary-cta h-12 w-full"'),
    ).toBeLessThan(
      indexOf(purchasePanel, 'data-testid="product-commerce-trust"'),
    );
    expect(
      indexOf(purchasePanel, 'data-testid="product-commerce-trust"'),
    ).toBeLessThan(indexOf(purchasePanel, "{cartMessage ?"));
    expect(
      indexOf(purchasePanel, 'data-testid="product-commerce-trust"'),
    ).toBeLessThan(indexOf(purchasePanel, "data-material-swatch"));
  });

  it("keeps product detail service rows available below the buy area", () => {
    const productPage = read("src/app/product/[slug]/page.tsx");

    expect(productPage).toContain("<ProductPurchasePanel");
    expect(productPage).toContain('data-testid="product-commerce-details"');
    expect(productPage).toContain("<ServiceRow");
    expect(productPage).toContain("ShieldCheck");
    expect(productPage).toContain("RotateCcw");
    expect(indexOf(productPage, "<ProductPurchasePanel")).toBeLessThan(
      indexOf(productPage, "<ServiceRow"),
    );
  });

  it("keeps product availability copy from repeating in the buy area", () => {
    const productPage = read("src/app/product/[slug]/page.tsx");
    const purchasePanel = read(
      "src/app/product/[slug]/_components/product-purchase-panel.tsx",
    );

    expect(productPage).not.toContain("value: commerceStatus.label");
    expect(purchasePanel).not.toContain("<Badge");
    expect(purchasePanel).toContain(
      'selectedVariant ? commerceStatus.label : "בדיקת זמינות"',
    );
    expect(
      countOccurrences(purchasePanel, "selectedVariant ? commerceStatus.label"),
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
    expect(checkoutForm).toContain("const checkoutTrustItems");
    expect(checkoutForm).toContain('data-testid="checkout-line-total"');
    expect(checkoutForm).toContain("checkoutTrustItems.map");
    expect(indexOf(checkoutForm, "checkoutTrustItems.map")).toBeLessThan(
      indexOf(checkoutForm, '<Button disabled={!canSubmit} size="lg"'),
    );
  });

  it("keeps the service route action-led and connected to customer support", () => {
    const servicePage = read("src/app/service/page.tsx");

    expect(servicePage).not.toContain('href="#service-form"');
    expect(servicePage).toContain("href={phoneHref}");
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
    expect(footer).toContain('title="קטלוג"');
    expect(footer).toContain('title="שירות והזמנה"');
    expect(footer).toContain('title="מידע"');
    expect(countOccurrences(footer, 'title="קטלוג"')).toBe(1);
    expect(countOccurrences(footer, 'title="שירות והזמנה"')).toBe(1);
    expect(countOccurrences(footer, 'title="מידע"')).toBe(1);
    expect(countOccurrences(footer, 'href: "/search"')).toBe(1);
    expect(footer).not.toContain('href="/search"');
    expect(footer).not.toContain("primaryServiceLinks");
    expect(footer).not.toContain("secondaryServiceLinks");
    expect(footer).not.toContain("שירות והזמנה - המשך");
    expect(footer).not.toContain("footer-online-service");
    expect(footer).not.toContain('href: "/ai"');
    expect(countOccurrences(footer, 'href: "/category/rings"')).toBe(1);
    expect(countOccurrences(footer, 'href: "/category/necklaces"')).toBe(1);
    expect(countOccurrences(footer, 'href: "/category/earrings"')).toBe(1);
    expect(countOccurrences(footer, 'href: "/category/bracelets"')).toBe(1);
    expect(footer).not.toContain('href="/gifts"');
    expect(footer).not.toContain('href: "/gifts"');
    expect(countOccurrences(footer, 'href: "/terms"')).toBe(1);
    expect(countOccurrences(footer, 'href: "/privacy"')).toBe(1);
    expect(countOccurrences(footer, 'href: "/accessibility"')).toBe(1);
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
