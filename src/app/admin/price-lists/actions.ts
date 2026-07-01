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
  assignPriceListToAccount,
  createPriceList,
  setPriceListActive,
  setPriceListItem,
} from "~/server/services/price-lists";

export async function createPriceListAction(formData: FormData) {
  await requireAdmin("CUSTOMER_WRITE");

  const name = stringValue(formData.get("name")).trim();
  if (!name) throw new Error("שם המחירון הוא שדה חובה.");

  await createPriceList({
    name,
    currency: optionalString(formData.get("currency")),
  });

  revalidatePath("/admin/price-lists");
}

export async function togglePriceListAction(formData: FormData) {
  await requireAdmin("CUSTOMER_WRITE");

  const priceListId = stringValue(formData.get("priceListId"));
  if (!priceListId) throw new Error("חסר מזהה מחירון.");

  await setPriceListActive({
    priceListId,
    isActive: formData.get("isActive") === "1",
  });

  revalidatePath("/admin/price-lists");
}

export async function setPriceListItemAction(formData: FormData) {
  await requireAdmin("CUSTOMER_WRITE");

  const priceListId = stringValue(formData.get("priceListId"));
  const sku = stringValue(formData.get("sku")).trim();
  if (!priceListId || !sku) throw new Error("יש לבחור מחירון ולהזין מק\"ט.");

  await setPriceListItem({
    priceListId,
    sku,
    price: Number(stringValue(formData.get("price"))) || 0,
  });

  redirect(`/admin/price-lists?list=${priceListId}`);
}

export async function assignPriceListAction(formData: FormData) {
  await requireAdmin("CUSTOMER_WRITE");

  const accountId = stringValue(formData.get("accountId"));
  if (!accountId) throw new Error("יש לבחור חשבון.");

  const priceListId = stringValue(formData.get("priceListId"));
  await assignPriceListToAccount({
    accountId,
    priceListId: priceListId || null,
  });

  revalidatePath("/admin/price-lists");
}

async function requireAdmin(permission: AdminPermission) {
  const session = await auth();

  if (!session?.user) {
    redirect("/admin/login?next=/admin/price-lists");
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
