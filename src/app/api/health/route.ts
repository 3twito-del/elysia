import { env } from "~/env";
import { auth } from "~/server/auth";
import { getAdminFromSession } from "~/server/auth/admin-access";
import { okJson } from "~/server/http/api-response";
import {
  createHealthChecks,
  getHealthOk,
  getHealthReadinessReport,
} from "~/server/services/health";
import { getOperationalHeartbeats } from "~/server/services/operational-alerts";

export const dynamic = "force-dynamic";

export async function GET() {
  const detailed = await canReadDetailedHealth();
  const checks = await createHealthChecks();
  const ok = getHealthOk(checks);

  // ADR 0007 §4: coarse public status only; worker/sweep heartbeats and open
  // P0 alert counts are private/admin detail so health can expose a stale
  // scheduler without leaking operational internals publicly.
  const heartbeats = detailed
    ? await getOperationalHeartbeats().catch(() => null)
    : null;

  return okJson(
    detailed
      ? {
          ok,
          checks,
          heartbeats,
          readiness: getHealthReadinessReport(checks),
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
