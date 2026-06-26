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
  createReport,
  deleteReport,
  setReportActive,
} from "~/server/services/reports";

const UNARY_OPS = new Set(["exists", "truthy", "falsy"]);

export async function createReportAction(formData: FormData) {
  await requireAdmin("ERP_WRITE");

  const name = stringValue(formData.get("name")).trim();
  const datasetKey = stringValue(formData.get("datasetKey"));
  if (!name) throw new Error("שם הדוח הוא שדה חובה.");
  if (!datasetKey) throw new Error("יש לבחור מאגר נתונים.");

  const dimensions = formData
    .getAll("dim")
    .filter((value): value is string => typeof value === "string");
  const measures = formData
    .getAll("measure")
    .filter((value): value is string => typeof value === "string");

  const filterField = optionalString(formData.get("filterField"));
  const filterOp = stringValue(formData.get("filterOp")) || "eq";
  const filterValueRaw = stringValue(formData.get("filterValue"));
  const filter = filterField
    ? UNARY_OPS.has(filterOp)
      ? { field: filterField, op: filterOp }
      : { field: filterField, op: filterOp, value: coerceValue(filterValueRaw) }
    : undefined;

  await createReport({
    name,
    description: optionalString(formData.get("description")),
    datasetKey,
    dimensions,
    measures,
    filter,
  });

  revalidatePath("/admin/reports");
}

export async function toggleReportAction(formData: FormData) {
  await requireAdmin("ERP_WRITE");

  const reportId = stringValue(formData.get("reportId"));
  if (!reportId) throw new Error("חסר מזהה דוח.");

  await setReportActive({
    reportId,
    isActive: formData.get("isActive") === "1",
  });

  revalidatePath("/admin/reports");
}

export async function deleteReportAction(formData: FormData) {
  await requireAdmin("ERP_WRITE");

  const reportId = stringValue(formData.get("reportId"));
  if (!reportId) throw new Error("חסר מזהה דוח.");

  await deleteReport({ reportId });

  revalidatePath("/admin/reports");
}

function coerceValue(raw: string): unknown {
  if (raw === "") return "";
  if (raw === "true") return true;
  if (raw === "false") return false;
  const num = Number(raw);
  if (raw.trim() !== "" && Number.isFinite(num)) return num;
  return raw;
}

async function requireAdmin(permission: AdminPermission) {
  const session = await auth();

  if (!session?.user) {
    redirect("/admin/login?next=/admin/reports");
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
