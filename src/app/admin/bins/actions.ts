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
  assignVariantToBin,
  createBin,
  setBinActive,
} from "~/server/services/bins";
import {
  cancelPickList,
  completePickList,
  generatePickList,
  setPickLinePicked,
} from "~/server/services/pick-list";
import {
  consumeLotsFefo,
  createInventoryLot,
} from "~/server/services/lot-tracking";

export async function createBinAction(formData: FormData) {
  await requireAdmin("INVENTORY_WRITE");

  const branchId = stringValue(formData.get("branchId"));
  const code = stringValue(formData.get("code")).trim();
  if (!branchId || !code) throw new Error("יש לבחור סניף ולהזין קוד מיקום.");

  await createBin({
    branchId,
    code,
    label: optionalString(formData.get("label")),
  });

  revalidatePath("/admin/bins");
}

export async function toggleBinAction(formData: FormData) {
  await requireAdmin("INVENTORY_WRITE");

  const binId = stringValue(formData.get("binId"));
  if (!binId) throw new Error("חסר מזהה מיקום.");

  await setBinActive({ binId, isActive: formData.get("isActive") === "1" });

  revalidatePath("/admin/bins");
}

export async function assignToBinAction(formData: FormData) {
  await requireAdmin("INVENTORY_WRITE");

  const binId = stringValue(formData.get("binId"));
  const sku = stringValue(formData.get("sku")).trim();
  if (!binId || !sku) throw new Error("יש לבחור מיקום ולהזין מק\"ט.");

  await assignVariantToBin({
    binId,
    sku,
    quantity: Number(stringValue(formData.get("quantity"))) || 0,
  });

  revalidatePath("/admin/bins");
}

export async function generatePickListAction(formData: FormData) {
  const admin = await requireAdmin("INVENTORY_WRITE");

  await generatePickList({
    branchId: optionalString(formData.get("branchId")),
    createdById: admin.id,
  });

  revalidatePath("/admin/bins");
}

export async function togglePickLineAction(formData: FormData) {
  await requireAdmin("INVENTORY_WRITE");

  const lineId = stringValue(formData.get("lineId"));
  if (!lineId) throw new Error("חסר מזהה שורה.");

  await setPickLinePicked({ lineId, picked: formData.get("picked") === "1" });

  revalidatePath("/admin/bins");
}

export async function completePickListAction(formData: FormData) {
  await requireAdmin("INVENTORY_WRITE");

  const pickListId = stringValue(formData.get("pickListId"));
  if (!pickListId) throw new Error("חסר מזהה רשימת ליקוט.");

  await completePickList({ pickListId });

  revalidatePath("/admin/bins");
}

export async function cancelPickListAction(formData: FormData) {
  await requireAdmin("INVENTORY_WRITE");

  const pickListId = stringValue(formData.get("pickListId"));
  if (!pickListId) throw new Error("חסר מזהה רשימת ליקוט.");

  await cancelPickList({ pickListId });

  revalidatePath("/admin/bins");
}

export async function createInventoryLotAction(formData: FormData) {
  await requireAdmin("INVENTORY_WRITE");

  const branchId = stringValue(formData.get("branchId"));
  const sku = stringValue(formData.get("sku")).trim();
  const lotNumber = stringValue(formData.get("lotNumber")).trim();
  if (!branchId || !sku || !lotNumber) {
    throw new Error('יש לבחור סניף ולהזין מק"ט ומספר אצווה.');
  }

  const expiryRaw = optionalString(formData.get("expiryDate"));
  await createInventoryLot({
    branchId,
    sku,
    lotNumber,
    quantity: Number(stringValue(formData.get("quantity"))) || 0,
    expiryDate: expiryRaw ? new Date(expiryRaw) : undefined,
  });

  revalidatePath("/admin/bins");
}

export async function consumeLotsAction(formData: FormData) {
  await requireAdmin("INVENTORY_WRITE");

  const branchId = stringValue(formData.get("branchId"));
  const sku = stringValue(formData.get("sku")).trim();
  if (!branchId || !sku) throw new Error('יש לבחור סניף ולהזין מק"ט.');

  await consumeLotsFefo({
    branchId,
    sku,
    quantity: Number(stringValue(formData.get("quantity"))) || 0,
  });

  revalidatePath("/admin/bins");
}

async function requireAdmin(permission: AdminPermission) {
  const session = await auth();

  if (!session?.user) {
    redirect("/admin/login?next=/admin/bins");
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
