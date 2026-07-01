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
  createExperiment,
  recordExperimentEvent,
  setExperimentStatus,
} from "~/server/services/ab-testing";

export async function createExperimentAction(formData: FormData) {
  await requireAdmin("CATALOG_WRITE");
  const name = stringValue(formData.get("name")).trim();
  if (!name) throw new Error("שם הניסוי הוא שדה חובה.");
  await createExperiment({ name });
  revalidatePath("/admin/experiments");
}

export async function setExperimentStatusAction(formData: FormData) {
  await requireAdmin("CATALOG_WRITE");
  const experimentId = stringValue(formData.get("experimentId"));
  if (!experimentId) throw new Error("חסר מזהה ניסוי.");
  await setExperimentStatus({
    experimentId,
    status: stringValue(formData.get("status")),
  });
  revalidatePath("/admin/experiments");
}

export async function recordExperimentEventAction(formData: FormData) {
  await requireAdmin("CATALOG_WRITE");
  const experimentId = stringValue(formData.get("experimentId"));
  const variantKey = stringValue(formData.get("variantKey"));
  if (!experimentId || !variantKey) throw new Error("חסרים פרטי אירוע.");
  await recordExperimentEvent({
    experimentId,
    variantKey,
    event: formData.get("event") === "conversion" ? "conversion" : "impression",
  });
  revalidatePath("/admin/experiments");
}

async function requireAdmin(permission: AdminPermission) {
  const session = await auth();
  if (!session?.user) redirect("/admin/login?next=/admin/experiments");
  const admin = await getAdminFromSession(session);
  if (!admin || !hasAdminPermission(admin, permission)) {
    throw new Error("אין הרשאה לבצע את הפעולה המבוקשת.");
  }
  return admin;
}

function stringValue(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value : "";
}
