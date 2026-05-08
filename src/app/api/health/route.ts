import { env } from "~/env";
import { auth } from "~/server/auth";
import { getAdminFromSession } from "~/server/auth/admin-access";
import { notificationProvider } from "~/server/adapters/notifications";
import { db } from "~/server/db";
import { okJson } from "~/server/http/api-response";

export const dynamic = "force-dynamic";

export async function GET() {
  const detailed = await canReadDetailedHealth();
  const checks = {
    database: await checkDatabase(),
    search:
      env.TYPESENSE_HOST && env.TYPESENSE_API_KEY
        ? "configured"
        : "local-fallback",
    email: notificationProvider.isOperational()
      ? notificationProvider.providerName()
      : env.NODE_ENV === "production"
        ? "missing"
        : "mock-fallback",
    payment:
      env.CARD_COM_TERMINAL &&
      env.CARD_COM_API_NAME &&
      env.CARD_COM_API_PASSWORD &&
      env.CARD_COM_WEBHOOK_SECRET
        ? "configured"
        : env.NODE_ENV === "production"
          ? "missing"
          : "mock-fallback",
    jobs:
      env.JOB_RUNNER_SECRET || env.CRON_SECRET
        ? "secured"
        : env.NODE_ENV === "production"
          ? "missing-secret"
          : "dev-open",
  };
  const ok = Object.values(checks).every(
    (status) => !["down", "missing", "missing-secret"].includes(status),
  );

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

async function checkDatabase() {
  try {
    await db.$queryRaw`SELECT 1`;
    return "up";
  } catch {
    return "down";
  }
}

async function canReadDetailedHealth() {
  if (env.NODE_ENV !== "production") return true;

  const session = await auth().catch(() => null);
  const admin = await getAdminFromSession(session).catch(() => null);

  return Boolean(admin?.permissions.includes("SYSTEM"));
}
