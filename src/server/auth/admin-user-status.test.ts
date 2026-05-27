import { describe, expect, it } from "vitest";

import { isAdminUserEnabled } from "./admin-user-status";

describe("admin user status", () => {
  it("allows admins with a password and no disable timestamp", () => {
    expect(
      isAdminUserEnabled({
        disabledAt: null,
        passwordHash: "hash",
      }),
    ).toBe(true);
  });

  it("rejects disabled admins", () => {
    expect(
      isAdminUserEnabled({
        disabledAt: new Date("2026-05-27T00:00:00.000Z"),
        passwordHash: "hash",
      }),
    ).toBe(false);
  });

  it("rejects admins without a password hash", () => {
    expect(
      isAdminUserEnabled({
        disabledAt: null,
        passwordHash: null,
      }),
    ).toBe(false);
  });
});
