"use server";

import type { AdminPermission } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "~/server/auth";
import {
  getAdminFromSession,
  hasAdminPermission,
} from "~/server/auth/admin-access";
import {
  convertQuoteToInvoice,
  createQuote,
  decideQuote,
  parseQuoteLines,
  sendQuote,
} from "~/server/services/crm-quotes";
import {
  convertLeadToOpportunity,
  createLead,
  setOpportunityStage,
} from "~/server/services/crm-sales";

export async function createLeadAction(formData: FormData) {
  await requireAdmin("CRM_WRITE");

  const name = stringValue(formData.get("name")).trim();
  if (!name) throw new Error("שם הליד הוא שדה חובה.");

  await createLead({
    name,
    email: optionalString(formData.get("email")),
    phone: optionalString(formData.get("phone")),
    source: optionalString(formData.get("source")),
    notes: optionalString(formData.get("notes")),
  });

  revalidatePath("/admin/crm");
}

export async function convertLeadAction(formData: FormData) {
  await requireAdmin("CRM_WRITE");

  const leadId = stringValue(formData.get("leadId"));
  if (!leadId) throw new Error("חסר ליד להמרה.");

  await convertLeadToOpportunity({
    leadId,
    title: optionalString(formData.get("title")) ?? "הזדמנות חדשה",
    amount: Number(formData.get("amount") ?? 0) || 0,
  });

  revalidatePath("/admin/crm");
}

export async function setOpportunityStageAction(formData: FormData) {
  await requireAdmin("CRM_WRITE");

  const opportunityId = stringValue(formData.get("opportunityId"));
  if (!opportunityId) throw new Error("חסרה הזדמנות לעדכון.");

  await setOpportunityStage({
    opportunityId,
    stage: stringValue(formData.get("stage")),
  });

  revalidatePath("/admin/crm");
}

export async function createQuoteAction(formData: FormData) {
  await requireAdmin("CRM_WRITE");

  const lines = parseQuoteLines(stringValue(formData.get("lines")));
  if (lines.length === 0) {
    throw new Error("יש להזין לפחות שורת הצעה אחת (תיאור | כמות | מחיר).");
  }

  const validUntil = optionalString(formData.get("validUntil"));

  await createQuote({
    customerId: optionalString(formData.get("customerId")),
    opportunityId: optionalString(formData.get("opportunityId")),
    validUntil: validUntil ? new Date(validUntil) : undefined,
    notes: optionalString(formData.get("notes")),
    lines,
  });

  revalidatePath("/admin/crm");
}

export async function sendQuoteAction(formData: FormData) {
  await requireAdmin("CRM_WRITE");

  await sendQuote(stringValue(formData.get("quoteId")));

  revalidatePath("/admin/crm");
}

export async function decideQuoteAction(formData: FormData) {
  await requireAdmin("CRM_WRITE");

  await decideQuote({
    quoteId: stringValue(formData.get("quoteId")),
    decision:
      stringValue(formData.get("decision")) === "ACCEPTED"
        ? "ACCEPTED"
        : "DECLINED",
  });

  revalidatePath("/admin/crm");
}

export async function convertQuoteToInvoiceAction(formData: FormData) {
  await requireAdmin("CRM_WRITE");

  await convertQuoteToInvoice({
    quoteId: stringValue(formData.get("quoteId")),
  });

  revalidatePath("/admin/crm");
}

async function requireAdmin(permission: AdminPermission) {
  const session = await auth();

  if (!session?.user) {
    redirect("/admin/login?next=/admin/crm");
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
