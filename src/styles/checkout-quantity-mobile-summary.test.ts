import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("checkout quantity recovery and mobile summary", () => {
  it("keeps benchmark support evidence available", () => {
    const benchmark = read(
      "docs/QA_EVIDENCE.md",
    );

    expect(benchmark).toContain("I-039");
    expect(benchmark).toContain("Weighted Score`: 16.5");
    expect(benchmark).toContain("Decision`: Supported");
    expect(benchmark).toContain("Graff");
    expect(benchmark).toContain("Boucheron");
  });

  it("keeps quantity recovery near item controls", () => {
    const checkoutForm = read(
      "src/app/checkout/_components/cart-checkout-form.tsx",
    );

    expect(checkoutForm).toContain("checkoutQuantityRecoveryCopy");
    expect(checkoutForm).toContain('data-testid="checkout-quantity-recovery"');
    expect(checkoutForm).toContain(
      'queueOfflineCartMutation("cart.updateItem"',
    );
    expect(checkoutForm).toContain(
      'queueOfflineCartMutation("cart.removeItem"',
    );
    expect(checkoutForm).toContain("item.quantity >= 10");
    expect(checkoutForm).toContain("item.quantity <= 1");
    expect(
      indexOf(checkoutForm, 'queueOfflineCartMutation("cart.updateItem"'),
    ).toBeLessThan(
      indexOf(checkoutForm, 'data-testid="checkout-quantity-recovery"'),
    );
    expect(
      indexOf(checkoutForm, 'data-testid="checkout-quantity-recovery"'),
    ).toBeLessThan(indexOf(checkoutForm, '<CheckoutStepBadge value="2"'));
  });

  it("keeps the mobile checkout summary source-aware", () => {
    const checkoutForm = read(
      "src/app/checkout/_components/cart-checkout-form.tsx",
    );

    expect(checkoutForm).toContain("mobileCheckoutSummaryCopy");
    expect(checkoutForm).toContain('data-testid="mobile-checkout-summary"');
    expect(checkoutForm).toContain("showMobileCheckoutBar");
    expect(checkoutForm).toContain(
      "canRenderStickyBar && hasOwnItems && showMobileCheckoutBar",
    );
    expect(checkoutForm).toContain(
      'data-testid="mobile-checkout-source-context"',
    );
    expect(checkoutForm).toContain("hasMixedSourceCart");
    expect(checkoutForm).toContain("dropshipTotalQuantity");
    expect(checkoutForm).toContain("totalItemQuantity");
    expect(checkoutForm).not.toContain("offline checkout");
    expect(checkoutForm).not.toContain("guaranteed delivery");
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
