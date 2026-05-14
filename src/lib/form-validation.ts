import { z } from "zod";

export type FormFieldErrors = Record<string, string | undefined>;

export function getFirstZodIssueMessage(
  error: z.ZodError,
  fallback = "הפרטים אינם תקינים.",
) {
  return error.issues[0]?.message ?? fallback;
}

export function getZodFieldErrors(error: z.ZodError): FormFieldErrors {
  const fields: FormFieldErrors = {};

  for (const issue of error.issues) {
    const field = issue.path[0];

    if (typeof field === "string" && !fields[field]) {
      fields[field] = issue.message;
    }
  }

  return fields;
}

export function optionalTrimmedString(
  maxLength: number,
  message = "הטקסט ארוך מדי.",
) {
  return z.preprocess(
    (value) =>
      typeof value === "string" && value.trim().length === 0
        ? undefined
        : value,
    z.string().trim().max(maxLength, message).optional(),
  );
}
