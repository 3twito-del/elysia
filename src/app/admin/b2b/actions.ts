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
  addAuthorizedBuyer,
  createB2bAccount,
  removeAuthorizedBuyer,
  setAuthorizedBuyerStatus,
  setB2bAccountStatus,
  updateB2bAccount,
} from "~/server/services/b2b";

export async function createB2bAccountAction(formData: FormData) {
  await requireAdmin("CUSTOMER_WRITE");

  const customerEmail = stringValue(formData.get("customerEmail")).trim();
  if (!customerEmail) throw new Error('יש להזין דוא"ל לקוח.');

  await createB2bAccount({
    customerEmail,
    companyName: optionalString(formData.get("companyName")),
    taxId: optionalString(formData.get("taxId")),
    discountPercent: Number(stringValue(formData.get("discountPercent"))) || 0,
    creditLimit: Number(stringValue(formData.get("creditLimit"))) || 0,
    paymentTermsDays: Number(stringValue(formData.get("paymentTermsDays"))) || 30,
  });

  revalidatePath("/admin/b2b");
}

export async function updateB2bAccountAction(formData: FormData) {
  await requireAdmin("CUSTOMER_WRITE");

  const accountId = stringValue(formData.get("accountId"));
  if (!accountId) throw new Error("חסר מזהה חשבון.");

  await updateB2bAccount({
    accountId,
    discountPercent: Number(stringValue(formData.get("discountPercent"))) || 0,
    creditLimit: Number(stringValue(formData.get("creditLimit"))) || 0,
    paymentTermsDays: Number(stringValue(formData.get("paymentTermsDays"))) || 30,
  });

  revalidatePath("/admin/b2b");
}

export async function setB2bAccountStatusAction(formData: FormData) {
  await requireAdmin("CUSTOMER_WRITE");

  const accountId = stringValue(formData.get("accountId"));
  if (!accountId) throw new Error("חסר מזהה חשבון.");

  await setB2bAccountStatus({
    accountId,
    status: formData.get("status") === "SUSPENDED" ? "SUSPENDED" : "ACTIVE",
  });

  revalidatePath("/admin/b2b");
}

export async function addAuthorizedBuyerAction(formData: FormData) {
  await requireAdmin("CUSTOMER_WRITE");

  const accountId = stringValue(formData.get("accountId"));
  if (!accountId) throw new Error("חסר מזהה חשבון.");

  await addAuthorizedBuyer({
    accountId,
    name: stringValue(formData.get("name")),
    email: stringValue(formData.get("email")),
    role: optionalString(formData.get("role")),
    spendLimit: Number(stringValue(formData.get("spendLimit"))) || 0,
  });

  revalidatePath("/admin/b2b");
}

export async function setAuthorizedBuyerStatusAction(formData: FormData) {
  await requireAdmin("CUSTOMER_WRITE");

  const buyerId = stringValue(formData.get("buyerId"));
  if (!buyerId) throw new Error("חסר מזהה רוכש.");

  await setAuthorizedBuyerStatus({
    buyerId,
    status: formData.get("status") === "SUSPENDED" ? "SUSPENDED" : "ACTIVE",
  });

  revalidatePath("/admin/b2b");
}

export async function removeAuthorizedBuyerAction(formData: FormData) {
  await requireAdmin("CUSTOMER_WRITE");

  const buyerId = stringValue(formData.get("buyerId"));
  if (!buyerId) throw new Error("חסר מזהה רוכש.");

  await removeAuthorizedBuyer({ buyerId });

  revalidatePath("/admin/b2b");
}

async function requireAdmin(permission: AdminPermission) {
  const session = await auth();

  if (!session?.user) {
    redirect("/admin/login?next=/admin/b2b");
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
