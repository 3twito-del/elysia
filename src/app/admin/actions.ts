"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

import { adminLoginInputSchema } from "~/lib/public-action-validation";
import { signIn, signOut } from "~/server/auth";
import {
  findAdminUserIdForLoginAudit,
  recordAdminLoginAudit,
} from "~/server/auth/admin-login-audit";
import { sanitizeAdminRedirect } from "~/server/auth/admin-redirect";
import {
  assertRateLimit,
  createRateLimitKey,
  RateLimitExceededError,
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
  const auditAdminUserId = await findAdminUserIdForLoginAudit(
    parsed.data.email,
  );

  try {
    await assertRateLimit({
      key: createRateLimitKey("admin-login", parsed.data.email),
      limit: 5,
      windowMs: 15 * 60_000,
    });

    await signIn("admin", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
      redirectTo,
    });

    await recordAdminLoginAudit({
      adminUserId: auditAdminUserId,
      email: parsed.data.email,
      outcome: "success",
      redirectTo,
    });
  } catch (error) {
    const message = rateLimitMessage(error);

    if (message) {
      await recordAdminLoginAudit({
        adminUserId: auditAdminUserId,
        email: parsed.data.email,
        outcome: "rate_limited",
        redirectTo,
        retryAfterSeconds:
          error instanceof RateLimitExceededError
            ? error.retryAfterSeconds
            : undefined,
      });

      return { message };
    }

    if (error instanceof AuthError) {
      await recordAdminLoginAudit({
        adminUserId: auditAdminUserId,
        email: parsed.data.email,
        outcome: "invalid_credentials",
        redirectTo,
      });

      return { message: "פרטי ההתחברות אינם תואמים לאדמין פעיל." };
    }

    throw error;
  }

  redirect(redirectTo);
}

export async function adminLogoutAction() {
  await signOut({ redirectTo: "/admin/login" });
}
