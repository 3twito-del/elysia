import { describe, expect, it } from "vitest";

import {
  ADMIN_SESSION_MAX_AGE_MS,
  hasActiveAdminAuthority,
} from "./admin-session";

const now = Date.parse("2026-07-08T12:00:00Z");

describe("hasActiveAdminAuthority (ADR 0005)", () => {
  it("grants authority only with an admin id and an unexpired stamp", () => {
    expect(
      hasActiveAdminAuthority(
        { adminUserId: "admin_1", adminSessionExpiresAt: now + 1_000 },
        now,
      ),
    ).toBe(true);
  });

  it("denies expired admin sessions", () => {
    expect(
      hasActiveAdminAuthority(
        { adminUserId: "admin_1", adminSessionExpiresAt: now - 1 },
        now,
      ),
    ).toBe(false);
  });

  it("denies tokens without the admin-session stamp (including legacy tokens)", () => {
    expect(hasActiveAdminAuthority({ adminUserId: "admin_1" }, now)).toBe(
      false,
    );
  });

  it("denies customer and anonymous tokens", () => {
    expect(hasActiveAdminAuthority({ adminUserId: null }, now)).toBe(false);
    expect(hasActiveAdminAuthority(null, now)).toBe(false);
    expect(hasActiveAdminAuthority(undefined, now)).toBe(false);
  });

  it("caps the admin session at 12 hours", () => {
    expect(ADMIN_SESSION_MAX_AGE_MS).toBe(12 * 60 * 60 * 1000);
  });
});
