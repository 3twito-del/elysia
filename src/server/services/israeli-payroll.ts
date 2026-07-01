/**
 * Israeli statutory payroll engine (HR-003): progressive income tax with credit
 * points, National Insurance (ביטוח לאומי) and health tax (מס בריאות) tiers, and
 * an employee pension contribution — producing a full net-pay breakdown.
 *
 * CAVEAT: the brackets, tier thresholds, credit-point value and rates below are
 * ILLUSTRATIVE DEFAULTS (approximate 2024 monthly figures). They MUST be
 * verified with an accountant / against רשות המסים + ביטוח לאומי before any live
 * use. All figures are overridable via the `config` argument.
 */

function round2(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export type TaxBracket = { upTo: number; rate: number };

export type PayrollConfig = {
  /** Progressive monthly income-tax brackets (upTo in ₪, ascending; last = Infinity). */
  incomeTaxBrackets: TaxBracket[];
  /** Monthly value of one credit point (נקודת זיכוי) in ₪. */
  creditPointValue: number;
  /** Monthly income threshold splitting reduced/full NI + health tiers (~60% avg wage). */
  reducedTierCeiling: number;
  /** Monthly income ceiling above which NI + health are not charged. */
  contributionCeiling: number;
  /** Employee National Insurance rates: reduced tier / full tier. */
  nationalInsurance: { reduced: number; full: number };
  /** Employee health-tax rates: reduced tier / full tier. */
  healthTax: { reduced: number; full: number };
  /** Employee pension contribution rate on gross. */
  pensionEmployeeRate: number;
};

/** Illustrative 2024 monthly defaults — verify with an accountant. */
export const DEFAULT_PAYROLL_CONFIG: PayrollConfig = {
  incomeTaxBrackets: [
    { upTo: 6790, rate: 0.1 },
    { upTo: 9730, rate: 0.14 },
    { upTo: 15620, rate: 0.2 },
    { upTo: 21710, rate: 0.31 },
    { upTo: 45180, rate: 0.35 },
    { upTo: 58190, rate: 0.47 },
    { upTo: Infinity, rate: 0.5 },
  ],
  creditPointValue: 242,
  reducedTierCeiling: 7122,
  contributionCeiling: 49030,
  nationalInsurance: { reduced: 0.004, full: 0.07 },
  healthTax: { reduced: 0.031, full: 0.05 },
  pensionEmployeeRate: 0.06,
};

/** Progressive income tax on monthly taxable pay, before credit points. Pure. */
export function computeGrossIncomeTax(
  monthlyTaxable: number,
  brackets: TaxBracket[],
): number {
  let remaining = Math.max(0, monthlyTaxable);
  let previous = 0;
  let tax = 0;
  for (const bracket of brackets) {
    if (remaining <= 0) break;
    const span = bracket.upTo - previous;
    const taxed = Math.min(remaining, span);
    tax += taxed * bracket.rate;
    remaining -= taxed;
    previous = bracket.upTo;
  }
  return round2(tax);
}

/** Income tax after subtracting credit points (never below 0). Pure. */
export function computeIncomeTax(
  monthlyTaxable: number,
  creditPoints: number,
  config: PayrollConfig = DEFAULT_PAYROLL_CONFIG,
): number {
  const gross = computeGrossIncomeTax(monthlyTaxable, config.incomeTaxBrackets);
  const credit = Math.max(0, creditPoints) * config.creditPointValue;
  return round2(Math.max(0, gross - credit));
}

/**
 * A two-tier employee contribution (National Insurance or health tax): the
 * reduced rate up to `reducedTierCeiling`, the full rate up to
 * `contributionCeiling`, nothing above. Pure.
 */
export function computeTieredContribution(
  monthlyGross: number,
  reducedRate: number,
  fullRate: number,
  config: PayrollConfig = DEFAULT_PAYROLL_CONFIG,
): number {
  const gross = Math.max(0, monthlyGross);
  const reducedBase = Math.min(gross, config.reducedTierCeiling);
  const fullBase = Math.max(
    0,
    Math.min(gross, config.contributionCeiling) - config.reducedTierCeiling,
  );
  return round2(reducedBase * reducedRate + fullBase * fullRate);
}

export type IsraeliPayslip = {
  gross: number;
  incomeTax: number;
  nationalInsurance: number;
  healthTax: number;
  pension: number;
  totalDeductions: number;
  net: number;
};

/** Full statutory payslip breakdown from monthly gross + credit points. Pure. */
export function computeIsraeliPayslip(
  input: { monthlyGross: number; creditPoints?: number },
  config: PayrollConfig = DEFAULT_PAYROLL_CONFIG,
): IsraeliPayslip {
  const gross = round2(Math.max(0, input.monthlyGross));
  const creditPoints = input.creditPoints ?? 2.25;

  const incomeTax = computeIncomeTax(gross, creditPoints, config);
  const nationalInsurance = computeTieredContribution(
    gross,
    config.nationalInsurance.reduced,
    config.nationalInsurance.full,
    config,
  );
  const healthTax = computeTieredContribution(
    gross,
    config.healthTax.reduced,
    config.healthTax.full,
    config,
  );
  const pension = round2(gross * config.pensionEmployeeRate);

  const totalDeductions = round2(
    incomeTax + nationalInsurance + healthTax + pension,
  );
  return {
    gross,
    incomeTax,
    nationalInsurance,
    healthTax,
    pension,
    totalDeductions,
    net: round2(gross - totalDeductions),
  };
}
