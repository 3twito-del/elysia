"use server";

import type { AdminPermission } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "~/server/auth";
import {
  getAdminFromSession,
  hasAdminPermission,
} from "~/server/auth/admin-access";
import { parseInvoiceLines } from "~/server/services/accounts-payable";
import {
  autoMatchBankStatement,
  ignoreBankStatementLine,
  importBankStatementLines,
  parseBankStatementCsv,
} from "~/server/services/bank-reconciliation";
import {
  createCustomerInvoice,
  issueCustomerInvoice,
  recordCustomerReceipt,
} from "~/server/services/accounts-receivable";
import {
  parseJournalLines,
  postManualJournalEntry,
} from "~/server/services/manual-journal";
import { setBudget } from "~/server/services/budgeting";
import {
  createCostCenter,
  recordCostEntry,
  setCostCenterActive,
} from "~/server/services/cost-accounting";
import {
  createMaintenanceSchedule,
  recordMaintenance,
  setMaintenanceScheduleStatus,
} from "~/server/services/asset-maintenance";
import {
  recordDunningContact,
  sendDunningReminder,
} from "~/server/services/dunning";
import { setExchangeRate } from "~/server/services/currency-fx";
import { createLedgerAccount } from "~/server/services/chart-of-accounts";
import { seedChartOfAccounts } from "~/server/services/ledger";
import {
  cancelSubscription,
  createPlan,
  runSubscriptionBilling,
  subscribeCustomer,
} from "~/server/services/subscriptions";
import {
  approveExpenseClaim,
  createExpenseClaim,
  rejectExpenseClaim,
} from "~/server/services/expense-management";
import {
  createFixedAsset,
  disposeFixedAsset,
  runDepreciation,
} from "~/server/services/fixed-assets";
import { createEmployee, runPayroll } from "~/server/services/hr-payroll";
import { closePeriod } from "~/server/services/period-close";

export async function createCustomerInvoiceAction(formData: FormData) {
  await requireAdmin("ERP_WRITE");

  const lines = parseInvoiceLines(stringValue(formData.get("lines"))).map(
    (line) => ({
      description: line.description,
      quantity: line.quantity,
      unitPrice: line.unitCost,
    }),
  );
  if (lines.length === 0) {
    throw new Error("יש להזין לפחות שורה אחת (תיאור | כמות | מחיר).");
  }

  const dueDate = optionalString(formData.get("dueDate"));

  await createCustomerInvoice({
    customerId: optionalString(formData.get("customerId")),
    invoiceDate: new Date(),
    dueDate: dueDate ? new Date(dueDate) : undefined,
    lines,
  });

  revalidatePath("/admin/finance");
}

export async function issueCustomerInvoiceAction(formData: FormData) {
  const admin = await requireAdmin("ERP_WRITE");

  await issueCustomerInvoice({
    invoiceId: stringValue(formData.get("invoiceId")),
    postedById: admin.id,
  });

  revalidatePath("/admin/finance");
}

export async function recordCustomerReceiptAction(formData: FormData) {
  const admin = await requireAdmin("ERP_WRITE");

  const invoiceId = stringValue(formData.get("invoiceId"));
  const amount = Number(formData.get("amount") ?? 0) || 0;
  if (!invoiceId) throw new Error("חסרה חשבונית לתקבול.");
  if (amount <= 0) throw new Error("יש להזין סכום תקבול חיובי.");

  await recordCustomerReceipt({
    customerId: optionalString(formData.get("customerId")),
    amount,
    postedById: admin.id,
    allocations: [{ customerInvoiceId: invoiceId, amount }],
  });

  revalidatePath("/admin/finance");
}

export async function importBankStatementAction(formData: FormData) {
  await requireAdmin("ERP_WRITE");

  const lines = parseBankStatementCsv(stringValue(formData.get("csv")));
  if (lines.length === 0) {
    throw new Error("לא נמצאו שורות תקינות (פורמט: תאריך,תיאור,סכום,אסמכתא).");
  }

  await importBankStatementLines(lines);
  revalidatePath("/admin/finance");
}

export async function autoMatchBankStatementAction() {
  await requireAdmin("ERP_WRITE");

  await autoMatchBankStatement();
  revalidatePath("/admin/finance");
}

