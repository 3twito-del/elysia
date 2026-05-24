import { env } from "~/env";
import { auth } from "~/server/auth";
import { getAdminFromSession } from "~/server/auth/admin-access";
import { okJson } from "~/server/http/api-response";
import { createHealthChecks, getHealthOk } from "~/server/services/health";

export const dynamic = "force-dynamic";

export async function GET() {
  const detailed = await canReadDetailedHealth();
  const checks = await createHealthChecks();
  const ok = getHealthOk(checks);

  return okJson(
    detailed
      ? {
          ok,
          checks,
          timestamp: new Date().toISOString(),
        }
      : {
          ok,
          timestamp: new Date().toISOString(),
        },
    { status: ok ? 200 : 503 },
  );
}

async function canReadDetailedHealth() {
  if (env.NODE_ENV !== "production") return true;

  const session = await auth().catch(() => null);
  const admin = await getAdminFromSession(session).catch(() => null);

  return Boolean(admin?.permissions.includes("SYSTEM"));
}
