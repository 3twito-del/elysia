"use server";

import type { AdminPermission } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "~/server/auth";
import {
  getAdminFromSession,
  hasAdminPermission,
} from "~/server/auth/admin-access";
import { issueApiKey, revokeApiKey } from "~/server/services/api-keys";
import {
  createEndpoint,
  deleteEndpoint,
  deliverWebhook,
  setEndpointActive,
} from "~/server/services/webhook-delivery";

export async function issueApiKeyAction(formData: FormData) {
  const admin = await requireAdmin("SYSTEM_CONFIG");

  const name = stringValue(formData.get("name")).trim();
  if (!name) throw new Error("שם המפתח הוא שדה חובה.");

  const scopes = formData
    .getAll("scope")
    .filter((value): value is string => typeof value === "string");

  const rateRaw = stringValue(formData.get("rateLimitPerMin")).trim();
  const expiresRaw = optionalString(formData.get("expiresAt"));

  const result = await issueApiKey({
    name,
    scopes,
    rateLimitPerMin: rateRaw ? Number(rateRaw) || 120 : undefined,
    expiresAt: expiresRaw ? new Date(expiresRaw) : undefined,
    adminUserId: admin.id,
  });

  // The plaintext is shown exactly once via a redirect flash.
  redirect(`/admin/developer?newKey=${encodeURIComponent(result.plaintext)}`);
}

export async function revokeApiKeyAction(formData: FormData) {
  const admin = await requireAdmin("SYSTEM_CONFIG");

  const apiKeyId = stringValue(formData.get("apiKeyId"));
  if (!apiKeyId) throw new Error("חסר מזהה מפתח.");

  await revokeApiKey({ apiKeyId, adminUserId: admin.id });

  revalidatePath("/admin/developer");
}

export async function createEndpointAction(formData: FormData) {
  const admin = await requireAdmin("SYSTEM_CONFIG");

  const name = stringValue(formData.get("name")).trim();
  const url = stringValue(formData.get("url")).trim();
  if (!name || !url) throw new Error("שם וכתובת הם שדות חובה.");

  const eventsRaw = stringValue(formData.get("events")).trim();
  const events = eventsRaw
    ? eventsRaw
        .split(",")
        .map((event) => event.trim())
        .filter(Boolean)
    : [];

  const result = await createEndpoint({ name, url, events, adminUserId: admin.id });

  redirect(`/admin/developer?newSecret=${encodeURIComponent(result.secret)}`);
}

export async function toggleEndpointAction(formData: FormData) {
  const admin = await requireAdmin("SYSTEM_CONFIG");

  const endpointId = stringValue(formData.get("endpointId"));
  if (!endpointId) throw new Error("חסר מזהה יעד.");

  await setEndpointActive({
    endpointId,
    isActive: formData.get("isActive") === "1",
    adminUserId: admin.id,
  });

  revalidatePath("/admin/developer");
}

export async function deleteEndpointAction(formData: FormData) {
  const admin = await requireAdmin("SYSTEM_CONFIG");

  const endpointId = stringValue(formData.get("endpointId"));
  if (!endpointId) throw new Error("חסר מזהה יעד.");

  await deleteEndpoint({ endpointId, adminUserId: admin.id });

  revalidatePath("/admin/developer");
}

export async function deliverWebhookAction(formData: FormData) {
  const admin = await requireAdmin("SYSTEM_CONFIG");

  const deliveryId = stringValue(formData.get("deliveryId"));
  if (!deliveryId) throw new Error("חסר מזהה משלוח.");

  await deliverWebhook({ deliveryId, adminUserId: admin.id });

  revalidatePath("/admin/developer");
}

async function requireAdmin(permission: AdminPermission) {
  const session = await auth();

  if (!session?.user) {
    redirect("/admin/login?next=/admin/developer");
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
