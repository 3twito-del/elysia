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
  createEntity,
  createIntercompanyTransaction,
  eliminateIntercompanyTransaction,
  setBranchEntity,
  setEntityActive,
  setEntityFxRate,
} from "~/server/services/entities";

export async function createEntityAction(formData: FormData) {
  await requireAdmin("FINANCE_WRITE");

  const code = stringValue(formData.get("code")).trim();
  const name = stringValue(formData.get("name")).trim();
  if (!code || !name) throw new Error("קוד ושם הם שדות חובה.");

  const fxRaw = stringValue(formData.get("fxRateToBase")).trim();

  await createEntity({
    code,
    name,
    functionalCurrency: optionalString(formData.get("functionalCurrency")),
    fxRateToBase: fxRaw ? Number(fxRaw) || 1 : 1,
    isBase: formData.get("isBase") === "1",
  });

  revalidatePath("/admin/entities");
}

export async function toggleEntityAction(formData: FormData) {
  await requireAdmin("FINANCE_WRITE");

  const entityId = stringValue(formData.get("entityId"));
  if (!entityId) throw new Error("חסר מזהה ישות.");

  await setEntityActive({
    entityId,
    isActive: formData.get("isActive") === "1",
  });

  revalidatePath("/admin/entities");
}

export async function setEntityFxAction(formData: FormData) {
  await requireAdmin("FINANCE_WRITE");

  const entityId = stringValue(formData.get("entityId"));
  const fxRaw = stringValue(formData.get("fxRateToBase")).trim();
  if (!entityId) throw new Error("חסר מזהה ישות.");
  if (!fxRaw) throw new Error("יש להזין שער חליפין.");

  await setEntityFxRate({ entityId, fxRateToBase: Number(fxRaw) || 0 });

  revalidatePath("/admin/entities");
}

export async function createIntercompanyAction(formData: FormData) {
  await requireAdmin("FINANCE_WRITE");

  const fromEntityId = stringValue(formData.get("fromEntityId"));
  const toEntityId = stringValue(formData.get("toEntityId"));
  const amountRaw = stringValue(formData.get("amount")).trim();
  if (!fromEntityId || !toEntityId) throw new Error("יש לבחור שתי ישויות.");
  if (!amountRaw) throw new Error("יש להזין סכום.");

  const occurredAt = optionalString(formData.get("occurredAt"));

  await createIntercompanyTransaction({
    fromEntityId,
    toEntityId,
    amount: Number(amountRaw) || 0,
    currency: optionalString(formData.get("currency")),
    description: optionalString(formData.get("description")),
    occurredAt: occurredAt ? new Date(occurredAt) : undefined,
  });

  revalidatePath("/admin/entities");
}

export async function setBranchEntityAction(formData: FormData) {
  await requireAdmin("FINANCE_WRITE");

  const branchId = stringValue(formData.get("branchId"));
  if (!branchId) throw new Error("חסר מזהה סניף.");

  const entityId = stringValue(formData.get("entityId"));
  await setBranchEntity({ branchId, entityId: entityId || null });

  revalidatePath("/admin/entities");
}

export async function eliminateIntercompanyAction(formData: FormData) {
  await requireAdmin("FINANCE_WRITE");

  const transactionId = stringValue(formData.get("transactionId"));
  if (!transactionId) throw new Error("חסר מזהה עסקה.");

  await eliminateIntercompanyTransaction({ transactionId });

  revalidatePath("/admin/entities");
}

async function requireAdmin(permission: AdminPermission) {
  const session = await auth();

  if (!session?.user) {
    redirect("/admin/login?next=/admin/entities");
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
