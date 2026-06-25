import { describe, expect, it } from "vitest";

import { parseTransferLines, planStockTransfer } from "./stock-transfer";

describe("planStockTransfer", () => {
  it("emits paired out/in movements per line", () => {
    const movements = planStockTransfer({
      sourceBranchId: "branch-a",
      destBranchId: "branch-b",
      lines: [
        { variantId: "v1", quantity: 3 },
        { variantId: "v2", quantity: 5 },
      ],
    });

    expect(movements).toEqual([
      { branchId: "branch-a", variantId: "v1", delta: -3, reason: "transfer_out" },
      { branchId: "branch-b", variantId: "v1", delta: 3, reason: "transfer_in" },
      { branchId: "branch-a", variantId: "v2", delta: -5, reason: "transfer_out" },
      { branchId: "branch-b", variantId: "v2", delta: 5, reason: "transfer_in" },
    ]);
  });

  it("rejects a transfer to the same branch", () => {
    expect(() =>
      planStockTransfer({
        sourceBranchId: "branch-a",
        destBranchId: "branch-a",
        lines: [{ variantId: "v1", quantity: 1 }],
      }),
    ).toThrow(/שונים/);
  });

  it("rejects non-positive or fractional quantities", () => {
    expect(() =>
      planStockTransfer({
        sourceBranchId: "a",
        destBranchId: "b",
        lines: [{ variantId: "v1", quantity: 0 }],
      }),
    ).toThrow(/חיובי/);
    expect(() =>
      planStockTransfer({
        sourceBranchId: "a",
        destBranchId: "b",
        lines: [{ variantId: "v1", quantity: 1.5 }],
      }),
    ).toThrow(/שלם/);
  });
});

describe("parseTransferLines", () => {
  it("parses SKU and quantity, skipping blanks", () => {
    expect(parseTransferLines("\nRING-01 | 2\n NECK-09 | 5 \n")).toEqual([
      { sku: "RING-01", quantity: 2 },
      { sku: "NECK-09", quantity: 5 },
    ]);
  });

  it("truncates fractional quantities to whole units", () => {
    expect(parseTransferLines("RING-01 | 2.9")).toEqual([
      { sku: "RING-01", quantity: 2 },
    ]);
  });

  it("rejects a missing SKU or non-positive quantity", () => {
    expect(() => parseTransferLines("| 3")).toThrow(/מק"ט/);
    expect(() => parseTransferLines("RING-01 | 0")).toThrow(/כמות/);
  });
});
