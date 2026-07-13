import type { Prisma } from "@prisma/client";

import { db } from "~/server/db";
import { writeAdminAudit } from "~/server/services/admin-commerce-workflow";
import { ACCOUNT, postJournalEntry } from "~/server/services/ledger";

/**
 * HR master + simplified payroll (HR, Phase 5).
 *
 * Running payroll for a month creates a payslip per active employee and posts
 * one GL entry: Dr Salary Expense (gross) / Cr Cash (net) / Cr Payroll
 * Liabilities (withholdings). Idempotent per period. The withholding math is a
 * deliberate illustrative simplification (flat rates) — not statutory Israeli
 * payroll. The pure helpers are exported for testing.
 */

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

/** Default illustrative withholding rates (income tax + national insurance). */
const DEFAULT_INCOME_TAX_RATE = 0.1;
const DEFAULT_SOCIAL_SECURITY_RATE = 0.07;

/** Computes a single payslip from gross pay. Pure. */
export function computePayslip(input: {
  monthlyGross: number;
  incomeTaxRate?: number;
  socialSecurityRate?: number;
}) {
  const gross = round2(input.monthlyGross);
  const incomeTax = round2(gross * (input.incomeTaxRate ?? DEFAULT_INCOME_TAX_RATE));
  const socialSecurity = round2(
    gross * (input.socialSecurityRate ?? DEFAULT_SOCIAL_SECURITY_RATE),
  );
  const net = round2(gross - incomeTax - socialSecurity);

  return { gross, incomeTax, socialSecurity, net };
}

/** Aggregates payslip totals. Pure. */
export function summarizePayroll(
  payslips: Array<{ gross: number; incomeTax: number; socialSecurity: number; net: number }>,
) {
  const grossTotal = round2(payslips.reduce((sum, slip) => sum + slip.gross, 0));
  const netTotal = round2(payslips.reduce((sum, slip) => sum + slip.net, 0));
  const withholdingTotal = round2(
    payslips.reduce((sum, slip) => sum + slip.incomeTax + slip.socialSecurity, 0),
  );

  return { grossTotal, netTotal, withholdingTotal };
}

function currentPeriod(date: Date = new Date()): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function periodEndDate(period: string): Date {
  const [year, month] = period.split("-").map(Number);
  return new Date(Date.UTC(year ?? 2000, month ?? 1, 0));
}

async function ensurePayrollAccounts(client: Prisma.TransactionClient) {
  const accounts = [
    {
      code: ACCOUNT.SALARY_EXPENSE,
      name: "הוצאות שכר",
      type: "EXPENSE",
      normalSide: "DEBIT",
    },
    {
      code: ACCOUNT.PAYROLL_LIABILITIES,
      name: "התחייבויות שכר (ניכויים)",
      type: "LIABILITY",
      normalSide: "CREDIT",
    },
  ];
  for (const account of accounts) {
    await client.ledgerAccount.upsert({
      where: { code: account.code },
      create: account,
      update: {},
    });
  }
}

async function nextEmployeeNumber(client: Prisma.TransactionClient) {
  const count = await client.employee.count();
  return `EMP-${String(count + 1).padStart(4, "0")}`;
}

/** Creates an employee record. */
export async function createEmployee(input: {
  firstName: string;
  lastName: string;
  email?: string;
  role?: string;
  department?: string;
  monthlyGross: number;
  hiredAt?: Date;
  branchId?: string;
  adminUserId: string;
}) {
  const monthlyGross = round2(input.monthlyGross);
  if (monthlyGross <= 0) throw new Error("שכר חודשי חייב להיות חיובי.");

  return db.$transaction(async (tx) => {
    const employee = await tx.employee.create({
      data: {
        employeeNumber: await nextEmployeeNumber(tx),
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        role: input.role,
        department: input.department,
        monthlyGross,
        hiredAt: input.hiredAt ?? new Date(),
        branchId: input.branchId,
      },
    });

    await writeAdminAudit(tx, {
      adminUserId: input.adminUserId,
      action: "employee_created",
      entity: "Employee",
      entityId: employee.id,
      metadata: { employeeNumber: employee.employeeNumber },
    });

    return employee;
  });
}

