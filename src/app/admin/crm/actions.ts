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
  convertQuoteToInvoice,
  createQuote,
  decideQuote,
  parseQuoteLines,
  sendQuote,
} from "~/server/services/crm-quotes";
import {
  activateJourney,
  addJourneyStep,
  archiveJourney,
  createJourney,
  enrollSegmentMembers,
  runJourneyTick,
} from "~/server/services/crm-journeys";
import {
  convertLeadToOpportunity,
  createLead,
  setOpportunityStage,
} from "~/server/services/crm-sales";
import {
  CONSENT_CHANNELS,
  type ConsentChannel,
  recordConsentByEmail,
} from "~/server/services/consent";
import { applyLoyaltyByEmail } from "~/server/services/loyalty";
import {
  createPriceRule,
  setPriceRuleActive,
} from "~/server/services/pricing-rules";
import { recomputeSegmentMemberships } from "~/server/services/marketing-segments";

export async function createLeadAction(formData: FormData) {
  await requireAdmin("CRM_WRITE");

  const name = stringValue(formData.get("name")).trim();
  if (!name) throw new Error("שם הליד הוא שדה חובה.");

  await createLead({
    name,
    email: optionalString(formData.get("email")),
    phone: optionalString(formData.get("phone")),
    source: optionalString(formData.get("source")),
    notes: optionalString(formData.get("notes")),
  });

  revalidatePath("/admin/crm");
}

export async function convertLeadAction(formData: FormData) {
  await requireAdmin("CRM_WRITE");

  const leadId = stringValue(formData.get("leadId"));
  if (!leadId) throw new Error("חסר ליד להמרה.");

  await convertLeadToOpportunity({
    leadId,
    title: optionalString(formData.get("title")) ?? "הזדמנות חדשה",
    amount: Number(formData.get("amount") ?? 0) || 0,
  });

  revalidatePath("/admin/crm");
}

export async function setOpportunityStageAction(formData: FormData) {
  await requireAdmin("CRM_WRITE");

  const opportunityId = stringValue(formData.get("opportunityId"));
  if (!opportunityId) throw new Error("חסרה הזדמנות לעדכון.");

  await setOpportunityStage({
    opportunityId,
    stage: stringValue(formData.get("stage")),
  });

  revalidatePath("/admin/crm");
}

export async function createQuoteAction(formData: FormData) {
  await requireAdmin("CRM_WRITE");

  const lines = parseQuoteLines(stringValue(formData.get("lines")));
  if (lines.length === 0) {
    throw new Error("יש להזין לפחות שורת הצעה אחת (תיאור | כמות | מחיר).");
  }

  const validUntil = optionalString(formData.get("validUntil"));

  await createQuote({
    customerId: optionalString(formData.get("customerId")),
    opportunityId: optionalString(formData.get("opportunityId")),
    validUntil: validUntil ? new Date(validUntil) : undefined,
    notes: optionalString(formData.get("notes")),
    lines,
  });

  revalidatePath("/admin/crm");
}

export async function sendQuoteAction(formData: FormData) {
  await requireAdmin("CRM_WRITE");

  await sendQuote(stringValue(formData.get("quoteId")));

  revalidatePath("/admin/crm");
}

export async function decideQuoteAction(formData: FormData) {
  await requireAdmin("CRM_WRITE");

  await decideQuote({
    quoteId: stringValue(formData.get("quoteId")),
    decision:
      stringValue(formData.get("decision")) === "ACCEPTED"
        ? "ACCEPTED"
        : "DECLINED",
  });

  revalidatePath("/admin/crm");
}

export async function convertQuoteToInvoiceAction(formData: FormData) {
  await requireAdmin("CRM_WRITE");

  await convertQuoteToInvoice({
    quoteId: stringValue(formData.get("quoteId")),
  });

  revalidatePath("/admin/crm");
}

export async function recomputeSegmentsAction() {
  await requireAdmin("CRM_WRITE");

  await recomputeSegmentMemberships();

  revalidatePath("/admin/crm");
}

