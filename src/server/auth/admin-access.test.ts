import { TRPCError } from "@trpc/server";
import { describe, expect, it } from "vitest";

import { assertAdminAccess, hasAdminPermission } from "./admin-access";
import type { AuthorizedAdmin } from "./admin-access";

const ordersAdmin: AuthorizedAdmin = {
  id: "admin_1",
  email: "admin@elysia.local",
  name: "Admin",
  roleName: "Orders",
  permissions: ["ORDERS"],
};

describe("admin access", () => {
  it("allows explicit permissions", () => {
    expect(hasAdminPermission(ordersAdmin, "ORDERS")).toBe(true);
  });

  it("allows broad permissions to satisfy granular checks", () => {
    expect(hasAdminPermission(ordersAdmin, "ORDERS_REFUND")).toBe(true);
  });

  it("allows SYSTEM to act as a super permission", () => {
    expect(
      hasAdminPermission(
        { ...ordersAdmin, permissions: ["SYSTEM"] },
        "INVENTORY",
      ),
    ).toBe(true);
  });

  it("rejects unauthenticated admin procedures", () => {
    expect(() =>
      assertAdminAccess({
        sessionUserId: null,
        admin: null,
        permission: "ORDERS",
      }),
    ).toThrow(TRPCError);
  });

  it("rejects authenticated users without the required permission", () => {
    expect(() =>
      assertAdminAccess({
        sessionUserId: "user_1",
        admin: { ...ordersAdmin, permissions: ["CATALOG"] },
        permission: "ORDERS",
      }),
    ).toThrow(TRPCError);
  });
});
