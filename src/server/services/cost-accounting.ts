import { db } from "~/server/db";
import { writeAdminAudit } from "~/server/services/admin-commerce-workflow";

/**
 * Cost accounting / controlling (FIN-CO-001): cost & profit centers with
 * revenue/expense entries for profitability and budget-variance reporting. A
 * managerial layer separate from the financial GL. The maths are pure + tested.
 */

export const CENTER_KINDS = ["COST", "PROFIT"] as const;
export type CenterKind = (typeof CENTER_KINDS)[number];

export const ENTRY_KINDS = ["REVENUE", "EXPENSE"] as const;
export type EntryKind = (typeof ENTRY_KINDS)[number];

function round2(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function normalizeCenterKind(value: string | undefined): CenterKind {
  return (value ?? "").toUpperCase() === "PROFIT" ? "PROFIT" : "COST";
}

export function normalizeEntryKind(value: string | undefined): EntryKind {
  return (value ?? "").toUpperCase() === "REVENUE" ? "REVENUE" : "EXPENSE";
}

/**
 * Revenue, expense, margin and margin% for a set of entries. Margin% is over
 * revenue (0 when there is no revenue). Pure.
 */
export function computeCenterProfitability(
  entries: Array<{ kind: string; amount: number }>,
): { revenue: number; expense: number; margin: number; marginPct: number } {
  let revenue = 0;
  let expense = 0;
  for (const entry of entries) {
    if (normalizeEntryKind(entry.kind) === "REVENUE") revenue += entry.amount;
    else expense += entry.amount;
  }
  const margin = revenue - expense;
  const marginPct = revenue > 0 ? round2((margin / revenue) * 100) : 0;
  return {
    revenue: round2(revenue),
    expense: round2(expense),
    margin: round2(margin),
    marginPct,
  };
}

/** Budget vs actual expense: variance (budget − actual) and over-budget flag. Pure. */
export function budgetVariance(
  budget: number,
  actualExpense: number,
): { variance: number; variancePct: number; over: boolean } {
  const variance = round2(budget - actualExpense);
  const variancePct = budget > 0 ? round2((variance / budget) * 100) : 0;
  return { variance, variancePct, over: actualExpense > budget };
}

export async function createCostCenter(input: {
  code: string;
  name: string;
  kind?: string;
  monthlyBudget?: number;
  adminUserId: string;
}) {
  const code = input.code.trim().toUpperCase();
  const name = input.name.trim();
  if (!code) throw new Error("יש להזין קוד מרכז.");
  if (!name) throw new Error("יש להזין שם מרכז.");

  const existing = await db.costCenter.findUnique({
    where: { code },
    select: { id: true },
  });
  if (existing) throw new Error("קוד מרכז כבר קיים.");

  return db.$transaction(async (tx) => {
    const center = await tx.costCenter.create({
      data: {
        code,
        name,
        kind: normalizeCenterKind(input.kind),
        monthlyBudget: round2(Math.max(0, input.monthlyBudget ?? 0)),
      },
    });

    await writeAdminAudit(tx, {
      adminUserId: input.adminUserId,
      action: "cost_center_created",
      entity: "CostCenter",
      entityId: center.id,
      metadata: { code: center.code, kind: center.kind },
    });

    return center;
  });
}

export async function setCostCenterActive(input: {
  costCenterId: string;
  isActive: boolean;
  adminUserId: string;
}) {
  return db.$transaction(async (tx) => {
    const center = await tx.costCenter.update({
      where: { id: input.costCenterId },
      data: { isActive: input.isActive },
    });

    await writeAdminAudit(tx, {
      adminUserId: input.adminUserId,
      action: "cost_center_status_updated",
      entity: "CostCenter",
      entityId: center.id,
      metadata: { isActive: center.isActive },
    });

    return center;
  });
}

export async function recordCostEntry(input: {
  costCenterId: string;
  period: string;
  kind: string;
  amount: number;
  description?: string;
  adminUserId: string;
}) {
  const period = input.period.trim();
  if (!/^\d{4}-\d{2}$/.test(period)) {
    throw new Error("תקופה חייבת להיות בפורמט YYYY-MM.");
  }
  if (!(input.amount > 0)) throw new Error("הסכום חייב להיות חיובי.");

  const center = await db.costCenter.findUnique({
    where: { id: input.costCenterId },
    select: { id: true },
  });
  if (!center) throw new Error("מרכז עלות לא נמצא.");

  return db.$transaction(async (tx) => {
    const entry = await tx.costEntry.create({
      data: {
        costCenterId: input.costCenterId,
        period,
        kind: normalizeEntryKind(input.kind),
        amount: round2(input.amount),
        description: input.description,
      },
    });

    await writeAdminAudit(tx, {
      adminUserId: input.adminUserId,
      action: "cost_entry_recorded",
      entity: "CostCenter",
      entityId: input.costCenterId,
      metadata: { entryId: entry.id, kind: entry.kind, amount: Number(entry.amount) },
    });

    return entry;
  });
}

/** Cost centers with aggregated profitability + budget variance. */
export async function listCostCenters(limit = 30) {
  const centers = await db.costCenter.findMany({
    orderBy: { code: "asc" },
    take: limit,
    select: {
      id: true,
      code: true,
      name: true,
      kind: true,
      monthlyBudget: true,
      isActive: true,
      entries: { select: { kind: true, amount: true } },
    },
  });

  return centers.map((center) => {
    const profitability = computeCenterProfitability(
      center.entries.map((entry) => ({
        kind: entry.kind,
        amount: Number(entry.amount),
      })),
    );
    return {
      id: center.id,
      code: center.code,
      name: center.name,
      kind: center.kind,
      isActive: center.isActive,
      monthlyBudget: Number(center.monthlyBudget),
      ...profitability,
      budget: budgetVariance(
        Number(center.monthlyBudget),
        profitability.expense,
      ),
    };
  });
}

export async function getCostAccountingSummary() {
  const centers = await db.costCenter.findMany({
    select: { entries: { select: { kind: true, amount: true } } },
  });
  let revenue = 0;
  let expense = 0;
  for (const center of centers) {
    for (const entry of center.entries) {
      if (normalizeEntryKind(entry.kind) === "REVENUE") {
        revenue += Number(entry.amount);
      } else {
        expense += Number(entry.amount);
      }
    }
  }
  return {
    centers: centers.length,
    revenue: round2(revenue),
    expense: round2(expense),
    margin: round2(revenue - expense),
  };
}
