import { describe, expect, it } from "vitest";

import { allocateLandedCost } from "./landed-cost";

describe("allocateLandedCost", () => {
  const layers = [
    { id: "a", quantity: 10, unitCost: 100 }, // value 1000
    { id: "b", quantity: 10, unitCost: 300 }, // value 3000
  ];

  it("allocates by VALUE and sums exactly to the amount", () => {
    const result = allocateLandedCost(400, "VALUE", layers);
    // weights 1000:3000 → 100 / 300
    expect(result.map((r) => r.allocated)).toEqual([100, 300]);
    expect(result[0]!.addedUnitCost).toBe(10);
    expect(result[1]!.addedUnitCost).toBe(30);
    expect(result[0]!.newUnitCost).toBe(110);
    expect(result[1]!.newUnitCost).toBe(330);
    expect(result.reduce((s, r) => s + r.allocated, 0)).toBe(400);
  });

  it("allocates by QUANTITY evenly", () => {
    const result = allocateLandedCost(400, "QUANTITY", layers);
    expect(result.map((r) => r.allocated)).toEqual([200, 200]);
    expect(result.map((r) => r.addedUnitCost)).toEqual([20, 20]);
  });

  it("absorbs the rounding residual into the largest-weight layer", () => {
    const result = allocateLandedCost(
      100,
      "QUANTITY",
      [
        { id: "x", quantity: 1, unitCost: 50 },
        { id: "y", quantity: 2, unitCost: 50 },
      ],
    );
    // raw 33.33 / 66.66 → rounded 33.33 + 66.67 = 100 exactly
    expect(result.reduce((s, r) => s + r.allocated, 0)).toBe(100);
  });

  it("allocates nothing when weight or amount is zero", () => {
    expect(allocateLandedCost(0, "VALUE", layers).every((r) => r.allocated === 0)).toBe(
      true,
    );
    const zeroQty = allocateLandedCost(100, "QUANTITY", [
      { id: "z", quantity: 0, unitCost: 0 },
    ]);
    expect(zeroQty[0]!.allocated).toBe(0);
    expect(zeroQty[0]!.addedUnitCost).toBe(0);
  });

  it("returns [] for no layers", () => {
    expect(allocateLandedCost(100, "VALUE", [])).toEqual([]);
  });
});
