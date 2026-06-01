import { env } from "~/env";
import { notificationProvider } from "~/server/adapters/notifications";
import { db } from "~/server/db";
import { shouldFallbackToCatalogFixturesOnDatabaseError } from "~/server/services/catalog-fixtures";

export type HealthChecks = Awaited<ReturnType<typeof createHealthChecks>>;
export type HealthReadinessReport = ReturnType<typeof getHealthReadinessReport>;

export async function createHealthChecks() {
  const isVercelPreview = process.env.VERCEL_ENV === "preview";

  return {
    database: await checkDatabase(),
    search:
      env.TYPESENSE_HOST && env.TYPESENSE_API_KEY
        ? "configured"
        : "local-fallback",
    shopifyDropship:
      env.SHOPIFY_DROPSHIP_ENABLED &&
      env.SHOPIFY_STORE_DOMAIN &&
      (env.SHOPIFY_STOREFRONT_ACCESS_TOKEN ||
        env.SHOPIFY_ADMIN_ACCESS_TOKEN ||
        (env.SHOPIFY_CLIENT_ID && env.SHOPIFY_CLIENT_SECRET))
        ? "configured"
        : "optional-disabled",
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
        : "manual-checkout",
    jobs:
      env.JOB_RUNNER_SECRET || env.CRON_SECRET
        ? "secured"
        : isVercelPreview
          ? "preview-disabled"
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

export function getHealthReadinessReport(checks: HealthChecks) {
  const appChecks = {
    database: checks.database,
    email: checks.email,
    jobs: checks.jobs,
  };
  const optionalProviderChecks = {
    payment: checks.payment,
    search: checks.search,
    shopifyDropship: checks.shopifyDropship,
  };
  const appOk = areHealthStatusesOk(Object.values(appChecks));
  const optionalProvidersOk = areHealthStatusesOk(
    Object.values(optionalProviderChecks),
  );

  return {
    app: {
      checks: appChecks,
      ok: appOk,
      status: appOk ? "ready" : "blocked",
    },
    optionalProviders: {
      checks: optionalProviderChecks,
      ok: optionalProvidersOk,
      status: optionalProvidersOk ? "ready-or-disabled" : "blocked",
    },
    overall: {
      ok: getHealthOk(checks),
    },
  };
}

function areHealthStatusesOk(statuses: string[]) {
  return statuses.every(
    (status) => !["down", "missing", "missing-secret"].includes(status),
  );
}

async function checkDatabase() {
  try {
    await db.$queryRaw`SELECT 1`;
    return "up";
  } catch {
    return shouldFallbackToCatalogFixturesOnDatabaseError()
      ? "degraded-fallback"
      : "down";
  }
}
