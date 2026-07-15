import { spawn } from "node:child_process";

const isVercelProductionBuild =
  process.env.VERCEL === "1" && process.env.VERCEL_ENV === "production";

// Enabled for every build (including production). This env var only lives in
// the `next build` process spawned below and its render workers — runtime
// serverless functions never see it — so a transient database outage during
// prerendering (e.g. Prisma P1002) degrades to seed fixtures instead of
// failing the whole build, while runtime request handling stays strict. ISR
// revalidation refreshes pages from the live database once it is reachable.
const buildPhaseEnv = {
  CATALOG_DB_ERROR_FALLBACK: process.env.CATALOG_DB_ERROR_FALLBACK ?? "1",
};

const nonProductionBuildEnv = isVercelProductionBuild
  ? buildPhaseEnv
  : {
      ...buildPhaseEnv,
      AI_SEMANTIC_SEARCH_ENABLED:
        process.env.AI_SEMANTIC_SEARCH_ENABLED ?? "false",
      E2E_CATALOG_FIXTURES: process.env.E2E_CATALOG_FIXTURES ?? "1",
      TYPESENSE_API_KEY: process.env.TYPESENSE_API_KEY ?? "",
      TYPESENSE_HOST: process.env.TYPESENSE_HOST ?? "",
    };

// --webpack: Turbopack is this Next.js version's default bundler (matching
// why `dev` already forces it too), but Turbopack has a known, tracked,
// unresolved nonce-propagation bug for dynamically-loaded script chunks
// (vercel/next.js#64037) that broke this app's strict-dynamic CSP live in
// production on every /search page load -- 2 script tags silently missing
// their nonce, blocked by the browser, confirmed via a real production
// console-error reproduction (docs/QA_EVIDENCE.md ->
// g-11-turbopack-csp-nonce-incident). webpack has none of these violations.
const nextInvocation =
  process.platform === "win32"
    ? { args: ["/d", "/s", "/c", "next build --webpack"], command: "cmd.exe" }
    : { args: ["build", "--webpack"], command: "next" };

const child = spawn(nextInvocation.command, nextInvocation.args, {
  env: { ...process.env, ...nonProductionBuildEnv },
  stdio: "inherit",
});

child.once("exit", (code, signal) => {
  if (signal) {
    process.exitCode = 1;
    return;
  }

  process.exitCode = code ?? 1;
});
