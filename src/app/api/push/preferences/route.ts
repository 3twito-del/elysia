import { badRequestJson, okJson } from "~/server/http/api-response";
import {
  pushPreferencesInputSchema,
  updatePushPreferences,
} from "~/server/services/push";

export async function PATCH(req: Request) {
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return badRequestJson("Invalid push preferences payload.");
  }

  const parsed = pushPreferencesInputSchema.safeParse(body);

  if (!parsed.success) {
    return badRequestJson(
      parsed.error.issues[0]?.message ?? "Invalid push preferences payload.",
    );
  }

  const result = await updatePushPreferences(parsed.data);

  return okJson({ ok: true, updated: result.count });
}
