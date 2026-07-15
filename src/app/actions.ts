"use server";

import { revalidatePath } from "next/cache";

import {
  newsletterInputSchema,
  wishlistInputSchema,
} from "~/lib/public-action-validation";
import { feedbackInputSchema } from "~/lib/feedback-validation";
import { newsletterConsentText } from "~/lib/legal-content";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { recordAnalyticsEvent } from "~/server/services/analytics";
import {
  assertRateLimit,
  createRateLimitKey,
  rateLimitMessage,
} from "~/server/services/rate-limit";

export type PublicActionState = {
  code?: "AUTH_REQUIRED";
  ok?: boolean;
  message?: string;
  saved?: boolean;
};

export async function joinNewsletter(
  _state: PublicActionState,
  formData: FormData,
): Promise<PublicActionState> {
  const parsed = newsletterInputSchema.safeParse({
    email: formData.get("email"),
    marketingConsent: formData.get("marketingConsent"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "כתובת אימייל לא תקינה.",
    };
  }

  try {
    await assertRateLimit({
      key: createRateLimitKey("newsletter", parsed.data.email),
      limit: 3,
      windowMs: 10 * 60_000,
    });
  } catch (error) {
    return {
      ok: false,
      message: rateLimitMessage(error) ?? "לא ניתן להירשם כרגע. נסי שוב.",
    };
  }

  await db.newsletterSubscription.upsert({
    where: { email: parsed.data.email },
    update: {
      consentedAt: new Date(),
      consentText: newsletterConsentText,
      status: "SUBSCRIBED",
      source: "site-footer",
    },
    create: {
      consentedAt: new Date(),
      consentText: newsletterConsentText,
      email: parsed.data.email,
      source: "site-footer",
    },
  });
  await recordPublicActionAnalyticsSafely({
    type: "newsletter_subscribed",
    consentMode: "business",
    payload: {
      source: "site-footer",
      consentTextVersion: newsletterConsentText.slice(0, 80),
    },
    idempotencyKey: `newsletter_subscribed:${parsed.data.email}`,
  });

  revalidatePath("/");
  return {
    ok: true,
    message: "תודה שהצטרפת! נעדכן אותך ראשונה על קולקציות ופריטים חדשים.",
  };
}

async function recordPublicActionAnalyticsSafely(
  input: Parameters<typeof recordAnalyticsEvent>[0],
) {
  try {
    await recordAnalyticsEvent(input);
  } catch (error) {
    console.error("[public-actions:analytics-failed]", error);
  }
}

export async function saveWishlistItem(
  _state: PublicActionState,
  formData: FormData,
): Promise<PublicActionState> {
  const parsed = wishlistInputSchema.safeParse({
    productSlug: formData.get("productSlug"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "לא נמצא תכשיט לשמירה.",
    };
  }

  const session = await auth();

  if (!session?.user?.id || session.user.adminUserId) {
    return {
      code: "AUTH_REQUIRED",
      ok: false,
      message: "ניתן לשמור גם בלי התחברות.",
    };
  }

  const customer = await db.customer.findUnique({
    where: { userId: session.user.id },
  });

  if (!customer) {
    return {
      ok: false,
      message: "לא נמצא פרופיל לקוח פעיל.",
    };
  }

  const product = await db.product.findFirst({
    where: { slug: parsed.data.productSlug, status: "ACTIVE" },
    include: {
      variants: {
        orderBy: { isDefault: "desc" },
        take: 1,
      },
    },
  });
  const variant = product?.variants[0];

  if (!variant) {
    return {
      ok: false,
      message: "לא נמצאה אפשרות זמינה לשמירה.",
    };
  }

  const wishlist = await db.wishlist.upsert({
    where: { customerId: customer.id },
    update: {},
    create: { customerId: customer.id },
  });
  const wishlistIdentity = {
    wishlistId: wishlist.id,
    variantId: variant.id,
  };
  const existingItem = await db.wishlistItem.findUnique({
    where: {
      wishlistId_variantId: wishlistIdentity,
    },
  });

  if (existingItem) {
    await db.wishlistItem.delete({
      where: { id: existingItem.id },
    });

    revalidatePath(`/product/${parsed.data.productSlug}`);
    revalidatePath("/account");
    revalidatePath("/wishlist");
    return { ok: true, saved: false, message: "התכשיט הוסר מהמועדפים" };
  }

  const priceAtSave = Number(product.basePrice) + Number(variant.priceDelta);

  await db.wishlistItem.upsert({
    where: {
      wishlistId_variantId: wishlistIdentity,
    },
    update: {},
    create: {
      ...wishlistIdentity,
      priceAtSave: Number.isFinite(priceAtSave) ? priceAtSave : undefined,
    },
  });
  await recordPublicActionAnalyticsSafely({
    type: "wishlist_add",
    customerId: customer.id,
    productId: product.id,
    consentMode: "business",
    payload: {
      productSlug: parsed.data.productSlug,
      variantId: variant.id,
    },
    idempotencyKey: `wishlist_add:${customer.id}:${variant.id}`,
  });

  revalidatePath(`/product/${parsed.data.productSlug}`);
  revalidatePath("/account");
  revalidatePath("/wishlist");
  return { ok: true, saved: true, message: "התכשיט נשמר" };
}

export async function submitFeedback(
  _state: PublicActionState,
  formData: FormData,
): Promise<PublicActionState> {
  const emailValue = formData.get("email");
  const parsed = feedbackInputSchema.safeParse({
    message: formData.get("message"),
    email:
      typeof emailValue === "string" && emailValue.trim()
        ? emailValue
        : undefined,
    url: formData.get("url") ?? undefined,
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "יש להזין פרטים תקינים.",
    };
  }

  try {
    await assertRateLimit({
      key: createRateLimitKey("feedback", parsed.data.email ?? "anonymous"),
      limit: 5,
      windowMs: 10 * 60_000,
    });
  } catch (error) {
    return {
      ok: false,
      message: rateLimitMessage(error) ?? "לא ניתן לשלוח כרגע. נסי שוב.",
    };
  }

  const session = await auth();
  let customerId: string | undefined;

  if (session?.user?.id && !session.user.adminUserId) {
    const customer = await db.customer.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    customerId = customer?.id;
  }

  await db.userFeedback.create({
    data: {
      message: parsed.data.message,
      email: parsed.data.email ?? null,
      url: parsed.data.url ?? null,
      customerId: customerId ?? null,
    },
  });

  return { ok: true, message: "תודה! הפידבק שלך התקבל." };
}
