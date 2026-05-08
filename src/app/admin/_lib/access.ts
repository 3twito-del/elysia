import type { AdminPermission } from "@prisma/client";
import { redirect } from "next/navigation";

import { auth } from "~/server/auth";
import {
  getAdminFromSession,
  hasAdminPermission,
  type AuthorizedAdmin,
} from "~/server/auth/admin-access";

export type AdminAccessDenied = {
  detail: string;
  title: string;
};

export async function getAdminPageAccess(
  permission: AdminPermission,
): Promise<
  | { admin: AuthorizedAdmin; denied?: never }
  | { admin: AuthorizedAdmin | null; denied: AdminAccessDenied }
> {
  const session = await auth();

  if (!session?.user) {
    redirect("/admin/login?next=/admin");
  }

  const admin = await getAdminFromSession(session).catch((error: unknown) => {
    if (process.env.NODE_ENV === "development") {
      console.error("[admin] failed to load admin session", error);
    }

    return null;
  });

  if (!admin) {
    return {
      admin: null,
      denied: {
        detail:
          "המשתמש המחובר אינו משויך לאדמין פעיל עם סיסמה והרשאות. יש להתחבר עם משתמש אדמין שנוצר דרך seed.",
        title: "אין הרשאת אדמין פעילה",
      },
    };
  }

  if (!hasAdminPermission(admin, permission)) {
    return {
      admin,
      denied: {
        detail: `תפקיד האדמין המחובר אינו כולל הרשאת ${permission} או SYSTEM.`,
        title: "אין הרשאה למסך המבוקש",
      },
    };
  }

  return { admin };
}
