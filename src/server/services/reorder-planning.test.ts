import { describe, expect, it } from "vitest";

import {
  computeDailyVelocity,
  dynamicReorderPoint,
  netAvailable,
  reorderStatus,
  suggestReorderQuantity,
} from "./reorder-planning";

describe("computeDailyVelocity", () => {
  it("averages consumption over the window", () => {
    expect(computeDailyVelocity(60, 30)).toBe(2);
    expect(computeDailyVelocity(45, 30)).toBe(1.5);
    expect(computeDailyVelocity(10, 0)).toBe(0);
  });
});

describe("dynamicReorderPoint", () => {
  it("covers demand over the lead time plus safety stock", () => {
    expect(
      dynamicReorderPoint({ velocityPerDay: 2, leadTimeDays: 14, safetyStock: 5 }),
    ).toBe(33); // ceil(28) + 5
    expect(
      dynamicReorderPoint({ velocityPerDay: 1.5, leadTimeDays: 10, safetyStock: 0 }),
    ).toBe(15);
  });
});

describe("netAvailable", () => {
  it("subtracts reserved, never below zero", () => {
    expect(netAvailable(10, 3)).toBe(7);
    expect(netAvailable(2, 5)).toBe(0);
  });
});

describe("suggestReorderQuantity", () => {
  it("replenishes up to target when at/below the reorder point", () => {
    expect(
      suggestReorderQuantity({ available: 3, reorderPoint: 5, targetLevel: 20 }),
    ).toBe(17);
    expect(
      suggestReorderQuantity({ available: 5, reorderPoint: 5, targetLevel: 20 }),
    ).toBe(15);
  });

  it("suggests nothing above the point or with no policy", () => {
    expect(
      suggestReorderQuantity({ available: 9, reorderPoint: 5, targetLevel: 20 }),
    ).toBe(0);
    expect(
      suggestReorderQuantity({ available: 0, reorderPoint: 0, targetLevel: 20 }),
    ).toBe(0);
  });
});

describe("reorderStatus", () => {
  it("classifies OK / REORDER / CRITICAL", () => {
    expect(reorderStatus(0, 5)).toBe("CRITICAL");
    expect(reorderStatus(4, 5)).toBe("REORDER");
    expect(reorderStatus(10, 5)).toBe("OK");
    expect(reorderStatus(10, 0)).toBe("OK"); // no policy
  });
});
