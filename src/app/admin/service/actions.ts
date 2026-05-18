"use server";

import type { AdminPermission, ServiceRequestStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "~/server/auth";
import {
  getAdminFromSession,
  hasAdminPermission,
} from "~/server/auth/admin-access";
import {
  updateAdminServiceRequest,
  updateAdminServiceSettings,
  upsertAdminContactTopic,
  upsertAdminServiceBranch,
} from "~/server/services/service";

export async function updateServiceRequestAdminAction(formData: FormData) {
  const admin = await requireAdmin("CUSTOMER_WRITE");

  await updateAdminServiceRequest({
    adminUserId: admin.id,
    data: {
      serviceRequestId: stringValue(formData.get("serviceRequestId")),
      status: stringValue(formData.get("status")) as ServiceRequestStatus,
      adminNotes: optionalString(formData.get("adminNotes")),
    },
  });

  revalidatePath("/admin/service");
}

export async function updateServiceSettingsAdminAction(formData: FormData) {
  const admin = await requireAdmin("SYSTEM_CONFIG");

  await updateAdminServiceSettings({
    adminUserId: admin.id,
    data: {
      phoneE164: stringValue(formData.get("phoneE164")),
      displayPhone: stringValue(formData.get("displayPhone")),
      serviceEmail: stringValue(formData.get("serviceEmail")),
      physicalBranchesEnabled: formData.get("physicalBranchesEnabled") === "on",
    },
  });

  revalidatePath("/admin/service");
  revalidatePath("/service");
  revalidatePath("/branches");
}

export async function upsertContactTopicAdminAction(formData: FormData) {
  const admin = await requireAdmin("SYSTEM_CONFIG");

  await upsertAdminContactTopic({
    adminUserId: admin.id,
    data: {
      id: optionalString(formData.get("id")),
      slug: stringValue(formData.get("slug")),
      label: stringValue(formData.get("label")),
      description: optionalString(formData.get("description")),
      recipientEmail: optionalString(formData.get("recipientEmail")),
      isActive: formData.get("isActive") === "on",
      sortOrder: Number(formData.get("sortOrder") ?? 0),
    },
  });

  revalidatePath("/admin/service");
  revalidatePath("/service");
}

export async function upsertServiceBranchAdminAction(formData: FormData) {
  const admin = await requireAdmin("SYSTEM_CONFIG");

  await upsertAdminServiceBranch({
    adminUserId: admin.id,
    data: {
      id: optionalString(formData.get("id")),
      slug: stringValue(formData.get("slug")),
      name: stringValue(formData.get("name")),
      address: stringValue(formData.get("address")),
      city: stringValue(formData.get("city")),
      phone: stringValue(formData.get("phone")),
      whatsapp: optionalString(formData.get("whatsapp")),
      openingHoursText: stringValue(formData.get("openingHoursText")),
      servicesText: stringValue(formData.get("servicesText")),
      isApproved: formData.get("isApproved") === "on",
      isPublic: formData.get("isPublic") === "on",
      isActive: formData.get("isActive") === "on",
      sortOrder: Number(formData.get("sortOrder") ?? 0),
    },
  });

  revalidatePath("/admin/service");
  revalidatePath("/branches");
}

async function requireAdmin(permission: AdminPermission) {
  const session = await auth();

  if (!session?.user) {
    redirect("/admin/login?next=/admin/service");
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
