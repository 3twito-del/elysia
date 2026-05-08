"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "~/server/auth";
import { db } from "~/server/db";

const newsletterSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  marketingConsent: z.literal("yes"),
});

const unsubscribeNewsletterSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
});

const wishlistSchema = z.object({
  productSlug: z.string().trim().min(1),
});

export type PublicActionState = {
  ok?: boolean;
  message?: string;
};

export async function joinNewsletter(
  _state: PublicActionState,
  formData: FormData,
): Promise<PublicActionState> {
  const parsed = newsletterSchema.safeParse({
    email: formData.get("email"),
    marketingConsent: formData.get("marketingConsent"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "יש להזין אימייל תקין ולאשר קבלת דיוור",
    };
  }

  const consentText =
    "אני מסכימ/ה לקבל מ-Aphrodite עדכונים, הטבות ודברי פרסומת בדוא״ל, וידוע לי שאפשר להסיר בכל עת.";

  try {
    await db.newsletterSubscription.upsert({
      where: { email: parsed.data.email },
      update: {
        consentText,
        consentedAt: new Date(),
        status: "SUBSCRIBED",
        source: "site-footer-explicit-consent",
      },
      create: {
        consentText,
        consentedAt: new Date(),
        email: parsed.data.email,
        source: "site-footer-explicit-consent",
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[newsletter] failed to save subscription", error);
    }

    return {
      ok: false,
      message: "לא הצלחנו לשמור את ההרשמה כרגע. נסו שוב בעוד רגע.",
    };
  }

  revalidatePath("/");
  return { ok: true, message: "נרשמת לעדכוני Aphrodite" };
}

export async function unsubscribeNewsletter(
  _state: PublicActionState,
  formData: FormData,
): Promise<PublicActionState> {
  const parsed = unsubscribeNewsletterSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { ok: false, message: "כתובת אימייל לא תקינה" };
  }

  try {
    await db.newsletterSubscription.upsert({
      where: { email: parsed.data.email },
      update: {
        status: "UNSUBSCRIBED",
        source: "unsubscribe-form",
      },
      create: {
        email: parsed.data.email,
        source: "unsubscribe-form",
        status: "UNSUBSCRIBED",
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[newsletter] failed to unsubscribe", error);
    }

    return {
      ok: false,
      message: "לא הצלחנו לעדכן את ההסרה כרגע. נסו שוב בעוד רגע.",
    };
  }

  return {
    ok: true,
    message: "הכתובת הוסרה מדיוור שיווקי או סומנה כלא פעילה.",
  };
}

export async function saveWishlistItem(
  _state: PublicActionState,
  formData: FormData,
): Promise<PublicActionState> {
  const parsed = wishlistSchema.safeParse({
    productSlug: formData.get("productSlug"),
  });

  if (!parsed.success) {
    return { ok: false, message: "לא נמצא מוצר לשמירה" };
  }

  const session = await auth();

  if (!session?.user?.id || session.user.adminUserId) {
    return {
      ok: false,
      message: "יש להתחבר לאזור הלקוח כדי לשמור מוצר.",
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
    return { ok: false, message: "לא נמצאה וריאציה זמינה לשמירה." };
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
  return { ok: true, message: "המוצר נשמר ל-Wishlist" };
}