export async function ignoreBankStatementLineAction(formData: FormData) {
  await requireAdmin("ERP_WRITE");

  const id = stringValue(formData.get("lineId"));
  if (!id) throw new Error("חסר מזהה שורת בנק.");

  await ignoreBankStatementLine(id);
  revalidatePath("/admin/finance");
}

export async function postManualJournalEntryAction(formData: FormData) {
  const admin = await requireAdmin("ERP_WRITE");

  const lines = parseJournalLines(stringValue(formData.get("lines")));
  if (lines.length < 2) {
    throw new Error("יש להזין לפחות שתי שורות (קוד חשבון | חובה | זכות).");
  }

  const entryDate = optionalString(formData.get("entryDate"));

  await postManualJournalEntry({
    entryDate: entryDate ? new Date(entryDate) : undefined,
    memo: optionalString(formData.get("memo")),
    lines,
    postedById: admin.id,
    entityId: optionalString(formData.get("entityId")),
  });

  revalidatePath("/admin/finance");
}

export async function createFixedAssetAction(formData: FormData) {
  const admin = await requireAdmin("ERP_WRITE");

  const name = stringValue(formData.get("name")).trim();
  if (!name) throw new Error("שם הנכס הוא שדה חובה.");

  const acquisitionCost = Number(formData.get("acquisitionCost") ?? 0) || 0;
  const usefulLifeMonths = Number(formData.get("usefulLifeMonths") ?? 0) || 0;
  if (acquisitionCost <= 0) throw new Error("יש להזין עלות רכישה חיובית.");
  if (usefulLifeMonths <= 0) throw new Error("יש להזין אורך חיים בחודשים.");

  await createFixedAsset({
    name,
    category: optionalString(formData.get("category")),
    acquisitionCost,
    salvageValue: Number(formData.get("salvageValue") ?? 0) || 0,
    usefulLifeMonths,
    postedById: admin.id,
  });

  revalidatePath("/admin/finance");
}

export async function runDepreciationAction() {
  const admin = await requireAdmin("ERP_WRITE");

  await runDepreciation({ postedById: admin.id });

  revalidatePath("/admin/finance");
}

export async function disposeFixedAssetAction(formData: FormData) {
  const admin = await requireAdmin("ERP_WRITE");

  const fixedAssetId = stringValue(formData.get("fixedAssetId"));
  if (!fixedAssetId) throw new Error("חסר מזהה נכס.");

  await disposeFixedAsset({
    fixedAssetId,
    proceeds: Number(formData.get("proceeds") ?? 0) || 0,
    postedById: admin.id,
  });

  revalidatePath("/admin/finance");
}

export async function createEmployeeAction(formData: FormData) {
  await requireAdmin("ERP_WRITE");

  const firstName = stringValue(formData.get("firstName")).trim();
  const lastName = stringValue(formData.get("lastName")).trim();
  if (!firstName || !lastName) throw new Error("שם פרטי ושם משפחה הם חובה.");

  const monthlyGross = Number(formData.get("monthlyGross") ?? 0) || 0;
  if (monthlyGross <= 0) throw new Error("יש להזין שכר חודשי חיובי.");

  await createEmployee({
    firstName,
    lastName,
    email: optionalString(formData.get("email")),
    role: optionalString(formData.get("role")),
    department: optionalString(formData.get("department")),
    monthlyGross,
  });

  revalidatePath("/admin/finance");
}

export async function runPayrollAction() {
  const admin = await requireAdmin("ERP_WRITE");

  await runPayroll({ postedById: admin.id });

  revalidatePath("/admin/finance");
}

export async function createExpenseClaimAction(formData: FormData) {
  await requireAdmin("ERP_WRITE");

  const description = stringValue(formData.get("description")).trim();
  if (!description) throw new Error("תיאור ההוצאה הוא שדה חובה.");

  const amount = Number(formData.get("amount") ?? 0) || 0;
  if (amount <= 0) throw new Error("יש להזין סכום הוצאה חיובי.");

  await createExpenseClaim({
    employeeId: optionalString(formData.get("employeeId")),
    description,
    category: optionalString(formData.get("category")),
    amount,
  });

  revalidatePath("/admin/finance");
}

export async function approveExpenseClaimAction(formData: FormData) {
  const admin = await requireAdmin("ERP_WRITE");

  const claimId = stringValue(formData.get("claimId"));
  if (!claimId) throw new Error("חסר מזהה בקשה.");

  await approveExpenseClaim({ claimId, postedById: admin.id });

  revalidatePath("/admin/finance");
}

