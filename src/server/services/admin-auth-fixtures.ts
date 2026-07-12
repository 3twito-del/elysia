// K-01 (docs/TASKS.md): role-scoped E2E admin auth needs a deterministic way
// to reach a fully-enrolled admin session (password + TOTP) without a real
// authenticator app or manually-seeded credentials. Mirrors the existing
// customer-auth-fixtures.ts pattern and reuses its same E2E-only gate.

import type { AdminPermission } from "@prisma/client";
import { z } from "zod";

import { hashPassword } from "~/server/auth/password";
import {
  generateRecoveryCodes,
  normalizeRecoveryCodeInput,
  RECOVERY_CODE_COUNT,
} from "~/server/auth/recovery-codes";
import { generateTotpSecret } from "~/server/auth/totp";
import { encryptTotpSecret } from "~/server/auth/totp-encryption";
import { db } from "~/server/db";
import { CUSTOMER_AUTH_FIXTURE_FLAG } from "./customer-auth-fixtures";

export const ADMIN_AUTH_FIXTURE_DEFAULTS = {
  password: "E2eAdminFixturePassword42!",
  roleNameFull: "E2E Fixture — Full Access",
  roleNameLimited: "E2E Fixture — Catalog Only",
} as const;

const ADMIN_AUTH_FIXTURE_ROLES: Record<
  "full" | "limited",
  { email: string; name: string; permissions: AdminPermission[]; roleName: string }
> = {
  full: {
    email: "e2e.admin.full@elysia.local",
    name: "E2E Full Admin",
    permissions: ["SYSTEM"],
    roleName: ADMIN_AUTH_FIXTURE_DEFAULTS.roleNameFull,
  },
  limited: {
    email: "e2e.admin.limited@elysia.local",
    name: "E2E Limited Admin",
    permissions: ["CATALOG_READ"],
    roleName: ADMIN_AUTH_FIXTURE_DEFAULTS.roleNameLimited,
  },
};

const adminAuthFixtureInputSchema = z.object({
  role: z.enum(["full", "limited"]).default("full"),
});

export class AdminAuthFixturesDisabledError extends Error {
  constructor() {
    super("Admin auth fixtures are disabled.");
    this.name = "AdminAuthFixturesDisabledError";
  }
}

// Same flag/guard as customer-auth-fixtures.ts (~/server/services/customer-auth-fixtures)
// — one E2E-only switch for the whole fixture surface, not a second flag to keep in sync.
export function shouldUseAdminAuthFixtures(
  env: Record<string, string | undefined> = process.env,
) {
  return (
    env[CUSTOMER_AUTH_FIXTURE_FLAG] === "1" &&
    !(env.VERCEL === "1" && env.VERCEL_ENV === "production")
  );
}

export async function createAdminAuthFixture(input: unknown = {}) {
  if (!shouldUseAdminAuthFixtures()) {
    throw new AdminAuthFixturesDisabledError();
  }

  const { role } = adminAuthFixtureInputSchema.parse(input ?? {});
  const definition = ADMIN_AUTH_FIXTURE_ROLES[role];

  const password = ADMIN_AUTH_FIXTURE_DEFAULTS.password;
  const passwordHash = await hashPassword(password);
  const totpSecret = generateTotpSecret();
  const totpSecretEncrypted = encryptTotpSecret(totpSecret);
  const recoveryCodes = generateRecoveryCodes(RECOVERY_CODE_COUNT);
  const recoveryCodeHashes = await Promise.all(
    recoveryCodes.map((code) => hashPassword(normalizeRecoveryCodeInput(code))),
  );

  const fixtureRole = await db.role.upsert({
    create: { name: definition.roleName, permissions: definition.permissions },
    update: { permissions: definition.permissions },
    where: { name: definition.roleName },
  });

  const admin = await db.adminUser.upsert({
    create: {
      email: definition.email,
      name: definition.name,
      passwordHash,
      roleId: fixtureRole.id,
      totpEnabledAt: new Date(),
      totpSecretEncrypted,
    },
    update: {
      disabledAt: null,
      passwordHash,
      roleId: fixtureRole.id,
      totpEnabledAt: new Date(),
      totpPendingExpiresAt: null,
      totpPendingSecretEncrypted: null,
      totpSecretEncrypted,
    },
    where: { email: definition.email },
  });

  await db.adminRecoveryCode.deleteMany({ where: { adminUserId: admin.id } });
  await db.adminRecoveryCode.createMany({
    data: recoveryCodeHashes.map((codeHash) => ({
      adminUserId: admin.id,
      codeHash,
    })),
  });

  return {
    adminUserId: admin.id,
    email: definition.email,
    password,
    recoveryCodes,
    roleName: definition.roleName,
    totpSecret,
  };
}
