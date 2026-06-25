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
  createAnnouncement,
  expireAnnouncement,
  setAnnouncementPinned,
} from "~/server/services/announcements";
import {
  createArticle,
  setArticleStatus,
} from "~/server/services/knowledge-base";

export async function createArticleAction(formData: FormData) {
  const admin = await requireAdmin("ERP_WRITE");

  const title = stringValue(formData.get("title")).trim();
  const body = stringValue(formData.get("body")).trim();
  if (!title || !body) throw new Error("כותרת ותוכן הם שדות חובה.");

  await createArticle({
    title,
    body,
    category: optionalString(formData.get("category")),
    authorAdminUserId: admin.id,
  });

  revalidatePath("/admin/workspace");
}

export async function setArticleStatusAction(formData: FormData) {
  await requireAdmin("ERP_WRITE");

  const articleId = stringValue(formData.get("articleId"));
  const status = stringValue(formData.get("status"));
  if (!articleId) throw new Error("חסר מזהה מאמר.");
  if (status !== "DRAFT" && status !== "PUBLISHED" && status !== "ARCHIVED") {
    throw new Error("סטטוס לא תקין.");
  }

  await setArticleStatus({ articleId, status });

  revalidatePath("/admin/workspace");
}

export async function createAnnouncementAction(formData: FormData) {
  const admin = await requireAdmin("ERP_WRITE");

  const title = stringValue(formData.get("title")).trim();
  const body = stringValue(formData.get("body")).trim();
  if (!title || !body) throw new Error("כותרת ותוכן הם שדות חובה.");

  const severityRaw = stringValue(formData.get("severity"));
  const severity =
    severityRaw === "WARNING" || severityRaw === "CRITICAL"
      ? severityRaw
      : "INFO";

  await createAnnouncement({
    title,
    body,
    severity,
    isPinned: formData.get("isPinned") === "1",
    authorAdminUserId: admin.id,
  });

  revalidatePath("/admin/workspace");
}

export async function pinAnnouncementAction(formData: FormData) {
  await requireAdmin("ERP_WRITE");

  const announcementId = stringValue(formData.get("announcementId"));
  if (!announcementId) throw new Error("חסר מזהה הודעה.");

  await setAnnouncementPinned({
    announcementId,
    isPinned: formData.get("isPinned") === "1",
  });

  revalidatePath("/admin/workspace");
}

export async function expireAnnouncementAction(formData: FormData) {
  await requireAdmin("ERP_WRITE");

  const announcementId = stringValue(formData.get("announcementId"));
  if (!announcementId) throw new Error("חסר מזהה הודעה.");

  await expireAnnouncement({ announcementId });

  revalidatePath("/admin/workspace");
}

async function requireAdmin(permission: AdminPermission) {
  const session = await auth();

  if (!session?.user) {
    redirect("/admin/login?next=/admin/workspace");
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
