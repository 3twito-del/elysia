import { describe, expect, it } from "vitest";

import { buildNlQuerySchemaContext, resolveNlQuerySelection } from "./nl-query";
import type { Dataset } from "./report-datasets";

const dataset = {
  key: "orders",
  label: "הזמנות",
  description: "בדיקה",
  load: async () => [] as Record<string, unknown>[],
  dimensions: [
    { key: "status", label: "סטטוס", field: "status" },
    { key: "month", label: "חודש", field: "month" },
  ],
  measures: [
    { key: "count", label: "מספר", agg: "COUNT" as const },
    { key: "revenue", label: "הכנסה", agg: "SUM" as const, field: "total" },
  ],
} satisfies Dataset;

describe("buildNlQuerySchemaContext", () => {
  it("lists dataset keys with their dimensions and measures", () => {
    const ctx = buildNlQuerySchemaContext([dataset]);
    expect(ctx).toContain('dataset "orders"');
    expect(ctx).toContain("status (סטטוס)");
    expect(ctx).toContain("revenue (הכנסה)");
  });
});

describe("resolveNlQuerySelection", () => {
  it("resolves known keys and drops unknown ones", () => {
    const { dimensions, measures } = resolveNlQuerySelection(dataset, {
      dimensionKeys: ["status", "bogus"],
      measureKeys: ["revenue"],
    });
    expect(dimensions.map((d) => d.key)).toEqual(["status"]);
    expect(measures.map((m) => m.key)).toEqual(["revenue"]);
  });

  it("falls back to the first measure when none resolve", () => {
    const { measures } = resolveNlQuerySelection(dataset, {
      dimensionKeys: [],
      measureKeys: ["nope"],
    });
    expect(measures.map((m) => m.key)).toEqual(["count"]);
  });
});
