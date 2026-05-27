import { createHash } from "node:crypto";
import type { Prisma } from "@prisma/client";

import { db } from "~/server/db";

export type AdminLoginAuditOutcome =
  | "invalid_credentials"
  | "rate_limited"
  | "success";

type AdminLoginAuditInput = {
  adminUserId?: string | null;
  email: string;
  outcome: AdminLoginAuditOutcome;
  redirectTo: string;
  retryAfterSeconds?: number;
};

export async function findAdminUserIdForLoginAudit(email: string) {
  const admin = await db.adminUser.findUnique({
    select: { id: true },
    where: { email: email.trim().toLowerCase() },
  });

  return admin?.id ?? null;
}

export async function recordAdminLoginAudit(input: AdminLoginAuditInput) {
  try {
    await db.auditLog.create({
      data: {
        action: `admin_login_${input.outcome}`,
        adminUserId: input.adminUserId ?? null,
        entity: "AdminSession",
        entityId: input.adminUserId ?? null,
        metadata: createAdminLoginAuditMetadata(input),
      },
    });
  } catch (error) {
    console.error("[admin-login:audit-failed]", error);
  }
}

export function createAdminLoginAuditMetadata(input: AdminLoginAuditInput) {
  const metadata: Prisma.JsonObject = {
    emailHash: hashAdminLoginEmail(input.email),
    outcome: input.outcome,
    redirectTo: input.redirectTo,
  };

  if (typeof input.retryAfterSeconds === "number") {
    metadata.retryAfterSeconds = input.retryAfterSeconds;
  }

  return metadata;
}

function hashAdminLoginEmail(email: string) {
  return createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
}
