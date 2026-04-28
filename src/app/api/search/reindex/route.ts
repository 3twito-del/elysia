import { NextResponse } from "next/server";

import { auth } from "~/server/auth";
import {
  getAdminFromSession,
  hasAdminPermission,
} from "~/server/auth/admin-access";
import { searchProvider } from "~/server/adapters/search";

export const dynamic = "force-dynamic";

export async function POST() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const admin = await getAdminFromSession(session);

  if (!admin || !hasAdminPermission(admin, "CATALOG")) {
    return NextResponse.json(
      { ok: false, error: "Forbidden" },
      { status: 403 },
    );
  }

  const result = await searchProvider.indexProducts();

  return NextResponse.json({
    ok: true,
    ...result,
  });
}
