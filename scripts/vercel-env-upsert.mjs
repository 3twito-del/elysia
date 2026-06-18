import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { execSync } from "node:child_process";

const defaultKeys = [
  "AUTH_SECRET",
  "DATABASE_URL",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
  "STORE_FROM_EMAIL",
  "STORE_FROM_NAME",
  "OPERATIONS_EMAIL",
  "CARD_COM_TERMINAL",
  "CARD_COM_API_NAME",
  "CARD_COM_API_PASSWORD",
  "CARD_COM_WEBHOOK_SECRET",
  "SMS_PROVIDER_API_KEY",
  "TYPESENSE_HOST",
  "TYPESENSE_API_KEY",
  "TYPESENSE_PORT",
  "TYPESENSE_PROTOCOL",
  "JOB_RUNNER_SECRET",
  "CRON_SECRET",
  "SITE_URL",
  "SHOPIFY_DROPSHIP_ENABLED",
  "SHOPIFY_DROPSHIP_SYNC_ENABLED",
  "SHOPIFY_STORE_DOMAIN",
  "SHOPIFY_CLIENT_ID",
  "SHOPIFY_CLIENT_SECRET",
  "SHOPIFY_STOREFRONT_ACCESS_TOKEN",
  "SHOPIFY_WEBHOOK_SECRET",
  "SHOPIFY_API_VERSION",
];

const plainKeys = new Set([
  "SITE_URL",
  "SHOPIFY_DROPSHIP_ENABLED",
  "SHOPIFY_DROPSHIP_SYNC_ENABLED",
  "SHOPIFY_STORE_DOMAIN",
  "SHOPIFY_API_VERSION",
  "STORE_FROM_NAME",
  "TYPESENSE_PORT",
  "TYPESENSE_PROTOCOL",
]);
const guardedEnabledFlags = new Set([
  "SHOPIFY_DROPSHIP_ENABLED",
  "SHOPIFY_DROPSHIP_SYNC_ENABLED",
]);

const argv = process.argv.slice(2);
const options = parseArgs(argv);
const envValues = { ...loadEnv(options.envFiles), ...process.env };
const rows = [];

if (!existsSync(".vercel/project.json")) {
  throw new Error("Missing .vercel/project.json. Run `vercel link` first.");
}

const project = JSON.parse(readFileSync(".vercel/project.json", "utf8"));
const token = options.write ? getVercelToken() : undefined;
const branch =
  options.branch === "current"
    ? execSync("git branch --show-current", { encoding: "utf8" }).trim()
    : options.branch;

for (const key of options.keys) {
  const value = envValues[key]?.trim() ?? "";

  if (!value) {
    rows.push({
      key,
      presentInSource: false,
      status: "skipped-missing-source-value",
      target: options.target,
    });
    continue;
  }

  const guardedStatus = getGuardedStatus({ key, options, value });

  if (guardedStatus) {
    rows.push({
      key,
      presentInSource: true,
      status: guardedStatus,
      target: options.target,
    });
    continue;
  }

  if (!options.write) {
    rows.push({
      key,
      presentInSource: true,
      status: "dry-run",
      target: options.target,
      type: getVercelEnvType(key),
    });
    continue;
  }

  rows.push(
    await upsertVercelEnv({
      branch,
      key,
      project,
      target: options.target,
      token,
      value,
    }),
  );
}

console.log(
  JSON.stringify({ ok: !rows.some((row) => row.status === "failed"), rows }, null, 2),
);
process.exitCode = rows.some((row) => row.status === "failed") ? 1 : 0;

function parseArgs(args) {
  const parsed = {
    allowEnabledFlags: false,
    allowLocalDatabaseUrl: false,
    branch: "current",
    envFiles: [".env", ".env.local", ".env.production.local"],
    keys: defaultKeys,
    target: "production",
    write: false,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    const next = args[index + 1];

    if (arg === "--write") {
      parsed.write = true;
    } else if (arg === "--allow-enabled-flags") {
      parsed.allowEnabledFlags = true;
    } else if (arg === "--allow-local-database-url") {
      parsed.allowLocalDatabaseUrl = true;
    } else if (arg === "--target" && next) {
      parsed.target = next;
      index += 1;
    } else if (arg === "--branch" && next) {
      parsed.branch = next;
      index += 1;
    } else if (arg === "--env-file" && next) {
      parsed.envFiles.push(next);
      index += 1;
    } else if (arg === "--keys" && next) {
      parsed.keys = next
        .split(/[,\s]+/u)
        .map((key) => key.trim())
        .filter(Boolean);
      index += 1;
    }
  }

  if (!["production", "preview", "development"].includes(parsed.target)) {
    throw new Error("--target must be production, preview, or development.");
  }

  if (parsed.target !== "preview") {
    parsed.branch = undefined;
  }

  return parsed;
}

function getGuardedStatus({ key, options, value }) {
  if (
    guardedEnabledFlags.has(key) &&
    !options.allowEnabledFlags &&
    isTruthy(value)
  ) {
    return "skipped-unsafe-enabled-feature-flag";
  }

  if (
    key === "DATABASE_URL" &&
    !options.allowLocalDatabaseUrl &&
    ["production", "preview"].includes(options.target) &&
    isLocalDatabaseUrl(value)
  ) {
    return "skipped-local-database-url";
  }

  return null;
}

function loadEnv(files) {
  const values = new Map();

  for (const filename of files) {
    if (!existsSync(filename)) continue;

    for (const line of readFileSync(filename, "utf8").split(/\r?\n/u)) {
      const match = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)?\s*$/u.exec(
        line,
      );

      if (!match?.[1]) continue;

      values.set(match[1], parseEnvValue(match[2] ?? ""));
    }
  }

  return Object.fromEntries(values);
}

function parseEnvValue(value) {
  const trimmed = value.trim();
  const quoted =
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"));

  return quoted ? trimmed.slice(1, -1) : trimmed;
}

function getVercelToken() {
  const candidates = [
    join(homedir(), ".vercel", "auth.json"),
    process.env.APPDATA
      ? join(process.env.APPDATA, "xdg.data", "com.vercel.cli", "auth.json")
      : "",
    process.env.APPDATA
      ? join(process.env.APPDATA, "com.vercel.cli", "Data", "auth.json")
      : "",
  ].filter(Boolean);

  for (const file of candidates) {
    if (!existsSync(file)) continue;

    const auth = JSON.parse(readFileSync(file, "utf8"));
    const token = auth.token ?? auth.authToken ?? auth.bearerToken;

    if (token) return token;
  }

  throw new Error("Missing Vercel auth token. Run `vercel login` first.");
}

function getVercelEnvType(key) {
  return plainKeys.has(key) ? "plain" : "encrypted";
}

function isTruthy(value) {
  return value === "1" || value.toLowerCase() === "true";
}

function isLocalDatabaseUrl(value) {
  try {
    const url = new URL(value);

    return ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  } catch {
    return false;
  }
}

async function upsertVercelEnv({ branch, key, project, target, token, value }) {
  const url = new URL(
    `https://api.vercel.com/v10/projects/${project.projectId}/env`,
  );
  url.searchParams.set("teamId", project.orgId);
  url.searchParams.set("upsert", "true");

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      gitBranch: branch,
      key,
      target: [target],
      type: getVercelEnvType(key),
      value,
    }),
  });
  const payload = await response.json().catch(() => ({}));

  return {
    key,
    status:
      response.ok && !payload.failed?.length ? "upserted" : "failed",
    target,
    type: getVercelEnvType(key),
    code: payload.error?.code ?? payload.failed?.[0]?.error?.code ?? null,
  };
}
