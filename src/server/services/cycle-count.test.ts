import { describe, expect, it } from "vitest";

import {
  computeCountVariance,
  parseCountLines,
  planCountAdjustments,
} from "./cycle-count";

describe("computeCountVariance", () => {
  it("computes per-line and aggregate variance", () => {
    const result = computeCountVariance([
      { bookQty: 10, countedQty: 8 }, // -2 shrinkage
      { bookQty: 5, countedQty: 5 }, // no variance
      { bookQty: 0, countedQty: 3 }, // +3 found
    ]);

    expect(result.rows.map((row) => row.variance)).toEqual([-2, 0, 3]);
    expect(result.linesWithVariance).toBe(2);
    expect(result.totalVariance).toBe(1);
  });
});

describe("planCountAdjustments", () => {
  it("emits adjustments only for lines that differ from book", () => {
    const adjustments = planCountAdjustments([
      { variantId: "v1", bookQty: 10, countedQty: 8 },
      { variantId: "v2", bookQty: 5, countedQty: 5 },
      { variantId: "v3", bookQty: 0, countedQty: 3 },
    ]);

    expect(adjustments).toEqual([
      { variantId: "v1", delta: -2, bookQty: 10, countedQty: 8 },
      { variantId: "v3", delta: 3, bookQty: 0, countedQty: 3 },
    ]);
  });
});

describe("parseCountLines", () => {
  it("parses SKU and counted quantity, allowing zero", () => {
    expect(parseCountLines("RING-01 | 8\nNECK-09 | 0")).toEqual([
      { sku: "RING-01", countedQty: 8 },
      { sku: "NECK-09", countedQty: 0 },
    ]);
  });

  it("rejects a missing SKU or negative quantity", () => {
    expect(() => parseCountLines("| 3")).toThrow(/מק"ט/);
    expect(() => parseCountLines("RING-01 | -1")).toThrow(/לא תקינה/);
  });
});
