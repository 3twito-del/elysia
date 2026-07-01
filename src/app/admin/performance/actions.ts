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
  createGoal,
  createReview,
  setReviewStatus,
  updateGoal,
} from "~/server/services/hr-performance";

export async function createReviewAction(formData: FormData) {
  await requireAdmin("ERP_WRITE");

  const employeeId = stringValue(formData.get("employeeId"));
  const cycle = stringValue(formData.get("cycle")).trim();
  if (!employeeId || !cycle) throw new Error("יש לבחור עובד ולהזין מחזור.");

  await createReview({
    employeeId,
    cycle,
    rating: Number(stringValue(formData.get("rating"))) || 3,
    summary: optionalString(formData.get("summary")),
  });

  revalidatePath("/admin/performance");
}

export async function setReviewStatusAction(formData: FormData) {
  await requireAdmin("ERP_WRITE");

  const reviewId = stringValue(formData.get("reviewId"));
  const status = stringValue(formData.get("status"));
  if (!reviewId) throw new Error("חסר מזהה הערכה.");

  await setReviewStatus({ reviewId, status });

  revalidatePath("/admin/performance");
}

export async function createGoalAction(formData: FormData) {
  await requireAdmin("ERP_WRITE");

  const employeeId = stringValue(formData.get("employeeId"));
  const title = stringValue(formData.get("title")).trim();
  if (!employeeId || !title) throw new Error("יש לבחור עובד ולהזין כותרת.");

  const dueDate = optionalString(formData.get("dueDate"));

  await createGoal({
    employeeId,
    title,
    dueDate: dueDate ? new Date(dueDate) : undefined,
  });

  revalidatePath("/admin/performance");
}

export async function updateGoalAction(formData: FormData) {
  await requireAdmin("ERP_WRITE");

  const goalId = stringValue(formData.get("goalId"));
  if (!goalId) throw new Error("חסר מזהה יעד.");

  await updateGoal({
    goalId,
    status: stringValue(formData.get("status")) || "OPEN",
    progress: Number(stringValue(formData.get("progress"))) || 0,
  });

  revalidatePath("/admin/performance");
}

async function requireAdmin(permission: AdminPermission) {
  const session = await auth();

  if (!session?.user) {
    redirect("/admin/login?next=/admin/performance");
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
