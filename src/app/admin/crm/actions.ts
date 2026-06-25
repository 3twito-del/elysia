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
