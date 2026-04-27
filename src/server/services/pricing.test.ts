import { describe, expect, it } from "vitest";

import {
  calculateDiscount,
  calculateOrderTotal,
  calculateSubtotal,
} from "./pricing";

describe("pricing service", () => {
  it("calculates subtotal from line items", () => {
    expect(
      calculateSubtotal([
        { unitPrice: 1290, quantity: 1 },
        { unitPrice: 690, quantity: 2 },
      ]),
    ).toBe(2670);
  });

  it("uses the larger coupon value and caps discount at subtotal", () => {
    expect(calculateDiscount(1000, { percentOff: 10, amountOff: 180 })).toBe(
      180,
    );
    expect(calculateDiscount(100, { amountOff: 200 })).toBe(100);
  });

  it("returns a non-negative order total", () => {
    expect(
      calculateOrderTotal({
        items: [{ unitPrice: 100, quantity: 1 }],
        shipping: 29,
        coupon: { amountOff: 200 },
      }),
    ).toEqual({
      subtotal: 100,
      discount: 100,
      shipping: 29,
      total: 29,
    });
  });
});
