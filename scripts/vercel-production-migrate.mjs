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

const packageRunner = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const result = spawnSync(packageRunner, ["prisma", "migrate", "deploy"], {
  env: process.env,
  shell: false,
  stdio: "inherit",
});

if (result.signal) {
  console.error(
    `[vercel-production-migrate] Migration command exited with signal ${result.signal}.`,
  );
  process.exit(1);
}

process.exit(result.status ?? 1);
