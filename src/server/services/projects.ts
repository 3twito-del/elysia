import type { Prisma } from "@prisma/client";

import { db } from "~/server/db";

/**
 * Projects (PRJ, §4.J): delivery / professional-services projects with a budget,
 * billable milestones and logged time. The roll-ups (budget usage, milestone
 * totals, billable amount, health) are pure and exported for testing.
 */

export const PROJECT_STATUSES = [
  "PLANNING",
  "ACTIVE",
  "ON_HOLD",
  "COMPLETED",
  "CANCELLED",
] as const;

export const BILLING_TYPES = [
  "FIXED",
  "TIME_AND_MATERIALS",
  "MILESTONE",
] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];
export type BillingType = (typeof BILLING_TYPES)[number];
export type ProjectHealth = "ON_TRACK" | "AT_RISK" | "OVER_BUDGET" | "CLOSED";

function round2(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Budget consumption snapshot. Pure. */
export function computeBudgetUsage(input: { budget: number; spent: number }) {
  const budget = round2(Math.max(0, input.budget));
  const spent = round2(Math.max(0, input.spent));
  const remaining = round2(budget - spent);
  const utilization = budget > 0 ? round2((spent / budget) * 100) : 0;
  return { budget, spent, remaining, utilization };
}

/** Total cost of logged time (hours × rate). Pure. */
export function timeEntriesCost(
  entries: Array<{ hours: number; ratePerHour: number }>,
) {
  return round2(
    entries.reduce((sum, entry) => sum + entry.hours * entry.ratePerHour, 0),
  );
}

/** Value of billable, not-yet-invoiced time. Pure. */
export function unbilledBillableAmount(
  entries: Array<{
    hours: number;
    ratePerHour: number;
    billable: boolean;
    status: string;
  }>,
) {
  return round2(
    entries
      .filter((entry) => entry.billable && entry.status === "UNBILLED")
      .reduce((sum, entry) => sum + entry.hours * entry.ratePerHour, 0),
  );
}

/** Counts and amounts of milestones by status. Pure. */
export function summarizeMilestones(
  milestones: Array<{ amount: number; status: string }>,
) {
  let invoiced = 0;
  let remaining = 0;
  const counts: Record<string, number> = {};
  for (const milestone of milestones) {
    counts[milestone.status] = (counts[milestone.status] ?? 0) + 1;
    if (milestone.status === "INVOICED") invoiced += milestone.amount;
    else remaining += milestone.amount;
  }
  return {
    counts,
    total: round2(invoiced + remaining),
    invoiced: round2(invoiced),
    remaining: round2(remaining),
  };
}

/** Project health from status and budget utilization. Pure. */
export function projectHealth(input: {
  status: string;
  utilization: number;
}): ProjectHealth {
  if (input.status === "COMPLETED" || input.status === "CANCELLED") {
    return "CLOSED";
  }
  if (input.utilization > 100) return "OVER_BUDGET";
  if (input.utilization >= 85) return "AT_RISK";
  return "ON_TRACK";
}

async function nextProjectCode(client: Prisma.TransactionClient) {
  const count = await client.project.count();
  return `PRJ-${String(count + 1).padStart(5, "0")}`;
}

function normalizeStatus(value: string): ProjectStatus {
  return (PROJECT_STATUSES as readonly string[]).includes(value)
    ? (value as ProjectStatus)
    : "PLANNING";
}

function normalizeBillingType(value: string | undefined): BillingType {
  return value && (BILLING_TYPES as readonly string[]).includes(value)
    ? (value as BillingType)
    : "MILESTONE";
}

/** Opens a new project with an auto-assigned code. */
export async function createProject(input: {
  name: string;
  customerId?: string;
  billingType?: string;
  budgetAmount?: number;
  startDate?: Date;
  endDate?: Date;
  notes?: string;
}) {
  if (!input.name.trim()) throw new Error("שם הפרויקט הוא שדה חובה.");

  const budgetAmount = round2(Math.max(0, input.budgetAmount ?? 0));

  return db.$transaction(async (tx) =>
    tx.project.create({
      data: {
        code: await nextProjectCode(tx),
        name: input.name.trim(),
        customerId: input.customerId,
        billingType: normalizeBillingType(input.billingType),
        budgetAmount,
        startDate: input.startDate,
        endDate: input.endDate,
        notes: input.notes,
      },
    }),
  );
}

/** Sets a project's lifecycle status. */
export async function setProjectStatus(input: {
  projectId: string;
  status: string;
}) {
  return db.project.update({
    where: { id: input.projectId },
    data: { status: normalizeStatus(input.status) },
  });
}

/** Adds a billable milestone to a project. */
export async function addMilestone(input: {
  projectId: string;
  name: string;
  amount?: number;
  dueDate?: Date;
}) {
  if (!input.name.trim()) throw new Error("שם אבן הדרך הוא שדה חובה.");

  return db.projectMilestone.create({
    data: {
      projectId: input.projectId,
      name: input.name.trim(),
      amount: round2(Math.max(0, input.amount ?? 0)),
      dueDate: input.dueDate,
    },
  });
}

/** Marks a milestone complete (ready to bill). */
export async function completeMilestone(input: { milestoneId: string }) {
  return db.projectMilestone.update({
    where: { id: input.milestoneId },
    data: { status: "COMPLETED" },
  });
}

/** Marks a completed milestone as invoiced. */
export async function invoiceMilestone(input: { milestoneId: string }) {
  const milestone = await db.projectMilestone.findUnique({
    where: { id: input.milestoneId },
    select: { status: true },
  });
  if (!milestone) throw new Error("אבן דרך לא נמצאה.");
  if (milestone.status === "PENDING") {
    throw new Error("יש לסמן את אבן הדרך כהושלמה לפני חיוב.");
  }

  return db.projectMilestone.update({
    where: { id: input.milestoneId },
    data: { status: "INVOICED" },
  });
}

/** Logs a time entry against a project. */
export async function logTime(input: {
  projectId: string;
  adminUserId?: string;
  workDate?: Date;
  hours: number;
  ratePerHour?: number;
  description?: string;
  billable?: boolean;
}) {
  const hours = round2(input.hours);
  if (!(hours > 0)) throw new Error("מספר השעות חייב להיות חיובי.");

  return db.projectTimeEntry.create({
    data: {
      projectId: input.projectId,
      adminUserId: input.adminUserId,
      workDate: input.workDate ?? new Date(),
      hours,
      ratePerHour: round2(Math.max(0, input.ratePerHour ?? 0)),
      description: input.description,
      billable: input.billable ?? true,
    },
  });
}

const billingTypeLabel: Record<BillingType, string> = {
  FIXED: "מחיר קבוע",
  TIME_AND_MATERIALS: "לפי זמן וחומרים",
  MILESTONE: "לפי אבני דרך",
};

/** Recent projects with rolled-up budget usage, milestone totals and health. */
export async function listProjects(limit = 20) {
  const projects = await db.project.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      code: true,
      name: true,
      status: true,
      billingType: true,
      budgetAmount: true,
      milestones: { select: { amount: true, status: true } },
      timeEntries: {
        select: {
          hours: true,
          ratePerHour: true,
          billable: true,
          status: true,
        },
      },
    },
  });

  return projects.map((project) => {
    const timeEntries = project.timeEntries.map((entry) => ({
      hours: Number(entry.hours),
      ratePerHour: Number(entry.ratePerHour),
      billable: entry.billable,
      status: entry.status,
    }));
    const spent = timeEntriesCost(timeEntries);
    const usage = computeBudgetUsage({
      budget: Number(project.budgetAmount),
      spent,
    });
    const milestones = summarizeMilestones(
      project.milestones.map((milestone) => ({
        amount: Number(milestone.amount),
        status: milestone.status,
      })),
    );

    return {
      id: project.id,
      code: project.code,
      name: project.name,
      status: project.status,
      billingType: project.billingType,
      billingTypeLabel:
        billingTypeLabel[project.billingType as BillingType] ??
        project.billingType,
      ...usage,
      unbilled: unbilledBillableAmount(timeEntries),
      milestoneTotal: milestones.total,
      milestoneInvoiced: milestones.invoiced,
      health: projectHealth({
        status: project.status,
        utilization: usage.utilization,
      }),
    };
  });
}

