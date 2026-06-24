import { describe, expect, it } from "vitest";

import {
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

describe("weightedAverageUnitCost", () => {
  it("computes the quantity-weighted average cost", () => {
    expect(weightedAverageUnitCost(layers)).toBe(6);
  });

  it("returns zero when there are no layers", () => {
    expect(weightedAverageUnitCost([])).toBe(0);
  });
});
