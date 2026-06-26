import { describe, expect, it } from "vitest";

import {
  aggregateMeasure,
  aggregateRows,
  formatMeasure,
  toCsv,
  type Dimension,
  type Measure,
} from "./report-engine";

const rows = [
  { status: "PAID", branch: "TLV", total: 100 },
  { status: "PAID", branch: "TLV", total: 300 },
  { status: "PAID", branch: "HFA", total: 200 },
  { status: "REFUNDED", branch: "TLV", total: 50 },
];

const statusDim: Dimension = { key: "status", label: "סטטוס", field: "status" };
const countMeasure: Measure = { key: "count", label: "כמות", agg: "COUNT" };
const revenueMeasure: Measure = {
  key: "revenue",
  label: "הכנסה",
  agg: "SUM",
  field: "total",
  format: "CURRENCY",
};

describe("aggregateMeasure", () => {
  it("counts, sums, averages and distinct-counts", () => {
    expect(aggregateMeasure(rows, countMeasure)).toBe(4);
    expect(aggregateMeasure(rows, revenueMeasure)).toBe(650);
    expect(
      aggregateMeasure(rows, { key: "aov", label: "AOV", agg: "AVG", field: "total" }),
    ).toBe(162.5);
    expect(
      aggregateMeasure(rows, { key: "b", label: "branches", agg: "COUNT_DISTINCT", field: "branch" }),
    ).toBe(2);
  });
});

describe("aggregateRows", () => {
  it("groups by a dimension and totals", () => {
    const result = aggregateRows({
      rows,
      dimensions: [statusDim],
      measures: [countMeasure, revenueMeasure],
    });

    expect(result.rowCount).toBe(4);
    expect(result.totals).toEqual({ count: 4, revenue: 650 });
    // sorted by first measure (count) desc → PAID first
    expect(result.rows[0]?.dimensions.status).toBe("PAID");
    expect(result.rows[0]?.measures).toEqual({ count: 3, revenue: 600 });
    expect(result.rows[1]?.measures).toEqual({ count: 1, revenue: 50 });
  });

  it("applies a filter via the rule engine", () => {
    const result = aggregateRows({
      rows,
      dimensions: [statusDim],
      measures: [countMeasure],
      filter: { field: "status", op: "eq", value: "PAID" },
    });
    expect(result.rowCount).toBe(3);
    expect(result.rows).toHaveLength(1);
  });

  it("produces a single total row with no dimensions", () => {
    const result = aggregateRows({ rows, dimensions: [], measures: [revenueMeasure] });
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]?.measures.revenue).toBe(650);
  });
});

describe("formatMeasure", () => {
  it("formats currency and percent", () => {
    expect(formatMeasure(1500, "CURRENCY")).toContain("₪");
    expect(formatMeasure(12.5, "PERCENT")).toContain("%");
  });
});

describe("toCsv", () => {
  it("emits header, rows and a totals line", () => {
    const result = aggregateRows({
      rows,
      dimensions: [statusDim],
      measures: [countMeasure],
    });
    const csv = toCsv(result).split("\n");
    expect(csv[0]).toBe("סטטוס,כמות");
    expect(csv.at(-1)).toContain("4");
  });
});
