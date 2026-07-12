// ADR 0005 (docs/DECISIONS.md): mandatory admin TOTP MFA. This service owns
// the enrollment/verification/recovery-code domain logic shared by the
// phased login server actions (src/app/admin/login/mfa/actions.ts) and the
// self-service settings surface (src/app/admin/security). Rate limiting for
// the guessable surfaces (TOTP code, recovery code) lives one layer up, in
// the callers — this module only knows about the domain, not abuse control.

import { isAdminUserEnabled } from "~/server/auth/admin-user-status";
import { hashPassword, verifyPassword } from "~/server/auth/password";
import {
  generateRecoveryCodes,
  normalizeRecoveryCodeInput,
  RECOVERY_CODE_COUNT,
} from "~/server/auth/recovery-codes";
import {
  buildOtpAuthUri,
  generateTotpSecret,
  verifyTotpCode,
} from "~/server/auth/totp";
import {
  decryptTotpSecret,
  encryptTotpSecret,
} from "~/server/auth/totp-encryption";
import { db } from "~/server/db";
import { recordAdminSecurityEvent } from "./admin-security";

const MFA_ISSUER = "Elysia";
const PENDING_ENROLLMENT_TTL_MS = 15 * 60_000;

export type AdminMfaStatus = {
  enabled: boolean;
  enrolledAt: Date | null;
};

/** Used only to attach an email to a rate-limit audit event before any
 * heavier MFA-verification lookup happens. */
export async function getAdminEmailForAudit(adminUserId: string) {
  const admin = await db.adminUser.findUnique({
    select: { email: true },
    where: { id: adminUserId },
  });

  return admin?.email ?? "unknown";
}

export async function getAdminMfaStatus(
  adminUserId: string,
): Promise<AdminMfaStatus> {
  const admin = await db.adminUser.findUniqueOrThrow({
    select: { totpEnabledAt: true },
    where: { id: adminUserId },
  });

  return {
    enabled: Boolean(admin.totpEnabledAt),
    enrolledAt: admin.totpEnabledAt,
  };
}

export async function beginAdminMfaEnrollment(adminUserId: string) {
  const admin = await db.adminUser.findUniqueOrThrow({
    select: {
      email: true,
      totpPendingExpiresAt: true,
      totpPendingSecretEncrypted: true,
    },
    where: { id: adminUserId },
  });

  const now = new Date();
  const pendingStillValid = Boolean(
    admin.totpPendingSecretEncrypted &&
      admin.totpPendingExpiresAt &&
      admin.totpPendingExpiresAt > now,
  );

  // Idempotent: a page refresh during enrollment reuses the same pending
  // secret (and thus the same QR) instead of silently invalidating it.
  const secretBase32 = pendingStillValid
    ? decryptTotpSecret(admin.totpPendingSecretEncrypted!)
    : generateTotpSecret();

  if (!pendingStillValid) {
    await db.adminUser.update({
      data: {
        totpPendingExpiresAt: new Date(
          now.getTime() + PENDING_ENROLLMENT_TTL_MS,
        ),
        totpPendingSecretEncrypted: encryptTotpSecret(secretBase32),
      },
      where: { id: adminUserId },
    });
  }

  return {
    otpauthUri: buildOtpAuthUri({
      accountLabel: admin.email,
      issuer: MFA_ISSUER,
      secretBase32,
    }),
    secretBase32,
  };
}

export type AdminMfaConfirmResult =
  | { ok: true; recoveryCodes: string[] }
  | {
      ok: false;
      reason: "disabled" | "no_pending_enrollment" | "expired" | "invalid_code";
    };

