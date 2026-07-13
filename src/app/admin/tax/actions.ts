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
  assignInvoiceAllocationNumber,
  createWithholdingRule,
  flagInvoicesNeedingAllocation,
  setWithholdingRuleActive,
} from "~/server/services/israeli-tax";

export async function createWithholdingRuleAction(formData: FormData) {
  await requireAdmin("FINANCE_WRITE");

  const category = stringValue(formData.get("category")).trim();
  const rateRaw = stringValue(formData.get("ratePercent")).trim();
  if (!category || !rateRaw) throw new Error("קטגוריה ושיעור הם שדות חובה.");

  const effectiveFrom = optionalString(formData.get("effectiveFrom"));

  await createWithholdingRule({
    category,
    ratePercent: Number(rateRaw) || 0,
    effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : undefined,
    notes: optionalString(formData.get("notes")),
  });

  revalidatePath("/admin/tax");
}

export async function toggleWithholdingRuleAction(formData: FormData) {
  await requireAdmin("FINANCE_WRITE");

  const ruleId = stringValue(formData.get("ruleId"));
  if (!ruleId) throw new Error("חסר מזהה כלל.");

  await setWithholdingRuleActive({
    ruleId,
    isActive: formData.get("isActive") === "1",
  });

  revalidatePath("/admin/tax");
}

export async function assignAllocationNumberAction(formData: FormData) {
  await requireAdmin("FINANCE_WRITE");

  const invoiceId = stringValue(formData.get("invoiceId"));
  const allocationNumber = stringValue(formData.get("allocationNumber")).trim();
  if (!invoiceId || !allocationNumber) {
    throw new Error("חסר מזהה חשבונית או מספר הקצאה.");
  }

  await assignInvoiceAllocationNumber({ invoiceId, allocationNumber });

  revalidatePath("/admin/tax");
}

export async function flagAllocationAction() {
  await requireAdmin("FINANCE_WRITE");

  await flagInvoicesNeedingAllocation();

  revalidatePath("/admin/tax");
}

async function requireAdmin(permission: AdminPermission) {
  const session = await auth();

  if (!session?.user) {
    redirect("/admin/login?next=/admin/tax");
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
