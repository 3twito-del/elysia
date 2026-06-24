import { describe, expect, it } from "vitest";

import { computeChurnRisk, computeHealthScore, isRevenueOrder } from "./crm";

describe("computeChurnRisk", () => {
  it("returns ACTIVE for customers with no orders or no recency signal", () => {
    expect(computeChurnRisk({ orderCount: 0, recencyDays: null })).toBe(
      "ACTIVE",
    );
    expect(computeChurnRisk({ orderCount: 5, recencyDays: null })).toBe(
      "ACTIVE",
    );
  });

  it("bands recency strictly: ACTIVE < WARNING < HIGH < DORMANT", () => {
    expect(computeChurnRisk({ orderCount: 3, recencyDays: 10 })).toBe("ACTIVE");
    expect(computeChurnRisk({ orderCount: 3, recencyDays: 60 })).toBe(
      "WARNING",
    );
    expect(computeChurnRisk({ orderCount: 3, recencyDays: 119 })).toBe(
      "WARNING",
    );
    expect(computeChurnRisk({ orderCount: 3, recencyDays: 120 })).toBe("HIGH");
    expect(computeChurnRisk({ orderCount: 3, recencyDays: 179 })).toBe("HIGH");
    expect(computeChurnRisk({ orderCount: 3, recencyDays: 180 })).toBe(
      "DORMANT",
    );
  });

  it("makes the HIGH band reachable (regression for the old ordering bug)", () => {
    // Previously DORMANT(90) was checked before HIGH(120), so HIGH was dead code.
    expect(computeChurnRisk({ orderCount: 1, recencyDays: 150 })).toBe("HIGH");
  });
});

describe("isRevenueOrder", () => {
  it("excludes cancelled and refunded orders only", () => {
    expect(isRevenueOrder({ status: "PAID" })).toBe(true);
    expect(isRevenueOrder({ status: "COMPLETED" })).toBe(true);
    expect(isRevenueOrder({ status: "PENDING_PAYMENT" })).toBe(true);
    expect(isRevenueOrder({ status: "CANCELLED" })).toBe(false);
    expect(isRevenueOrder({ status: "REFUNDED" })).toBe(false);
  });
});

describe("computeHealthScore", () => {
  it("stays within the 0–100 range at both extremes", () => {
    const high = computeHealthScore({
      lifetimeValue: 100_000,
      orderCount: 50,
      wishlistItems: 20,
      openCart: true,
      recencyDays: 0,
    });
    expect(high).toBeGreaterThanOrEqual(0);
    expect(high).toBeLessThanOrEqual(100);

    const low = computeHealthScore({
      lifetimeValue: 0,
      orderCount: 0,
      wishlistItems: 0,
      openCart: false,
      recencyDays: 400,
    });
    expect(low).toBeGreaterThanOrEqual(0);
    expect(low).toBeLessThanOrEqual(100);
  });

  it("rewards a recently-active customer over an otherwise-identical dormant one", () => {
    const engaged = computeHealthScore({
      lifetimeValue: 1000,
      orderCount: 5,
      wishlistItems: 3,
      openCart: true,
      recencyDays: 5,
    });
    const dormant = computeHealthScore({
      lifetimeValue: 1000,
      orderCount: 5,
      wishlistItems: 3,
      openCart: true,
      recencyDays: 300,
    });

    expect(engaged).toBeGreaterThan(dormant);
  });
});
