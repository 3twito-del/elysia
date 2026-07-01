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
  createPromotion,
  deletePromotion,
  setPromotionActive,
} from "~/server/services/promotions";

export async function createPromotionAction(formData: FormData) {
  await requireAdmin("CATALOG_WRITE");

  const name = stringValue(formData.get("name")).trim();
  if (!name) throw new Error("שם המבצע הוא שדה חובה.");

  const startsAt = optionalString(formData.get("startsAt"));
  const endsAt = optionalString(formData.get("endsAt"));

  await createPromotion({
    name,
    type: stringValue(formData.get("type")) || "PERCENT",
    value: Number(stringValue(formData.get("value"))) || 0,
    categoryId: optionalString(formData.get("categoryId")),
    buyQuantity: Number(stringValue(formData.get("buyQuantity"))) || 0,
    getQuantity: Number(stringValue(formData.get("getQuantity"))) || 0,
    minCartTotal: Number(stringValue(formData.get("minCartTotal"))) || 0,
    minQuantity: Number(stringValue(formData.get("minQuantity"))) || 0,
    priority: Number(stringValue(formData.get("priority"))) || 100,
    stackable: formData.get("stackable") === "1",
    startsAt: startsAt ? new Date(startsAt) : undefined,
    endsAt: endsAt ? new Date(endsAt) : undefined,
  });

  revalidatePath("/admin/promotions");
}

export async function togglePromotionAction(formData: FormData) {
  await requireAdmin("CATALOG_WRITE");

  const promotionId = stringValue(formData.get("promotionId"));
  if (!promotionId) throw new Error("חסר מזהה מבצע.");

  await setPromotionActive({
    promotionId,
    isActive: formData.get("isActive") === "1",
  });

  revalidatePath("/admin/promotions");
}

export async function deletePromotionAction(formData: FormData) {
  await requireAdmin("CATALOG_WRITE");

  const promotionId = stringValue(formData.get("promotionId"));
  if (!promotionId) throw new Error("חסר מזהה מבצע.");

  await deletePromotion({ promotionId });

  revalidatePath("/admin/promotions");
}

async function requireAdmin(permission: AdminPermission) {
  const session = await auth();

  if (!session?.user) {
    redirect("/admin/login?next=/admin/promotions");
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
