import { describe, expect, it } from "vitest";

import { validateReportSpec } from "./reports";

const dataset = {
  dimensions: [
    { key: "status", label: "סטטוס", field: "status" },
    { key: "month", label: "חודש", field: "month" },
  ],
  measures: [
    { key: "count", label: "כמות", agg: "COUNT" as const },
    { key: "revenue", label: "הכנסה", agg: "SUM" as const, field: "total" },
  ],
};

describe("validateReportSpec", () => {
  it("accepts valid dimensions and measures", () => {
    expect(validateReportSpec(dataset, ["status"], ["revenue"])).toEqual([]);
  });

  it("requires at least one measure", () => {
    expect(validateReportSpec(dataset, ["status"], [])).toEqual([
      "יש לבחור לפחות מדד אחד.",
    ]);
  });

  it("rejects unknown dimensions and measures", () => {
    expect(validateReportSpec(dataset, ["bogus"], ["nope"])).toEqual([
      "ממד לא קיים במאגר: bogus.",
      "מדד לא קיים במאגר: nope.",
    ]);
  });
});
