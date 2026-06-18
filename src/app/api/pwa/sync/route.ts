import { z } from "zod";

import {
  badRequestJson,
  okJson,
  rateLimitedJson,
} from "~/server/http/api-response";
import {
  assertRateLimit,
  getRequestIp,
  RateLimitExceededError,
} from "~/server/services/rate-limit";
import {
  createOfflineSyncResponse,
  offlineJsonSyncSchema,
  processOfflineJsonActions,
} from "~/server/services/offline-sync";

export async function POST(req: Request) {
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return badRequestJson("Invalid offline sync payload.");
  }

  const parsed = offlineJsonSyncSchema.safeParse(body);

  if (!parsed.success) {
    return badRequestJson(
      parsed.error.issues[0]?.message ?? "Invalid offline sync payload.",
    );
  }

  try {
    await assertRateLimit({
      key: `pwa-sync:${getRequestIp(req)}`,
      limit: 60,
      windowMs: 60_000,
    });

    const results = await processOfflineJsonActions(parsed.data.actions);

    return okJson(createOfflineSyncResponse(results));
  } catch (error) {
    if (error instanceof RateLimitExceededError) {
      return rateLimitedJson(error, "Too many offline sync requests.");
    }

    if (error instanceof z.ZodError) {
      return badRequestJson(
        error.issues[0]?.message ?? "Invalid offline sync action.",
      );
    }

    return badRequestJson("Offline sync failed.");
  }
}
