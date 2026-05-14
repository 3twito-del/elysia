import { z } from "zod";

import { optionalTrimmedString } from "./form-validation";

const requiredId = (message = "חסר מזהה לביצוע הפעולה.") =>
  z.string().trim().min(1, message);

const requiredText = (message: string, maxLength: number) =>
  z.string().trim().min(1, message).max(maxLength, "הטקסט ארוך מדי.");

const positiveNumber = (message: string) =>
  z.number({ invalid_type_error: message }).positive(message).finite(message);

const nonnegativeInteger = (message: string) =>
  z.number({ invalid_type_error: message }).int(message).nonnegative(message);

const optionalUrl = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim().length === 0 ? undefined : value,
  z
    .string()
    .trim()
    .url("יש להזין כתובת תמונה תקינה.")
    .max(2_048, "כתובת התמונה ארוכה מדי.")
    .optional(),
);

export const createAdminProductInputSchema = z.object({
  slug: z.string().trim().min(3, "יש להזין slug תקין.").max(120),
  sku: z.string().trim().min(3, "יש להזין מק״ט מוצר.").max(80),
  name: z.string().trim().min(2, "יש להזין שם מוצר.").max(160),
  shortDescription: z
    .string()
    .trim()
    .min(5, "יש להזין תיאור קצר.")
    .max(240, "התיאור הקצר ארוך מדי."),
  description: z
    .string()
    .trim()
    .min(5, "יש להזין תיאור מלא.")
    .max(1500, "התיאור המלא ארוך מדי."),
  categoryId: requiredId("יש לבחור קטגוריה."),
  materialId: requiredId("יש לבחור חומר."),
  stoneId: requiredId().optional(),
  basePrice: positiveNumber("יש להזין מחיר גדול מאפס."),
  imageUrl: optionalUrl,
  variantSku: z.string().trim().min(3, "יש להזין מק״ט וריאציה.").max(100),
  variantName: z.string().trim().min(1, "יש להזין שם וריאציה.").max(120),
  branchInventory: z
    .array(
      z.object({
        branchId: requiredId("חסר סניף מלאי."),
        quantity: nonnegativeInteger("יש להזין מלאי תקין."),
        safetyStock: nonnegativeInteger("יש להזין מלאי ביטחון תקין.").default(
          0,
        ),
      }),
    )
    .default([]),
});

export const updateAdminProductStatusInputSchema = z.object({
  productId: requiredId("חסר מוצר לעדכון."),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]),
});

export const updateAdminInventoryInputSchema = z.object({
  variantId: requiredId("חסרה וריאציה לעדכון מלאי."),
  branchId: requiredId("חסר סניף לעדכון מלאי."),
  quantity: nonnegativeInteger("יש להזין מלאי תקין."),
  safetyStock: nonnegativeInteger("יש להזין מלאי ביטחון תקין.").default(0),
});

export const createAdminCouponClientInputSchema = z
  .object({
    code: z.string().trim().min(3, "׳™׳© ׳׳”׳–׳™׳ ׳§׳•׳“ ׳§׳•׳₪׳•׳.").max(64),
    description: optionalTrimmedString(240, "׳×׳™׳׳•׳¨ ׳”׳§׳•׳₪׳•׳ ׳׳¨׳•׳ ׳׳“׳™."),
    percentOff: z.number().int().min(1).max(100).optional(),
    amountOff: z.number().positive().optional(),
    endsAt: z.coerce.date().optional(),
    maxUses: z.number().int().positive().optional(),
  })
  .refine(
    (input) => input.percentOff !== undefined || input.amountOff !== undefined,
    {
      message: "׳™׳© ׳׳”׳–׳™׳ ׳׳—׳•׳– ׳”׳ ׳—׳” ׳׳• ׳¡׳›׳•׳ ׳”׳ ׳—׳”.",
      path: ["percentOff"],
    },
  );

export const createAdminCouponInputSchema = z
  .object({
    code: z.string().trim().min(3, "יש להזין קוד קופון.").max(64),
    description: optionalTrimmedString(240, "תיאור הקופון ארוך מדי."),
    percentOff: z.number().int().min(1).max(100).optional(),
    amountOff: z.number().positive().optional(),
    startsAt: z.coerce.date().default(() => new Date()),
    endsAt: z.coerce.date().optional(),
    maxUses: z.number().int().positive().optional(),
  })
  .refine(
    (input) => input.percentOff !== undefined || input.amountOff !== undefined,
    {
      message: "יש להזין אחוז הנחה או סכום הנחה.",
      path: ["percentOff"],
    },
  );

export const updateAdminCouponStatusInputSchema = z.object({
  couponId: requiredId("חסר קופון לעדכון."),
  isActive: z.boolean(),
});

export const upsertAdminShipmentInputSchema = z.object({
  orderId: requiredId("חסרה הזמנה לעדכון משלוח."),
  provider: optionalTrimmedString(80, "שם ספק המשלוח ארוך מדי."),
  tracking: optionalTrimmedString(120, "מספר המעקב ארוך מדי."),
  status: requiredText("יש לבחור סטטוס משלוח.", 80).default("SHIPPED"),
});

export const refundAdminOrderInputSchema = z.object({
  orderId: requiredId("חסרה הזמנה לזיכוי."),
  returnRequestId: requiredId().optional(),
  reason: z.string().trim().min(3, "יש להזין סיבת זיכוי.").max(500),
  notes: optionalTrimmedString(1000, "הערות הזיכוי ארוכות מדי."),
  restockItems: z.boolean().default(false),
});

export const updateAdminAppointmentStatusInputSchema = z.object({
  appointmentId: requiredId("חסרה פגישה לעדכון."),
  status: z.enum(["REQUESTED", "CONFIRMED", "COMPLETED", "CANCELLED"]),
  notes: optionalTrimmedString(500, "הערות הפגישה ארוכות מדי."),
});
