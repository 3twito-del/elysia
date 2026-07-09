import { describe, expect, it } from "vitest";

import {
  ADMIN_SESSION_MAX_AGE_MS,
  type AdminAuthorityFields,
  applyAdminAuthorityToToken,
  resolveActiveAdminAuthority,
} from "./admin-session";

const now = Date.parse("2026-07-08T12:00:00Z");

function emptyToken(): AdminAuthorityFields {
  return {};
}

describe("admin session token logic (ADR 0005)", () => {
  it("stamps a 12-hour admin expiry at admin sign-in", () => {
    const token = applyAdminAuthorityToToken(
      emptyToken(),
      { adminUserId: "admin_1", permissions: ["SYSTEM_CONFIG"] },
      now,
    );

    expect(token.adminUserId).toBe("admin_1");
    expect(token.adminSessionExpiresAt).toBe(now + ADMIN_SESSION_MAX_AGE_MS);
  });

  it("does not stamp customer sign-ins with admin expiry", () => {
    const token = applyAdminAuthorityToToken(
      emptyToken(),
      { adminUserId: null, permissions: [] },
      now,
    );

    expect(token.adminUserId).toBeNull();
    expect(token.adminSessionExpiresAt).toBeUndefined();
  });

  it("strips expired admin authority on token refresh", () => {
    const token = applyAdminAuthorityToToken(
      {
        adminUserId: "admin_1",
        permissions: ["SYSTEM_CONFIG"],
        adminSessionExpiresAt: now - 1_000,
      },
      null,
      now,
    );

    expect(token.adminUserId).toBeNull();
    expect(token.permissions).toEqual([]);
    expect(token.adminSessionExpiresAt).toBeUndefined();
  });

  it("keeps active admin authority intact on refresh", () => {
    const token = applyAdminAuthorityToToken(
      {
        adminUserId: "admin_1",
        permissions: ["SYSTEM_CONFIG"],
        adminSessionExpiresAt: now + 60_000,
      },
      null,
      now,
    );

    expect(token.adminUserId).toBe("admin_1");
    expect(token.permissions).toEqual(["SYSTEM_CONFIG"]);
  });

  it("never surfaces admin authority through the session once expired", () => {
    expect(
      resolveActiveAdminAuthority(
        {
          adminUserId: "admin_1",
          permissions: ["SYSTEM_CONFIG"],
          adminSessionExpiresAt: now - 1_000,
        },
        now,
      ),
    ).toEqual({ adminUserId: null, permissions: [] });

    expect(
      resolveActiveAdminAuthority(
        {
          adminUserId: "admin_1",
          permissions: ["SYSTEM_CONFIG"],
          adminSessionExpiresAt: now + 1_000,
        },
        now,
      ),
    ).toEqual({ adminUserId: "admin_1", permissions: ["SYSTEM_CONFIG"] });
  });
});
