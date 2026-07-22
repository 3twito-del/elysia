import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("checkout visual recomposition contract", () => {
  it("keeps source review and checkout actions visibly separated", () => {
    const checkoutForm = read(
      "src/app/checkout/_components/cart-checkout-form.tsx",
    );

    expect(checkoutForm).toContain("checkout-source-overview");
    expect(checkoutForm).toContain('data-testid="checkout-source-groups"');
    expect(checkoutForm).toContain('data-testid="checkout-action-stack"');
    expect(checkoutForm).toContain('data-testid="checkout-local-action-panel"');
    expect(checkoutForm).toContain(
      'data-testid="checkout-supplier-action-panel"',
    );
    expect(checkoutForm).toContain('data-testid="checkout-delivery-fields"');
    expect(checkoutForm).not.toContain("checkout-boutique-panel hidden");

    expect(indexOf(checkoutForm, "checkout-source-overview")).toBeLessThan(
      indexOf(checkoutForm, "checkout-boutique-item-card"),
    );
    expect(
      indexOf(checkoutForm, 'data-testid="checkout-payment-confidence"'),
    ).toBeLessThan(
      indexOf(checkoutForm, 'data-testid="checkout-action-stack"'),
    );
    expect(
      indexOf(checkoutForm, 'data-testid="checkout-local-action-panel"'),
    ).toBeLessThan(
      indexOf(checkoutForm, 'data-testid="local-checkout-submit-button"'),
    );
    expect(
      indexOf(checkoutForm, 'data-testid="checkout-supplier-action-panel"'),
    ).toBeLessThan(
      indexOf(checkoutForm, 'data-testid="shopify-dropship-checkout-button"'),
    );
  });

  it("does not leave duplicated contact, delivery, or gift fields in the DOM", () => {
    const checkoutForm = read(
      "src/app/checkout/_components/cart-checkout-form.tsx",
    );

    expect(countAttribute(checkoutForm, "id", "city")).toBe(1);
    expect(countAttribute(checkoutForm, "id", "street")).toBe(1);
    expect(countAttribute(checkoutForm, "id", "postalCode")).toBe(1);
    expect(countAttribute(checkoutForm, "id", "coupon")).toBe(1);
    expect(countAttribute(checkoutForm, "id", "checkout-order-note-hint")).toBe(
      0,
    );
    expect(
      countOccurrences(checkoutForm, 'data-testid="checkout-order-note-hint"'),
    ).toBe(0);
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

function countAttribute(source: string, name: string, value: string) {
  const escapedName = escapeRegex(name);
  const escapedValue = escapeRegex(value);

  return Array.from(
    source.matchAll(new RegExp(`\\s${escapedName}="${escapedValue}"`, "gu")),
  ).length;
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}
