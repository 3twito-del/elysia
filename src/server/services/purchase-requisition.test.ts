import { describe, expect, it } from "vitest";

import {
  computeRequisitionTotal,
  parseRequisitionLines,
  requiresApproval,
} from "./purchase-requisition";

describe("computeRequisitionTotal", () => {
  it("sums quantity × unitCost, rounded to 2dp", () => {
    expect(
      computeRequisitionTotal([
        { quantity: 3, unitCost: 100 },
        { quantity: 2, unitCost: 49.995 },
      ]),
    ).toBe(399.99);
  });

  it("is zero for no lines", () => {
    expect(computeRequisitionTotal([])).toBe(0);
  });
});

describe("requiresApproval", () => {
  it("needs approval at or above the threshold", () => {
    expect(requiresApproval(5000, 5000)).toBe(true);
    expect(requiresApproval(9000, 5000)).toBe(true);
  });

  it("auto-approves below the threshold", () => {
    expect(requiresApproval(4999.99, 5000)).toBe(false);
  });

  it("uses the default threshold when omitted", () => {
    expect(requiresApproval(10000)).toBe(true);
    expect(requiresApproval(10)).toBe(false);
  });
});

describe("parseRequisitionLines", () => {
  it("parses 'description | quantity | unitCost' rows", () => {
    const lines = parseRequisitionLines("מסך 27 | 2 | 900\n\nכיסא | 5 | 350");
    expect(lines).toEqual([
      { description: "מסך 27", quantity: 2, unitCost: 900 },
      { description: "כיסא", quantity: 5, unitCost: 350 },
    ]);
  });

  it("rejects a missing description or non-positive quantity", () => {
    expect(() => parseRequisitionLines("| 2 | 900")).toThrow();
    expect(() => parseRequisitionLines("פריט | 0 | 10")).toThrow();
  });
});
