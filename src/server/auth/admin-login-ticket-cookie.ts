// ADR 0005: carries the phased-login ticket (~/server/auth/admin-mfa-ticket)
// between the password action, the MFA page/actions, and the final signIn
// call. httpOnly + scoped to /admin/login so it's never readable client-side
// and is only ever sent back to the login flow itself.

import { cookies } from "next/headers";

import {
  ADMIN_LOGIN_TICKET_TTL_MS,
  type AdminLoginTicketStage,
} from "./admin-mfa-ticket";

export const ADMIN_LOGIN_TICKET_COOKIE = "admin_login_ticket";

export async function setAdminLoginTicketCookie(
  ticket: string,
  stage: AdminLoginTicketStage,
) {
  const store = await cookies();

  store.set(ADMIN_LOGIN_TICKET_COOKIE, ticket, {
    httpOnly: true,
    maxAge: Math.ceil(ADMIN_LOGIN_TICKET_TTL_MS[stage] / 1000),
    path: "/admin/login",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function getAdminLoginTicketCookie() {
  const store = await cookies();

  return store.get(ADMIN_LOGIN_TICKET_COOKIE)?.value ?? null;
}

export async function clearAdminLoginTicketCookie() {
  const store = await cookies();

  // Cookie identity includes path — deleting without the matching path the
  // cookie was set with (below) is a silent no-op in most browsers.
  store.delete({ name: ADMIN_LOGIN_TICKET_COOKIE, path: "/admin/login" });
}

// Carries the just-generated recovery codes from confirmAdminMfaEnrollAction
// to the recovery-codes-reveal screen via an actual redirect/full render
// (not client-side useActionState) — Next.js re-renders the enclosing
// Server Component as part of the same action response, which would
// otherwise discard a client-only "just confirmed" state the moment the
// server-computed enrollment status flips to enabled. Not a trust boundary
// (nothing reads this cookie to grant authority), so it's a plain JSON
// value rather than a signed ticket — short-lived and cleared once shown.
const ADMIN_MFA_RECOVERY_REVEAL_COOKIE = "admin_mfa_recovery_reveal";
// Matches the mfa_verified ticket TTL — the "continue" button needs both to
// still be valid together.
const RECOVERY_REVEAL_TTL_SECONDS = ADMIN_LOGIN_TICKET_TTL_MS.mfa_verified / 1000;

export async function setAdminMfaRecoveryRevealCookie(codes: string[]) {
  const store = await cookies();

  store.set(ADMIN_MFA_RECOVERY_REVEAL_COOKIE, JSON.stringify(codes), {
    httpOnly: true,
    maxAge: RECOVERY_REVEAL_TTL_SECONDS,
    path: "/admin/login",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function getAdminMfaRecoveryRevealCodes() {
  const store = await cookies();
  const raw = store.get(ADMIN_MFA_RECOVERY_REVEAL_COOKIE)?.value;

  if (!raw) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);

    return Array.isArray(parsed) && parsed.every((code) => typeof code === "string")
      ? parsed
      : null;
  } catch {
    return null;
  }
}

export async function clearAdminMfaRecoveryRevealCookie() {
  const store = await cookies();

  store.delete({ name: ADMIN_MFA_RECOVERY_REVEAL_COOKIE, path: "/admin/login" });
}
