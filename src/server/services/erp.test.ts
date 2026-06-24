import { describe, expect, it } from "vitest";

import { DEFAULT_VAT_RATE, computePurchaseOrderTotals } from "./erp";

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

describe("computePurchaseOrderTotals", () => {
  it("sums line subtotals", () => {
    const totals = computePurchaseOrderTotals({
      items: [
        { quantity: 2, unitCost: 10 },
        { quantity: 3, unitCost: 5 },
      ],
      taxRate: 0,
    });

    expect(totals.subtotal).toBe(35);
    expect(totals.total).toBe(35);
  });

  it("applies the default VAT rate when no tax is specified", () => {
    const totals = computePurchaseOrderTotals({
      items: [{ quantity: 1, unitCost: 100 }],
    });

    expect(totals.taxTotal).toBe(round2(100 * DEFAULT_VAT_RATE));
    expect(totals.total).toBe(round2(100 + 100 * DEFAULT_VAT_RATE));
  });

  it("includes shipping in the taxable base and the total", () => {
    const totals = computePurchaseOrderTotals({
      items: [{ quantity: 1, unitCost: 100 }],
      shippingTotal: 20,
      taxRate: 0.18,
    });

    expect(totals.shippingTotal).toBe(20);
    expect(totals.taxTotal).toBe(round2(120 * 0.18));
    expect(totals.total).toBe(round2(120 + 120 * 0.18));
  });

  it("lets an explicit tax amount override the rate", () => {
    const totals = computePurchaseOrderTotals({
      items: [{ quantity: 1, unitCost: 100 }],
      taxRate: 0.18,
      taxTotal: 7,
    });

    expect(totals.taxTotal).toBe(7);
    expect(totals.total).toBe(107);
  });

  it("treats a zero tax rate as exempt (no longer total === subtotal by accident)", () => {
    const totals = computePurchaseOrderTotals({
      items: [{ quantity: 4, unitCost: 25 }],
      taxRate: 0,
    });

    expect(totals.taxTotal).toBe(0);
    expect(totals.total).toBe(100);
  });

  it("never produces negative shipping or tax", () => {
    const totals = computePurchaseOrderTotals({
      items: [{ quantity: 1, unitCost: 50 }],
      shippingTotal: -10,
      taxTotal: -5,
    });

    expect(totals.shippingTotal).toBe(0);
    expect(totals.taxTotal).toBe(0);
    expect(totals.total).toBe(50);
  });
});
