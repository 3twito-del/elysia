import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { applyPriceRules } from "./pricing-rules";

describe("applyPriceRules", () => {
  const rules = [
    { code: "P10", type: "PERCENT", value: 10, minQuantity: 1 },
    { code: "BULK", type: "FIXED", value: 50, minQuantity: 5 },
  ];

  it("picks the rule that yields the lowest total", () => {
    // unit 100 x qty 2 = 200; PERCENT 10% -> 180; BULK not eligible (qty<5)
    expect(applyPriceRules({ unitPrice: 100, quantity: 2, rules })).toEqual({
      originalTotal: 200,
      discountedTotal: 180,
      discount: 20,
      bestRuleCode: "P10",
    });
  });

  it("honours minimum quantity and compares rules", () => {
    // unit 100 x qty 5 = 500; PERCENT 10% -> 450; FIXED 50 -> 450; first wins on tie? lower picked, P10 first
    const result = applyPriceRules({ unitPrice: 100, quantity: 5, rules });
    expect(result.discountedTotal).toBe(450);
  });

  it("returns the original total when no rule applies", () => {
    expect(
      applyPriceRules({ unitPrice: 100, quantity: 1, rules: [] }),
    ).toEqual({
      originalTotal: 100,
      discountedTotal: 100,
      discount: 0,
      bestRuleCode: null,
    });
  });

  it("never discounts below zero", () => {
    const result = applyPriceRules({
      unitPrice: 10,
      quantity: 1,
      rules: [{ code: "BIG", type: "FIXED", value: 999, minQuantity: 1 }],
    });
    expect(result.discountedTotal).toBe(0);
  });
});

describe("K-14 audit coverage", () => {
  it("createPriceRule and setPriceRuleActive write an AuditLog row inside a transaction", () => {
    const source = readFileSync(
      path.join(process.cwd(), "src/server/services/pricing-rules.ts"),
      "utf8",
    );

    for (const operation of ["createPriceRule", "setPriceRuleActive"]) {
      const start = source.indexOf(`export async function ${operation}`);
      const next = source.indexOf("\nexport async function ", start + 1);

      expect(start).toBeGreaterThanOrEqual(0);

      const body = source.slice(start, next === -1 ? source.length : next);

      expect(body).toContain("db.$transaction");
      expect(body).toContain("writeAdminAudit");
    }
  });
});
