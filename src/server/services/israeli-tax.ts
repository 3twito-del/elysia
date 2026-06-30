import { db } from "~/server/db";

/**
 * Israeli statutory tax helpers (FIN-TAX / IL): withholding tax (ניכוי מס במקור)
 * and the "חשבונית ישראל" invoice allocation number (מספר הקצאה) from SHAAM.
 *
 * REGULATORY CAVEAT: every rate and threshold here is an EXAMPLE and must be
 * verified with an accountant / the Tax Authority before real use. The pure
 * computations are unit-tested; the statutory values are not authoritative.
 */

/** Example default threshold (₪) above which an allocation number is required. */
export const ALLOCATION_NUMBER_THRESHOLD = 20000;

function round2(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Splits an amount into withheld tax and net payable. Pure. */
export function computeWithholding(input: {
  amount: number;
  ratePercent: number;
}) {
  const amount = Math.max(0, input.amount);
  const rate = Math.max(0, Math.min(100, input.ratePercent));
  const withheld = round2((amount * rate) / 100);
  return { gross: round2(amount), withheld, net: round2(amount - withheld) };
}

/** Whether an invoice total requires an allocation number. Pure. */
export function requiresAllocationNumber(
  amount: number,
  threshold = ALLOCATION_NUMBER_THRESHOLD,
): boolean {
  return amount >= threshold;
}

/** Validates a SHAAM allocation number (example: 9 digits). Pure. */
export function validateAllocationNumber(value: string): boolean {
  return /^\d{9}$/.test(value.trim());
}

/** The withholding rate in effect for a category at a date. Pure. */
export function effectiveWithholdingRate(
  rules: Array<{ category: string; ratePercent: number; effectiveFrom: Date; isActive: boolean }>,
  category: string,
  asOf: Date = new Date(),
): number | null {
  const candidate = rules
    .filter(
      (rule) =>
        rule.isActive &&
        rule.category === category &&
        rule.effectiveFrom.getTime() <= asOf.getTime(),
    )
    .sort((a, b) => b.effectiveFrom.getTime() - a.effectiveFrom.getTime())[0];
  return candidate ? candidate.ratePercent : null;
}

// ---- withholding-rule persistence ----

export async function createWithholdingRule(input: {
  category: string;
  ratePercent: number;
  effectiveFrom?: Date;
  notes?: string;
}) {
  if (!input.category.trim()) throw new Error("קטגוריה היא שדה חובה.");
  const rate = input.ratePercent;
  if (!(rate >= 0 && rate <= 100)) throw new Error("שיעור חייב להיות בין 0 ל-100.");

  return db.withholdingTaxRule.create({
    data: {
      category: input.category.trim(),
      ratePercent: round2(rate),
      effectiveFrom: input.effectiveFrom ?? new Date(),
      notes: input.notes,
    },
  });
}

export async function setWithholdingRuleActive(input: {
  ruleId: string;
  isActive: boolean;
}) {
  return db.withholdingTaxRule.update({
    where: { id: input.ruleId },
    data: { isActive: input.isActive },
  });
}

export async function listWithholdingRules() {
  const rules = await db.withholdingTaxRule.findMany({
    orderBy: [{ category: "asc" }, { effectiveFrom: "desc" }],
    select: {
      id: true,
      category: true,
      ratePercent: true,
      effectiveFrom: true,
      isActive: true,
    },
  });
  return rules.map((rule) => ({
    id: rule.id,
    category: rule.category,
    ratePercent: Number(rule.ratePercent),
    effectiveFrom: rule.effectiveFrom,
    isActive: rule.isActive,
  }));
}

/** Resolves the active withholding rate for a category at a date (from the DB). */
export async function getWithholdingRate(category: string, asOf: Date = new Date()) {
  const rules = await db.withholdingTaxRule.findMany({
    where: { category, isActive: true },
    select: { category: true, ratePercent: true, effectiveFrom: true, isActive: true },
  });
  return effectiveWithholdingRate(
    rules.map((rule) => ({
      category: rule.category,
      ratePercent: Number(rule.ratePercent),
      effectiveFrom: rule.effectiveFrom,
      isActive: rule.isActive,
    })),
    category,
    asOf,
  );
}

// ---- allocation numbers (חשבונית ישראל) ----

/** Assigns a validated allocation number to an invoice. */
export async function assignInvoiceAllocationNumber(input: {
  invoiceId: string;
  allocationNumber: string;
}) {
  if (!validateAllocationNumber(input.allocationNumber)) {
    throw new Error("מספר הקצאה חייב להיות בן 9 ספרות.");
  }
  return db.customerInvoice.update({
    where: { id: input.invoiceId },
    data: {
      allocationNumber: input.allocationNumber.trim(),
      allocationStatus: "ASSIGNED",
    },
  });
}

/** Flags issued invoices over the threshold that still lack an allocation number. */
export async function flagInvoicesNeedingAllocation(
  threshold = ALLOCATION_NUMBER_THRESHOLD,
) {
  const result = await db.customerInvoice.updateMany({
    where: {
      status: { in: ["ISSUED", "PARTIALLY_PAID", "PAID"] },
      allocationNumber: null,
      total: { gte: threshold },
      allocationStatus: "NOT_REQUIRED",
    },
    data: { allocationStatus: "REQUIRED" },
  });
  return { flagged: result.count };
}

export async function listInvoicesNeedingAllocation(limit = 20) {
  const invoices = await db.customerInvoice.findMany({
    where: {
      allocationNumber: null,
      status: { in: ["ISSUED", "PARTIALLY_PAID", "PAID"] },
      total: { gte: ALLOCATION_NUMBER_THRESHOLD },
    },
    orderBy: { invoiceDate: "desc" },
    take: limit,
    select: { id: true, invoiceNumber: true, total: true, allocationStatus: true },
  });
  return invoices.map((invoice) => ({
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    total: Number(invoice.total),
    allocationStatus: invoice.allocationStatus,
  }));
}

export async function getStatutorySummary() {
  const [withholdingRules, needingAllocation, assigned] = await Promise.all([
    db.withholdingTaxRule.count({ where: { isActive: true } }),
    db.customerInvoice.count({
      where: {
        allocationNumber: null,
        status: { in: ["ISSUED", "PARTIALLY_PAID", "PAID"] },
        total: { gte: ALLOCATION_NUMBER_THRESHOLD },
      },
    }),
    db.customerInvoice.count({ where: { allocationStatus: "ASSIGNED" } }),
  ]);
  return { withholdingRules, needingAllocation, assigned };
}
