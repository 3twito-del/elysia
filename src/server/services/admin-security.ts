// ADR 0005 (docs/DECISIONS.md): a failed admin login is security telemetry,
// not a rejected request. Every listed security event lands in the immutable
// AuditLog (ADR 0004 protects it below the service layer). Recording is
// best-effort by design — telemetry failure must never decide a login.

import { db } from "~/server/db";

export type AdminSecurityEvent =
  | {
      action: "admin_login.succeeded";
      adminUserId: string;
      email: string;
      ip?: string;
    }
  | {
      action: "admin_login.failed";
      adminUserId?: string | null;
      email: string;
      ip?: string;
      reason: "invalid-credentials" | "disabled";
    }
  | {
      action: "admin_login.rate_limited";
      email: string;
      ip?: string;
    };

export const ADMIN_SECURITY_ACTIONS = [
  "admin_login.succeeded",
  "admin_login.failed",
  "admin_login.rate_limited",
] as const;

export async function recordAdminSecurityEvent(event: AdminSecurityEvent) {
  try {
    await db.auditLog.create({
      data: {
        adminUserId:
          "adminUserId" in event ? (event.adminUserId ?? null) : null,
        action: event.action,
        entity: "AdminAuth",
        metadata: {
          email: event.email,
          ip: event.ip ?? null,
          ...("reason" in event ? { reason: event.reason } : {}),
        },
      },
    });
  } catch (error) {
    console.error("[admin-security:audit-failed]", event.action, error);
  }
}

/**
 * ADR 0007 SECURITY invariant input: recent failed / rate-limited admin
 * logins that no operator has reviewed yet.
 */
export async function countRecentAdminLoginFailures(input: {
  windowMinutes: number;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const since = new Date(now.getTime() - input.windowMinutes * 60_000);

  return db.auditLog.count({
    where: {
      action: { in: ["admin_login.failed", "admin_login.rate_limited"] },
      createdAt: { gte: since },
    },
  });
}
