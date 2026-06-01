import { describe, expect, it } from "vitest";

import {
  canReserveStock,
  getSellableQuantity,
  simulateInventoryReservations,
} from "./inventory";

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

  it("simulates limited-stock checkout races deterministically", () => {
    expect(
      simulateInventoryReservations({
        quantity: 2,
        reserved: 0,
        requests: [1, 1],
        safetyStock: 1,
      }),
    ).toEqual([
      {
        accepted: true,
        beforeReserved: 0,
        index: 0,
        requested: 1,
        reservedAfter: 1,
        sellableAfter: 0,
      },
      {
        accepted: false,
        beforeReserved: 1,
        index: 1,
        requested: 1,
        reservedAfter: 1,
        sellableAfter: 0,
      },
    ]);
  });
});
