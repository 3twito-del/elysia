"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

import { signIn } from "~/server/auth";
import {
  clearAdminLoginTicketCookie,
  clearAdminMfaRecoveryRevealCookie,
  getAdminLoginTicketCookie,
  setAdminLoginTicketCookie,
  setAdminMfaRecoveryRevealCookie,
} from "~/server/auth/admin-login-ticket-cookie";
import {
  mintAdminLoginTicket,
  verifyAdminLoginTicket,
} from "~/server/auth/admin-mfa-ticket";
import { sanitizeAdminRedirect } from "~/server/auth/admin-redirect";
import {
  confirmAdminMfaEnrollment,
  getAdminEmailForAudit,
  verifyAdminMfaCode,
} from "~/server/services/admin-mfa";
import { recordAdminSecurityEvent } from "~/server/services/admin-security";
import {
  assertRateLimit,
  createRateLimitKey,
  rateLimitMessage,
} from "~/server/services/rate-limit";

const MFA_INVALID_CODE_MESSAGE = "קוד שגוי. נסו שוב.";
const MFA_SESSION_EXPIRED_MESSAGE = "פג תוקף תהליך ההתחברות. יש להתחבר מחדש.";

function getFormCode(formData: FormData) {
  const value = formData.get("code");

  return typeof value === "string" ? value : "";
}

export type AdminMfaEnrollState = {
  message?: string;
};

export type AdminMfaVerifyState = {
  message?: string;
};

async function requirePasswordVerifiedTicket() {
  const ticket = await getAdminLoginTicketCookie();

  return verifyAdminLoginTicket(ticket, {
    expectedStage: "password_verified",
  });
}

/** Returns a user-facing message if rate-limited (and audits it), else null. */
async function assertAdminMfaRateLimit(adminUserId: string) {
  try {
    await assertRateLimit({
      key: createRateLimitKey("admin-mfa", adminUserId),
      limit: 5,
      windowMs: 15 * 60_000,
    });

    return null;
  } catch (error) {
    const message = rateLimitMessage(error);

    if (!message) {
      throw error;
    }

    await recordAdminSecurityEvent({
      action: "admin_totp.rate_limited",
      adminUserId,
      email: await getAdminEmailForAudit(adminUserId),
    });

    return message;
  }
}

async function finalizeAdminSession(ticket: string, redirectTo: string) {
  try {
    await signIn("admin", { redirect: false, redirectTo, ticket });
  } catch (error) {
    await clearAdminLoginTicketCookie();

    if (error instanceof AuthError) {
      redirect("/admin/login");
    }

    throw error;
  }

  await clearAdminLoginTicketCookie();
  await clearAdminMfaRecoveryRevealCookie();
  redirect(redirectTo);
}

export async function adminMfaConfirmEnrollAction(
  _state: AdminMfaEnrollState,
  formData: FormData,
): Promise<AdminMfaEnrollState> {
  const payload = await requirePasswordVerifiedTicket();

  if (!payload) {
    redirect("/admin/login");
  }

  const rateLimited = await assertAdminMfaRateLimit(payload.adminUserId);

  if (rateLimited) {
    return { message: rateLimited };
  }

  const code = getFormCode(formData);
  const result = await confirmAdminMfaEnrollment({
    adminUserId: payload.adminUserId,
    code,
  });

  if (!result.ok) {
    return {
      message:
        result.reason === "expired" || result.reason === "no_pending_enrollment"
          ? MFA_SESSION_EXPIRED_MESSAGE
          : MFA_INVALID_CODE_MESSAGE,
    };
  }

  // Persisted (not returned via useActionState) because the recovery-codes
  // reveal is a genuine full re-render of /admin/login/mfa, not an in-place
  // client update: Next.js re-renders the enclosing Server Component as part
  // of processing this same action, and by then getAdminMfaStatus() already
  // reports "enabled" — a client-only "just confirmed" state would be
  // discarded the moment that re-render swaps the page to the verify UI. A
  // short-lived cookie survives that re-render (and an accidental refresh).
  await setAdminLoginTicketCookie(
    mintAdminLoginTicket({
      adminUserId: payload.adminUserId,
      stage: "mfa_verified",
    }),
    "mfa_verified",
  );
  await setAdminMfaRecoveryRevealCookie(result.recoveryCodes);

  const redirectTo = sanitizeAdminRedirect(formData.get("next"));

  redirect(`/admin/login/mfa?next=${encodeURIComponent(redirectTo)}`);
}

export async function adminMfaFinalizeAction(formData: FormData) {
  const ticket = await getAdminLoginTicketCookie();
  const payload = verifyAdminLoginTicket(ticket, {
    expectedStage: "mfa_verified",
  });

  if (!payload || !ticket) {
    redirect("/admin/login");
  }

  const redirectTo = sanitizeAdminRedirect(formData.get("next"));

  await finalizeAdminSession(ticket, redirectTo);
}

export async function adminMfaVerifyAction(
  _state: AdminMfaVerifyState,
  formData: FormData,
): Promise<AdminMfaVerifyState> {
  const payload = await requirePasswordVerifiedTicket();

  if (!payload) {
    redirect("/admin/login");
  }

  const redirectTo = sanitizeAdminRedirect(formData.get("next"));
  const rateLimited = await assertAdminMfaRateLimit(payload.adminUserId);

  if (rateLimited) {
    return { message: rateLimited };
  }

  const code = getFormCode(formData);
  const result = await verifyAdminMfaCode({
    adminUserId: payload.adminUserId,
    code,
  });

  if (!result.ok) {
    return { message: MFA_INVALID_CODE_MESSAGE };
  }

  // No persisted ticket needed here — unlike enrollment, there is nothing to
  // show between a successful verify and the final signIn.
  const mfaTicket = mintAdminLoginTicket({
    adminUserId: payload.adminUserId,
    stage: "mfa_verified",
  });

  await finalizeAdminSession(mfaTicket, redirectTo);

  return {};
}
