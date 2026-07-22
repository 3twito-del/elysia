"use server";

import { TRPCError } from "@trpc/server";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { Prisma } from "@prisma/client";
import { z } from "zod";

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
import {
  GUEST_ORDER_ACCESS_COOKIE,
  GUEST_ORDER_ACCESS_MAX_AGE_SECONDS,
  requestGuestOrderAccess,
  requestGuestOrderAccessSchema,
  verifyGuestOrderAccess,
  verifyGuestOrderAccessSchema,
} from "~/server/services/guest-order-access";
import { BUSINESS_EVENTS, createOutboxEvent } from "~/server/services/outbox";
import {
  customerAddressInputSchema,
  deleteCustomerDataInputSchema,
  getFirstZodIssueMessage,
  getZodFieldErrors,
  returnRequestInputSchema,
} from "~/lib/account-validation";
import {
  savedSizeInputSchema,
  sizeFitKinds,
  type SavedSize,
} from "~/lib/size-fit";

export type CustomerOtpState = {
  ok?: boolean;
  identifier?: string;
  message?: string;
  developmentCode?: string;
};

export type AccountActionState = {
  fieldErrors?: Record<string, string | undefined>;
  // UX41: echoes back what the customer actually typed so a failed submit
  // can re-populate the form instead of leaving it blank (React 19 resets
  // uncontrolled form fields on every submit, success or failure).
  fieldValues?: Record<string, string | undefined>;
  ok?: boolean;
  message?: string;
  // UX44: return requests get a short, human-readable tracking reference,
  // matching what service requests already give the customer.
  requestReference?: string;
};

export type GuestWishlistMergeState = AccountActionState & {
  duplicateCount?: number;
  mergedCount?: number;
  requestedCount?: number;
};

export type GuestOrderAccessState = {
  ok?: boolean;
  message?: string;
  challengeId?: string;
  developmentCode?: string;
};

export async function requestGuestOrderAccessAction(
  _state: GuestOrderAccessState,
  formData: FormData,
): Promise<GuestOrderAccessState> {
  const parsed = requestGuestOrderAccessSchema.safeParse({
    orderNumber: getFormString(formData, "orderNumber"),
    identifier: getFormString(formData, "identifier"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      message: "יש להזין מספר הזמנה ואימייל או טלפון תקינים.",
    };
  }

  try {
    await assertRateLimit({
      key: createRateLimitKey(
        "guest-order:request",
        `${parsed.data.orderNumber}:${parsed.data.identifier}`,
      ),
      limit: 4,
      windowMs: 10 * 60_000,
    });
    return await requestGuestOrderAccess(parsed.data);
  } catch (error) {
    return {
      ok: false,
      message:
        rateLimitMessage(error) ??
        (error instanceof TRPCError
          ? error.message
          : "לא ניתן לשלוח קוד כרגע. נסי שוב בעוד דקה."),
    };
  }
}

export async function verifyGuestOrderAccessAction(
  _state: GuestOrderAccessState,
  formData: FormData,
): Promise<GuestOrderAccessState> {
  const parsed = verifyGuestOrderAccessSchema.safeParse({
    challengeId: getFormString(formData, "challengeId"),
    code: getFormString(formData, "code"),
  });
  if (!parsed.success)
    return { ok: false, message: "יש להזין קוד בן שש ספרות." };

  try {
    await assertRateLimit({
      key: createRateLimitKey("guest-order:verify", parsed.data.challengeId),
      limit: 6,
      windowMs: 10 * 60_000,
    });
    const result = await verifyGuestOrderAccess(parsed.data);
    (await cookies()).set(GUEST_ORDER_ACCESS_COOKIE, result.token, {
      httpOnly: true,
      maxAge: GUEST_ORDER_ACCESS_MAX_AGE_SECONDS,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/account",
    });
  } catch (error) {
    return {
      ok: false,
      message:
        rateLimitMessage(error) ??
        (error instanceof TRPCError
          ? error.message
          : "לא הצלחנו לאמת את הקוד."),
    };
  }

  redirect("/account#guest-order");
}

const guestWishlistMergeInputSchema = z
  .array(z.string().trim().min(1).max(120))
  .max(100);

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
    return {
      ok: false,
      identifier,
      message:
        rateLimitMessage(error) ??
        (error instanceof TRPCError
          ? error.message
          : "לא ניתן לשלוח קוד כרגע. בדקי את הפרטים ונסי שוב בעוד דקה."),
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
  const redirectTo = getSafeAccountRedirectTarget(
    getFormString(formData, "redirectTo"),
  );

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
      redirectTo,
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
      const code = "code" in error ? error.code : undefined;
      const otpMessage =
        code === "otp_expired"
          ? "הקוד פג תוקף. בקשי קוד חדש."
          : code === "otp_locked"
            ? "בוצעו יותר מדי ניסיונות. בקשי קוד חדש."
            : "הקוד שהוזן שגוי. אפשר לנסות שוב או לבקש קוד חדש.";

      return {
        ok: false,
        identifier,
        message: otpMessage,
      };
    }

    throw error;
  }

  redirect(redirectTo);
}

