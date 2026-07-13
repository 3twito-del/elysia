"use server";

import type { AdminPermission } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "~/server/auth";
import {
  getAdminFromSession,
  hasAdminPermission,
} from "~/server/auth/admin-access";
import { issueGiftCard, redeemGiftCard } from "~/server/services/gift-card";
import {
  closeShift,
  openShift,
  recordPosSale,
} from "~/server/services/pos-register";

export async function issueGiftCardAction(formData: FormData) {
  const admin = await requireAdmin("POS_WRITE");

  const amount = Number(formData.get("amount") ?? 0) || 0;
  if (amount <= 0) throw new Error("יש להזין סכום שובר חיובי.");

  await issueGiftCard({ amount, issuedById: admin.id });

  revalidatePath("/admin/pos");
}

export async function redeemGiftCardAction(formData: FormData) {
  const admin = await requireAdmin("POS_WRITE");

  const code = stringValue(formData.get("code")).trim();
  const amount = Number(formData.get("amount") ?? 0) || 0;
  if (!code) throw new Error("יש להזין קוד שובר.");
  if (amount <= 0) throw new Error("יש להזין סכום פדיון חיובי.");

  await redeemGiftCard({ code, amount, postedById: admin.id });

  revalidatePath("/admin/pos");
}

export async function openShiftAction(formData: FormData) {
  const admin = await requireAdmin("POS_WRITE");

  await openShift({
    branchId: optionalString(formData.get("branchId")),
    openingFloat: Number(formData.get("openingFloat") ?? 0) || 0,
    openedById: admin.id,
  });

  revalidatePath("/admin/pos");
}

export async function closeShiftAction(formData: FormData) {
  const admin = await requireAdmin("POS_WRITE");

  const shiftId = stringValue(formData.get("shiftId"));
  if (!shiftId) throw new Error("חסר מזהה משמרת.");

  await closeShift({
    shiftId,
    countedCash: Number(formData.get("countedCash") ?? 0) || 0,
    closedById: admin.id,
  });

  revalidatePath("/admin/pos");
}

export async function recordPosSaleAction(formData: FormData) {
  const admin = await requireAdmin("POS_WRITE");

  const shiftId = stringValue(formData.get("shiftId")).trim();
  const sku = stringValue(formData.get("sku")).trim();
  if (!shiftId) throw new Error("יש לבחור משמרת פתוחה.");
  if (!sku) throw new Error('יש להזין מק"ט.');

  const quantity = Number(formData.get("quantity") ?? 0) || 0;
  if (quantity <= 0) throw new Error("יש להזין כמות חיובית.");

  await recordPosSale({
    shiftId,
    sku,
    quantity,
    customerEmail: optionalString(formData.get("customerEmail")),
    soldById: admin.id,
  });

  revalidatePath("/admin/pos");
}

async function requireAdmin(permission: AdminPermission) {
  const session = await auth();

  if (!session?.user) {
    redirect("/admin/login?next=/admin/pos");
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