export async function rejectExpenseClaimAction(formData: FormData) {
  await requireAdmin("ERP_WRITE");

  const claimId = stringValue(formData.get("claimId"));
  if (!claimId) throw new Error("חסר מזהה בקשה.");

  await rejectExpenseClaim({ claimId });

  revalidatePath("/admin/finance");
}

export async function seedChartAction() {
  const admin = await requireAdmin("ERP_WRITE");

  await seedChartOfAccounts({ adminUserId: admin.id });

  revalidatePath("/admin/finance");
}

export async function createLedgerAccountAction(formData: FormData) {
  const admin = await requireAdmin("ERP_WRITE");

  const code = stringValue(formData.get("code")).trim();
  const name = stringValue(formData.get("name")).trim();
  const type = stringValue(formData.get("type"));
  if (!code || !name) throw new Error("קוד ושם הם שדות חובה.");

  await createLedgerAccount({ code, name, type, adminUserId: admin.id });

  revalidatePath("/admin/finance");
}

export async function createSubscriptionPlanAction(formData: FormData) {
  const admin = await requireAdmin("ERP_WRITE");

  const key = stringValue(formData.get("key")).trim();
  const name = stringValue(formData.get("name")).trim();
  const amount = Number(formData.get("amount") ?? 0) || 0;
  if (!key || !name) throw new Error("מפתח ושם התוכנית הם שדות חובה.");
  if (amount <= 0) throw new Error("יש להזין סכום מנוי חיובי.");

  await createPlan({
    key,
    name,
    amount,
    interval:
      stringValue(formData.get("interval")) === "YEARLY" ? "YEARLY" : "MONTHLY",
    adminUserId: admin.id,
  });

  revalidatePath("/admin/finance");
}

export async function subscribeAction(formData: FormData) {
  const admin = await requireAdmin("ERP_WRITE");

  const planId = stringValue(formData.get("planId"));
  if (!planId) throw new Error("יש לבחור תוכנית מנוי.");

  await subscribeCustomer({
    planId,
    customerId: optionalString(formData.get("customerId")),
    adminUserId: admin.id,
  });

  revalidatePath("/admin/finance");
}

export async function runSubscriptionBillingAction() {
  const admin = await requireAdmin("ERP_WRITE");

  await runSubscriptionBilling({ adminUserId: admin.id });

  revalidatePath("/admin/finance");
}

export async function cancelSubscriptionAction(formData: FormData) {
  const admin = await requireAdmin("ERP_WRITE");

  const subscriptionId = stringValue(formData.get("subscriptionId"));
  if (!subscriptionId) throw new Error("חסר מזהה מנוי.");

  await cancelSubscription({ subscriptionId, adminUserId: admin.id });

  revalidatePath("/admin/finance");
}

export async function setBudgetAction(formData: FormData) {
  const admin = await requireAdmin("ERP_WRITE");

  const period = stringValue(formData.get("period")).trim();
  const accountCode = stringValue(formData.get("accountCode")).trim();
  if (!period || !accountCode) throw new Error("יש לבחור תקופה וחשבון.");

  const amount = Number(formData.get("amount") ?? 0) || 0;

  await setBudget({ period, accountCode, amount, adminUserId: admin.id });

  revalidatePath("/admin/finance");
}

export async function closePeriodAction(formData: FormData) {
  const admin = await requireAdmin("ERP_WRITE");

  const year = Number(formData.get("year") ?? 0) || 0;
  const month = Number(formData.get("month") ?? 0) || 0;
  if (year <= 0 || month < 1 || month > 12) {
    throw new Error("יש לבחור שנה וחודש תקינים לסגירה.");
  }

  await closePeriod({
    year,
    month,
    postedById: admin.id,
    notes: optionalString(formData.get("notes")),
  });

  revalidatePath("/admin/finance");
}

export async function createCostCenterAction(formData: FormData) {
  const admin = await requireAdmin("ERP_WRITE");

  await createCostCenter({
    code: stringValue(formData.get("code")),
    name: stringValue(formData.get("name")),
    kind: stringValue(formData.get("kind")),
    monthlyBudget: Number(stringValue(formData.get("monthlyBudget"))) || 0,
    adminUserId: admin.id,
  });

  revalidatePath("/admin/finance");
}

