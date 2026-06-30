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
  createAffiliatePartner,
  recordReferral,
  setPartnerStatus,
  setReferralStatus,
} from "~/server/services/affiliates";
import {
  createCampaign,
  recordCampaignResults,
  setCampaignStatus,
} from "~/server/services/marketing-campaigns";

export async function createCampaignAction(formData: FormData) {
  await requireAdmin("ERP_WRITE");

  const name = stringValue(formData.get("name")).trim();
  if (!name) throw new Error("שם הקמפיין הוא שדה חובה.");

  const budgetRaw = stringValue(formData.get("budget")).trim();

  await createCampaign({
    name,
    channel: stringValue(formData.get("channel")) || "OTHER",
    budget: budgetRaw ? Number(budgetRaw) || 0 : undefined,
  });

  revalidatePath("/admin/marketing");
}

export async function recordCampaignResultsAction(formData: FormData) {
  await requireAdmin("ERP_WRITE");

  const campaignId = stringValue(formData.get("campaignId"));
  if (!campaignId) throw new Error("חסר מזהה קמפיין.");

  await recordCampaignResults({
    campaignId,
    spend: Number(stringValue(formData.get("spend"))) || 0,
    revenue: Number(stringValue(formData.get("revenue"))) || 0,
  });

  revalidatePath("/admin/marketing");
}

export async function setCampaignStatusAction(formData: FormData) {
  await requireAdmin("ERP_WRITE");

  const campaignId = stringValue(formData.get("campaignId"));
  const status = stringValue(formData.get("status"));
  if (!campaignId) throw new Error("חסר מזהה קמפיין.");

  await setCampaignStatus({ campaignId, status });

  revalidatePath("/admin/marketing");
}

export async function createAffiliatePartnerAction(formData: FormData) {
  await requireAdmin("ERP_WRITE");

  const name = stringValue(formData.get("name")).trim();
  if (!name) throw new Error("שם השותף הוא שדה חובה.");

  await createAffiliatePartner({
    name,
    code: optionalString(formData.get("code")),
    commissionPercent: Number(stringValue(formData.get("commissionPercent"))) || 0,
  });

  revalidatePath("/admin/marketing");
}

export async function setPartnerStatusAction(formData: FormData) {
  await requireAdmin("ERP_WRITE");

  const partnerId = stringValue(formData.get("partnerId"));
  if (!partnerId) throw new Error("חסר מזהה שותף.");

  await setPartnerStatus({
    partnerId,
    status: formData.get("status") === "SUSPENDED" ? "SUSPENDED" : "ACTIVE",
  });

  revalidatePath("/admin/marketing");
}

export async function recordReferralAction(formData: FormData) {
  await requireAdmin("ERP_WRITE");

  const partnerId = stringValue(formData.get("partnerId"));
  const amountRaw = stringValue(formData.get("amount")).trim();
  if (!partnerId || !amountRaw) throw new Error("יש לבחור שותף ולהזין סכום.");

  await recordReferral({
    partnerId,
    amount: Number(amountRaw) || 0,
    orderId: optionalString(formData.get("orderId")),
  });

  revalidatePath("/admin/marketing");
}

export async function setReferralStatusAction(formData: FormData) {
  await requireAdmin("ERP_WRITE");

  const referralId = stringValue(formData.get("referralId"));
  if (!referralId) throw new Error("חסר מזהה הפניה.");

  await setReferralStatus({
    referralId,
    status: formData.get("status") === "PAID" ? "PAID" : "APPROVED",
  });

  revalidatePath("/admin/marketing");
}

async function requireAdmin(permission: AdminPermission) {
  const session = await auth();

  if (!session?.user) {
    redirect("/admin/login?next=/admin/marketing");
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
