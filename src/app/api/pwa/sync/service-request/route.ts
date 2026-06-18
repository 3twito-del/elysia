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
  offlineServiceRequestMetadataSchema,
  processOfflineServiceRequest,
} from "~/server/services/offline-sync";

export async function POST(req: Request) {
  let formData: FormData;

  try {
    formData = await req.formData();
  } catch {
    return badRequestJson("Invalid offline service request payload.");
  }

  const metadataValue = formData.get("metadata");

  if (typeof metadataValue !== "string") {
    return badRequestJson("Missing offline service request metadata.");
  }

  let metadataJson: unknown;

  try {
    metadataJson = JSON.parse(metadataValue) as unknown;
  } catch {
    return badRequestJson("Invalid offline service request metadata.");
  }

  const parsedMetadata =
    offlineServiceRequestMetadataSchema.safeParse(metadataJson);

  if (!parsedMetadata.success) {
    return badRequestJson(
      parsedMetadata.error.issues[0]?.message ??
        "Invalid offline service request metadata.",
    );
  }

  const files = formData.getAll("attachments").filter(isFile);

  try {
    await assertRateLimit({
      key: `pwa-service-sync:${getRequestIp(req)}`,
      limit: 20,
      windowMs: 60_000,
    });

    const result = await processOfflineServiceRequest({
      files,
      metadata: parsedMetadata.data,
    });

    return okJson(createOfflineSyncResponse([result]));
  } catch (error) {
    if (error instanceof RateLimitExceededError) {
      return rateLimitedJson(error, "Too many offline service sync requests.");
    }

    if (error instanceof z.ZodError) {
      return badRequestJson(
        error.issues[0]?.message ?? "Invalid offline service request.",
      );
    }

    return badRequestJson("Offline service request sync failed.");
  }
}

function isFile(value: FormDataEntryValue): value is File {
  return typeof File !== "undefined" && value instanceof File;
}
