import { spawn, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import net from "node:net";
import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";
import { pathToFileURL } from "node:url";

const defaultPreviewPort = Number(process.env.GATE_PREVIEW_PORT ?? 3002);
const previewReadyTimeoutMs = Number(
  process.env.GATE_PREVIEW_TIMEOUT_MS ?? 120_000,
);
const previewStopTimeoutMs = Number(
  process.env.GATE_PREVIEW_STOP_TIMEOUT_MS ?? 10_000,
);

const fixSteps = [
  step("Format Prisma schema", "pnpm", ["exec", "prisma", "format"]),
  step("Convert public images to AVIF", "node", [
    "scripts/convert-public-images-to-avif.mjs",
  ]),
  step("Apply ESLint fixes", "pnpm", ["exec", "eslint", ".", "--fix"]),
  step("Apply Prettier formatting", "pnpm", [
    "exec",
    "prettier",
    "--write",
    "**/*.{ts,tsx,js,jsx,mdx}",
    "--cache",
  ]),
  prismaGenerateStep(),
];

export const gateDefinitions = [
  {
    name: "gate:list",
    description: "Print the manual gate catalog.",
    action: "list",
  },
  {
    name: "gate:fix",
    description: "Run deterministic auto-fixers only.",
    steps: fixSteps,
  },
  {
    name: "gate:quick",
    description:
      "Run formatting, lint, typecheck, Prisma validation, and AVIF checks without writing files.",
    steps: [
      step("Check formatting", "pnpm", ["format:check"]),
      step("Lint", "pnpm", ["lint"]),
      step("Typecheck", "pnpm", ["typecheck"]),
      step("Validate Prisma schema", "pnpm", ["exec", "prisma", "validate"]),
      step("Check AVIF assets and references", "node", [
        "scripts/convert-public-images-to-avif.mjs",
        "--check",
      ]),
    ],
  },
  {
    name: "gate:test",
    description: "Run Vitest unit and integration tests without writing files.",
    steps: [step("Run Vitest", "pnpm", ["test"])],
  },
  {
    name: "gate:db",
    description:
      "Validate Prisma, deploy migrations, seed, and check migration status.",
    steps: [
      step("Validate Prisma schema", "pnpm", ["exec", "prisma", "validate"]),
      step("Deploy database migrations", "pnpm", ["db:migrate"]),
      step("Seed database", "pnpm", ["db:seed"]),
      step("Check migration status", "pnpm", [
        "exec",
        "prisma",
        "migrate",
        "status",
      ]),
    ],
  },
  {
    name: "gate:build",
    description:
      "Run a production Next.js build without writing source assets.",
    steps: [buildStep()],
  },
  {
    name: "gate:smoke",
    description: "Build, start preview, then run HTTP smoke checks.",
    preview: true,
    steps: [
      step("Run smoke checks", "node", ["scripts/smoke.mjs"], {
        env: ({ baseUrl }) => ({ SMOKE_BASE_URL: baseUrl }),
      }),
    ],
  },
  {
    name: "gate:e2e",
    description: "Build, start preview, then run Playwright flows.",
    preview: true,
    steps: [
      step("Run Playwright", "pnpm", ["e2e"], {
        env: ({ baseUrl }) => ({ E2E_BASE_URL: baseUrl }),
      }),
    ],
  },
  {
    name: "gate:visual",
    description: "Build, start preview, then run agent-browser visual QA.",
    preview: true,
    steps: [
      step("Run visual QA", powerShellCommand(), [
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-File",
        "scripts/visual-qa-agent-browser.ps1",
        "-BaseUrl",
        ({ baseUrl }) => baseUrl,
      ]),
    ],
  },
  {
    name: "gate:runtime",
    description:
      "Build once, start preview, then run smoke, e2e, visual QA, and performance QA.",
    preview: true,
    steps: [
      step("Check QA route inventory", "pnpm", ["qa:routes"]),
      step("Run smoke checks", "node", ["scripts/smoke.mjs"], {
        env: ({ baseUrl }) => ({ SMOKE_BASE_URL: baseUrl }),
      }),
      step("Run Playwright", "pnpm", ["e2e"], {
        env: ({ baseUrl }) => ({ E2E_BASE_URL: baseUrl }),
      }),
      step(
        "Run visual QA",
        powerShellCommand(),
        [
          "-NoProfile",
          "-ExecutionPolicy",
          "Bypass",
          "-File",
          "scripts/visual-qa-agent-browser.ps1",
          "-BaseUrl",
          ({ baseUrl }) => baseUrl,
        ],
        {
          restartPreviewBefore: true,
        },
      ),
      step(
        "Run strict performance QA",
        "pnpm",
        [
          "exec",
          "tsx",
          "scripts/qa-site-audit.ts",
          "--performance-only",
          "--base-url",
          ({ baseUrl }) => baseUrl,
        ],
        {
          restartPreviewBefore: true,
        },
      ),
    ],
  },
  {
    name: "gate:qa",
    description:
      "Build, start preview, then run full route inventory and cross-browser QA audit artifacts.",
    preview: true,
    steps: [
      step("Check QA route inventory", "pnpm", ["qa:routes"]),
      step("Run full QA site audit", "pnpm", [
        "exec",
        "tsx",
        "scripts/qa-site-audit.ts",
        "--base-url",
        ({ baseUrl }) => baseUrl,
      ]),
    ],
  },
  {
    name: "gate:coherence",
    description:
      "Run fast architectural coherence checks, lint, typecheck, and focused static Vitest coverage.",
    steps: [
      step("Check coherence contract", "node", [
        "scripts/coherence-contract.mjs",
      ]),
      step("Lint", "pnpm", ["lint"]),
      step("Typecheck", "pnpm", ["typecheck"]),
      step("Run focused coherence tests", "pnpm", [
        "exec",
        "vitest",
        "run",
        "scripts/gates.test.mjs",
        "src/components/ai-elements/accessibility.test.ts",
        "src/server/services/admin-commerce.test.ts",
        "src/server/ai/model.test.ts",
        "src/server/ai/planner.test.ts",
        "src/server/adapters/search.test.ts",
        "src/app/search/_lib/search-state.test.ts",
      ]),
    ],
  },
  {
    name: "gate:security",
    description: "Check frozen install integrity and production audit results.",
    steps: [
      step("Check frozen lockfile install", "pnpm", [
        "install",
        "--frozen-lockfile",
      ]),
      step("Run production dependency audit", "pnpm", ["audit", "--prod"]),
    ],
  },
  {
    name: "gate:prod",
    description: "Force production-readiness environment validation locally.",
    steps: [
      step("Validate production readiness", "node", [
        "scripts/verify-production-env.mjs",
        "--readiness",
        "--force",
      ]),
    ],
  },
  {
    name: "gate:release-slice",
    description:
      "Run the strict release-slice artifact gate from explicit artifact env vars.",
    steps: [
      step("Run release slice gate", "pnpm", [
        "release:slice-gate",
        "--",
        "--owner-intake-validation",
        requiredEnvArg("RELEASE_OWNER_INTAKE_VALIDATION"),
        "--owner-intake-apply",
        requiredEnvArg("RELEASE_OWNER_INTAKE_APPLY"),
        "--catalog-readiness",
        requiredEnvArg("RELEASE_CATALOG_READINESS"),
        "--catalog-quality",
        requiredEnvArg("RELEASE_CATALOG_QUALITY"),
        "--release-scorecard",
        requiredEnvArg("RELEASE_SCORECARD"),
        "--strict",
      ]),
    ],
  },
  {
    name: "gate:full",
    description:
      "Run explicit fixes once, then quick, test, db, build/runtime, QA, and security gates.",
    includes: [
      "gate:fix",
      "gate:quick",
      "gate:test",
      "gate:db",
      "gate:build",
      "gate:runtime",
      "gate:qa",
      "gate:security",
    ],
  },
  {
    name: "gate:ship",
    description:
      "Run explicit fixes once, then strict routine production deploy gates.",
    includes: [
      "gate:fix",
      "gate:coherence",
      "gate:quick",
      "gate:test",
      "gate:db",
      "gate:build",
      "gate:runtime",
      "gate:security",
    ],
  },
  {
    name: "gate:release",
    description: "Run the full gate plus forced production-readiness checks.",
    includes: ["gate:full", "gate:prod"],
  },
];

export function normalizeGateName(input = "list") {
  const trimmed = input.trim();

  if (!trimmed || trimmed === "-h" || trimmed === "--help") return "gate:list";
  if (trimmed.startsWith("gate:")) return trimmed;

  return `gate:${trimmed}`;
}

export function getGateDefinition(name) {
  const normalized = normalizeGateName(name);

  return gateDefinitions.find((gate) => gate.name === normalized) ?? null;
}

export function listGates({ logger = console.log } = {}) {
  const width = Math.max(...gateDefinitions.map((gate) => gate.name.length));

  logger("Manual quality gates:");

  for (const gate of gateDefinitions) {
    logger(`  ${gate.name.padEnd(width)}  ${gate.description}`);
  }
}

export function collectGateSteps() {
  return gateDefinitions.flatMap((gate) => gate.steps ?? []);
}

export function formatStepCommand(stepDefinition) {
  const args = stepDefinition.args.map((arg) =>
    typeof arg === "function" ? "<dynamic>" : arg,
  );

  return [stepDefinition.command, ...args].join(" ");
}

export async function runGate(name, options = {}) {
  const gate = getGateDefinition(name);

  if (!gate) {
    const available = gateDefinitions.map((item) => item.name).join(", ");

    throw new Error(`Unknown gate "${name}". Available gates: ${available}`);
  }

  const context = createGateContext(options);

  try {
    await runGateDefinition(gate, context);
  } finally {
    await stopPreviewServer(context);
  }
}

function step(label, command, args, options = {}) {
  return { label, command, args, ...options };
}

function buildStep() {
  return step("Build Next.js app", "pnpm", ["build"], {
    env: () => buildSafeCatalogEnv(),
    marksBuild: true,
  });
}

function buildSafeCatalogEnv() {
  const e2eDatabaseUrl =
    process.env.E2E_DATABASE_URL ??
    process.env.DATABASE_URL ??
    readDotenvValue(".env.development.local", "DATABASE_URL");

  return {
    AI_SEMANTIC_SEARCH_ENABLED: "false",
    CATALOG_DB_ERROR_FALLBACK: "1",
    ...(e2eDatabaseUrl ? { DATABASE_URL: e2eDatabaseUrl } : {}),
    E2E_AUTH_FIXTURES: "1",
    E2E_CATALOG_FIXTURES: "1",
    SERWIST_LOCAL_FALLBACK: "1",
    TYPESENSE_API_KEY: "",
    TYPESENSE_HOST: "",
    VERCEL_ENV: "preview",
  };
}

function readDotenvValue(filePath, key) {
  if (!existsSync(filePath)) return undefined;

  const assignmentPattern = new RegExp(`^\\s*${key}\\s*=\\s*(.*)\\s*$`);

  for (const line of readFileSync(filePath, "utf8").split(/\r?\n/u)) {
    const match = line.match(assignmentPattern);

    if (!match) continue;

    const value = (match[1] ?? "").trim();
    const quoted =
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"));

    return quoted ? value.slice(1, -1) : value || undefined;
  }

  return undefined;
}

function requiredEnvArg(name) {
  return () => {
    const value = process.env[name]?.trim();

    if (!value) {
      throw new Error(
        `Missing ${name}. Set it to the required release-slice artifact path before running gate:release-slice.`,
      );
    }

    return value;
  };
}

function prismaGenerateStep() {
  return step(
    "Generate Prisma client",
    "pnpm",
    ["exec", "prisma", "generate"],
    {
      hint: "On Windows, stop any running Next.js/dev process using Prisma Client if query_engine-windows.dll.node is locked.",
    },
  );
}

function powerShellCommand() {
  return process.platform === "win32" ? "powershell" : "pwsh";
}

function createGateContext({ cwd = process.cwd(), logger = console.log } = {}) {
  return {
    buildRan: false,
    cwd,
    logger,
    previewBaseUrl: "",
    previewProcess: null,
  };
}

async function runGateDefinition(gate, context) {
  if (gate.action === "list") {
    listGates({ logger: context.logger });
    return;
  }

  context.logger(`\n[${gate.name}] ${gate.description}`);

  if (gate.name === "gate:fix") {
    await runSteps(gate.steps ?? [], context, gate.name, {});
    return;
  }

  if (gate.preview) {
    await withPreviewServer(context, async (baseUrl) => {
      await runSteps(gate.steps ?? [], context, gate.name, { baseUrl });
    });
    return;
  }

  for (const includedGateName of gate.includes ?? []) {
    const includedGate = getGateDefinition(includedGateName);

    if (!includedGate) {
      throw new Error(`${gate.name} includes unknown gate ${includedGateName}`);
    }

    await runGateDefinition(includedGate, context);
  }

  await runSteps(gate.steps ?? [], context, gate.name, {});
}

async function runBuildIfNeeded(context) {
  if (context.buildRan) return;

  await runSteps([buildStep()], context, "gate:build", {});
}

async function runSteps(steps, context, gateName, runtime) {
  for (const item of steps) {
    if (item.restartPreviewBefore) {
      await restartPreviewServer(context);
      runtime.baseUrl = context.previewBaseUrl;
    }

    await runStep(item, context, gateName, runtime);

    if (item.marksBuild) {
      context.buildRan = true;
    }
  }
}

async function runStep(item, context, gateName, runtime) {
  const command = item.command;
  const args = item.args.map((arg) =>
    typeof arg === "function" ? arg(runtime) : arg,
  );
  const stepEnv =
    typeof item.env === "function" ? item.env(runtime) : (item.env ?? {});
  const env = { ...process.env, ...stepEnv };

  context.logger(`\n[${gateName}] ${item.label}`);
  context.logger(`$ ${[command, ...args].join(" ")}`);

  const code = await spawnCommand(command, args, {
    cwd: context.cwd,
    env,
    stdio: "inherit",
  });

  if (code !== 0) {
    const hint = item.hint ? `\nHint: ${item.hint}` : "";

    throw new Error(
      `${gateName} failed during "${item.label}" with exit code ${code}.${hint}`,
    );
  }
}

async function withPreviewServer(context, callback) {
  if (context.previewProcess) {
    await callback(context.previewBaseUrl);
    return;
  }

  await startPreviewServer(context);

  try {
    await callback(context.previewBaseUrl);
  } finally {
    await stopPreviewServer(context);
  }
}

async function restartPreviewServer(context) {
  if (!context.previewProcess) return;

  context.logger("\n[gate:runtime] Restarting preview server.");
  await stopPreviewServer(context);
  await startPreviewServer(context);
}

async function startPreviewServer(context) {
  await runBuildIfNeeded(context);

  const port = await findAvailablePort(defaultPreviewPort);
  const baseUrl = `http://127.0.0.1:${port}`;

  if (port !== defaultPreviewPort) {
    context.logger(
      `[gate:runtime] Port ${defaultPreviewPort} is busy. Using ${port}.`,
    );
  }

  context.logger(`\n[gate:runtime] Starting preview server on ${baseUrl}`);
  const previewCommand = resolveCommandInvocation("pnpm", [
    "exec",
    "next",
    "start",
    "-p",
    `${port}`,
  ]);
  const previewProcess = spawn(previewCommand.command, previewCommand.args, {
    cwd: context.cwd,
    detached: true,
    env: { ...process.env, ...buildSafeCatalogEnv(), PORT: `${port}` },
    stdio: "inherit",
  });

  context.previewProcess = previewProcess;
  context.previewBaseUrl = baseUrl;

  await waitForPreviewServer(baseUrl, previewProcess);
}

async function spawnCommand(command, args, options) {
  return await new Promise((resolve, reject) => {
    const invocation = resolveCommandInvocation(command, args);
    const child = spawn(invocation.command, invocation.args, options);

    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (signal) {
        resolve(1);
        return;
      }

      resolve(code ?? 1);
    });
  });
}