/** A single project with its milestones and recent time entries. */
export async function getProjectDetail(projectId: string) {
  const project = await db.project.findUnique({
    where: { id: projectId },
    include: {
      milestones: { orderBy: { createdAt: "asc" } },
      timeEntries: { orderBy: { workDate: "desc" }, take: 30 },
    },
  });
  if (!project) return null;

  const timeEntries = project.timeEntries.map((entry) => ({
    id: entry.id,
    workDate: entry.workDate,
    hours: Number(entry.hours),
    ratePerHour: Number(entry.ratePerHour),
    description: entry.description,
    billable: entry.billable,
    status: entry.status,
  }));
  const spent = timeEntriesCost(timeEntries);

  return {
    id: project.id,
    code: project.code,
    name: project.name,
    status: project.status,
    billingType: project.billingType,
    notes: project.notes,
    ...computeBudgetUsage({ budget: Number(project.budgetAmount), spent }),
    unbilled: unbilledBillableAmount(timeEntries),
    milestones: project.milestones.map((milestone) => ({
      id: milestone.id,
      name: milestone.name,
      amount: Number(milestone.amount),
      status: milestone.status,
      dueDate: milestone.dueDate,
    })),
    timeEntries,
  };
}

export async function getProjectsSummary() {
  const projects = await db.project.findMany({
    select: {
      status: true,
      budgetAmount: true,
      timeEntries: {
        select: {
          hours: true,
          ratePerHour: true,
          billable: true,
          status: true,
        },
      },
    },
  });

  let activeCount = 0;
  let totalBudget = 0;
  let totalSpent = 0;
  let totalUnbilled = 0;
  for (const project of projects) {
    if (project.status === "ACTIVE") activeCount += 1;
    totalBudget += Number(project.budgetAmount);
    const entries = project.timeEntries.map((entry) => ({
      hours: Number(entry.hours),
      ratePerHour: Number(entry.ratePerHour),
      billable: entry.billable,
      status: entry.status,
    }));
    totalSpent += timeEntriesCost(entries);
    totalUnbilled += unbilledBillableAmount(entries);
  }

  return {
    totalProjects: projects.length,
    activeCount,
    totalBudget: round2(totalBudget),
    totalSpent: round2(totalSpent),
    totalUnbilled: round2(totalUnbilled),
  };
}
