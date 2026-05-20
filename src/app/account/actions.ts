"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

import {
  requestCustomerOtp,
  requestCustomerOtpInputSchema,
} from "~/server/services/customer-otp";
import {
  assertRateLimit,
  createRateLimitKey,
  rateLimitMessage,
} from "~/server/services/rate-limit";
import { signIn, signOut } from "~/server/auth";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { BUSINESS_EVENTS, createOutboxEvent } from "~/server/services/outbox";
import {
  customerAddressInputSchema,
  deleteCustomerDataInputSchema,
  getFirstZodIssueMessage,
  getZodFieldErrors,
  returnRequestInputSchema,
} from "~/lib/account-validation";

export type CustomerOtpState = {
  ok?: boolean;
  identifier?: string;
  message?: string;
  developmentCode?: string;
};

export type AccountActionState = {
  fieldErrors?: Record<string, string | undefined>;
  ok?: boolean;
  message?: string;
};

export async function requestCustomerOtpAction(
  _state: CustomerOtpState,
  formData: FormData,
): Promise<CustomerOtpState> {
  const identifier = getFormString(formData, "identifier");
  const channel = identifier.includes("@") ? "EMAIL" : "SMS";
  const parsed = requestCustomerOtpInputSchema.safeParse({
    identifier,
    channel,
  });

  if (!parsed.success) {
    return {
      ok: false,
      identifier,
      message:
        parsed.error.issues[0]?.message ?? "יש להזין אימייל או טלפון תקינים.",
    };
  }

  try {
    await assertRateLimit({
      key: createRateLimitKey("otp:request", parsed.data.identifier),
      limit: 3,
      windowMs: 10 * 60_000,
    });

    const result = await requestCustomerOtp(parsed.data);

    return {
      ok: true,
      identifier: parsed.data.identifier,
      developmentCode: result.developmentCode,
      message:
        result.channel === "EMAIL"
          ? "שלחנו קוד אימות לאימייל."
          : "שלחנו קוד אימות ב-SMS.",
    };
  } catch (error) {
    const fallbackMessage =
      error instanceof Error
        ? error.message
        : "לא ניתן לשלוח קוד כרגע. נסו שוב.";

    return {
      ok: false,
      identifier,
      message: rateLimitMessage(error) ?? fallbackMessage,
    };
  }
}

export async function verifyCustomerOtpAction(
  _state: CustomerOtpState,
  formData: FormData,
): Promise<CustomerOtpState> {
  const identifier = getFormString(formData, "identifier");
  const code = getFormString(formData, "code");
  const sessionKey = getFormString(formData, "sessionKey");

  try {
    await assertRateLimit({
      key: createRateLimitKey("otp:verify", identifier),
      limit: 6,
      windowMs: 10 * 60_000,
    });

    await signIn("otp", {
      identifier,
      code,
      sessionKey: sessionKey || undefined,
      redirectTo: "/account",
    });
  } catch (error) {
    const message = rateLimitMessage(error);

    if (message) {
      return {
        ok: false,
        identifier,
        message,
      };
    }

    if (error instanceof AuthError) {
      return {
        ok: false,
        identifier,
        message: "קוד האימות אינו תקין או שפג תוקף.",
      };
    }

    throw error;
  }

  redirect("/account");
}

export async function customerLogoutAction() {
  await signOut({ redirectTo: "/account" });
}

export async function addCustomerAddressAction(
  _state: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const session = await auth();
  const customer = session?.user?.id
    ? await db.customer.findUnique({ where: { userId: session.user.id } })
    : null;

  if (!customer) {
    return { ok: false, message: "יש להתחבר לאזור הלקוח." };
  }

  const parsed = customerAddressInputSchema.safeParse({
    label: getFormString(formData, "label"),
    recipient: getFormString(formData, "recipient"),
    phone: getFormString(formData, "phone"),
    city: getFormString(formData, "city"),
    street: getFormString(formData, "street"),
    postalCode: getFormString(formData, "postalCode"),
  });

  if (!parsed.success) {
    return {
      fieldErrors: getZodFieldErrors(parsed.error),
      ok: false,
      message: getFirstZodIssueMessage(
        parsed.error,
        "פרטי הכתובת אינם תקינים.",
      ),
    };
  }

  await db.customerAddress.create({
    data: {
      customerId: customer.id,
      ...parsed.data,
      isDefault:
        (await db.customerAddress.count({
          where: { customerId: customer.id },
        })) === 0,
    },
  });

  revalidatePath("/account");

  return { ok: true, message: "הכתובת נשמרה." };
}

export async function removeWishlistItemAction(formData: FormData) {
  const session = await auth();
  const itemId = getFormString(formData, "itemId");
  const customer = session?.user?.id
    ? await db.customer.findUnique({
        where: { userId: session.user.id },
        include: { wishlist: true },
      })
    : null;

  if (!customer?.wishlist || !itemId) return;

  await db.wishlistItem.deleteMany({
    where: {
      id: itemId,
      wishlistId: customer.wishlist.id,
    },
  });

  revalidatePath("/account");
}