function resolveCommandInvocation(command, args) {
  if (process.platform !== "win32") {
    return { args, command };
  }

  return {
    args: ["/d", "/s", "/c", [command, ...args].map(quoteCmdArg).join(" ")],
    command: "cmd.exe",
  };
}

function quoteCmdArg(value) {
  if (/^[\w./:=?{}*,+-]+$/u.test(value)) return value;

  return `"${value.replace(/"/gu, '\\"')}"`;
}

async function findAvailablePort(preferredPort) {
  for (let port = preferredPort; port < preferredPort + 20; port += 1) {
    if (await canListenOnPort(port)) return port;
  }

  throw new Error(
    `No available preview port found from ${preferredPort} to ${
      preferredPort + 19
    }.`,
  );
}

async function canListenOnPort(port) {
  return await new Promise((resolve) => {
    const server = net.createServer();

    server.once("error", () => resolve(false));
    server.once("listening", () => {
      server.close(() => resolve(true));
    });
    server.listen(port, "127.0.0.1");
  });
}

async function waitForPreviewServer(baseUrl, previewProcess) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < previewReadyTimeoutMs) {
    if (previewProcess.exitCode !== null) {
      throw new Error(
        `Preview server exited before becoming ready with code ${previewProcess.exitCode}.`,
      );
    }

    try {
      const response = await fetchWithTimeout(baseUrl, 2_000);

      await response.arrayBuffer();
      return;
    } catch {
      await delay(1_000);
    }
  }

  throw new Error(
    `Preview server did not become ready within ${previewReadyTimeoutMs}ms.`,
  );
}

