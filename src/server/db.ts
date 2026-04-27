import { PrismaClient } from "@prisma/client";

import { env } from "~/env";

const createPrismaClient = () =>
  new PrismaClient({
    log: env.NODE_ENV === "development" ? ["query", "error", "warn"] : [],
  });

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export function getDb() {
  if (!env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required before accessing Prisma.");
  }

  globalForPrisma.prisma ??= createPrismaClient();

  return globalForPrisma.prisma;
}

export const db = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const value = Reflect.get(getDb(), prop, receiver);

    return typeof value === "function" ? value.bind(getDb()) : value;
  },
});
