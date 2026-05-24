import { env } from "~/env";
import { notificationProvider } from "~/server/adapters/notifications";
import { db } from "~/server/db";

export type HealthChecks = Awaited<ReturnType<typeof createHealthChecks>>;

export async function createHealthChecks() {
  return {
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
}

export function getHealthOk(checks: HealthChecks) {
  return Object.values(checks).every(
    (status) => !["down", "missing", "missing-secret"].includes(status),
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
