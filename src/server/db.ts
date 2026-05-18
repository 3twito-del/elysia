import { PrismaClient } from "@prisma/client";

import { env } from "~/env";

const transientPrismaErrorCodes = new Set([
  "P1001",
  "P1002",
  "P1008",
  "P1017",
  "P2024",
]);
const transientPrismaRetryDelaysMs = [150, 450, 900];
const prismaProxyCache = new WeakMap<object, unknown>();
const nonProductionConnectionDefaults = {
  connect_timeout: "5",
  connection_limit: "5",
  pool_timeout: "5",
  socket_timeout: "15",
} as const;

const createPrismaClient = (databaseUrl: string) =>
  new PrismaClient({
    datasourceUrl: getRuntimePrismaDatasourceUrl(databaseUrl),
    log: env.NODE_ENV === "development" ? ["query", "error", "warn"] : [],
    transactionOptions: {
      maxWait: 5_000,
      timeout: 15_000,
    },
  });

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaWithRetries: PrismaClient | undefined;
};

export function getDb() {
  if (!env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required before accessing Prisma.");
  }

  globalForPrisma.prisma ??= createPrismaClient(env.DATABASE_URL);

  return globalForPrisma.prisma;
}

function getDbWithRetries() {
  globalForPrisma.prismaWithRetries ??= createRetryProxy(getDb());

  return globalForPrisma.prismaWithRetries;
}

export const db = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const value = Reflect.get(getDbWithRetries(), prop, receiver);

    return typeof value === "function" ? value.bind(getDbWithRetries()) : value;
  },
});

function createRetryProxy<T extends object>(target: T): T {
  const cached = prismaProxyCache.get(target);

  if (cached) return cached as T;

  const proxy = new Proxy(target, {
    get(currentTarget, prop, receiver) {
      const value = Reflect.get(currentTarget, prop, receiver);

      if (typeof value === "function") {
        return (...args: unknown[]) =>
          retryTransientPrismaError(() =>
            (value as (...input: unknown[]) => unknown).apply(
              currentTarget,
              args,
            ),
          );
      }

      if (value && typeof value === "object") {
        return createRetryProxy(value);
      }

      return value;
    },
  });

  prismaProxyCache.set(target, proxy);

  return proxy;
}

async function retryTransientPrismaError<T>(
  operation: () => T,
): Promise<Awaited<T>> {
  for (let attempt = 0; attempt <= transientPrismaRetryDelaysMs.length; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      const shouldRetry =
        attempt < transientPrismaRetryDelaysMs.length &&
        isTransientPrismaError(error);

      if (!shouldRetry) throw error;

      await wait(transientPrismaRetryDelaysMs[attempt] ?? 0);
    }
  }

  throw new Error("Unreachable Prisma retry state.");
}

function isTransientPrismaError(error: unknown) {
  const code =
    error && typeof error === "object" && "code" in error
      ? (error as { code?: unknown }).code
      : undefined;
  const message = error instanceof Error ? error.message : "";

  return (
    (typeof code === "string" && transientPrismaErrorCodes.has(code)) ||
    /Can't reach database server|Timed out fetching a new connection|Unable to start a transaction|Connection pool timeout/i.test(
      message,
    )
  );
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getRuntimePrismaDatasourceUrl(databaseUrl: string) {
  if (env.NODE_ENV === "production") return databaseUrl;

  return addPrismaConnectionDefaults(databaseUrl);
}

export function addPrismaConnectionDefaults(databaseUrl: string) {
  try {
    const url = new URL(databaseUrl);

    if (url.protocol !== "postgresql:" && url.protocol !== "postgres:") {
      return databaseUrl;
    }

    for (const [key, value] of Object.entries(
      nonProductionConnectionDefaults,
    )) {
      if (!url.searchParams.has(key)) {
        url.searchParams.set(key, value);
      }
    }

    return url.toString();
  } catch {
    return databaseUrl;
  }
}
