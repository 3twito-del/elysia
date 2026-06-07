"use server";

import { revalidatePath } from "next/cache";

import {
  newsletterInputSchema,
  wishlistInputSchema,
} from "~/lib/public-action-validation";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import {
  assertRateLimit,
  createRateLimitKey,
  rateLimitMessage,
} from "~/server/services/rate-limit";

export type PublicActionState = {
  code?: "AUTH_REQUIRED";
  ok?: boolean;
  message?: string;
};

export async function joinNewsletter(
  _state: PublicActionState,
  formData: FormData,
): Promise<PublicActionState> {
  const parsed = newsletterInputSchema.safeParse({
    email: formData.get("email"),
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
      message: rateLimitMessage(error) ?? "לא ניתן להירשם כרגע. נסו שוב.",
    };
  }

  await db.newsletterSubscription.upsert({
    where: { email: parsed.data.email },
    update: {
      status: "SUBSCRIBED",
      source: "site-footer",
    },
    create: {
      email: parsed.data.email,
      source: "site-footer",
    },
  });

  revalidatePath("/");
  return { ok: true, message: "נרשמת לעדכוני Elysia" };
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
      message: "לא נמצאה התאמה פנויה לשמירה.",
    };
  }

  const wishlist = await db.wishlist.upsert({
    where: { customerId: customer.id },
    update: {},
    create: { customerId: customer.id },
  });

  await db.wishlistItem.upsert({
    where: {
      wishlistId_variantId: {
        wishlistId: wishlist.id,
        variantId: variant.id,
      },
    },
    update: {},
    create: {
      wishlistId: wishlist.id,
      variantId: variant.id,
    },
  });

  revalidatePath(`/product/${parsed.data.productSlug}`);
  revalidatePath("/account");
  revalidatePath("/wishlist");
  return { ok: true, message: "התכשיט נשמר" };
}
