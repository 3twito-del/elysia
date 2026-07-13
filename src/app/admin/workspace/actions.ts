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
  createApprovalRequest,
  decideApprovalRequest,
} from "~/server/services/approvals";
import {
  archiveDocument,
  createDocument,
  requestSignature,
  signDocument,
} from "~/server/services/document-management";
import {
  createArticle,
  setArticleStatus,
} from "~/server/services/knowledge-base";
import {
  createContract,
  setContractStatus,
} from "~/server/services/contracts";
import {
  createComplianceItem,
  setComplianceStatus,
} from "~/server/services/grc";
import {
  cancelBooking,
  createBooking,
  createResource,
} from "~/server/services/resource-booking";

export async function createArticleAction(formData: FormData) {
  const admin = await requireAdmin("WORKSPACE_WRITE");

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
  await requireAdmin("WORKSPACE_WRITE");

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
  const admin = await requireAdmin("WORKSPACE_WRITE");

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
  await requireAdmin("WORKSPACE_WRITE");

  const announcementId = stringValue(formData.get("announcementId"));
  if (!announcementId) throw new Error("חסר מזהה הודעה.");

  await setAnnouncementPinned({
    announcementId,
    isPinned: formData.get("isPinned") === "1",
  });

  revalidatePath("/admin/workspace");
}

export async function expireAnnouncementAction(formData: FormData) {
  await requireAdmin("WORKSPACE_WRITE");

  const announcementId = stringValue(formData.get("announcementId"));
  if (!announcementId) throw new Error("חסר מזהה הודעה.");

  await expireAnnouncement({ announcementId });

  revalidatePath("/admin/workspace");
}

export async function createDocumentAction(formData: FormData) {
  const admin = await requireAdmin("WORKSPACE_WRITE");

  const name = stringValue(formData.get("name")).trim();
  const url = stringValue(formData.get("url")).trim();
  if (!name || !url) throw new Error("שם וקישור הם שדות חובה.");

  await createDocument({
    name,
    url,
    category: optionalString(formData.get("category")),
    entityType: optionalString(formData.get("entityType")),
    entityId: optionalString(formData.get("entityId")),
    uploadedById: admin.id,
  });

  revalidatePath("/admin/workspace");
}

export async function requestSignatureAction(formData: FormData) {
  await requireAdmin("WORKSPACE_WRITE");

  const documentId = stringValue(formData.get("documentId"));
  if (!documentId) throw new Error("חסר מזהה מסמך.");

  await requestSignature({ documentId });

  revalidatePath("/admin/workspace");
}

export async function signDocumentAction(formData: FormData) {
  const admin = await requireAdmin("WORKSPACE_WRITE");

  const documentId = stringValue(formData.get("documentId"));
  if (!documentId) throw new Error("חסר מזהה מסמך.");

  await signDocument({ documentId, signedBy: admin.name });

  revalidatePath("/admin/workspace");
}

export async function archiveDocumentAction(formData: FormData) {
  await requireAdmin("WORKSPACE_WRITE");

  const documentId = stringValue(formData.get("documentId"));
  if (!documentId) throw new Error("חסר מזהה מסמך.");

  await archiveDocument({ documentId });

  revalidatePath("/admin/workspace");
}

export async function createApprovalRequestAction(formData: FormData) {
  const admin = await requireAdmin("WORKSPACE_WRITE");

  const title = stringValue(formData.get("title")).trim();
  if (!title) throw new Error("חסרה כותרת לבקשה.");

  const amountRaw = stringValue(formData.get("amount")).trim();

  await createApprovalRequest({
    title,
    amount: amountRaw ? Number(amountRaw) || 0 : undefined,
    notes: optionalString(formData.get("notes")),
    requestedById: admin.id,
  });

  revalidatePath("/admin/workspace");
}

export async function decideApprovalRequestAction(formData: FormData) {
  const admin = await requireAdmin("WORKSPACE_WRITE");

  const requestId = stringValue(formData.get("requestId"));
  if (!requestId) throw new Error("חסר מזהה בקשה.");

  await decideApprovalRequest({
    requestId,
    decision:
      stringValue(formData.get("decision")) === "APPROVED"
        ? "APPROVED"
        : "REJECTED",
    decidedById: admin.id,
  });

  revalidatePath("/admin/workspace");
}