/** Only same-app, /account-scoped paths are honored, so a crafted redirectTo
 * form field can't be used as an open redirect. */
function getSafeAccountRedirectTarget(candidate: string) {
  if (candidate === "/account" || candidate.startsWith("/account/")) {
    return candidate;
  }

  return "/account";
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

  const rawFieldValues = {
    label: getFormString(formData, "label"),
    recipient: getFormString(formData, "recipient"),
    phone: getFormString(formData, "phone"),
    city: getFormString(formData, "city"),
    street: getFormString(formData, "street"),
    postalCode: getFormString(formData, "postalCode"),
  };
  const parsed = customerAddressInputSchema.safeParse(rawFieldValues);

  if (!parsed.success) {
    return {
      fieldErrors: getZodFieldErrors(parsed.error),
      fieldValues: rawFieldValues,
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

export async function deleteCustomerAddressAction(
  _state: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const session = await auth();
  const addressId = getFormString(formData, "addressId");

  if (!session?.user?.id) {
    return { ok: false, message: "יש להתחבר לאזור הלקוח כדי להסיר כתובת." };
  }

  const customer = await db.customer.findUnique({
    where: { userId: session.user.id },
  });

  if (!customer || !addressId) {
    return { ok: false, message: "לא ניתן להסיר את הכתובת כרגע." };
  }

  const deleted = await db.customerAddress.deleteMany({
    where: { id: addressId, customerId: customer.id },
  });

  if (deleted.count === 0) {
    return { ok: false, message: "הכתובת כבר לא קיימת." };
  }

  revalidatePath("/account");

  return { ok: true, message: "הכתובת הוסרה." };
}

export async function saveCustomerSizeAction(
  _state: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const parsed = savedSizeInputSchema.safeParse({
    kind: getFormString(formData, "kind"),
    value: getFormString(formData, "value"),
  });

  if (!parsed.success) {
    return {
      fieldErrors: getZodFieldErrors(parsed.error),
      ok: false,
      message: getFirstZodIssueMessage(
        parsed.error,
        "המידה שנבחרה אינה תקינה.",
      ),
    };
  }

  const session = await auth();

  if (session?.user?.adminUserId) {
    return {
      ok: false,
      message: "אזור המידות האישי מיועד ללקוחות בלבד.",
    };
  }

  if (!session?.user?.id) {
    if (getFormString(formData, "context") === "account") {
      return {
        ok: false,
        message: "החיבור לחשבון פג. נא להתחבר מחדש כדי לשמור את המידה.",
      };
    }

    return {
      ok: true,
      message: "המידה נשמרה במכשיר. התחברות תסנכרן אותה לחשבון.",
    };
  }

  try {
    await assertRateLimit({
      key: createRateLimitKey("saved-size", session.user.id),
      limit: 20,
      windowMs: 10 * 60_000,
    });
  } catch (error) {
    return {
      ok: false,
      message: rateLimitMessage(error) ?? "לא ניתן לשמור מידה כרגע.",
    };
  }

  const customer = await db.customer.findUnique({
    where: { userId: session.user.id },
  });

  if (!customer) {
    return { ok: false, message: "לא נמצא פרופיל לקוח פעיל." };
  }

  await db.savedSize.upsert({
    where: {
      customerId_kind: {
        customerId: customer.id,
        kind: parsed.data.kind,
      },
    },
    update: { value: parsed.data.value },
    create: {
      customerId: customer.id,
      kind: parsed.data.kind,
      value: parsed.data.value,
    },
  });

  revalidatePath("/account");

  return { ok: true, message: "המידה נשמרה." };
}

export async function syncCustomerSavedSizesAction(
  sizes: SavedSize[],
): Promise<AccountActionState> {
  const parsed = savedSizeInputSchema
    .array()
    .max(sizeFitKinds.length)
    .safeParse(sizes);

  if (!parsed.success) {
    return {
      fieldErrors: getZodFieldErrors(parsed.error),
      ok: false,
      message: getFirstZodIssueMessage(
        parsed.error,
        "לא ניתן לסנכרן את המידות המקומיות.",
      ),
    };
  }

  const session = await auth();

  if (session?.user?.adminUserId) {
    return {
      ok: false,
      message: "אזור המידות האישי מיועד ללקוחות בלבד.",
    };
  }

  if (!session?.user?.id) {
    return {
      ok: true,
      message: "המידות נשמרו במכשיר.",
    };
  }

  const uniqueSizes = Array.from(
    new Map(parsed.data.map((size) => [size.kind, size])).values(),
  );

  if (uniqueSizes.length === 0) {
    return { ok: true };
  }

  try {
    await assertRateLimit({
      key: createRateLimitKey("saved-size-sync", session.user.id),
      limit: 10,
      windowMs: 10 * 60_000,
    });
  } catch (error) {
    return {
      ok: false,
      message: rateLimitMessage(error) ?? "לא ניתן לסנכרן מידות מקומיות כרגע.",
    };
  }

  const customer = await db.customer.findUnique({
    where: { userId: session.user.id },
    include: { savedSizes: true },
  });

  if (!customer) {
    return { ok: false, message: "לא נמצא פרופיל לקוח פעיל." };
  }

  const existingKinds = new Set(customer.savedSizes.map((size) => size.kind));
  const missingSizes = uniqueSizes.filter(
    (size) => !existingKinds.has(size.kind),
  );

  if (missingSizes.length === 0) {
    return { ok: true };
  }

  await db.$transaction(
    missingSizes.map((size) =>
      db.savedSize.upsert({
        where: {
          customerId_kind: {
            customerId: customer.id,
            kind: size.kind,
          },
        },
        update: { value: size.value },
        create: {
          customerId: customer.id,
          kind: size.kind,
          value: size.value,
        },
      }),
    ),
  );

  revalidatePath("/account");

  return {
    ok: true,
    message: "מידות שנשמרו במכשיר סונכרנו לחשבון.",
  };
}

export async function removeWishlistItemAction(
  _state: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const session = await auth();
  const itemId = getFormString(formData, "itemId");
  const customer = session?.user?.id
    ? await db.customer.findUnique({
        where: { userId: session.user.id },
        include: { wishlist: true },
      })
    : null;

  if (!session?.user?.id) {
    return { ok: false, message: "יש להתחבר לאזור הלקוח כדי להסיר פריט." };
  }

  if (!customer?.wishlist || !itemId) {
    return { ok: false, message: "לא ניתן להסיר את הפריט כרגע." };
  }

  const deleted = await db.wishlistItem.deleteMany({
    where: {
      id: itemId,
      wishlistId: customer.wishlist.id,
    },
  });

  if (deleted.count === 0) {
    return { ok: false, message: "הפריט כבר לא נמצא במועדפים." };
  }

  revalidatePath("/account");
  revalidatePath("/wishlist");

  return { ok: true };
}

export async function mergeGuestWishlistAction(
  productSlugs: string[],
): Promise<GuestWishlistMergeState> {
  const parsed = guestWishlistMergeInputSchema.safeParse(productSlugs);

  if (!parsed.success) {
    return {
      ok: false,
      message: "לא ניתן לסנכרן את המועדפים המקומיים כרגע.",
    };
  }

  const session = await auth();

  if (!session?.user?.id || session.user.adminUserId) {
    return {
      ok: false,
      message: "יש להתחבר לאזור הלקוח כדי לסנכרן מועדפים.",
    };
  }

  const uniqueSlugs = Array.from(new Set(parsed.data));

  if (uniqueSlugs.length === 0) {
    return { mergedCount: 0, ok: true, requestedCount: 0 };
  }

  const customer = await db.customer.findUnique({
    where: { userId: session.user.id },
    include: {
      wishlist: {
        include: {
          items: true,
        },
      },
    },
  });

  if (!customer) {
    return {
      ok: false,
      message: "לא נמצא פרופיל לקוח פעיל.",
    };
  }

  const [wishlist, products] = await Promise.all([
    db.wishlist.upsert({
      where: { customerId: customer.id },
      update: {},
      create: { customerId: customer.id },
    }),
    db.product.findMany({
      where: {
        slug: { in: uniqueSlugs },
        status: "ACTIVE",
      },
      include: {
        variants: {
          orderBy: { isDefault: "desc" },
          take: 1,
        },
      },
    }),
  ]);
  const existingVariantIds = new Set(
    customer.wishlist?.items.map((item) => item.variantId) ?? [],
  );
  const variantIds = Array.from(
    new Set(
      products
        .map((product) => product.variants[0]?.id)
        .filter((variantId): variantId is string => Boolean(variantId)),
    ),
  );
  const newVariantIds = variantIds.filter(
    (variantId) => !existingVariantIds.has(variantId),
  );
  const priceByVariantId = new Map(
    products.flatMap((product) => {
      const variant = product.variants[0];
      const price = Number(product.basePrice) + Number(variant?.priceDelta);

      return variant && Number.isFinite(price)
        ? [[variant.id, price] as const]
        : [];
    }),
  );

  if (newVariantIds.length > 0) {
    await db.$transaction(
      newVariantIds.map((variantId) =>
        db.wishlistItem.upsert({
          where: {
            wishlistId_variantId: {
              wishlistId: wishlist.id,
              variantId,
            },
          },
          update: {},
          create: {
            wishlistId: wishlist.id,
            variantId,
            priceAtSave: priceByVariantId.get(variantId),
          },
        }),
      ),
    );

    revalidatePath("/account");
    revalidatePath("/wishlist");
  }

  const unavailableCount = Math.max(uniqueSlugs.length - variantIds.length, 0);

  return {
    duplicateCount: Math.max(variantIds.length - newVariantIds.length, 0),
    mergedCount: newVariantIds.length,
    ok: true,
    requestedCount: uniqueSlugs.length,
    message:
      newVariantIds.length > 0
        ? `${newVariantIds.length} פריטים מהמועדפים המקומיים נוספו לחשבון.`
        : unavailableCount > 0 && unavailableCount === uniqueSlugs.length
          ? "הפריטים השמורים מהדפדפן כבר אינם זמינים ולא נוספו לחשבון."
          : unavailableCount > 0
            ? "חלק מהפריטים השמורים מהדפדפן כבר אינם זמינים ולא נוספו לחשבון. השאר כבר קיימים בחשבון."
            : "המועדפים המקומיים כבר קיימים בחשבון.",
  };
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

  const returnRequest = await db.$transaction(async (tx) => {
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

    return request;
  });

  revalidatePath("/account");
  revalidatePath(`/account/orders/${order.id}`);

  const requestReference = createReturnRequestReference(returnRequest.id);

  return {
    ok: true,
    requestReference,
    message: `בקשת ההחזרה נפתחה ותועבר לטיפול. מספר בקשה: ${requestReference}.`,
  };
}

function createReturnRequestReference(id: string) {
  const compactId = id
    .replace(/[^a-z0-9]/giu, "")
    .slice(-8)
    .toUpperCase();

  return `RR-${compactId || "NEW"}`;
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

  await signOut({ redirectTo: "/account?dataDeleted=1" });

  return { ok: true, message: "נתוני הלקוח נמחקו." };
}

function getFormString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}
