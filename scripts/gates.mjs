import { spawn, spawnSync } from "node:child_process";
import net from "node:net";
import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";
import { pathToFileURL } from "node:url";

const defaultPreviewPort = Number(process.env.GATE_PREVIEW_PORT ?? 3002);
const previewReadyTimeoutMs = Number(
  process.env.GATE_PREVIEW_TIMEOUT_MS ?? 120_000,
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
      "Auto-fix, then run formatting, lint, typecheck, and Prisma validation.",
    needsFix: true,
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
    description: "Auto-fix, then run Vitest unit and integration tests.",
    needsFix: true,
    steps: [step("Run Vitest", "pnpm", ["test"])],
  },
  {
    name: "gate:db",
    description:
      "Auto-fix, then validate Prisma, deploy migrations, seed, and check migration status.",
    needsFix: true,
    steps: [
      step("Validate Prisma schema", "pnpm", ["exec", "prisma", "validate"]),
      prismaGenerateStep(),
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
    description: "Auto-fix, then run a production Next.js build.",
    needsFix: true,
    steps: [buildStep()],
  },
  {
    name: "gate:smoke",
    description: "Auto-fix, build, start preview, then run HTTP smoke checks.",
    needsFix: true,
    preview: true,
    steps: [
      step("Run smoke checks", "node", ["scripts/smoke.mjs"], {
        env: ({ baseUrl }) => ({ SMOKE_BASE_URL: baseUrl }),
      }),
    ],
  },
  {
    name: "gate:e2e",
    description: "Auto-fix, build, start preview, then run Playwright flows.",
    needsFix: true,
    preview: true,
    steps: [
      step("Run Playwright", "pnpm", ["e2e"], {
        env: ({ baseUrl }) => ({ E2E_BASE_URL: baseUrl }),
      }),
    ],
  },
  {
    name: "gate:visual",
    description:
      "Auto-fix, build, start preview, then run agent-browser visual QA.",
    needsFix: true,
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
      "Auto-fix, build once, start preview, then run smoke, e2e, visual QA, and performance QA.",
    needsFix: true,
    preview: true,
    steps: [
      step("Check QA route inventory", "pnpm", ["qa:routes"]),
      step("Run smoke checks", "node", ["scripts/smoke.mjs"], {
        env: ({ baseUrl }) => ({ SMOKE_BASE_URL: baseUrl }),
      }),
      step("Run Playwright", "pnpm", ["e2e"], {
        env: ({ baseUrl }) => ({ E2E_BASE_URL: baseUrl }),
      }),
      step("Run visual QA", powerShellCommand(), [
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-File",
        "scripts/visual-qa-agent-browser.ps1",
        "-BaseUrl",
        ({ baseUrl }) => baseUrl,
      ]),
      step("Run strict performance QA", "pnpm", [
        "exec",
        "tsx",
        "scripts/qa-site-audit.ts",
        "--performance-only",
        "--base-url",
        ({ baseUrl }) => baseUrl,
      ]),
    ],
  },
  {
    name: "gate:qa",
    description:
      "Auto-fix, build, start preview, then run full route inventory and cross-browser QA audit artifacts.",
    needsFix: true,
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
        "src/styles/benchmark-policy-enforcement.test.ts",
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
    name: "gate:public:local",
    description:
      "Auto-fix, build, start preview, then benchmark all public parts locally without external crawling.",
    needsFix: true,
    preview: true,
    steps: [
      step("Run local public benchmarks", "pnpm", [
        "exec",
        "tsx",
        "scripts/benchmarks/site-benchmark.ts",
        "--all",
        "--base-url",
        ({ baseUrl }) => baseUrl,
        "--skip-external",
      ]),
    ],
  },
  {
    name: "gate:public:live",
    description:
      "Auto-fix, build, start preview, then benchmark all public parts against live reference sites.",
    needsFix: true,
    preview: true,
    steps: [
      step("Run live public benchmarks", "pnpm", [
        "exec",
        "tsx",
        "scripts/benchmarks/site-benchmark.ts",
        "--all",
        "--base-url",
        ({ baseUrl }) => baseUrl,
        "--replace-blocked",
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
    name: "gate:full",
    description:
      "Auto-fix once, then run quick, test, db, build/runtime, security, and live public benchmarks.",
    needsFix: true,
    includes: [
      "gate:quick",
      "gate:test",
      "gate:db",
      "gate:build",
      "gate:runtime",
      "gate:qa",
      "gate:security",
      "gate:public:live",
    ],
  },
  {
    name: "gate:ship",
    description:
      "Run the release gate minus live public benchmarks for routine production deploys.",
    needsFix: true,
    includes: [
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
  return {
    AI_SEMANTIC_SEARCH_ENABLED: "false",
    CATALOG_DB_ERROR_FALLBACK: "1",
    E2E_CATALOG_FIXTURES: "1",
    TYPESENSE_API_KEY: "",
    TYPESENSE_HOST: "",
    VERCEL_ENV: "preview",
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
    fixRan: false,
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
    context.fixRan = true;
    return;
  }

  if (gate.needsFix) {
    await runFixIfNeeded(context);
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

async function runFixIfNeeded(context) {
  if (context.fixRan) return;

  const fixGate = getGateDefinition("gate:fix");

  if (!fixGate) throw new Error("gate:fix is not registered.");

  context.logger("\n[gate:fix] Running deterministic auto-fixers once.");
  await runSteps(fixGate.steps ?? [], context, "gate:fix", {});
  context.fixRan = true;
}

async function runBuildIfNeeded(context) {
  if (context.buildRan) return;

  await runSteps([buildStep()], context, "gate:build", {});
}

async function runSteps(steps, context, gateName, runtime) {
  for (const item of steps) {
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

  try {
    await waitForPreviewServer(baseUrl, previewProcess);
    await callback(baseUrl);
  } finally {
    await stopPreviewServer(context);
  }
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
    spawnSync("taskkill", ["/pid", `${previewProcess.pid}`, "/t", "/f"], {
      stdio: "ignore",
    });
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