export async function createResourceAction(formData: FormData) {
  await requireAdmin("WORKSPACE_WRITE");

  const name = stringValue(formData.get("name")).trim();
  if (!name) throw new Error("שם המשאב הוא שדה חובה.");

  const kindRaw = stringValue(formData.get("kind"));
  const kind =
    kindRaw === "EQUIPMENT" || kindRaw === "STAFF" ? kindRaw : "ROOM";

  await createResource({ name, kind });

  revalidatePath("/admin/workspace");
}

export async function createBookingAction(formData: FormData) {
  const admin = await requireAdmin("WORKSPACE_WRITE");

  const resourceId = stringValue(formData.get("resourceId"));
  const title = stringValue(formData.get("title")).trim();
  const startsAt = stringValue(formData.get("startsAt"));
  const endsAt = stringValue(formData.get("endsAt"));
  if (!resourceId || !title) throw new Error("יש לבחור משאב ולהזין כותרת.");
  if (!startsAt || !endsAt) throw new Error("יש להזין שעת התחלה וסיום.");

  await createBooking({
    resourceId,
    title,
    startsAt: new Date(startsAt),
    endsAt: new Date(endsAt),
    bookedById: admin.id,
  });

  revalidatePath("/admin/workspace");
}

export async function cancelBookingAction(formData: FormData) {
  await requireAdmin("WORKSPACE_WRITE");

  const bookingId = stringValue(formData.get("bookingId"));
  if (!bookingId) throw new Error("חסר מזהה שיבוץ.");

  await cancelBooking({ bookingId });

  revalidatePath("/admin/workspace");
}

export async function createComplianceItemAction(formData: FormData) {
  const admin = await requireAdmin("WORKSPACE_WRITE");

  const title = stringValue(formData.get("title")).trim();
  if (!title) throw new Error("כותרת הפריט היא שדה חובה.");

  const severityRaw = stringValue(formData.get("severity"));
  const severity =
    severityRaw === "LOW" ||
    severityRaw === "HIGH" ||
    severityRaw === "CRITICAL"
      ? severityRaw
      : "MEDIUM";
  const dueAt = optionalString(formData.get("dueAt"));

  await createComplianceItem({
    title,
    category: optionalString(formData.get("category")),
    severity,
    dueAt: dueAt ? new Date(dueAt) : undefined,
    ownerAdminUserId: admin.id,
  });

  revalidatePath("/admin/workspace");
}

export async function setComplianceStatusAction(formData: FormData) {
  await requireAdmin("WORKSPACE_WRITE");

  const itemId = stringValue(formData.get("itemId"));
  const status = stringValue(formData.get("status"));
  if (!itemId) throw new Error("חסר מזהה פריט.");
  if (
    status !== "OPEN" &&
    status !== "IN_PROGRESS" &&
    status !== "RESOLVED" &&
    status !== "ACCEPTED"
  ) {
    throw new Error("סטטוס לא תקין.");
  }

  await setComplianceStatus({ itemId, status });

  revalidatePath("/admin/workspace");
}

export async function createContractAction(formData: FormData) {
  await requireAdmin("WORKSPACE_WRITE");

  const title = stringValue(formData.get("title")).trim();
  const counterparty = stringValue(formData.get("counterparty")).trim();
  if (!title || !counterparty) throw new Error("כותרת וצד נגדי הם שדות חובה.");

  const valueRaw = stringValue(formData.get("value")).trim();
  const endsAt = optionalString(formData.get("endsAt"));

  await createContract({
    title,
    counterparty,
    type: optionalString(formData.get("type")),
    value: valueRaw ? Number(valueRaw) || 0 : undefined,
    endsAt: endsAt ? new Date(endsAt) : undefined,
  });

  revalidatePath("/admin/workspace");
}

export async function setContractStatusAction(formData: FormData) {
  await requireAdmin("WORKSPACE_WRITE");

  const contractId = stringValue(formData.get("contractId"));
  const status = stringValue(formData.get("status"));
  if (!contractId) throw new Error("חסר מזהה חוזה.");
  if (
    status !== "DRAFT" &&
    status !== "ACTIVE" &&
    status !== "EXPIRED" &&
    status !== "TERMINATED"
  ) {
    throw new Error("סטטוס לא תקין.");
  }

  await setContractStatus({ contractId, status });

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
