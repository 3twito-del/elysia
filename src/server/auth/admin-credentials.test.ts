import { beforeEach, describe, expect, it, vi } from "vitest";

import { verifyAdminCredentials } from "./admin-credentials";
import { hashPassword } from "./password";

const fake = vi.hoisted(() => ({
  admin: null as Record<string, unknown> | null,
}));

vi.mock("~/server/db", () => ({
  db: {
    adminUser: {
      findUnique: vi.fn(async ({ where }: { where: { email: string } }) =>
        fake.admin?.email === where.email
          ? { ...fake.admin }
          : null,
      ),
    },
  },
}));

describe("verifyAdminCredentials", () => {
  beforeEach(async () => {
    fake.admin = {
      disabledAt: null,
      email: "admin@elysia.local",
      id: "admin_1",
      passwordHash: await hashPassword("correct horse battery staple"),
    };
  });

  it("returns the admin identity on a matching password", async () => {
    await expect(
      verifyAdminCredentials({
        email: "admin@elysia.local",
        password: "correct horse battery staple",
      }),
    ).resolves.toEqual({ email: "admin@elysia.local", id: "admin_1" });
  });

  it("returns null for a wrong password", async () => {
    await expect(
      verifyAdminCredentials({
        email: "admin@elysia.local",
        password: "wrong password",
      }),
    ).resolves.toBeNull();
  });

  it("returns null for an unknown email", async () => {
    await expect(
      verifyAdminCredentials({
        email: "nobody@elysia.local",
        password: "correct horse battery staple",
      }),
    ).resolves.toBeNull();
  });

  it("returns null for a disabled admin", async () => {
    fake.admin!.disabledAt = new Date();

    await expect(
      verifyAdminCredentials({
        email: "admin@elysia.local",
        password: "correct horse battery staple",
      }),
    ).resolves.toBeNull();
  });
});
