import { z } from "zod";

import {
  ACCOUNT_PHONE_PATTERN,
  DELETE_CONFIRMATION_VALUE,
} from "./account-validation-constants";
export { ACCOUNT_PHONE_PATTERN, DELETE_CONFIRMATION_VALUE };

const optionalTrimmedString = (maxLength: number) =>
  z.preprocess(
    (value) =>
      typeof value === "string" && value.trim().length === 0
        ? undefined
        : value,
    z.string().trim().max(maxLength).optional(),
  );

export const customerAddressInputSchema = z.object({
  city: z.string().trim().min(2, "יש להזין עיר.").max(80),
  label: optionalTrimmedString(80),
  phone: z
    .string()
    .trim()
    .min(7, "יש להזין טלפון תקין.")
    .max(20, "מספר הטלפון ארוך מדי.")
    .regex(ACCOUNT_PHONE_PATTERN, "יש להזין טלפון תקין."),
  postalCode: optionalTrimmedString(20),
  recipient: z.string().trim().min(2, "יש להזין שם מקבל.").max(80),
  street: z.string().trim().min(2, "יש להזין רחוב ומספר.").max(120),
});

export const returnRequestInputSchema = z.object({
  notes: optionalTrimmedString(1000),
  orderId: z.string().trim().min(1, "חסרה הזמנה לפתיחת החזרה."),
  reason: z
    .string()
    .trim()
    .min(3, "יש לפרט סיבת החזרה.")
    .max(500, "סיבת ההחזרה ארוכה מדי."),
});

export const deleteCustomerDataInputSchema = z.object({
  confirmation: z.literal(DELETE_CONFIRMATION_VALUE, {
    error: "יש להקליד DELETE כדי לאשר מחיקה.",
  }),
});

export type AccountFieldErrors = Record<string, string | undefined>;

export function getFirstZodIssueMessage(
  error: z.ZodError,
  fallback = "הפרטים אינם תקינים.",
) {
  return error.issues[0]?.message ?? fallback;
}

export function getZodFieldErrors(error: z.ZodError): AccountFieldErrors {
  const fields: AccountFieldErrors = {};

  for (const issue of error.issues) {
    const field = issue.path[0];

    if (typeof field === "string" && !fields[field]) {
      fields[field] = issue.message;
    }
  }

  return fields;
}
