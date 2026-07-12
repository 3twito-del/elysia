import { beforeEach, describe, expect, it, vi } from "vitest";

import { currentTotpStep, totpCodeAtStep } from "~/server/auth/totp";

import {
  beginAdminMfaEnrollment,
  confirmAdminMfaEnrollment,
  getAdminMfaStatus,
  regenerateAdminRecoveryCodes,
  verifyAdminMfaCode,
} from "./admin-mfa";

const fake = vi.hoisted(() => ({
  state: {
    admin: null as Record<string, unknown> | null,
    auditEvents: [] as Array<Record<string, unknown>>,
    nextId: 1,
    recoveryCodes: [] as Array<{
      id: string;
      adminUserId: string;
      codeHash: string;
      usedAt: Date | null;
    }>,
  },
}));

vi.mock("~/server/db", () => {
  const dbMock = {
    adminRecoveryCode: {
      createMany: vi.fn(
        async ({ data }: { data: Array<{ adminUserId: string; codeHash: string }> }) => {
          for (const row of data) {
            fake.state.recoveryCodes.push({
              adminUserId: row.adminUserId,
              codeHash: row.codeHash,
              id: `rc_${fake.state.nextId++}`,
              usedAt: null,
            });
          }

          return { count: data.length };
        },
      ),
      deleteMany: vi.fn(async ({ where }: { where: { adminUserId: string } }) => {
        const before = fake.state.recoveryCodes.length;

        fake.state.recoveryCodes = fake.state.recoveryCodes.filter(
          (code) => code.adminUserId !== where.adminUserId,
        );

        return { count: before - fake.state.recoveryCodes.length };
      }),
      findMany: vi.fn(
        async ({
          where,
        }: {
          where: { adminUserId: string; usedAt: null };
        }) =>
          fake.state.recoveryCodes
            .filter((code) => code.adminUserId === where.adminUserId)
            .filter((code) => code.usedAt === where.usedAt)
            .map((code) => ({ ...code })),
      ),
      update: vi.fn(
        async ({
          data,
          where,
        }: {
          data: { usedAt: Date };
          where: { id: string };
        }) => {
          const code = fake.state.recoveryCodes.find(
            (candidate) => candidate.id === where.id,
          );

          if (!code) throw new Error("recovery code not found");

          Object.assign(code, data);

          return { ...code };
        },
      ),
    },
    adminUser: {
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) =>
        fake.state.admin?.id === where.id
          ? { ...fake.state.admin }
          : null,
      ),
      findUniqueOrThrow: vi.fn(async ({ where }: { where: { id: string } }) => {
        if (fake.state.admin?.id !== where.id) {
          throw new Error("admin not found");
        }

        return { ...fake.state.admin };
      }),
      update: vi.fn(
        async ({
          data,
          where,
        }: {
          data: Record<string, unknown>;
          where: { id: string };
        }) => {
          if (fake.state.admin?.id !== where.id) {
            throw new Error("admin not found");
          }

          fake.state.admin = { ...fake.state.admin, ...data };

          return { ...fake.state.admin };
        },
      ),
    },
    auditLog: {
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        fake.state.auditEvents.push(data);

        return { id: `audit_${fake.state.nextId++}`, ...data };
      }),
    },
  };

  (dbMock as { $transaction?: unknown }).$transaction = vi.fn(
    async (callback: (tx: typeof dbMock) => Promise<unknown>) =>
      callback(dbMock),
  );

  return { db: dbMock };
});

const ADMIN_ID = "admin_1";

function resetFakeAdmin() {
  fake.state.admin = {
    disabledAt: null,
    email: "admin@elysia.local",
    id: ADMIN_ID,
    passwordHash: "scrypt:salt:hash",
    totpEnabledAt: null,
    totpPendingExpiresAt: null,
    totpPendingSecretEncrypted: null,
    totpSecretEncrypted: null,
  };
  fake.state.recoveryCodes = [];
  fake.state.auditEvents = [];
}

beforeEach(() => {
  resetFakeAdmin();
});

describe("beginAdminMfaEnrollment", () => {
  it("generates a pending secret and an otpauth URI for the admin", async () => {
    const result = await beginAdminMfaEnrollment(ADMIN_ID);

    expect(result.secretBase32).toMatch(/^[A-Z2-7]+$/u);
    expect(result.otpauthUri).toContain("otpauth://totp/");
    expect(result.otpauthUri).toContain("issuer=Elysia");
    expect(result.otpauthUri).toContain(
      encodeURIComponent("Elysia:admin@elysia.local"),
    );
  });

  it("reuses the same pending secret on a second call before it expires", async () => {
    const first = await beginAdminMfaEnrollment(ADMIN_ID);
    const second = await beginAdminMfaEnrollment(ADMIN_ID);

    expect(second.secretBase32).toBe(first.secretBase32);
  });
});

