import { z } from "zod";

import { optionalTrimmedString } from "./form-validation";

const requiredId = (message = "חסר מזהה לביצוע הפעולה.") =>
  z.string().trim().min(1, message).max(128, "המזהה ארוך מדי.");

const requiredText = (message: string, maxLength: number) =>
  z.string().trim().min(1, message).max(maxLength, "הטקסט ארוך מדי.");

const positiveNumber = (message: string) =>
  z.number({ error: message }).positive(message).finite(message);

const nonnegativeInteger = (message: string) =>
  z.number({ error: message }).int(message).nonnegative(message);

const productAvailabilityModes = [
  "READY_TO_ORDER",
  "MADE_TO_ORDER",
  "CONSULTATION",
] as const;

const commerceHighlights = z
  .array(z.string().trim().min(1).max(80, "שורת הבטחת מסחר ארוכה מדי."))
  .max(4, "ניתן להציג עד ארבע הבטחות מסחר.")
  .default([]);

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

const productTruthFields = {
  countryOfManufacture: optionalTrimmedString(120, "מדינת הייצור ארוכה מדי."),
  manufacturerOrImporter: optionalTrimmedString(
    240,
    "פרטי היצרן או היבואן ארוכים מדי.",
  ),
  materialDetails: optionalTrimmedString(500, "פרטי החומר ארוכים מדי."),
  measurements: optionalTrimmedString(500, "פרטי המידות ארוכים מדי."),
  stoneDetails: optionalTrimmedString(500, "פרטי האבן ארוכים מדי."),
  factSourceReference: optionalTrimmedString(500, "אסמכתת העובדות ארוכה מדי."),
  policySourceReference: optionalTrimmedString(
    500,
    "אסמכתת המדיניות ארוכה מדי.",
  ),
  verifyFacts: z.boolean().default(false),
  verifyPolicies: z.boolean().default(false),
};

type ProductVerificationInput = {
  careInstructions?: string;
  countryOfManufacture?: string;
  deliveryPromise?: string;
  factSourceReference?: string;
  manufacturerOrImporter?: string;
  materialDetails?: string;
  measurements?: string;
  policySourceReference?: string;
  returnPolicy?: string;
  verifyFacts?: boolean;
  verifyPolicies?: boolean;
  warranty?: string;
};

function validateProductVerification(
  input: ProductVerificationInput,
  context: z.RefinementCtx,
) {
  if (input.verifyFacts) {
    for (const field of [
      "countryOfManufacture",
      "manufacturerOrImporter",
      "materialDetails",
      "measurements",
      "factSourceReference",
    ] as const) {
      if (!input[field]) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "נדרש ערך מלא לפני אימות עובדות המוצר.",
          path: [field],
        });
      }
    }
  }

  if (input.verifyPolicies) {
    for (const field of [
      "deliveryPromise",
      "returnPolicy",
      "careInstructions",
      "warranty",
      "policySourceReference",
    ] as const) {
      if (!input[field]) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "נדרש ערך מלא לפני אימות מדיניות המוצר.",
          path: [field],
        });
      }
    }
  }
}

export const createAdminProductInputSchema = z
  .object({
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
    compareAt: z.number().positive("יש להזין מחיר לפני הנחה תקין.").optional(),
    availabilityMode: z
      .enum(productAvailabilityModes)
      .default("READY_TO_ORDER"),
    commerceHighlights,
    deliveryPromise: optionalTrimmedString(160, "הבטחת המשלוח ארוכה מדי."),
    returnPolicy: optionalTrimmedString(220, "מדיניות ההחזרה ארוכה מדי."),
    careInstructions: optionalTrimmedString(500, "הנחיות הטיפול ארוכות מדי."),
    warranty: optionalTrimmedString(300, "טקסט האחריות ארוך מדי."),
    ...productTruthFields,
    imageUrl: optionalUrl,
    variantSku: z.string().trim().min(3, "יש להזין מק״ט וריאציה.").max(100),
    variantName: z.string().trim().min(1, "יש להזין שם וריאציה.").max(120),
    variantSize: optionalTrimmedString(80, "מידת הווריאציה ארוכה מדי."),
    variantMetalColor: optionalTrimmedString(80, "גוון המתכת ארוך מדי."),
    variantStoneColor: optionalTrimmedString(80, "גוון האבן ארוך מדי."),
    branchInventory: z
      .array(
        z.object({
          branchId: requiredId("חסר ערוץ מלאי."),
          quantity: nonnegativeInteger("יש להזין מלאי תקין."),
          safetyStock: nonnegativeInteger("יש להזין מלאי ביטחון תקין.").default(
            0,
          ),
        }),
      )
      .default([]),
  })
  .refine(
    (input) =>
      input.compareAt === undefined || input.compareAt > input.basePrice,
    {
      message: "מחיר לפני הנחה חייב להיות גבוה ממחיר המכירה.",
      path: ["compareAt"],
    },
  )
  .superRefine(validateProductVerification);

export const updateAdminProductStatusInputSchema = z.object({
  productId: requiredId("חסר מוצר לעדכון."),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]),
});

export const updateAdminProductCommerceInputSchema = z
  .object({
    productId: requiredId("חסר מוצר לעדכון."),
    variantId: requiredId("חסרה וריאציה לעדכון.").optional(),
    availabilityMode: z.enum(productAvailabilityModes),
    commerceHighlights,
    deliveryPromise: optionalTrimmedString(160, "הבטחת המשלוח ארוכה מדי."),
    returnPolicy: optionalTrimmedString(220, "מדיניות ההחזרה ארוכה מדי."),
    careInstructions: optionalTrimmedString(500, "הנחיות הטיפול ארוכות מדי."),
    warranty: optionalTrimmedString(300, "טקסט האחריות ארוך מדי."),
    ...productTruthFields,
    compareAt: z.number().positive("יש להזין מחיר לפני הנחה תקין.").optional(),
    variantSize: optionalTrimmedString(80, "מידת הווריאציה ארוכה מדי."),
    variantMetalColor: optionalTrimmedString(80, "גוון המתכת ארוך מדי."),
    variantStoneColor: optionalTrimmedString(80, "גוון האבן ארוך מדי."),
  })
  .refine(
    (input) => input.compareAt === undefined || Boolean(input.variantId),
    {
      message: "יש לבחור וריאציה לעדכון מחיר לפני הנחה.",
      path: ["compareAt"],
    },
  )
  .superRefine(validateProductVerification);

export const updateAdminInventoryInputSchema = z.object({
  variantId: requiredId("חסרה וריאציה לעדכון מלאי."),
  branchId: requiredId("חסר ערוץ לעדכון מלאי."),
  quantity: nonnegativeInteger("יש להזין מלאי תקין."),
  safetyStock: nonnegativeInteger("יש להזין מלאי ביטחון תקין.").default(0),
});

export const createAdminCouponClientInputSchema = z
  .object({
    code: z.string().trim().min(3, "יש להזין קוד קופון.").max(64),
    description: optionalTrimmedString(240, "תיאור הקופון ארוך מדי."),
    percentOff: z.number().int().min(1).max(100).optional(),
    amountOff: z.number().positive().optional(),
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
