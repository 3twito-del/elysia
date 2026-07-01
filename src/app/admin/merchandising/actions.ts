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
  createBanner,
  deleteBanner,
  setBannerActive,
} from "~/server/services/merchandising";

export async function createBannerAction(formData: FormData) {
  await requireAdmin("CATALOG_WRITE");

  const title = stringValue(formData.get("title")).trim();
  if (!title) throw new Error("כותרת הבאנר היא שדה חובה.");

  const startsAt = optionalString(formData.get("startsAt"));
  const endsAt = optionalString(formData.get("endsAt"));

  await createBanner({
    title,
    placement: stringValue(formData.get("placement")) || "HOME_HERO",
    imageUrl: optionalString(formData.get("imageUrl")),
    linkUrl: optionalString(formData.get("linkUrl")),
    priority: Number(stringValue(formData.get("priority"))) || 100,
    startsAt: startsAt ? new Date(startsAt) : undefined,
    endsAt: endsAt ? new Date(endsAt) : undefined,
  });

  revalidatePath("/admin/merchandising");
}

export async function toggleBannerAction(formData: FormData) {
  await requireAdmin("CATALOG_WRITE");

  const bannerId = stringValue(formData.get("bannerId"));
  if (!bannerId) throw new Error("חסר מזהה באנר.");

  await setBannerActive({
    bannerId,
    isActive: formData.get("isActive") === "1",
  });

  revalidatePath("/admin/merchandising");
}

export async function deleteBannerAction(formData: FormData) {
  await requireAdmin("CATALOG_WRITE");

  const bannerId = stringValue(formData.get("bannerId"));
  if (!bannerId) throw new Error("חסר מזהה באנר.");

  await deleteBanner({ bannerId });

  revalidatePath("/admin/merchandising");
}

async function requireAdmin(permission: AdminPermission) {
  const session = await auth();

  if (!session?.user) {
    redirect("/admin/login?next=/admin/merchandising");
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
