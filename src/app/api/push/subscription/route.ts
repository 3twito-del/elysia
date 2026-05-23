import { z } from "zod";

import { badRequestJson, okJson } from "~/server/http/api-response";
import { revokePushSubscription } from "~/server/services/push";

const deleteSchema = z.object({
  deviceId: z.string().trim().min(8).max(128).optional(),
  endpoint: z.string().url().max(2048).optional(),
});

export async function DELETE(req: Request) {
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return badRequestJson("Invalid push subscription payload.");
  }

  const parsed = deleteSchema.safeParse(body);

  if (!parsed.success || (!parsed.data.deviceId && !parsed.data.endpoint)) {
    return badRequestJson(
      parsed.success
        ? "Missing push subscription identifier."
        : (parsed.error.issues[0]?.message ??
            "Invalid push subscription payload."),
    );
  }

  const result = await revokePushSubscription(parsed.data);

  return okJson({ ok: true, updated: result.count });
}
