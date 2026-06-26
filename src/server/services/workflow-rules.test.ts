import { describe, expect, it } from "vitest";

import {
  describeCondition,
  evaluateCondition,
  getPath,
  validateRule,
} from "./workflow-rules";

describe("getPath", () => {
  it("reads dotted paths", () => {
    const ctx = { order: { total: 500, customer: { vip: true } } };
    expect(getPath(ctx, "order.total")).toBe(500);
    expect(getPath(ctx, "order.customer.vip")).toBe(true);
    expect(getPath(ctx, "order.missing")).toBeUndefined();
    expect(getPath(ctx, "nope.deep.path")).toBeUndefined();
  });
});

describe("evaluateCondition", () => {
  const ctx = { amount: 1200, status: "PAID", tags: ["vip", "rush"] };

  it("treats a null rule as always true", () => {
    expect(evaluateCondition(null, ctx)).toBe(true);
    expect(evaluateCondition({}, ctx)).toBe(true);
  });

  it("evaluates numeric comparisons", () => {
    expect(evaluateCondition({ field: "amount", op: "gt", value: 1000 }, ctx)).toBe(true);
    expect(evaluateCondition({ field: "amount", op: "lt", value: 1000 }, ctx)).toBe(false);
    expect(evaluateCondition({ field: "amount", op: "gte", value: 1200 }, ctx)).toBe(true);
  });

  it("evaluates eq / neq / in / contains / exists", () => {
    expect(evaluateCondition({ field: "status", op: "eq", value: "PAID" }, ctx)).toBe(true);
    expect(evaluateCondition({ field: "status", op: "neq", value: "PAID" }, ctx)).toBe(false);
    expect(evaluateCondition({ field: "status", op: "in", value: ["PAID", "SHIPPED"] }, ctx)).toBe(true);
    expect(evaluateCondition({ field: "tags", op: "contains", value: "vip" }, ctx)).toBe(true);
    expect(evaluateCondition({ field: "tags", op: "contains", value: "none" }, ctx)).toBe(false);
    expect(evaluateCondition({ field: "status", op: "exists" }, ctx)).toBe(true);
    expect(evaluateCondition({ field: "missing", op: "exists" }, ctx)).toBe(false);
  });

  it("combines with all / any / not", () => {
    const rule = {
      all: [
        { field: "amount", op: "gte", value: 1000 },
        { any: [{ field: "status", op: "eq", value: "PAID" }, { field: "status", op: "eq", value: "SHIPPED" }] },
        { not: { field: "tags", op: "contains", value: "blocked" } },
      ],
    };
    expect(evaluateCondition(rule, ctx)).toBe(true);
    expect(evaluateCondition(rule, { ...ctx, amount: 10 })).toBe(false);
  });

  it("fails gracefully on non-numeric comparison", () => {
    expect(evaluateCondition({ field: "status", op: "gt", value: 5 }, ctx)).toBe(false);
  });
});

describe("describeCondition", () => {
  it("describes a null rule and a leaf", () => {
    expect(describeCondition(null)).toBe("תמיד");
    expect(describeCondition({ field: "amount", op: "gt", value: 1000 })).toBe(
      "amount גדול מ 1000",
    );
  });

  it("joins branches", () => {
    expect(
      describeCondition({
        all: [
          { field: "a", op: "eq", value: 1 },
          { field: "b", op: "exists" },
        ],
      }),
    ).toBe("a שווה ל 1 וגם b קיים");
  });
});

describe("validateRule", () => {
  it("accepts a valid tree", () => {
    expect(
      validateRule({ all: [{ field: "amount", op: "gt", value: 5 }] }),
    ).toEqual([]);
    expect(validateRule(null)).toEqual([]);
  });

  it("flags an unknown operator and a missing value", () => {
    expect(validateRule({ field: "x", op: "bogus", value: 1 })).toEqual([
      "אופרטור לא נתמך: bogus.",
    ]);
    expect(validateRule({ field: "x", op: "gt" })).toEqual([
      "אופרטור gt דורש ערך.",
    ]);
  });

  it("flags a missing field", () => {
    expect(validateRule({ op: "exists" })).toContain("חסר שדה (field) בתנאי.");
  });
});
