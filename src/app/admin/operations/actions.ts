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
  createFacilityRequest,
  setFacilityStatus,
} from "~/server/services/facilities";
import {
  createAsset,
  createTicket,
  setAssetStatus,
  setTicketStatus,
} from "~/server/services/it-service";

export async function createTicketAction(formData: FormData) {
  const admin = await requireAdmin("ERP_WRITE");

  const title = stringValue(formData.get("title")).trim();
  if (!title) throw new Error("כותרת הפנייה היא שדה חובה.");

  const priorityRaw = stringValue(formData.get("priority"));
  const priority =
    priorityRaw === "LOW" || priorityRaw === "HIGH" || priorityRaw === "URGENT"
      ? priorityRaw
      : "MEDIUM";

  await createTicket({
    title,
    category: optionalString(formData.get("category")),
    priority,
    requestedById: admin.id,
  });

  revalidatePath("/admin/operations");
}

export async function setTicketStatusAction(formData: FormData) {
  await requireAdmin("ERP_WRITE");

  const ticketId = stringValue(formData.get("ticketId"));
  const status = stringValue(formData.get("status"));
  if (!ticketId) throw new Error("חסר מזהה פנייה.");
  if (
    status !== "OPEN" &&
    status !== "IN_PROGRESS" &&
    status !== "RESOLVED" &&
    status !== "CLOSED"
  ) {
    throw new Error("סטטוס לא תקין.");
  }

  await setTicketStatus({ ticketId, status });

  revalidatePath("/admin/operations");
}

export async function createAssetAction(formData: FormData) {
  await requireAdmin("ERP_WRITE");

  const name = stringValue(formData.get("name")).trim();
  if (!name) throw new Error("שם הנכס הוא שדה חובה.");

  await createAsset({
    name,
    category: optionalString(formData.get("category")),
    serialNumber: optionalString(formData.get("serialNumber")),
    assignedTo: optionalString(formData.get("assignedTo")),
  });

  revalidatePath("/admin/operations");
}

export async function setAssetStatusAction(formData: FormData) {
  await requireAdmin("ERP_WRITE");

  const assetId = stringValue(formData.get("assetId"));
  const status = stringValue(formData.get("status"));
  if (!assetId) throw new Error("חסר מזהה נכס.");
  if (status !== "IN_USE" && status !== "IN_STORAGE" && status !== "RETIRED") {
    throw new Error("סטטוס לא תקין.");
  }

  await setAssetStatus({ assetId, status });

  revalidatePath("/admin/operations");
}

export async function createFacilityRequestAction(formData: FormData) {
  await requireAdmin("ERP_WRITE");

  const title = stringValue(formData.get("title")).trim();
  if (!title) throw new Error("כותרת הבקשה היא שדה חובה.");

  const priorityRaw = stringValue(formData.get("priority"));
  const priority =
    priorityRaw === "LOW" || priorityRaw === "HIGH" ? priorityRaw : "MEDIUM";

  await createFacilityRequest({
    title,
    category: optionalString(formData.get("category")),
    priority,
    notes: optionalString(formData.get("notes")),
  });

  revalidatePath("/admin/operations");
}

export async function setFacilityStatusAction(formData: FormData) {
  await requireAdmin("ERP_WRITE");

  const requestId = stringValue(formData.get("requestId"));
  const status = stringValue(formData.get("status"));
  if (!requestId) throw new Error("חסר מזהה בקשה.");
  if (
    status !== "OPEN" &&
    status !== "SCHEDULED" &&
    status !== "DONE" &&
    status !== "CANCELLED"
  ) {
    throw new Error("סטטוס לא תקין.");
  }

  await setFacilityStatus({ requestId, status });

  revalidatePath("/admin/operations");
}

async function requireAdmin(permission: AdminPermission) {
  const session = await auth();

  if (!session?.user) {
    redirect("/admin/login?next=/admin/operations");
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
