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
import {
  createLeaveRequest,
  recordAttendance,
  setLeaveRequestStatus,
} from "~/server/services/time-attendance";

export async function createReviewAction(formData: FormData) {
  await requireAdmin("PERFORMANCE_WRITE");

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
  await requireAdmin("PERFORMANCE_WRITE");

  const reviewId = stringValue(formData.get("reviewId"));
  const status = stringValue(formData.get("status"));
  if (!reviewId) throw new Error("חסר מזהה הערכה.");

  await setReviewStatus({ reviewId, status });

  revalidatePath("/admin/performance");
}

export async function createGoalAction(formData: FormData) {
  await requireAdmin("PERFORMANCE_WRITE");

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
  await requireAdmin("PERFORMANCE_WRITE");

  const goalId = stringValue(formData.get("goalId"));
  if (!goalId) throw new Error("חסר מזהה יעד.");

  await updateGoal({
    goalId,
    status: stringValue(formData.get("status")) || "OPEN",
    progress: Number(stringValue(formData.get("progress"))) || 0,
  });

  revalidatePath("/admin/performance");
}

export async function recordAttendanceAction(formData: FormData) {
  await requireAdmin("PERFORMANCE_WRITE");

  const employeeId = stringValue(formData.get("employeeId"));
  const clockInRaw = stringValue(formData.get("clockIn"));
  if (!employeeId || !clockInRaw) {
    throw new Error("יש לבחור עובד ולהזין שעת כניסה.");
  }

  const clockIn = new Date(clockInRaw);
  const clockOutRaw = optionalString(formData.get("clockOut"));

  await recordAttendance({
    employeeId,
    workDate: clockIn,
    clockIn,
    clockOut: clockOutRaw ? new Date(clockOutRaw) : undefined,
    breakMinutes: Number(stringValue(formData.get("breakMinutes"))) || 0,
  });

  revalidatePath("/admin/performance");
}

export async function createLeaveRequestAction(formData: FormData) {
  await requireAdmin("PERFORMANCE_WRITE");

  const employeeId = stringValue(formData.get("employeeId"));
  const startRaw = stringValue(formData.get("startDate"));
  const endRaw = stringValue(formData.get("endDate"));
  if (!employeeId || !startRaw || !endRaw) {
    throw new Error("יש לבחור עובד ולהזין טווח תאריכים.");
  }

  await createLeaveRequest({
    employeeId,
    type: stringValue(formData.get("type")),
    startDate: new Date(startRaw),
    endDate: new Date(endRaw),
    notes: optionalString(formData.get("notes")),
  });

  revalidatePath("/admin/performance");
}

export async function setLeaveRequestStatusAction(formData: FormData) {
  await requireAdmin("PERFORMANCE_WRITE");

  const leaveRequestId = stringValue(formData.get("leaveRequestId"));
  if (!leaveRequestId) throw new Error("חסר מזהה בקשה.");

  await setLeaveRequestStatus({
    leaveRequestId,
    status: formData.get("status") === "APPROVED" ? "APPROVED" : "REJECTED",
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
