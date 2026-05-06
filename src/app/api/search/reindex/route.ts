import { auth } from "~/server/auth";
import {
  getAdminFromSession,
  hasAdminPermission,
} from "~/server/auth/admin-access";
import { searchProvider } from "~/server/adapters/search";
import {
  forbiddenJson,
  okJson,
  unauthorizedJson,
} from "~/server/http/api-response";
import { BUSINESS_EVENTS, enqueueOutboxEvent } from "~/server/services/outbox";

export const dynamic = "force-dynamic";

export async function POST() {
  const session = await auth();

  if (!session?.user) {
    return unauthorizedJson("Unauthorized.");
  }

  const admin = await getAdminFromSession(session);

  if (!admin || !hasAdminPermission(admin, "CATALOG_WRITE")) {
    return forbiddenJson("Forbidden.");
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

  return okJson({
    ok: true,
    ...result,
  });
}
