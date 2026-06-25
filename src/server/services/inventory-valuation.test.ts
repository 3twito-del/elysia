import { describe, expect, it } from "vitest";

import {
  resolveUnitCost,
  valueFifoEndingInventory,
  weightedAverageUnitCost,
} from "./inventory-valuation";

const layers = [
  { quantity: 10, unitCost: 5 }, // oldest
  { quantity: 10, unitCost: 7 }, // newest
];

describe("valueFifoEndingInventory", () => {
  it("values the on-hand units against the newest layers (oldest sold first)", () => {
    // 20 received, 12 on hand → 8 oldest sold; remaining = 10@7 + 2@5 = 80
    const result = valueFifoEndingInventory(layers, 12);
    expect(result).toEqual({ value: 80, valuedQuantity: 12 });
  });

  it("returns zero for no on-hand stock", () => {
    expect(valueFifoEndingInventory(layers, 0)).toEqual({
      value: 0,
      valuedQuantity: 0,
    });
  });

  it("caps valuation at the available layers when on-hand exceeds receipts", () => {
    // only 20 units of cost basis exist → 10*5 + 10*7 = 120
    const result = valueFifoEndingInventory(layers, 25);
    expect(result).toEqual({ value: 120, valuedQuantity: 20 });
  });
});

describe("resolveUnitCost", () => {
  it("prefers the weighted-average from cost layers", () => {
    expect(
      resolveUnitCost({
        layers: [
          { quantity: 10, unitCost: 5 },
          { quantity: 10, unitCost: 7 },
        ],
        snapshotCost: 9,
        unitPrice: 100,
      }),
    ).toBe(6);
  });

  it("falls back to the cost snapshot when there are no layers", () => {
    expect(
      resolveUnitCost({ layers: [], snapshotCost: 9, unitPrice: 100 }),
    ).toBe(9);
  });

  it("falls back to 40% of price when there is no cost data", () => {
    expect(
      resolveUnitCost({ layers: [], snapshotCost: null, unitPrice: 100 }),
    ).toBe(40);
  });
});

describe("weightedAverageUnitCost", () => {
  it("computes the quantity-weighted average cost", () => {
    expect(weightedAverageUnitCost(layers)).toBe(6);
  });

  it("returns zero when there are no layers", () => {
    expect(weightedAverageUnitCost([])).toBe(0);
  });
});
