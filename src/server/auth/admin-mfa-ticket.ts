// ADR 0005 (docs/DECISIONS.md): admin login is phased across password ->
// TOTP/recovery-code verification before any NextAuth session exists, so
// jwt/session callbacks (~/server/auth/admin-session.ts), src/proxy.ts, and
// src/server/api/trpc.ts never need to understand a "pending" auth state.
// This ticket is the side channel carrying that pending state, confined
// entirely to the login flow: signed (HMAC-SHA256, keyed from AUTH_SECRET)
// and short-lived. Deriving the signing key from AUTH_SECRET is safe here —
// unlike ~/server/auth/totp-encryption.ts's key — because the ticket only
// lives a few minutes; an AUTH_SECRET rotation mid-login just means
// restarting the (few-second) login, matching docs/RUNBOOKS.md §10's
// existing "admins re-login anyway" framing for that rotation.

import { createHmac, timingSafeEqual } from "node:crypto";

import { env } from "~/env";

export type AdminLoginTicketStage = "password_verified" | "mfa_verified";

export type AdminLoginTicketPayload = {
  adminUserId: string;
  stage: AdminLoginTicketStage;
  expiresAt: number;
};

const TICKET_CONTEXT = "elysia-admin-login-ticket-v1";

// password_verified: time to open an authenticator app / find a recovery
// code. mfa_verified: usually an immediate hand-off into signIn() — except
// right after a successful enrollment confirm, where it also has to survive
// the admin reading and saving 10 recovery codes before clicking continue,
// so it can't be as short as "immediate" implies.
export const ADMIN_LOGIN_TICKET_TTL_MS: Record<AdminLoginTicketStage, number> =
  {
    mfa_verified: 5 * 60_000,
    password_verified: 10 * 60_000,
  };

export function mintAdminLoginTicket(input: {
  adminUserId: string;
  stage: AdminLoginTicketStage;
  now?: number;
}) {
  const now = input.now ?? Date.now();
  const payload: AdminLoginTicketPayload = {
    adminUserId: input.adminUserId,
    expiresAt: now + ADMIN_LOGIN_TICKET_TTL_MS[input.stage],
    stage: input.stage,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString(
    "base64url",
  );

  return `${encodedPayload}.${signPayload(encodedPayload)}`;
}

export function verifyAdminLoginTicket(
  raw: string | undefined | null,
  opts: { expectedStage?: AdminLoginTicketStage; now?: number } = {},
): AdminLoginTicketPayload | null {
  if (!raw) {
    return null;
  }

  const dotIndex = raw.indexOf(".");

  if (dotIndex < 1) {
    return null;
  }

  const encodedPayload = raw.slice(0, dotIndex);
  const signature = raw.slice(dotIndex + 1);

  if (!signature || !timingSafeEqualStrings(signature, signPayload(encodedPayload))) {
    return null;
  }

  let payload: AdminLoginTicketPayload;

  try {
    payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    ) as AdminLoginTicketPayload;
  } catch {
    return null;
  }

  if (typeof payload.adminUserId !== "string" || !payload.adminUserId) {
    return null;
  }

  if (
    payload.stage !== "password_verified" &&
    payload.stage !== "mfa_verified"
  ) {
    return null;
  }

  if (typeof payload.expiresAt !== "number") {
    return null;
  }

  const now = opts.now ?? Date.now();

  if (payload.expiresAt <= now) {
    return null;
  }

  if (opts.expectedStage && payload.stage !== opts.expectedStage) {
    return null;
  }

  return payload;
}

function signPayload(encodedPayload: string) {
  return createHmac("sha256", env.AUTH_SECRET ?? "")
    .update(TICKET_CONTEXT)
    .update(encodedPayload)
    .digest("hex");
}

function timingSafeEqualStrings(a: string, b: string) {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);

  if (bufferA.length !== bufferB.length) {
    return false;
  }

  return timingSafeEqual(bufferA, bufferB);
}
