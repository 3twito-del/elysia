import { describe, expect, it } from "vitest";

import {
  aggregatePickLines,
  compareBinPath,
  pickListProgress,
  sortByBinPath,
} from "./pick-list";

describe("aggregatePickLines", () => {
  it("merges lines by variant, summing quantities", () => {
    const result = aggregatePickLines([
      { variantId: "v1", sku: "A", name: "Ring", quantity: 2 },
      { variantId: "v2", sku: "B", name: "Chain", quantity: 1 },
      { variantId: "v1", sku: "A", name: "Ring", quantity: 3 },
    ]);
    expect(result).toHaveLength(2);
    expect(result.find((l) => l.variantId === "v1")?.quantity).toBe(5);
  });
});

describe("compareBinPath", () => {
  it("orders bins naturally by segment number", () => {
    expect(compareBinPath("A-01-3", "A-01-10")).toBeLessThan(0);
    expect(compareBinPath("B-01-1", "A-99-9")).toBeGreaterThan(0);
  });

  it("sorts empty/absent bins last", () => {
    expect(compareBinPath(null, "A-01-1")).toBeGreaterThan(0);
    expect(compareBinPath("A-01-1", null)).toBeLessThan(0);
    expect(compareBinPath(null, null)).toBe(0);
  });
});

describe("sortByBinPath", () => {
  it("returns lines along the pick path with unbinned last", () => {
    const sorted = sortByBinPath([
      { variantId: "c", sku: "c", name: "c", quantity: 1, binCode: null },
      { variantId: "b", sku: "b", name: "b", quantity: 1, binCode: "A-02-1" },
      { variantId: "a", sku: "a", name: "a", quantity: 1, binCode: "A-01-1" },
    ]);
    expect(sorted.map((l) => l.variantId)).toEqual(["a", "b", "c"]);
  });
});

describe("pickListProgress", () => {
  it("computes picked count and percentage", () => {
    expect(
      pickListProgress([{ picked: true }, { picked: false }, { picked: true }]),
    ).toEqual({ total: 3, picked: 2, pct: 67 });
    expect(pickListProgress([])).toEqual({ total: 0, picked: 0, pct: 0 });
  });
});
