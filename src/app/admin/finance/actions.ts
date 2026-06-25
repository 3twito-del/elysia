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