export async function requestReturnAction(
  _state: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const session = await auth();
  const customer = session?.user?.id
    ? await db.customer.findUnique({ where: { userId: session.user.id } })
    : null;

  if (!customer) {
    return { ok: false, message: "יש להתחבר לאזור הלקוח." };
  }

  const parsed = returnRequestInputSchema.safeParse({
    orderId: getFormString(formData, "orderId"),
    reason: getFormString(formData, "reason"),
    notes: getFormString(formData, "notes"),
  });

  if (!parsed.success) {
    return {
      fieldErrors: getZodFieldErrors(parsed.error),
      ok: false,
      message: getFirstZodIssueMessage(
        parsed.error,
        "פרטי בקשת ההחזרה אינם תקינים.",
      ),
    };
  }

  const order = await db.order.findFirst({
    where: {
      id: parsed.data.orderId,
      customerId: customer.id,
    },
    include: { returns: true },
  });

  if (!order) {
    return { ok: false, message: "ההזמנה לא נמצאה." };
  }

  if (["PENDING_PAYMENT", "CANCELLED", "REFUNDED"].includes(order.status)) {
    return { ok: false, message: "לא ניתן לפתוח החזרה להזמנה בסטטוס הנוכחי." };
  }

  if (order.returns.some((request) => request.status !== "CANCELLED")) {
    return { ok: false, message: "כבר קיימת בקשת החזרה פעילה להזמנה." };
  }

  await db.$transaction(async (tx) => {
    const request = await tx.returnRequest.create({
      data: {
        orderId: order.id,
        reason: parsed.data.reason,
        status: "REQUESTED",
        notes: parsed.data.notes,
      },
    });

    await tx.auditLog.create({
      data: {
        action: "customer_return_requested",
        entity: "ReturnRequest",
        entityId: request.id,
        metadata: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          customerId: customer.id,
        },
      },
    });

    await createOutboxEvent(tx, {
      type: BUSINESS_EVENTS.emailRequested,
      aggregateType: "Order",
      aggregateId: order.id,
      idempotencyKey: `${BUSINESS_EVENTS.emailRequested}:return-request:${request.id}`,
      payload: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerEmail: order.email,
        template: "return_requested",
      },
    });
  });

  revalidatePath("/account");
  revalidatePath(`/account/orders/${order.id}`);

  return { ok: true, message: "בקשת ההחזרה נפתחה ותועבר לטיפול." };
}

export async function deleteCustomerDataAction(
  _state: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const session = await auth();
  const parsed = deleteCustomerDataInputSchema.safeParse({
    confirmation: getFormString(formData, "confirmation"),
  });

  if (!parsed.success) {
    return {
      fieldErrors: getZodFieldErrors(parsed.error),
      ok: false,
      message: getFirstZodIssueMessage(parsed.error),
    };
  }

  try {
    await assertRateLimit({
      key: `customer-data-delete:${session?.user?.id ?? "anonymous"}`,
      limit: 3,
      windowMs: 60 * 60_000,
    });
  } catch (error) {
    const message = rateLimitMessage(error);

    if (message) {
      return { ok: false, message };
    }

    throw error;
  }

  const customer = session?.user?.id
    ? await db.customer.findUnique({
        where: { userId: session.user.id },
        include: { wishlist: true },
      })
    : null;

  if (!customer) {
    return { ok: false, message: "יש להתחבר לאזור הלקוח." };
  }

  await db.$transaction(async (tx) => {
    await tx.auditLog.create({
      data: {
        action: "customer_data_deleted",
        entity: "Customer",
        entityId: customer.id,
        metadata: {
          customerId: customer.id,
          userId: session?.user.id ?? null,
        },
      },
    });

    await tx.order.updateMany({
      where: { customerId: customer.id },
      data: {
        customerId: null,
        email: "deleted-customer@elysia.local",
        phone: "deleted",
        recipientName: "Deleted customer",
        shippingAddress: Prisma.JsonNull,
      },
    });

    await tx.cart.updateMany({
      where: { customerId: customer.id },
      data: { customerId: null, sessionKey: null },
    });
    await tx.appointment.deleteMany({ where: { customerId: customer.id } });
    await tx.customerAddress.deleteMany({ where: { customerId: customer.id } });
    await tx.savedSize.deleteMany({ where: { customerId: customer.id } });
    await tx.otpChallenge.deleteMany({ where: { customerId: customer.id } });
    await tx.giftProfile.deleteMany({ where: { customerId: customer.id } });
    await tx.styleProfile.deleteMany({ where: { customerId: customer.id } });
    await tx.recommendationSession.deleteMany({
      where: { customerId: customer.id },
    });
    await tx.tryOnSession.updateMany({
      where: { customerId: customer.id },
      data: { customerId: null, inputMediaUrl: null, outputMediaUrl: null },
    });

    if (customer.wishlist) {
      await tx.wishlist.delete({ where: { id: customer.wishlist.id } });
    }

    await tx.customer.update({
      where: { id: customer.id },
      data: {
        userId: null,
        email: null,
        phone: null,
        firstName: null,
        lastName: null,
      },
    });

    if (session?.user.id) {
      await tx.session.deleteMany({ where: { userId: session.user.id } });
      await tx.user.update({
        where: { id: session.user.id },
        data: {
          name: "Deleted customer",
          email: `deleted-${session.user.id}@elysia.local`,
          image: null,
        },
      });
    }
  });

  await signOut({ redirectTo: "/account" });

  return { ok: true, message: "נתוני הלקוח נמחקו." };
}

function getFormString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}
