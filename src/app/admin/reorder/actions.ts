"use server";

import type { AdminPermission } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "~/server/auth";
import {
  getAdminFromSession,
  hasAdminPermission,
} from "~/server/auth/admin-access";
import { setReorderPolicy } from "~/server/services/reorder-planning";

export async function setReorderPolicyAction(formData: FormData) {
  await requireAdmin("INVENTORY_WRITE");

  const inventoryItemId = stringValue(formData.get("inventoryItemId"));
  if (!inventoryItemId) throw new Error("חסר מזהה פריט מלאי.");

  await setReorderPolicy({
    inventoryItemId,
    reorderPoint: Number(stringValue(formData.get("reorderPoint"))) || 0,
    targetLevel: Number(stringValue(formData.get("targetLevel"))) || 0,
  });

  revalidatePath("/admin/reorder");
}

async function requireAdmin(permission: AdminPermission) {
  const session = await auth();

  if (!session?.user) {
    redirect("/admin/login?next=/admin/reorder");
  }

  const admin = await getAdminFromSession(session);

  if (!admin || !hasAdminPermission(admin, permission)) {
    throw new Error("אין הרשאה לבצע את הפעולה המבוקשת.");
  }

  return admin;
}

function stringValue(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value : "";
}
