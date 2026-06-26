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
  addMilestone,
  completeMilestone,
  createProject,
  invoiceMilestone,
  logTime,
  setProjectStatus,
} from "~/server/services/projects";

export async function createProjectAction(formData: FormData) {
  await requireAdmin("ERP_WRITE");

  const name = stringValue(formData.get("name")).trim();
  if (!name) throw new Error("שם הפרויקט הוא שדה חובה.");

  const budgetRaw = stringValue(formData.get("budgetAmount")).trim();
  const startDate = optionalString(formData.get("startDate"));
  const endDate = optionalString(formData.get("endDate"));

  await createProject({
    name,
    customerId: optionalString(formData.get("customerId")),
    billingType: optionalString(formData.get("billingType")),
    budgetAmount: budgetRaw ? Number(budgetRaw) || 0 : undefined,
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined,
    notes: optionalString(formData.get("notes")),
  });

  revalidatePath("/admin/projects");
}

export async function setProjectStatusAction(formData: FormData) {
  await requireAdmin("ERP_WRITE");

  const projectId = stringValue(formData.get("projectId"));
  const status = stringValue(formData.get("status"));
  if (!projectId) throw new Error("חסר מזהה פרויקט.");

  await setProjectStatus({ projectId, status });

  revalidatePath("/admin/projects");
}

export async function addMilestoneAction(formData: FormData) {
  await requireAdmin("ERP_WRITE");

  const projectId = stringValue(formData.get("projectId"));
  const name = stringValue(formData.get("name")).trim();
  if (!projectId || !name) throw new Error("יש לבחור פרויקט ולהזין שם אבן דרך.");

  const amountRaw = stringValue(formData.get("amount")).trim();
  const dueDate = optionalString(formData.get("dueDate"));

  await addMilestone({
    projectId,
    name,
    amount: amountRaw ? Number(amountRaw) || 0 : undefined,
    dueDate: dueDate ? new Date(dueDate) : undefined,
  });

  revalidatePath("/admin/projects");
}

export async function completeMilestoneAction(formData: FormData) {
  await requireAdmin("ERP_WRITE");

  const milestoneId = stringValue(formData.get("milestoneId"));
  if (!milestoneId) throw new Error("חסר מזהה אבן דרך.");

  await completeMilestone({ milestoneId });

  revalidatePath("/admin/projects");
}

export async function invoiceMilestoneAction(formData: FormData) {
  await requireAdmin("ERP_WRITE");

  const milestoneId = stringValue(formData.get("milestoneId"));
  if (!milestoneId) throw new Error("חסר מזהה אבן דרך.");

  await invoiceMilestone({ milestoneId });

  revalidatePath("/admin/projects");
}

export async function logTimeAction(formData: FormData) {
  const admin = await requireAdmin("ERP_WRITE");

  const projectId = stringValue(formData.get("projectId"));
  const hoursRaw = stringValue(formData.get("hours")).trim();
  if (!projectId || !hoursRaw) throw new Error("יש לבחור פרויקט ולהזין שעות.");

  const rateRaw = stringValue(formData.get("ratePerHour")).trim();
  const workDate = optionalString(formData.get("workDate"));

  await logTime({
    projectId,
    adminUserId: admin.id,
    hours: Number(hoursRaw) || 0,
    ratePerHour: rateRaw ? Number(rateRaw) || 0 : undefined,
    workDate: workDate ? new Date(workDate) : undefined,
    description: optionalString(formData.get("description")),
    billable: formData.get("billable") !== "0",
  });

  revalidatePath("/admin/projects");
}

async function requireAdmin(permission: AdminPermission) {
  const session = await auth();

  if (!session?.user) {
    redirect("/admin/login?next=/admin/projects");
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
