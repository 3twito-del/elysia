import { describe, expect, it } from "vitest";

import { defectRate, evaluateInspection } from "./quality";

describe("defectRate", () => {
  it("computes the percentage of defects in the sample", () => {
    expect(defectRate(2, 50)).toBe(4);
    expect(defectRate(0, 20)).toBe(0);
  });

  it("is zero for a non-positive sample", () => {
    expect(defectRate(3, 0)).toBe(0);
  });
});

describe("evaluateInspection", () => {
  it("passes at or below the AQL, fails above it", () => {
    expect(evaluateInspection(1, 100, 1)).toBe("PASS"); // 1% == AQL
    expect(evaluateInspection(2, 100, 1)).toBe("FAIL"); // 2% > AQL
    expect(evaluateInspection(0, 30, 1)).toBe("PASS");
  });
});
