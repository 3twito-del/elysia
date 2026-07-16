import { describe, expect, it } from "vitest";

import {
  canReserveStock,
  getInventoryLowStockThresholdCopy,
  getSellableQuantity,
  isPublicSellableQuantityLowStock,
  isInventoryLowStock,
  resolveItemFulfillment,
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

  it("resolves full reservation with no backorder when stock covers demand (OMS-002)", () => {
    expect(
      resolveItemFulfillment({
        quantity: 6,
        reserved: 2,
        safetyStock: 1,
        requested: 3,
        backorderEnabled: false,
      }),
    ).toEqual({ reserveNow: 3, backorder: 0 });

    // backorderEnabled doesn't matter when nothing is actually short.
    expect(
      resolveItemFulfillment({
        quantity: 6,
        reserved: 2,
        safetyStock: 1,
        requested: 3,
        backorderEnabled: true,
      }),
    ).toEqual({ reserveNow: 3, backorder: 0 });
  });

  it("splits reserve-now/backorder when demand exceeds sellable stock and backorder is enabled", () => {
    // sellable = 6-2-1 = 3, requested 5 -> reserve 3 now, backorder 2.
    expect(
      resolveItemFulfillment({
        quantity: 6,
        reserved: 2,
        safetyStock: 1,
        requested: 5,
        backorderEnabled: true,
      }),
    ).toEqual({ reserveNow: 3, backorder: 2 });
  });

  it("returns null (reject) when demand exceeds sellable stock and backorder isn't enabled", () => {
    expect(
      resolveItemFulfillment({
        quantity: 6,
        reserved: 2,
        safetyStock: 1,
        requested: 5,
        backorderEnabled: false,
      }),
    ).toBeNull();
  });

  it("backorders the full requested quantity when nothing is sellable at all", () => {
    expect(
      resolveItemFulfillment({
        quantity: 2,
        reserved: 2,
        safetyStock: 0,
        requested: 4,
        backorderEnabled: true,
      }),
    ).toEqual({ reserveNow: 0, backorder: 4 });
  });

  it("documents the low-stock threshold used by admin inventory views", () => {
    expect(
      isInventoryLowStock({ quantity: 5, reserved: 2, safetyStock: 3 }),
    ).toBe(true);
    expect(
      isInventoryLowStock({ quantity: 8, reserved: 1, safetyStock: 2 }),
    ).toBe(false);
    expect(getInventoryLowStockThresholdCopy({ safetyStock: 3 })).toContain(
      "זמין קטן או שווה למלאי הביטחון (3)",
    );
  });

  it("keeps public low-stock cues restrained to positive limited availability", () => {
    expect(isPublicSellableQuantityLowStock(0)).toBe(false);
    expect(isPublicSellableQuantityLowStock(1)).toBe(true);
    expect(isPublicSellableQuantityLowStock(2)).toBe(true);
    expect(isPublicSellableQuantityLowStock(3)).toBe(false);
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

  it("admits exactly the sellable quantity across a burst of single-unit races", () => {
    // 5 on hand, safety 1 => exactly 4 sellable. Six concurrent buyers each
    // wanting one unit: the first four win, the last two are refused. This is
    // the invariant the checkout compare-and-swap enforces at the DB level.
    const results = simulateInventoryReservations({
      quantity: 5,
      reserved: 0,
      requests: [1, 1, 1, 1, 1, 1],
      safetyStock: 1,
    });

    expect(results.map((row) => row.accepted)).toEqual([
      true,
      true,
      true,
      true,
      false,
      false,
    ]);
    expect(results.at(-1)?.reservedAfter).toBe(4);
    expect(results.at(-1)?.sellableAfter).toBe(0);
    // No oversell: accepted units never exceed on-hand minus safety stock.
    const accepted = results
      .filter((row) => row.accepted)
      .reduce((sum, row) => sum + row.requested, 0);

    expect(accepted).toBeLessThanOrEqual(5 - 1);
  });

  it("refuses a multi-unit request that would cross the safety-stock floor but admits a smaller one behind it", () => {
    // 6 on hand, safety 2, one unit already reserved => 3 sellable. A request
    // for 4 is refused (would breach safety stock); a later request for 3
    // still fits exactly, and a trailing request for 1 is then refused.
    const results = simulateInventoryReservations({
      quantity: 6,
      reserved: 1,
      requests: [4, 3, 1],
      safetyStock: 2,
    });

    expect(results.map((row) => row.accepted)).toEqual([false, true, false]);
    expect(results[1]?.reservedAfter).toBe(4);
    expect(results[1]?.sellableAfter).toBe(0);
  });

  it("treats an already-oversubscribed row as fully unavailable", () => {
    // reserved already exceeds on-hand (e.g. after a manual correction):
    // every further request must be refused, never producing negative stock.
    const results = simulateInventoryReservations({
      quantity: 3,
      reserved: 5,
      requests: [1, 2],
      safetyStock: 0,
    });

    expect(results.every((row) => !row.accepted)).toBe(true);
    expect(results.every((row) => row.sellableAfter === 0)).toBe(true);
  });
});