async function fetchWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function stopPreviewServer(context) {
  const previewProcess = context.previewProcess;

  if (!previewProcess) return;

  context.previewProcess = null;
  context.previewBaseUrl = "";

  if (previewProcess.exitCode !== null) return;

  context.logger("\n[gate:runtime] Stopping preview server.");

  if (process.platform === "win32") {
    const result = spawnSync(
      "taskkill",
      ["/pid", `${previewProcess.pid}`, "/t", "/f"],
      {
        stdio: "ignore",
        timeout: previewStopTimeoutMs,
      },
    );
    previewProcess.unref();

    if (result.error || result.status !== 0) {
      try {
        previewProcess.kill("SIGKILL");
      } catch {
        // The process may already be gone; cleanup should not fail the gate.
      }
    }

    return;
  }

  try {
    process.kill(-previewProcess.pid, "SIGTERM");
  } catch {
    try {
      previewProcess.kill("SIGTERM");
    } catch {
      return;
    }
  }

  await delay(1_000);

  if (previewProcess.exitCode === null) {
    try {
      process.kill(-previewProcess.pid, "SIGKILL");
    } catch {
      previewProcess.kill("SIGKILL");
    }
  }

  previewProcess.unref();
}

async function main(argv = process.argv.slice(2)) {
  await runGate(argv[0] ?? "list");
}

if (isDirectExecution()) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}

function isDirectExecution() {
  const entry = process.argv[1];

  return Boolean(entry) && import.meta.url === pathToFileURL(entry).href;
}
