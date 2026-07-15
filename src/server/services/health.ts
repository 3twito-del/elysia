import { env } from "~/env";
import { checkTypesenseConnectivity } from "~/server/adapters/search";
import { notificationProvider } from "~/server/adapters/notifications";
import { db } from "~/server/db";
import { shouldFallbackToCatalogFixturesOnDatabaseError } from "~/server/services/catalog-fixtures";

export type HealthChecks = Awaited<ReturnType<typeof createHealthChecks>>;
export type HealthReadinessReport = ReturnType<typeof getHealthReadinessReport>;

export async function createHealthChecks() {
  const isVercelPreview = process.env.VERCEL_ENV === "preview";

  return {
    database: await checkDatabase(),
    search: await checkSearch(),
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

// A bare "credentials are set" check can't distinguish a live provider from
// a deleted/expired one -- host+key stay present while every search
// silently runs on the local fallback path with no signal anywhere. `search`
// stays in optionalProviderChecks (never gates overall readiness: search is
// demoted-by-design per docs/RUNBOOKS.md's Typesense outage runbook), but
// the status value itself must tell "reachable" apart from "configured but
// currently broken" for that runbook -- and any future alerting -- to have
// something real to act on.
async function checkSearch() {
  const status = await checkTypesenseConnectivity();

  if (status === "not-configured") return "local-fallback";

  return status === "reachable" ? "configured" : "unreachable";
}
