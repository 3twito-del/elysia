import { describe, expect, it } from "vitest";

import { computePayslip, summarizePayroll } from "./hr-payroll";

describe("computePayslip", () => {
  it("withholds income tax and social security from gross", () => {
    expect(computePayslip({ monthlyGross: 10000 })).toEqual({
      gross: 10000,
      incomeTax: 1000,
      socialSecurity: 700,
      net: 8300,
    });
  });

  it("honours custom rates", () => {
    const slip = computePayslip({
      monthlyGross: 10000,
      incomeTaxRate: 0.2,
      socialSecurityRate: 0.1,
    });
    expect(slip.net).toBe(7000);
  });
});

describe("summarizePayroll", () => {
  it("totals gross, net and withholdings across payslips", () => {
    const summary = summarizePayroll([
      { gross: 10000, incomeTax: 1000, socialSecurity: 700, net: 8300 },
      { gross: 6000, incomeTax: 600, socialSecurity: 420, net: 4980 },
    ]);

    expect(summary).toEqual({
      grossTotal: 16000,
      netTotal: 13280,
      withholdingTotal: 2720,
    });
  });
});