export async function createJourneyAction(formData: FormData) {
  await requireAdmin("CRM_WRITE");

  const key = stringValue(formData.get("key")).trim();
  const name = stringValue(formData.get("name")).trim();
  if (!key || !name) throw new Error("מפתח ושם המסע הם שדות חובה.");

  await createJourney({
    key,
    name,
    description: optionalString(formData.get("description")),
    segmentId: optionalString(formData.get("segmentId")),
  });

  revalidatePath("/admin/crm");
}

export async function addJourneyStepAction(formData: FormData) {
  await requireAdmin("CRM_WRITE");

  const journeyId = stringValue(formData.get("journeyId"));
  if (!journeyId) throw new Error("חסר מסע לצעד.");

  const template = optionalString(formData.get("template"));

  await addJourneyStep({
    journeyId,
    actionType: stringValue(formData.get("actionType")) || "send_email",
    delayHours: Number(formData.get("delayHours") ?? 0) || 0,
    actionConfig: template ? { template } : undefined,
  });

  revalidatePath("/admin/crm");
}

export async function activateJourneyAction(formData: FormData) {
  await requireAdmin("CRM_WRITE");

  await activateJourney(stringValue(formData.get("journeyId")));

  revalidatePath("/admin/crm");
}

export async function enrollJourneySegmentAction(formData: FormData) {
  await requireAdmin("CRM_WRITE");

  await enrollSegmentMembers(stringValue(formData.get("journeyId")));

  revalidatePath("/admin/crm");
}

export async function archiveJourneyAction(formData: FormData) {
  await requireAdmin("CRM_WRITE");

  await archiveJourney(stringValue(formData.get("journeyId")));

  revalidatePath("/admin/crm");
}

export async function runJourneyTickAction() {
  await requireAdmin("CRM_WRITE");

  await runJourneyTick();

  revalidatePath("/admin/crm");
}

export async function recordConsentAction(formData: FormData) {
  await requireAdmin("CRM_WRITE");

  const email = stringValue(formData.get("email")).trim();
  if (!email) throw new Error('יש להזין דוא"ל לקוח.');

  const channel = stringValue(formData.get("channel"));
  if (!CONSENT_CHANNELS.includes(channel as ConsentChannel)) {
    throw new Error("ערוץ הסכמה לא תקין.");
  }

  await recordConsentByEmail({
    email,
    channel: channel as ConsentChannel,
    status: stringValue(formData.get("status")) === "REVOKED" ? "REVOKED" : "GRANTED",
    source: "admin",
  });

  revalidatePath("/admin/crm");
}

export async function applyLoyaltyAction(formData: FormData) {
  await requireAdmin("CRM_WRITE");

  const email = stringValue(formData.get("email")).trim();
  if (!email) throw new Error('יש להזין דוא"ל לקוח.');

  const points = Number(formData.get("points") ?? 0) || 0;
  if (points <= 0) throw new Error("יש להזין מספר נקודות חיובי.");

  await applyLoyaltyByEmail({
    email,
    points,
    type: stringValue(formData.get("type")) === "REDEEM" ? "REDEEM" : "EARN",
    reason: optionalString(formData.get("reason")),
  });

  revalidatePath("/admin/crm");
}

export async function createPriceRuleAction(formData: FormData) {
  await requireAdmin("CRM_WRITE");

  const code = stringValue(formData.get("code")).trim();
  const name = stringValue(formData.get("name")).trim();
  const value = Number(formData.get("value") ?? 0) || 0;
  if (!code || !name) throw new Error("קוד ושם הם שדות חובה.");
  if (value <= 0) throw new Error("ערך ההנחה חייב להיות חיובי.");

  await createPriceRule({
    code,
    name,
    type: stringValue(formData.get("type")) === "FIXED" ? "FIXED" : "PERCENT",
    value,
    minQuantity: Number(formData.get("minQuantity") ?? 1) || 1,
  });

  revalidatePath("/admin/crm");
}

export async function togglePriceRuleAction(formData: FormData) {
  await requireAdmin("CRM_WRITE");

  const ruleId = stringValue(formData.get("ruleId"));
  if (!ruleId) throw new Error("חסר מזהה חוק.");

  await setPriceRuleActive({
    ruleId,
    isActive: formData.get("isActive") === "1",
  });

  revalidatePath("/admin/crm");
}

async function requireAdmin(permission: AdminPermission) {
  const session = await auth();

  if (!session?.user) {
    redirect("/admin/login?next=/admin/crm");
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