export async function confirmAdminMfaEnrollment(input: {
  adminUserId: string;
  code: string;
}): Promise<AdminMfaConfirmResult> {
  const admin = await db.adminUser.findUnique({
    where: { id: input.adminUserId },
  });

  if (!isAdminUserEnabled(admin)) {
    return { ok: false, reason: "disabled" };
  }

  if (!admin.totpPendingSecretEncrypted || !admin.totpPendingExpiresAt) {
    return { ok: false, reason: "no_pending_enrollment" };
  }

  if (admin.totpPendingExpiresAt <= new Date()) {
    return { ok: false, reason: "expired" };
  }

  const secretBase32 = decryptTotpSecret(admin.totpPendingSecretEncrypted);

  if (!verifyTotpCode(secretBase32, input.code)) {
    await recordAdminSecurityEvent({
      action: "admin_totp.failed",
      adminUserId: admin.id,
      email: admin.email,
      reason: "invalid-code",
    });

    return { ok: false, reason: "invalid_code" };
  }

  const recoveryCodes = generateRecoveryCodes(RECOVERY_CODE_COUNT);
  const hashedCodes = await Promise.all(
    recoveryCodes.map((code) => hashPassword(normalizeRecoveryCodeInput(code))),
  );

  await db.$transaction(async (tx) => {
    await tx.adminUser.update({
      data: {
        totpEnabledAt: new Date(),
        totpPendingExpiresAt: null,
        totpPendingSecretEncrypted: null,
        totpSecretEncrypted: encryptTotpSecret(secretBase32),
      },
      where: { id: admin.id },
    });
    await tx.adminRecoveryCode.deleteMany({ where: { adminUserId: admin.id } });
    await tx.adminRecoveryCode.createMany({
      data: hashedCodes.map((codeHash) => ({
        adminUserId: admin.id,
        codeHash,
      })),
    });
  });

  await recordAdminSecurityEvent({
    action: "admin_mfa.enrolled",
    adminUserId: admin.id,
    email: admin.email,
  });
  await recordAdminSecurityEvent({
    action: "admin_recovery_code.generated",
    adminUserId: admin.id,
    count: recoveryCodes.length,
    email: admin.email,
  });

  return { ok: true, recoveryCodes };
}

export type AdminMfaVerifyResult =
  | { ok: true; method: "totp" | "recovery_code" }
  | { ok: false; reason: "disabled" | "not_enrolled" | "invalid_code" };

export async function verifyAdminMfaCode(input: {
  adminUserId: string;
  code: string;
}): Promise<AdminMfaVerifyResult> {
  const admin = await db.adminUser.findUnique({
    where: { id: input.adminUserId },
  });

  if (!isAdminUserEnabled(admin)) {
    return { ok: false, reason: "disabled" };
  }

  if (!admin.totpEnabledAt || !admin.totpSecretEncrypted) {
    return { ok: false, reason: "not_enrolled" };
  }

  const trimmed = input.code.trim();

  if (/^\d{6}$/u.test(trimmed)) {
    const secretBase32 = decryptTotpSecret(admin.totpSecretEncrypted);

    if (verifyTotpCode(secretBase32, trimmed)) {
      return { ok: true, method: "totp" };
    }

    await recordAdminSecurityEvent({
      action: "admin_totp.failed",
      adminUserId: admin.id,
      email: admin.email,
      reason: "invalid-code",
    });

    return { ok: false, reason: "invalid_code" };
  }

  const normalizedInput = normalizeRecoveryCodeInput(trimmed);
  const unusedCodes = await db.adminRecoveryCode.findMany({
    where: { adminUserId: admin.id, usedAt: null },
  });
  const matches = await Promise.all(
    unusedCodes.map((recoveryCode) =>
      verifyPassword(normalizedInput, recoveryCode.codeHash),
    ),
  );
  const matchedIndex = matches.findIndex(Boolean);

  if (matchedIndex === -1) {
    await recordAdminSecurityEvent({
      action: "admin_totp.failed",
      adminUserId: admin.id,
      email: admin.email,
      reason: "invalid-code",
    });

    return { ok: false, reason: "invalid_code" };
  }

  const matchedCode = unusedCodes[matchedIndex]!;

  await db.adminRecoveryCode.update({
    data: { usedAt: new Date() },
    where: { id: matchedCode.id },
  });
  await recordAdminSecurityEvent({
    action: "admin_recovery_code.used",
    adminUserId: admin.id,
    email: admin.email,
    recoveryCodeId: matchedCode.id,
  });

  return { ok: true, method: "recovery_code" };
}

export type AdminRecoveryCodeRegenerateResult =
  | { ok: true; recoveryCodes: string[] }
  | { ok: false; reason: "not_enrolled" };

export async function regenerateAdminRecoveryCodes(
  adminUserId: string,
): Promise<AdminRecoveryCodeRegenerateResult> {
  const admin = await db.adminUser.findUniqueOrThrow({
    where: { id: adminUserId },
  });

  if (!admin.totpEnabledAt) {
    return { ok: false, reason: "not_enrolled" };
  }

  const recoveryCodes = generateRecoveryCodes(RECOVERY_CODE_COUNT);
  const hashedCodes = await Promise.all(
    recoveryCodes.map((code) => hashPassword(normalizeRecoveryCodeInput(code))),
  );

  await db.$transaction(async (tx) => {
    await tx.adminRecoveryCode.deleteMany({ where: { adminUserId } });
    await tx.adminRecoveryCode.createMany({
      data: hashedCodes.map((codeHash) => ({ adminUserId, codeHash })),
    });
  });

  await recordAdminSecurityEvent({
    action: "admin_recovery_code.generated",
    adminUserId: admin.id,
    count: recoveryCodes.length,
    email: admin.email,
  });

  return { ok: true, recoveryCodes };
}
