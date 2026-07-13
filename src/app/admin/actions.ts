"use server";

import { redirect } from "next/navigation";

import { adminLoginInputSchema } from "~/lib/public-action-validation";
import { signOut } from "~/server/auth";
import { verifyAdminCredentials } from "~/server/auth/admin-credentials";
import {
  findAdminLoginAuditTarget,
  recordAdminLoginAudit,
} from "~/server/auth/admin-login-audit";
import { setAdminLoginTicketCookie } from "~/server/auth/admin-login-ticket-cookie";
import { mintAdminLoginTicket } from "~/server/auth/admin-mfa-ticket";
import { sanitizeAdminRedirect } from "~/server/auth/admin-redirect";
import { inactiveAdminLoginMessage } from "~/server/auth/admin-user-status";
import {
  isAdminAuthFixtureEmail,
  shouldUseAdminAuthFixtures,
} from "~/server/services/admin-auth-fixtures";
import {
  assertRateLimit,
  createRateLimitKey,
  RateLimitExceededError,
  rateLimitMessage,
} from "~/server/services/rate-limit";

export type AdminLoginState = {
  message?: string;
};

/**
 * ADR 0005 phase 1 of 3: password only. On success this hands off to
 * /admin/login/mfa via a signed, short-lived ticket cookie — it never mints
 * a NextAuth session by itself (see ~/app/admin/login/mfa/actions.ts for
 * phases 2/3).
 */
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
  const auditTarget = await findAdminLoginAuditTarget(parsed.data.email);
  const auditAdminUserId = auditTarget?.id ?? null;

  try {
    if (
      !(
        shouldUseAdminAuthFixtures() &&
        isAdminAuthFixtureEmail(parsed.data.email)
      )
    ) {
      await assertRateLimit({
        key: createRateLimitKey("admin-login", parsed.data.email),
        limit: 5,
        windowMs: 15 * 60_000,
      });
    }

    if (auditTarget?.disabledAt) {
      await recordAdminLoginAudit({
        adminUserId: auditAdminUserId,
        email: parsed.data.email,
        outcome: "disabled",
        redirectTo,
      });

      return { message: inactiveAdminLoginMessage };
    }

    const verified = await verifyAdminCredentials({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (!verified) {
      await recordAdminLoginAudit({
        adminUserId: auditAdminUserId,
        email: parsed.data.email,
        outcome: "invalid_credentials",
        redirectTo,
      });

      return { message: inactiveAdminLoginMessage };
    }

    await recordAdminLoginAudit({
      adminUserId: auditAdminUserId,
      email: parsed.data.email,
      outcome: "success",
      redirectTo,
    });

    await setAdminLoginTicketCookie(
      mintAdminLoginTicket({
        adminUserId: verified.id,
        stage: "password_verified",
      }),
      "password_verified",
    );
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

    throw error;
  }

  redirect(`/admin/login/mfa?next=${encodeURIComponent(redirectTo)}`);
}

export async function adminLogoutAction() {
  await signOut({ redirectTo: "/admin/login" });
}
