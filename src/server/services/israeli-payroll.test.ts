import { describe, expect, it } from "vitest";

import {
  computeGrossIncomeTax,
  computeIncomeTax,
  computeIsraeliPayslip,
  computeTieredContribution,
  DEFAULT_PAYROLL_CONFIG as CFG,
} from "./israeli-payroll";

describe("computeGrossIncomeTax", () => {
  it("applies progressive brackets", () => {
    // first bracket only: 6790 * 10%
    expect(computeGrossIncomeTax(6790, CFG.incomeTaxBrackets)).toBe(679);
    // 20000: 679 + 2940*14% + 5890*20% + 4380*31%
    expect(computeGrossIncomeTax(20000, CFG.incomeTaxBrackets)).toBe(3626.4);
    expect(computeGrossIncomeTax(0, CFG.incomeTaxBrackets)).toBe(0);
  });
});

describe("computeIncomeTax", () => {
  it("subtracts credit points, never below zero", () => {
    // 3626.4 - 2.25*242 = 3081.9
    expect(computeIncomeTax(20000, 2.25)).toBe(3081.9);
    // low income fully offset by credit points
    expect(computeIncomeTax(2000, 2.25)).toBe(0);
  });
});

describe("computeTieredContribution", () => {
  it("charges reduced rate below the tier ceiling, full above", () => {
    // 5000 all in reduced tier at NI reduced 0.4%
    expect(
      computeTieredContribution(5000, CFG.nationalInsurance.reduced, CFG.nationalInsurance.full),
    ).toBe(20);
    // 20000 NI: 7122*0.4% + 12878*7%
    expect(
      computeTieredContribution(20000, CFG.nationalInsurance.reduced, CFG.nationalInsurance.full),
    ).toBe(929.95);
  });
});

describe("computeIsraeliPayslip", () => {
  it("produces a full net-pay breakdown", () => {
    const slip = computeIsraeliPayslip({ monthlyGross: 20000, creditPoints: 2.25 });
    expect(slip.incomeTax).toBe(3081.9);
    expect(slip.nationalInsurance).toBe(929.95);
    expect(slip.healthTax).toBe(864.68);
    expect(slip.pension).toBe(1200);
    expect(slip.totalDeductions).toBe(6076.53);
    expect(slip.net).toBe(13923.47);
  });
});
