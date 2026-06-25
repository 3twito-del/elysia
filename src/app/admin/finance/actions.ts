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
  createCustomerInvoice,
  issueCustomerInvoice,
  recordCustomerReceipt,
} from "~/server/services/accounts-receivable";
import {
  parseJournalLines,
  postManualJournalEntry,
} from "~/server/services/manual-journal";
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
