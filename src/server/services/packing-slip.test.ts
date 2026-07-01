import { describe, expect, it } from "vitest";

import { buildPackingSlipModel } from "./packing-slip";

describe("buildPackingSlipModel", () => {
  const base = {
    orderNumber: "ORD-1001",
    recipientName: "דנה כהן",
    generatedAt: new Date("2026-03-07T00:00:00Z"),
    items: [
      { name: "טבעת", sku: "R-1", quantity: 2 },
      { name: "שרשרת", sku: "N-1", quantity: 1 },
    ],
  };

  it("totals units and line count", () => {
    const model = buildPackingSlipModel({ ...base, shippingAddress: null });
    expect(model.lineCount).toBe(2);
    expect(model.totalUnits).toBe(3);
    expect(model.address).toBeNull();
  });

  it("parses a shipping address object", () => {
    const model = buildPackingSlipModel({
      ...base,
      shippingAddress: {
        recipient: "דנה כהן",
        phone: "050-1234567",
        street: "הרצל 1",
        city: "תל אביב",
        postalCode: "6100000",
      },
    });
    expect(model.address).toEqual({
      recipient: "דנה כהן",
      phone: "050-1234567",
      street: "הרצל 1",
      city: "תל אביב",
      postalCode: "6100000",
    });
  });

  it("falls back to recipientName and nulls for a partial address", () => {
    const model = buildPackingSlipModel({
      ...base,
      shippingAddress: { city: "חיפה" },
    });
    expect(model.address?.recipient).toBe("דנה כהן");
    expect(model.address?.city).toBe("חיפה");
    expect(model.address?.street).toBeNull();
  });
});
