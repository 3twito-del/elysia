import { TRPCError } from "@trpc/server";
import type { AdminPermission } from "@prisma/client";
import type { Session } from "next-auth";

import { db } from "~/server/db";

export type AuthorizedAdmin = {
  id: string;
  email: string;
  name: string;
  roleName: string;
  permissions: AdminPermission[];
};

const impliedPermissions: Partial<Record<AdminPermission, AdminPermission[]>> =
  {
    CATALOG: ["CATALOG_READ", "CATALOG_WRITE"],
    INVENTORY: ["INVENTORY_READ", "INVENTORY_WRITE"],
    ORDERS: ["ORDERS_READ", "ORDERS_WRITE", "ORDERS_REFUND"],
    CUSTOMER_SERVICE: ["CUSTOMER_VIEW", "CUSTOMER_WRITE"],
  };

export async function getAdminFromSession(
  session: Session | null,
): Promise<AuthorizedAdmin | null> {
  const adminUserId = session?.user.adminUserId;

  if (!adminUserId) {
    return null;
  }

  const admin = await db.adminUser.findUnique({
    where: { id: adminUserId },
    include: { role: true },
  });

  if (!admin?.passwordHash) {
    return null;
  }

  return {
    id: admin.id,
    email: admin.email,
    name: admin.name,
    roleName: admin.role.name,
    permissions: admin.role.permissions,
  };
}

export function hasAdminPermission(
  admin: AuthorizedAdmin,
  permission: AdminPermission,
) {
  return (
    admin.permissions.includes("SYSTEM") ||
    admin.permissions.includes(permission) ||
    admin.permissions.some((adminPermission) =>
      (impliedPermissions[adminPermission] ?? []).includes(permission),
    )
  );
}

export function assertAdminAccess(input: {
  sessionUserId?: string | null;
  admin: AuthorizedAdmin | null;
  permission: AdminPermission;
}): AuthorizedAdmin {
  if (!input.sessionUserId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  if (!input.admin || !hasAdminPermission(input.admin, input.permission)) {
    throw new TRPCError({ code: "FORBIDDEN" });
  }

  return input.admin;
}