/**
 * Runs payroll for a period: one payslip per active employee + a posted GL
 * entry. Idempotent (the period is unique). Returns the run summary.
 */
export async function runPayroll(
  input: { period?: string; postedById?: string } = {},
) {
  const period = input.period ?? currentPeriod();

  const existing = await db.payrollRun.findUnique({ where: { period } });
  if (existing) {
    throw new Error(`שכר לתקופה ${period} כבר הורץ.`);
  }

  const employees = await db.employee.findMany({ where: { status: "ACTIVE" } });
  if (employees.length === 0) {
    throw new Error("אין עובדים פעילים להרצת שכר.");
  }

  const slips = employees.map((employee) => ({
    employeeId: employee.id,
    ...computePayslip({ monthlyGross: Number(employee.monthlyGross) }),
  }));
  const totals = summarizePayroll(slips);

  return db.$transaction(async (tx) => {
    await ensurePayrollAccounts(tx);

    const run = await tx.payrollRun.create({
      data: {
        period,
        status: "POSTED",
        grossTotal: totals.grossTotal,
        netTotal: totals.netTotal,
        postedById: input.postedById,
        postedAt: new Date(),
        payslips: {
          create: slips.map((slip) => ({
            employeeId: slip.employeeId,
            gross: slip.gross,
            incomeTax: slip.incomeTax,
            socialSecurity: slip.socialSecurity,
            net: slip.net,
          })),
        },
      },
    });

    const cashReady = await tx.ledgerAccount.count({
      where: { code: ACCOUNT.CASH },
    });
    if (cashReady > 0 && totals.grossTotal > 0) {
      const entry = await postJournalEntry(
        {
          entryDate: periodEndDate(period),
          memo: `שכר ${period}`,
          source: "payroll",
          aggregateType: "PayrollRun",
          aggregateId: run.id,
          postedById: input.postedById,
          lines: [
            {
              accountCode: ACCOUNT.SALARY_EXPENSE,
              debit: totals.grossTotal,
              credit: 0,
              memo: "הוצאות שכר ברוטו",
            },
            {
              accountCode: ACCOUNT.CASH,
              debit: 0,
              credit: totals.netTotal,
              memo: "תשלום שכר נטו",
            },
            {
              accountCode: ACCOUNT.PAYROLL_LIABILITIES,
              debit: 0,
              credit: totals.withholdingTotal,
              memo: "ניכויי שכר לתשלום",
            },
          ],
        },
        tx,
      );

      await tx.payrollRun.update({
        where: { id: run.id },
        data: { journalEntryId: entry.id },
      });
    }

    return { period, employees: slips.length, ...totals };
  });
}

/** Active/terminated employees for the HR register. */
export async function listEmployees(limit = 50) {
  const employees = await db.employee.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      employeeNumber: true,
      firstName: true,
      lastName: true,
      role: true,
      department: true,
      monthlyGross: true,
      status: true,
    },
  });

  return employees.map((employee) => ({
    id: employee.id,
    employeeNumber: employee.employeeNumber,
    name: `${employee.firstName} ${employee.lastName}`.trim(),
    role: employee.role,
    department: employee.department,
    monthlyGross: Number(employee.monthlyGross),
    status: employee.status,
  }));
}

/** HR summary: headcount and monthly payroll cost; latest run. */
export async function getPayrollSummary() {
  const [headcount, grossAgg, lastRun] = await Promise.all([
    db.employee.count({ where: { status: "ACTIVE" } }),
    db.employee.aggregate({
      where: { status: "ACTIVE" },
      _sum: { monthlyGross: true },
    }),
    db.payrollRun.findFirst({
      orderBy: { period: "desc" },
      select: { period: true, grossTotal: true, netTotal: true },
    }),
  ]);

  return {
    headcount,
    monthlyGross: Number(grossAgg._sum.monthlyGross ?? 0),
    lastRun: lastRun
      ? {
          period: lastRun.period,
          grossTotal: Number(lastRun.grossTotal),
          netTotal: Number(lastRun.netTotal),
        }
      : null,
  };
}
