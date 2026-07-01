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
  addBlock,
  createLandingPage,
  deleteBlock,
  moveBlock,
  setPageStatus,
} from "~/server/services/landing-pages";

export async function createPageAction(formData: FormData) {
  await requireAdmin("BLOG_WRITE");

  const title = stringValue(formData.get("title")).trim();
  if (!title) throw new Error("כותרת העמוד היא שדה חובה.");

  const page = await createLandingPage({ title });

  redirect(`/admin/pages?page=${page.id}`);
}

export async function setPageStatusAction(formData: FormData) {
  await requireAdmin("BLOG_WRITE");

  const pageId = stringValue(formData.get("pageId"));
  const status = stringValue(formData.get("status"));
  if (!pageId) throw new Error("חסר מזהה עמוד.");

  await setPageStatus({ pageId, status });

  revalidatePath("/admin/pages");
}

export async function addBlockAction(formData: FormData) {
  await requireAdmin("BLOG_WRITE");

  const pageId = stringValue(formData.get("pageId"));
  if (!pageId) throw new Error("חסר מזהה עמוד.");

  await addBlock({
    pageId,
    type: stringValue(formData.get("type")) || "TEXT",
    heading: optionalString(formData.get("heading")),
    body: optionalString(formData.get("body")),
    imageUrl: optionalString(formData.get("imageUrl")),
    linkUrl: optionalString(formData.get("linkUrl")),
  });

  redirect(`/admin/pages?page=${pageId}`);
}

export async function moveBlockAction(formData: FormData) {
  await requireAdmin("BLOG_WRITE");

  const blockId = stringValue(formData.get("blockId"));
  const pageId = stringValue(formData.get("pageId"));
  if (!blockId) throw new Error("חסר מזהה בלוק.");

  await moveBlock({
    blockId,
    direction: formData.get("direction") === "up" ? "up" : "down",
  });

  redirect(`/admin/pages?page=${pageId}`);
}

export async function deleteBlockAction(formData: FormData) {
  await requireAdmin("BLOG_WRITE");

  const blockId = stringValue(formData.get("blockId"));
  const pageId = stringValue(formData.get("pageId"));
  if (!blockId) throw new Error("חסר מזהה בלוק.");

  await deleteBlock({ blockId });

  redirect(`/admin/pages?page=${pageId}`);
}

async function requireAdmin(permission: AdminPermission) {
  const session = await auth();

  if (!session?.user) {
    redirect("/admin/login?next=/admin/pages");
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