describe("confirmAdminMfaEnrollment", () => {
  it("rejects when there is no pending enrollment", async () => {
    const result = await confirmAdminMfaEnrollment({
      adminUserId: ADMIN_ID,
      code: "123456",
    });

    expect(result).toEqual({ ok: false, reason: "no_pending_enrollment" });
  });

  it("rejects an invalid code and audits the failure", async () => {
    await beginAdminMfaEnrollment(ADMIN_ID);

    const result = await confirmAdminMfaEnrollment({
      adminUserId: ADMIN_ID,
      code: "000000",
    });

    expect(result).toEqual({ ok: false, reason: "invalid_code" });
    expect(fake.state.auditEvents).toContainEqual(
      expect.objectContaining({ action: "admin_totp.failed" }),
    );
  });

  it("rejects an expired pending enrollment", async () => {
    const { secretBase32 } = await beginAdminMfaEnrollment(ADMIN_ID);

    fake.state.admin!.totpPendingExpiresAt = new Date(Date.now() - 1_000);

    const code = totpCodeAtStep(secretBase32, currentTotpStep());
    const result = await confirmAdminMfaEnrollment({
      adminUserId: ADMIN_ID,
      code,
    });

    expect(result).toEqual({ ok: false, reason: "expired" });
  });

  it("enables MFA, issues 10 recovery codes, and audits both events on success", async () => {
    const { secretBase32 } = await beginAdminMfaEnrollment(ADMIN_ID);
    const code = totpCodeAtStep(secretBase32, currentTotpStep());

    const result = await confirmAdminMfaEnrollment({
      adminUserId: ADMIN_ID,
      code,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected success");
    expect(result.recoveryCodes).toHaveLength(10);
    expect(new Set(result.recoveryCodes).size).toBe(10);

    const status = await getAdminMfaStatus(ADMIN_ID);

    expect(status.enabled).toBe(true);
    expect(fake.state.admin?.totpPendingSecretEncrypted).toBeNull();
    expect(
      fake.state.auditEvents.map((event) => event.action),
    ).toEqual(
      expect.arrayContaining(["admin_mfa.enrolled", "admin_recovery_code.generated"]),
    );
  });
});

describe("verifyAdminMfaCode", () => {
  async function enrollAdmin() {
    const { secretBase32 } = await beginAdminMfaEnrollment(ADMIN_ID);
    const code = totpCodeAtStep(secretBase32, currentTotpStep());
    const result = await confirmAdminMfaEnrollment({
      adminUserId: ADMIN_ID,
      code,
    });

    if (!result.ok) throw new Error("enrollment failed in test setup");

    return { recoveryCodes: result.recoveryCodes, secretBase32 };
  }

  it("rejects when the admin hasn't enrolled yet", async () => {
    const result = await verifyAdminMfaCode({
      adminUserId: ADMIN_ID,
      code: "123456",
    });

    expect(result).toEqual({ ok: false, reason: "not_enrolled" });
  });

  it("accepts the current TOTP code", async () => {
    const { secretBase32 } = await enrollAdmin();
    const code = totpCodeAtStep(secretBase32, currentTotpStep());

    await expect(
      verifyAdminMfaCode({ adminUserId: ADMIN_ID, code }),
    ).resolves.toEqual({ ok: true, method: "totp" });
  });

  it("rejects a wrong TOTP code", async () => {
    await enrollAdmin();

    await expect(
      verifyAdminMfaCode({ adminUserId: ADMIN_ID, code: "000000" }),
    ).resolves.toEqual({ ok: false, reason: "invalid_code" });
  });

  it("accepts an unused recovery code and marks it used", async () => {
    const { recoveryCodes } = await enrollAdmin();
    const [firstCode] = recoveryCodes;

    const result = await verifyAdminMfaCode({
      adminUserId: ADMIN_ID,
      code: firstCode!,
    });

    expect(result).toEqual({ ok: true, method: "recovery_code" });
    expect(
      fake.state.recoveryCodes.filter((c) => c.usedAt !== null),
    ).toHaveLength(1);
  });

  it("rejects reusing an already-used recovery code", async () => {
    const { recoveryCodes } = await enrollAdmin();
    const [firstCode] = recoveryCodes;

    await verifyAdminMfaCode({ adminUserId: ADMIN_ID, code: firstCode! });

    await expect(
      verifyAdminMfaCode({ adminUserId: ADMIN_ID, code: firstCode! }),
    ).resolves.toEqual({ ok: false, reason: "invalid_code" });
  });
});

describe("regenerateAdminRecoveryCodes", () => {
  it("rejects when the admin hasn't enrolled yet", async () => {
    await expect(regenerateAdminRecoveryCodes(ADMIN_ID)).resolves.toEqual({
      ok: false,
      reason: "not_enrolled",
    });
  });

  it("replaces all recovery codes, invalidating prior unused ones", async () => {
    const { secretBase32 } = await beginAdminMfaEnrollment(ADMIN_ID);
    const code = totpCodeAtStep(secretBase32, currentTotpStep());
    const enrolled = await confirmAdminMfaEnrollment({
      adminUserId: ADMIN_ID,
      code,
    });

    if (!enrolled.ok) throw new Error("enrollment failed in test setup");

    const regenerated = await regenerateAdminRecoveryCodes(ADMIN_ID);

    expect(regenerated.ok).toBe(true);
    if (!regenerated.ok) throw new Error("expected success");
    expect(regenerated.recoveryCodes).toHaveLength(10);

    const oldCodeStillValid = await verifyAdminMfaCode({
      adminUserId: ADMIN_ID,
      code: enrolled.recoveryCodes[0]!,
    });

    expect(oldCodeStillValid).toEqual({ ok: false, reason: "invalid_code" });

    const newCodeValid = await verifyAdminMfaCode({
      adminUserId: ADMIN_ID,
      code: regenerated.recoveryCodes[0]!,
    });

    expect(newCodeValid).toEqual({ ok: true, method: "recovery_code" });
  });
});
