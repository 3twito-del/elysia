import { describe, expect, it } from "vitest";

import { DATASETS, getDataset, listDatasets, monthOf } from "./report-datasets";

describe("monthOf", () => {
  it("buckets a date to YYYY-MM", () => {
    expect(monthOf(new Date("2026-03-15T10:00:00Z"))).toBe("2026-03");
    expect(monthOf(null)).toBe("—");
  });
});

describe("dataset registry", () => {
  it("exposes orders and ledger with dimensions and measures", () => {
    expect(Object.keys(DATASETS).sort()).toEqual(["ledger", "orders"]);
    const orders = getDataset("orders");
    expect(orders?.measures.some((m) => m.key === "revenue")).toBe(true);
    expect(orders?.dimensions.some((d) => d.key === "month")).toBe(true);
    expect(getDataset("nope")).toBeUndefined();
  });

  it("lists metadata without loaders", () => {
    const list = listDatasets();
    expect(list).toHaveLength(2);
    expect(list[0]).not.toHaveProperty("load");
  });
});
