import { spawnSync } from "node:child_process";

const shouldRun =
  process.env.VERCEL === "1" &&
  process.env.VERCEL_ENV === "production" &&
  process.env.SKIP_VERCEL_PRODUCTION_MIGRATE !== "1";

if (!shouldRun) {
  process.exit(0);
}

if (!process.env.DATABASE_URL?.trim()) {
  console.error(
    "[vercel-production-migrate] DATABASE_URL is required for production migrations.",
  );
  process.exit(1);
}

console.log("[vercel-production-migrate] Applying Prisma migrations.");

const prismaMigrationArgs = ["prisma", "migrate", "deploy"];
const migrationInvocation =
  process.platform === "win32"
    ? {
        args: [
          "/d",
          "/s",
          "/c",
          `pnpm exec ${prismaMigrationArgs.join(" ")}`,
        ],
        command: "cmd.exe",
      }
    : { args: ["exec", ...prismaMigrationArgs], command: "pnpm" };

const result = spawnSync(
  migrationInvocation.command,
  migrationInvocation.args,
  {
    env: process.env,
    shell: false,
    stdio: "inherit",
  },
);

if (result.error) {
  console.error(
    `[vercel-production-migrate] Failed to start migration command: ${result.error.message}`,
  );
  process.exit(1);
}

if (result.signal) {
  console.error(
    `[vercel-production-migrate] Migration command exited with signal ${result.signal}.`,
  );
  process.exit(1);
}

if ((result.status ?? 1) !== 0) {
  console.error(
    `[vercel-production-migrate] Migration command exited with status ${result.status ?? "unknown"}.`,
  );
  process.exit(result.status ?? 1);
}

// Migrations applied — idempotently ensure the chart of accounts exists so the
// general ledger can post in production (FIN-GL-001). Best-effort: a seed
// failure must not fail the deploy (GL postings no-op until accounts exist).
console.log("[vercel-production-migrate] Seeding chart of accounts.");

const seedArgs = [
  "prisma",
  "db",
  "execute",
  "--file",
  "scripts/seed-ledger.sql",
  "--schema",
  "prisma/schema.prisma",
];
const seedInvocation =
  process.platform === "win32"
    ? {
        args: ["/d", "/s", "/c", `pnpm exec ${seedArgs.join(" ")}`],
        command: "cmd.exe",
      }
    : { args: ["exec", ...seedArgs], command: "pnpm" };

const seedResult = spawnSync(seedInvocation.command, seedInvocation.args, {
  env: process.env,
  shell: false,
  stdio: "inherit",
});

if ((seedResult.status ?? 1) !== 0) {
  console.warn(
    "[vercel-production-migrate] Chart-of-accounts seed did not complete; GL postings will no-op until the accounts exist.",
  );
}

process.exit(0);
