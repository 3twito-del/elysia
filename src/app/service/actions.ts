"use server";

import { revalidatePath } from "next/cache";

import {
  getFirstZodIssueMessage,
  getZodFieldErrors,
  type FormFieldErrors,
} from "~/lib/form-validation";
import { publicServiceRequestInputSchema } from "~/lib/service-validation";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { createPublicServiceRequest } from "~/server/services/service";
import {
  assertRateLimit,
  createRateLimitKey,
  rateLimitMessage,
} from "~/server/services/rate-limit";

export type ServiceRequestActionState = {
  fieldErrors?: FormFieldErrors;
  // UX41: echoes back what the customer actually typed so a failed submit
  // can re-populate the form instead of leaving it blank (React 19 resets
  // uncontrolled form fields on every submit, success or failure).
  fieldValues?: Record<string, string | undefined>;
  message?: string;
  ok?: boolean;
  requestReference?: string;
};

function getFormStringValue(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : undefined;
}

function getServiceRequestFieldValues(formData: FormData) {
  return {
    topicSlug: getFormStringValue(formData, "topicSlug"),
    name: getFormStringValue(formData, "name"),
    phone: getFormStringValue(formData, "phone"),
    email: getFormStringValue(formData, "email"),
    orderNumber: getFormStringValue(formData, "orderNumber"),
    productReference: getFormStringValue(formData, "productReference"),
    preferredContact: getFormStringValue(formData, "preferredContact") ?? "ANY",
    preferredContactTime: getFormStringValue(
      formData,
      "preferredContactTime",
    ),
    message: getFormStringValue(formData, "message"),
  };
}

export async function createServiceRequestAction(
  _state: ServiceRequestActionState,
  formData: FormData,
): Promise<ServiceRequestActionState> {
  const fieldValues = getServiceRequestFieldValues(formData);
  const parsed = publicServiceRequestInputSchema.safeParse(fieldValues);

  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: getZodFieldErrors(parsed.error),
      fieldValues,
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
      fieldValues,
      message:
        rateLimitMessage(error) ??
        "נשלחו יותר מדי פניות בזמן קצר. נסו שוב מאוחר יותר.",
    };
  }

  const session = await auth();
  let customerId: string | undefined;

  if (session?.user?.id && !session.user.adminUserId) {
    const customer = await db.customer.findUnique({
      select: { id: true },
      where: { userId: session.user.id },
    });

    customerId = customer?.id;
  }

  try {
    const request = await createPublicServiceRequest({
      customerId,
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
      fieldValues,
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
