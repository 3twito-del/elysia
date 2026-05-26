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
        "נשלחו יותר מדי פניות בפרק זמן קצר. נסו שוב מאוחר יותר.",
    };
  }

  try {
    await createPublicServiceRequest({
      data: parsed.data,
      files: formData.getAll("attachments").filter(isFile),
    });
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "לא הצלחנו לקבל את הפנייה כרגע. נסו שוב.",
    };
  }

  revalidatePath("/service");

  return {
    ok: true,
    message: "הפנייה התקבלה. צוות Elysia יחזור אליכם בהקדם.",
  };
}

function isFile(value: FormDataEntryValue): value is File {
  return typeof File !== "undefined" && value instanceof File;
}
