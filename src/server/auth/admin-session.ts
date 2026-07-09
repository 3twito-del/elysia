// ADR 0005 (docs/DECISIONS.md): admin sessions are capped at 12 hours,
// separately from customer sessions. Long customer sessions are a usability
// decision; long admin sessions are a control failure. This module is pure
// and edge-safe — it is shared by the NextAuth jwt callback and the edge
// middleware in src/middleware.ts.

export const ADMIN_SESSION_MAX_AGE_MS = 12 * 60 * 60 * 1000;

export type AdminSessionTokenFields = {
  adminUserId?: string | null;
  adminSessionExpiresAt?: number;
};

/**
 * Admin authority is active only when the token carries an admin identity AND
 * an unexpired admin-session stamp. Tokens without the stamp (including any
 * minted before this control shipped) carry no admin authority — the operator
 * re-authenticates once rather than holding an unbounded session.
 */
export function hasActiveAdminAuthority(
  token: AdminSessionTokenFields | null | undefined,
  now: number = Date.now(),
) {
  if (!token?.adminUserId) {
    return false;
  }

  if (typeof token.adminSessionExpiresAt !== "number") {
    return false;
  }

  return token.adminSessionExpiresAt > now;
}

export type AdminAuthorityFields = AdminSessionTokenFields & {
  permissions?: string[];
};

/**
 * jwt-callback logic (pure): stamp admin expiry at sign-in, strip expired
 * admin authority on refresh. Customer identity on the token is untouched.
 */
export function applyAdminAuthorityToToken<T extends AdminAuthorityFields>(
  token: T,
  user:
    | { adminUserId?: string | null; permissions?: string[] }
    | null
    | undefined,
  now: number = Date.now(),
): T {
  if (user) {
    token.adminUserId = user.adminUserId ?? null;
    token.permissions = user.permissions ?? [];
    token.adminSessionExpiresAt = user.adminUserId
      ? now + ADMIN_SESSION_MAX_AGE_MS
      : undefined;

    return token;
  }

  if (token.adminUserId && !hasActiveAdminAuthority(token, now)) {
    token.adminUserId = null;
    token.permissions = [];
    token.adminSessionExpiresAt = undefined;
  }

  return token;
}

/**
 * session-callback logic (pure): admin identity and permissions surface only
 * while the admin session stamp is active.
 */
export function resolveActiveAdminAuthority(
  token: AdminAuthorityFields | null | undefined,
  now: number = Date.now(),
) {
  const active = hasActiveAdminAuthority(token ?? null, now);

  return {
    adminUserId: active ? (token?.adminUserId ?? null) : null,
    permissions: active ? (token?.permissions ?? []) : [],
  };
}
