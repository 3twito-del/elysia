"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

const newsletterSchema = z.object({
  email: z.string().email(),
});

const wishlistSchema = z.object({
  productSlug: z.string().min(1),
});

export async function joinNewsletter(formData: FormData) {
  const parsed = newsletterSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { ok: false, message: "כתובת אימייל לא תקינה" };
  }

  revalidatePath("/");
  return { ok: true, message: "נרשמת לעדכוני Aphrodite" };
}

export async function saveWishlistItem(formData: FormData) {
  const parsed = wishlistSchema.safeParse({
    productSlug: formData.get("productSlug"),
  });

  if (!parsed.success) {
    return { ok: false, message: "לא נמצא מוצר לשמירה" };
  }

  revalidatePath(`/product/${parsed.data.productSlug}`);
  return { ok: true, message: "המוצר נשמר ל-Wishlist" };
}
