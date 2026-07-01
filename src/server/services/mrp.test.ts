import { describe, expect, it } from "vitest";

import {
  computeNetRequirement,
  explodeRequirements,
  mrpStatus,
} from "./mrp";

describe("explodeRequirements", () => {
  it("multiplies per-unit quantity by build quantity", () => {
    const result = explodeRequirements(
      [
        { componentVariantId: "a", quantity: 2 },
        { componentVariantId: "b", quantity: 5 },
      ],
      10,
    );
    expect(result).toEqual([
      { componentVariantId: "a", gross: 20 },
      { componentVariantId: "b", gross: 50 },
    ]);
  });
});

describe("computeNetRequirement", () => {
  it("nets gross against on-hand and on-order, floored at 0", () => {
    expect(
      computeNetRequirement({ gross: 100, onHand: 30, onOrder: 20 }),
    ).toBe(50);
    expect(
      computeNetRequirement({ gross: 40, onHand: 60, onOrder: 0 }),
    ).toBe(0);
  });

  it("adds safety stock to the requirement", () => {
    expect(
      computeNetRequirement({ gross: 10, onHand: 10, onOrder: 0, safetyStock: 5 }),
    ).toBe(5);
  });
});

describe("mrpStatus", () => {
  it("flags a shortage only for positive net", () => {
    expect(mrpStatus(5)).toBe("SHORTAGE");
    expect(mrpStatus(0)).toBe("OK");
  });
});
