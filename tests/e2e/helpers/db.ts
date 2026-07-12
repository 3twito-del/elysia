import { PrismaClient } from "@prisma/client";

// K-01: role-scoped E2E needs to assert audit-log side effects, not just UI
// state. A single lazily-created client for the whole e2e run — this is
// test-only code, never bundled into the app.
let client: PrismaClient | null = null;

export function getTestDb() {
  client ??= new PrismaClient();

  return client;
}
