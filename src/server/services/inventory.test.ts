import { describe, expect, it } from "vitest";

import { canReserveStock, getSellableQuantity } from "./inventory";

describe("inventory service", () => {
  it("subtracts reservations and safety stock", () => {
    expect(
      getSellableQuantity({ quantity: 8, reserved: 2, safetyStock: 1 }),
    ).toBe(5);
  });

  it("never returns a negative sellable quantity", () => {
    expect(
      getSellableQuantity({ quantity: 1, reserved: 3, safetyStock: 1 }),
    ).toBe(0);
  });

  it("checks reservation feasibility", () => {
    expect(
      canReserveStock({
        quantity: 6,
        reserved: 2,
        safetyStock: 1,
        requested: 3,
      }),
    ).toBe(true);
    expect(
      canReserveStock({
        quantity: 6,
        reserved: 2,
        safetyStock: 1,
        requested: 4,
      }),
    ).toBe(false);
  });
});
