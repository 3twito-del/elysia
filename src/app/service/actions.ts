"use server";

import { revalidatePath } from "next/cache";

import {
  getFirstZodIssueMessage,
  getZodFieldErrors,
  type FormFieldErrors,
} from "~/lib/form-validation";
import { publicServiceRequestInputSchema } from "~/lib/service-validation";
import { createPublicServiceRequest } from "~/server/services/service";
import {
  assertRateLimit,
  createRateLimitKey,
  rateLimitMessage,
} from "~/server/services/rate-limit";

export type ServiceRequestActionState = {
  fieldErrors?: FormFieldErrors;
  message?: string;
  ok?: boolean;
  requestReference?: string;
};

export async function createServiceRequestAction(
  _state: ServiceRequestActionState,
  formData: FormData,
): Promise<ServiceRequestActionState> {
  const parsed = publicServiceRequestInputSchema.safeParse({
    topicSlug: formData.get("topicSlug"),
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    orderNumber: formData.get("orderNumber"),
    productReference: formData.get("productReference"),
    preferredContact: formData.get("preferredContact") ?? "ANY",
    preferredContactTime: formData.get("preferredContactTime"),
    message: formData.get("message"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: getZodFieldErrors(parsed.error),
      message: getFirstZodIssueMessage(parsed.error),
    };
  }

  try {
    await assertRateLimit({
      key: createRateLimitKey("service-request", parsed.data.email),
      limit: 4,
      windowMs: 60 * 60_000,
    });
  } catch (error) {
    return {
      ok: false,
      message:
        rateLimitMessage(error) ??
        "נשלחו יותר מדי פניות בזמן קצר. נסו שוב מאוחר יותר.",
    };
  }

  try {
    const request = await createPublicServiceRequest({
      data: parsed.data,
      files: formData.getAll("attachments").filter(isFile),
    });
    const requestReference = createServiceRequestReference(request.id);

    revalidatePath("/service");

    return {
      ok: true,
      requestReference,
      message: `הפנייה התקבלה. מספר הפנייה: ${requestReference}. צוות Elysia יחזור עד 24 שעות ביום עסקים לאחר בדיקת הפרטים.`,
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "לא הצלחנו לקבל את הפנייה כרגע. נסו שוב.",
    };
  }
}

function isFile(value: FormDataEntryValue): value is File {
  return typeof File !== "undefined" && value instanceof File;
}

function createServiceRequestReference(id: string) {
  const compactId = id
    .replace(/[^a-z0-9]/giu, "")
    .slice(-8)
    .toUpperCase();

  return `SR-${compactId || "NEW"}`;
}
