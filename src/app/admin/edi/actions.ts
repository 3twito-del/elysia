"use server";

import type { AdminPermission } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "~/server/auth";
import {
  getAdminFromSession,
  hasAdminPermission,
} from "~/server/auth/admin-access";
import { generateEdi850ForPo } from "~/server/services/edi";

export async function generateEdi850Action(formData: FormData) {
  await requireAdmin("SYSTEM_CONFIG");

  const purchaseOrderId = stringValue(formData.get("purchaseOrderId"));
  if (!purchaseOrderId) throw new Error("חסר מזהה הזמנת רכש.");

  await generateEdi850ForPo(purchaseOrderId);

  revalidatePath("/admin/edi");
}

async function requireAdmin(permission: AdminPermission) {
  const session = await auth();

  if (!session?.user) {
    redirect("/admin/login?next=/admin/edi");
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
