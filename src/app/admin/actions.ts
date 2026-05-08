"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { z } from "zod";

import { signIn, signOut } from "~/server/auth";
import { sanitizeAdminRedirect } from "~/server/auth/admin-redirect";
import {
  assertRateLimit,
  rateLimitMessage,
} from "~/server/services/rate-limit";

const adminLoginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(12),
  next: z.string().max(256).optional(),
});

export type AdminLoginState = {
  message?: string;
};

export async function adminLoginAction(
  _state: AdminLoginState,
  formData: FormData,
): Promise<AdminLoginState> {
  const parsed = adminLoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next"),
  });

  if (!parsed.success) {
    return { message: "יש להזין אימייל וסיסמה תקינים." };
  }

  const redirectTo = sanitizeAdminRedirect(parsed.data.next);

  try {
    await assertRateLimit({
      key: `admin-login:${parsed.data.email}`,
      limit: 5,
      windowMs: 15 * 60_000,
    });

    await signIn("admin", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo,
    });
  } catch (error) {
    const message = rateLimitMessage(error);

    if (message) {
      return { message };
    }

    if (error instanceof AuthError) {
      return { message: "פרטי ההתחברות אינם תואמים לאדמין פעיל." };
    }

    throw error;
  }

  redirect(redirectTo);
}

export async function adminLogoutAction() {
  await signOut({ redirectTo: "/admin/login" });
}
