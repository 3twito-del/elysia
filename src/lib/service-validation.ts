import { z } from "zod";

import { optionalTrimmedString } from "./form-validation";

export const serviceRequestStatuses = [
  "NEW",
  "IN_REVIEW",
  "WAITING_FOR_CUSTOMER",
  "RESOLVED",
  "CLOSED",
] as const;

export const serviceContactPreferences = [
  "ANY",
  "EMAIL",
  "PHONE",
  "WHATSAPP",
] as const;

export const serviceRequestAcceptedFileTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
] as const;

export const maxServiceRequestFiles = 5;
export const maxServiceRequestFileBytes = 10 * 1024 * 1024;

const requiredText = (message: string, maxLength: number) =>
  z.string().trim().min(1, message).max(maxLength, "הטקסט ארוך מדי.");

const requiredId = (message = "חסר מזהה לביצוע הפעולה.") =>
  z.string().trim().min(1, message).max(128, "המזהה ארוך מדי.");

const email = z
  .string()
  .trim()
  .email("יש להזין כתובת אימייל תקינה.")
  .toLowerCase();

const phone = z
  .string()
  .trim()
  .min(7, "יש להזין מספר טלפון תקין.")
  .max(32, "מספר הטלפון ארוך מדי.");

export const publicServiceRequestInputSchema = z.object({
  topicSlug: requiredText("יש לבחור נושא פנייה.", 80),
  name: requiredText("יש להזין שם מלא.", 120),
  phone,
  email,
  orderNumber: optionalTrimmedString(80, "מספר ההזמנה ארוך מדי."),
  productReference: optionalTrimmedString(240, "פרטי המוצר ארוכים מדי."),
  preferredContact: z.enum(serviceContactPreferences).default("ANY"),
  preferredContactTime: optionalTrimmedString(160, "זמן החזרה ארוך מדי."),
  message: requiredText("יש לכתוב בקצרה במה נוכל לעזור.", 2_000),
});

export const updateServiceRequestInputSchema = z.object({
  serviceRequestId: requiredId("חסרה פנייה לעדכון."),
  status: z.enum(serviceRequestStatuses),
  adminNotes: optionalTrimmedString(1_500, "הערות הטיפול ארוכות מדי."),
});

export const updateServiceSettingsInputSchema = z.object({
  phoneE164: z
    .string()
    .trim()
    .min(8, "יש להזין טלפון בינלאומי תקין.")
    .max(32, "הטלפון ארוך מדי."),
  displayPhone: phone,
  serviceEmail: email,
  physicalBranchesEnabled: z.boolean().default(false),
});

export const upsertContactTopicInputSchema = z.object({
  id: requiredId().optional(),
  slug: z
    .string()
    .trim()
    .min(2, "יש להזין slug תקין.")
    .max(80, "ה-slug ארוך מדי.")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "ה-slug חייב להיות באנגלית קטנה עם מקפים.",
    ),
  label: requiredText("יש להזין שם נושא.", 120),
  description: optionalTrimmedString(300, "תיאור הנושא ארוך מדי."),
  recipientEmail: z.preprocess(
    (value) =>
      typeof value === "string" && value.trim().length === 0
        ? undefined
        : value,
    email.optional(),
  ),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).max(10_000).default(0),
});

export const upsertServiceBranchInputSchema = z.object({
  id: requiredId().optional(),
  slug: z
    .string()
    .trim()
    .min(2, "יש להזין slug תקין.")
    .max(80, "ה-slug ארוך מדי.")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "ה-slug חייב להיות באנגלית קטנה עם מקפים.",
    ),
  name: requiredText("יש להזין שם מיקום.", 160),
  address: requiredText("יש להזין כתובת.", 240),
  city: requiredText("יש להזין עיר.", 120),
  phone,
  whatsapp: optionalTrimmedString(32, "מספר הוואטסאפ ארוך מדי."),
  openingHoursText: requiredText("יש להזין שעות פעילות.", 500),
  servicesText: requiredText("יש להזין לפחות שירות אחד.", 500),
  isApproved: z.boolean().default(false),
  isPublic: z.boolean().default(false),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).max(10_000).default(0),
});

export function getServiceRequestStatusLabel(status: string) {
  switch (status) {
    case "NEW":
      return "חדשה";
    case "IN_REVIEW":
      return "בטיפול";
    case "WAITING_FOR_CUSTOMER":
      return "ממתינה ללקוח";
    case "RESOLVED":
      return "טופלה";
    case "CLOSED":
      return "נסגרה";
    default:
      return status;
  }
}

export function getServiceContactPreferenceLabel(preference: string) {
  switch (preference) {
    case "EMAIL":
      return "אימייל";
    case "PHONE":
      return "טלפון";
    case "WHATSAPP":
      return "וואטסאפ";
    case "ANY":
      return "הדרך הנוחה לצוות";
    default:
      return preference;
  }
}
