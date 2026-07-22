import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("checkout validation summary and payment confidence", () => {
  it("keeps benchmark support evidence available", () => {
    const benchmark = read("docs/QA_EVIDENCE.md");

    expect(benchmark).toContain("I-035");
    expect(benchmark).toContain("Weighted Score`: 16.5");
    expect(benchmark).toContain("Decision`: Supported");
    expect(benchmark).toContain("Graff");
    expect(benchmark).toContain("De Beers");
  });

  it("keeps checkout validation and payment confidence near submit actions", () => {
    const checkoutForm = read(
      "src/app/checkout/_components/cart-checkout-form.tsx",
    );

    expect(checkoutForm).toContain('data-testid="checkout-validation-summary"');
    expect(checkoutForm).toContain('id="checkout-issue-list"');
    expect(checkoutForm).toContain('role="status"');
    expect(checkoutForm).toContain('aria-live="polite"');
    expect(checkoutForm).toContain('data-testid="checkout-payment-confidence"');
    expect(checkoutForm).toContain(
      'data-testid="checkout-secure-payment-badge"',
    );
    expect(checkoutForm).not.toContain(
      'data-testid="checkout-gift-wrap-upsell"',
    );
    expect(checkoutForm).toContain("checkoutPaymentConfidenceCopy");
    expect(checkoutForm).toContain("hasMixedSourceCart");
    expect(checkoutForm).toContain("hasDropshipItems && !hasOwnItems");

    expect(
      indexOf(checkoutForm, 'data-testid="checkout-validation-summary"'),
    ).toBeLessThan(
      indexOf(checkoutForm, 'data-testid="local-checkout-submit-button"'),
    );
    expect(
      indexOf(checkoutForm, 'data-testid="checkout-payment-confidence"'),
    ).toBeLessThan(
      indexOf(checkoutForm, 'data-testid="local-checkout-submit-button"'),
    );
    expect(
      indexOf(checkoutForm, 'data-testid="checkout-payment-confidence"'),
    ).toBeLessThan(
      indexOf(checkoutForm, 'data-testid="shopify-dropship-checkout-button"'),
    );
  });

  it("keeps the checkout readiness summary before validation, payment confidence, and actions", () => {
    const checkoutForm = read(
      "src/app/checkout/_components/cart-checkout-form.tsx",
    );

    expect(checkoutForm).toContain('data-testid="checkout-readiness-summary"');
    expect(checkoutForm).toContain("checkoutReadinessSummaryItems.map");
    expect(checkoutForm).toContain("data-checkout-ready=");
    expect(checkoutForm).toContain("checkoutIssues.length === 0");
    expect(checkoutForm).toContain("!hasPricingReview");
    expect(checkoutForm).toContain("!isOffline");
    expect(checkoutForm).toContain(
      "data-testid={`checkout-readiness-${item.key}`}",
    );
    expect(checkoutForm).toContain("בדיקת הזמנה לפני תשלום");
    expect(checkoutForm).toContain("אין חיוב עכשיו");
    expect(checkoutForm).toContain("קופה נפרדת");
    expect(checkoutForm).toContain("MessageCircle");

    expect(
      indexOf(checkoutForm, 'data-testid="checkout-readiness-summary"'),
    ).toBeLessThan(
      indexOf(checkoutForm, 'data-testid="checkout-validation-summary"'),
    );
    expect(
      indexOf(checkoutForm, 'data-testid="checkout-readiness-summary"'),
    ).toBeLessThan(
      indexOf(checkoutForm, 'data-testid="checkout-payment-confidence"'),
    );
    expect(
      indexOf(checkoutForm, 'data-testid="checkout-readiness-summary"'),
    ).toBeLessThan(
      indexOf(checkoutForm, 'data-testid="local-checkout-submit-button"'),
    );
    expect(
      indexOf(checkoutForm, 'data-testid="checkout-readiness-summary"'),
    ).toBeLessThan(
      indexOf(checkoutForm, 'data-testid="shopify-dropship-checkout-button"'),
    );
  });

  it("does not add unsupported payment provider promises", () => {
    const checkoutForm = read(
      "src/app/checkout/_components/cart-checkout-form.tsx",
    );

    expect(checkoutForm).not.toContain("CardCom");
    expect(checkoutForm).not.toContain("guaranteed delivery");
    expect(checkoutForm).not.toContain("offline payment");
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
