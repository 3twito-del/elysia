import { NextResponse } from "next/server";

import { auth } from "~/server/auth";
import {
  getAdminFromSession,
  hasAdminPermission,
} from "~/server/auth/admin-access";
import { searchProvider } from "~/server/adapters/search";
import { BUSINESS_EVENTS, enqueueOutboxEvent } from "~/server/services/outbox";

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

  if (!admin || !hasAdminPermission(admin, "CATALOG_WRITE")) {
    return NextResponse.json(
      { ok: false, error: "Forbidden" },
      { status: 403 },
    );
  }

  const result = await searchProvider.indexProducts();

  await enqueueOutboxEvent({
    type: BUSINESS_EVENTS.searchReindexRequested,
    aggregateType: "SearchIndex",
    aggregateId: "products",
    idempotencyKey: `${BUSINESS_EVENTS.searchReindexRequested}:products:${Date.now()}`,
    payload: {
      requestedBy: admin.id,
      indexed: result.indexed,
      engine: result.engine,
    },
  });

  return NextResponse.json({
    ok: true,
    ...result,
  });
}