export async function toggleCostCenterAction(formData: FormData) {
  const admin = await requireAdmin("ERP_WRITE");

  const costCenterId = stringValue(formData.get("costCenterId"));
  if (!costCenterId) throw new Error("חסר מזהה מרכז.");

  await setCostCenterActive({
    costCenterId,
    isActive: formData.get("isActive") === "1",
    adminUserId: admin.id,
  });

  revalidatePath("/admin/finance");
}

export async function setExchangeRateAction(formData: FormData) {
  const admin = await requireAdmin("ERP_WRITE");

  const effectiveRaw = stringValue(formData.get("effectiveDate"));
  await setExchangeRate({
    currency: stringValue(formData.get("currency")),
    rateToBase: Number(stringValue(formData.get("rateToBase"))) || 0,
    effectiveDate: effectiveRaw ? new Date(effectiveRaw) : new Date(),
    adminUserId: admin.id,
  });

  revalidatePath("/admin/finance");
}

export async function sendDunningReminderAction(formData: FormData) {
  await requireAdmin("ERP_WRITE");

  const customerInvoiceId = stringValue(formData.get("customerInvoiceId"));
  if (!customerInvoiceId) throw new Error("חסר מזהה חשבונית.");

  await sendDunningReminder({ customerInvoiceId });

  revalidatePath("/admin/finance");
}

export async function recordDunningContactAction(formData: FormData) {
  await requireAdmin("ERP_WRITE");

  const customerInvoiceId = stringValue(formData.get("customerInvoiceId"));
  if (!customerInvoiceId) throw new Error("חסר מזהה חשבונית.");

  await recordDunningContact({
    customerInvoiceId,
    level: Number(stringValue(formData.get("level"))) || 1,
    note: optionalString(formData.get("note")),
  });

  revalidatePath("/admin/finance");
}

export async function createMaintenanceScheduleAction(formData: FormData) {
  await requireAdmin("ERP_WRITE");

  const fixedAssetId = stringValue(formData.get("fixedAssetId"));
  if (!fixedAssetId) throw new Error("יש לבחור נכס.");

  await createMaintenanceSchedule({
    fixedAssetId,
    title: stringValue(formData.get("title")),
    intervalDays: Number(stringValue(formData.get("intervalDays"))) || 0,
  });

  revalidatePath("/admin/finance");
}

export async function recordMaintenanceAction(formData: FormData) {
  await requireAdmin("ERP_WRITE");

  const scheduleId = stringValue(formData.get("scheduleId"));
  if (!scheduleId) throw new Error("חסר מזהה תזמון.");

  await recordMaintenance({ scheduleId });

  revalidatePath("/admin/finance");
}

export async function toggleMaintenanceScheduleAction(formData: FormData) {
  await requireAdmin("ERP_WRITE");

  const scheduleId = stringValue(formData.get("scheduleId"));
  if (!scheduleId) throw new Error("חסר מזהה תזמון.");

  await setMaintenanceScheduleStatus({
    scheduleId,
    status: formData.get("status") === "ACTIVE" ? "ACTIVE" : "PAUSED",
  });

  revalidatePath("/admin/finance");
}

export async function recordCostEntryAction(formData: FormData) {
  const admin = await requireAdmin("ERP_WRITE");

  const costCenterId = stringValue(formData.get("costCenterId"));
  if (!costCenterId) throw new Error("יש לבחור מרכז עלות.");

  await recordCostEntry({
    costCenterId,
    period: stringValue(formData.get("period")),
    kind: stringValue(formData.get("kind")),
    amount: Number(stringValue(formData.get("amount"))) || 0,
    description: optionalString(formData.get("description")),
    adminUserId: admin.id,
  });

  revalidatePath("/admin/finance");
}

async function requireAdmin(permission: AdminPermission) {
  const session = await auth();

  if (!session?.user) {
    redirect("/admin/login?next=/admin/finance");
  }

  const admin = await getAdminFromSession(session);

  if (!admin || !hasAdminPermission(admin, permission)) {
    throw new Error("אין הרשאה לבצע את הפעולה המבוקשת.");
  }

  return admin;
}

function optionalString(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return undefined;

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : undefined;
}

function stringValue(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value : "";
}
