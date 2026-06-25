import { describe, expect, it } from "vitest";

import { allocateDemand, computeNetworkAtp } from "./availability";

describe("computeNetworkAtp", () => {
  it("sums sellable (on-hand − reserved − safety) across branches", () => {
    const atp = computeNetworkAtp([
      { branchId: "a", quantity: 10, reserved: 2, safetyStock: 1 }, // 7
      { branchId: "b", quantity: 5, reserved: 5, safetyStock: 0 }, // 0
      { branchId: "c", quantity: 4, reserved: 0, safetyStock: 1 }, // 3
    ]);

    expect(atp.networkAtp).toBe(10);
    expect(atp.totalOnHand).toBe(19);
    expect(atp.totalReserved).toBe(7);
    expect(atp.byBranch.find((b) => b.branchId === "a")?.sellable).toBe(7);
    expect(atp.byBranch.find((b) => b.branchId === "b")?.sellable).toBe(0);
  });
});

describe("allocateDemand", () => {
  it("fills from the fullest branch first and reports the remainder", () => {
    const plan = allocateDemand(
      [
        { branchId: "a", sellable: 7 },
        { branchId: "c", sellable: 3 },
      ],
      8,
    );

    expect(plan.allocations).toEqual([
      { branchId: "a", allocated: 7 },
      { branchId: "c", allocated: 1 },
    ]);
    expect(plan.fulfilled).toBe(8);
    expect(plan.shortfall).toBe(0);
    expect(plan.fullyFulfilled).toBe(true);
  });

  it("reports a shortfall when demand exceeds network ATP", () => {
    const plan = allocateDemand([{ branchId: "a", sellable: 2 }], 5);

    expect(plan.allocations).toEqual([{ branchId: "a", allocated: 2 }]);
    expect(plan.fulfilled).toBe(2);
    expect(plan.shortfall).toBe(3);
    expect(plan.fullyFulfilled).toBe(false);
  });
});
