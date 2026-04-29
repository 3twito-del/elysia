import { NextResponse } from "next/server";

import { env } from "~/env";
import { notificationProvider } from "~/server/adapters/notifications";
import { db } from "~/server/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks = {
    database: await checkDatabase(),
    search:
      env.TYPESENSE_HOST && env.TYPESENSE_API_KEY
        ? "configured"
        : "local-fallback",
    email: notificationProvider.isOperational()
      ? "configured"
      : env.NODE_ENV === "production"
        ? "missing"
        : "mock-fallback",
    payment:
      env.CARD_COM_TERMINAL &&
      env.CARD_COM_API_NAME &&
      env.CARD_COM_API_PASSWORD
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

  return NextResponse.json(
    {
      ok,
      checks,
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
