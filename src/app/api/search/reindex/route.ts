import { auth } from "~/server/auth";
import {
  getAdminFromSession,
  hasAdminPermission,
} from "~/server/auth/admin-access";
import { searchProvider } from "~/server/adapters/search";
import {
  badRequestJson,
  forbiddenJson,
  okJson,
  payloadTooLargeJson,
  rateLimitedJson,
  serviceUnavailableJson,
  unauthorizedJson,
} from "~/server/http/api-response";
import { readSafeText } from "~/server/http/safe-json";
import { BUSINESS_EVENTS, enqueueOutboxEvent } from "~/server/services/outbox";
import {
  assertRateLimit,
  getRequestIp,
  RateLimitExceededError,
} from "~/server/services/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    await assertRateLimit({
      key: `search-reindex:${getRequestIp(req)}`,
      limit: 10,
      windowMs: 60_000,
    });
  } catch (error) {
    if (error instanceof RateLimitExceededError) {
      return rateLimitedJson(error, "Too many search reindex requests.");
    }

    throw error;
  }

  const session = await auth();

  if (!session?.user) {
    return unauthorizedJson("Unauthorized.");
  }

  const admin = await getAdminFromSession(session);

  if (!admin || !hasAdminPermission(admin, "CATALOG_WRITE")) {
    return forbiddenJson("Forbidden.");
  }

  const payload = await readSafeText(req, {
    allowEmpty: true,
    maxBytes: 1024,
  });

  if (!payload.ok) {
    if (payload.error === "too-large") {
      return payloadTooLargeJson("Search reindex payload is too large.");
    }

    return badRequestJson("Search reindex does not accept a request body.");
  }

  if (payload.text.trim()) {
    return badRequestJson("Search reindex does not accept a request body.");
  }

  let result: Awaited<ReturnType<typeof searchProvider.indexProducts>>;

  try {
    result = await searchProvider.indexProducts();
  } catch (error) {
    console.error("[search:reindex-failed]", error);

    return serviceUnavailableJson("Search reindex provider is unavailable.");
  }

  let auditEvent: Awaited<ReturnType<typeof enqueueOutboxEvent>>;

  try {
    auditEvent = await enqueueOutboxEvent({
      type: BUSINESS_EVENTS.searchReindexRequested,
      aggregateType: "SearchIndex",
      aggregateId: "products",
      idempotencyKey: `${BUSINESS_EVENTS.searchReindexRequested}:products:${Date.now()}`,
      payload: {
        requestedBy: admin.id,
        embedded: result.embedded ?? 0,
        embeddingDimension: result.embeddingDimension ?? null,
        embeddingModel: result.embeddingModel ?? null,
        indexed: result.indexed,
        engine: result.engine,
        semantic: result.semantic ?? false,
      },
    });
  } catch (error) {
    console.error("[search:reindex-audit-failed]", error);

    return serviceUnavailableJson("Search reindex audit is unavailable.");
  }

  return okJson({
    ok: true,
    audit: {
      enqueued: true,
      eventId: auditEvent.id,
    },
    ...result,
  });
}
