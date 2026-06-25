import { describe, expect, it } from "vitest";

import {
  buildCashFlowStatement,
  classifyCashFlow,
} from "./cash-flow";

describe("classifyCashFlow", () => {
  it("maps known auto-posting sources to operating", () => {
    expect(classifyCashFlow("customer_receipt")).toBe("OPERATING");
    expect(classifyCashFlow("vendor_payment")).toBe("OPERATING");
  });

  it("treats a manual entry against equity as financing", () => {
    expect(classifyCashFlow("manual", ["EQUITY"])).toBe("FINANCING");
  });

  it("defaults an unrecognised manual entry to operating", () => {
    expect(classifyCashFlow("manual", ["EXPENSE"])).toBe("OPERATING");
    expect(classifyCashFlow("manual")).toBe("OPERATING");
  });
});

describe("buildCashFlowStatement", () => {
  it("buckets movements and nets them to the cash change", () => {
    const statement = buildCashFlowStatement([
      { category: "OPERATING", cashDelta: 1180 }, // collections
      { category: "OPERATING", cashDelta: -400 }, // supplier payment
      { category: "FINANCING", cashDelta: 5000 }, // owner injection
    ]);

    expect(statement).toEqual({
      operating: 780,
      investing: 0,
      financing: 5000,
      netChange: 5780,
    });
  });

  it("is all-zero with no cash activity", () => {
    expect(buildCashFlowStatement([])).toEqual({
      operating: 0,
      investing: 0,
      financing: 0,
      netChange: 0,
    });
  });
});
