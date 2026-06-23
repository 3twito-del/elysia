import { auth } from "~/server/auth";
import {
  getAdminFromSession,
  hasAdminPermission,
} from "~/server/auth/admin-access";
import {
  forbiddenJson,
  okJson,
  unauthorizedJson,
} from "~/server/http/api-response";
import { getAdminLiveInsights } from "~/server/services/analytics-insights";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await auth();

  if (!session?.user) {
    return unauthorizedJson("Unauthorized.");
  }

  const admin = await getAdminFromSession(session);

  if (!admin || !hasAdminPermission(admin, "ANALYTICS_READ")) {
    return forbiddenJson("Forbidden.");
  }

  const url = new URL(req.url);
  const data = await getAdminLiveInsights({
    cursor: url.searchParams.get("cursor"),
  });

  return okJson(
    { ok: true, ...data },
    {
      headers: {
        "cache-control": "no-store",
      },
    },
  );
}
