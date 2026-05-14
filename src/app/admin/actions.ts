"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

import { adminLoginInputSchema } from "~/lib/public-action-validation";
import { signIn, signOut } from "~/server/auth";
import { sanitizeAdminRedirect } from "~/server/auth/admin-redirect";
import {
  assertRateLimit,
  createRateLimitKey,
  rateLimitMessage,
} from "~/server/services/rate-limit";

export type AdminLoginState = {
  message?: string;
};

export async function adminLoginAction(
  _state: AdminLoginState,
  formData: FormData,
): Promise<AdminLoginState> {
  const parsed = adminLoginInputSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next"),
  });

  if (!parsed.success) {
    return {
      message:
        parsed.error.issues[0]?.message ?? "יש להזין אימייל וסיסמה תקינים.",
    };
  }

  const redirectTo = sanitizeAdminRedirect(parsed.data.next);

  try {
    await assertRateLimit({
      key: createRateLimitKey("admin-login", parsed.data.email),
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
