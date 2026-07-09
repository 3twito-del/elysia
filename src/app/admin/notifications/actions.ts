"use server";

import { revalidatePath } from "next/cache";

import { auth } from "~/server/auth";
import {
  getAdminFromSession,
  hasAdminPermission,
} from "~/server/auth/admin-access";
import { acknowledgeOperationalAlert } from "~/server/services/operational-alerts";
import {
  createPushCampaign,
  enqueuePushCampaign,
  pushCampaignInputSchema,
} from "~/server/services/push";

export type AdminPushCampaignState = {
  message?: string;
  ok?: boolean;
};

function getFormString(formData: FormData, name: string) {
  const value = formData.get(name);

  return typeof value === "string" ? value.trim() : "";
}

export async function createPushCampaignAction(
  _state: AdminPushCampaignState,
  formData: FormData,
): Promise<AdminPushCampaignState> {
  const session = await auth();
  const admin = session ? await getAdminFromSession(session) : null;

  if (!admin || !hasAdminPermission(admin, "SYSTEM_CONFIG")) {
    return { ok: false, message: "אין הרשאת SYSTEM_CONFIG." };
  }

  const scheduledAt = getFormString(formData, "scheduledAt");
  const segment = getFormString(formData, "segment");
  const parsed = pushCampaignInputSchema.safeParse({
    body: formData.get("body"),
    scheduledAt: scheduledAt.length > 0 ? scheduledAt : undefined,
    segment: segment.length > 0 ? segment : "MARKETING_OPT_IN",
    targetUrl: formData.get("targetUrl"),
    title: formData.get("title"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "נתוני הקמפיין לא תקינים.",
    };
  }

  const campaign = await createPushCampaign(parsed.data);

  if (formData.get("sendNow") === "on" || parsed.data.scheduledAt) {
    await enqueuePushCampaign(
      campaign.id,
      formData.get("sendNow") === "on" ? undefined : parsed.data.scheduledAt,
    );
  }

  revalidatePath("/admin/notifications");

  return {
    ok: true,
    message:
      formData.get("sendNow") === "on"
        ? "הקמפיין נוצר ונשלח לעיבוד."
        : "הקמפיין נשמר.",
  };
}

export async function acknowledgeOperationalAlertAction(formData: FormData) {
  const session = await auth();
  const admin = session ? await getAdminFromSession(session) : null;

  if (!admin || !hasAdminPermission(admin, "SYSTEM_CONFIG")) {
    return;
  }

  const alertId = getFormString(formData, "alertId");

  if (!alertId) return;

  await acknowledgeOperationalAlert({ alertId, adminUserId: admin.id });
  revalidatePath("/admin/notifications");
}

export async function enqueuePushCampaignAction(formData: FormData) {
  const session = await auth();
  const admin = session ? await getAdminFromSession(session) : null;

  if (!admin || !hasAdminPermission(admin, "SYSTEM_CONFIG")) {
    return;
  }

  const campaignId = getFormString(formData, "campaignId");

  if (!campaignId) return;

  await enqueuePushCampaign(campaignId);
  revalidatePath("/admin/notifications");
}
