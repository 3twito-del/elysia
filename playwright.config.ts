import { existsSync, readFileSync } from "node:fs";

import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const shouldStartLocalE2EServer = !process.env.E2E_BASE_URL;
const qaArtifactDir = process.env.QA_ARTIFACT_DIR;
const playwrightOutputDir = qaArtifactDir
  ? `${qaArtifactDir}/playwright-results`
  : "test-results";
const playwrightReportDir = qaArtifactDir
  ? `${qaArtifactDir}/playwright-report`
  : "playwright-report";
const e2eDatabaseUrl =
  process.env.E2E_DATABASE_URL ??
  process.env.DATABASE_URL ??
  readDotenvValue(".env.development.local", "DATABASE_URL");
const localE2EWebServerEnv: Record<string, string> = {
  AI_SEMANTIC_SEARCH_ENABLED: "false",
  E2E_AUTH_FIXTURES: "1",
  E2E_CATALOG_FIXTURES: "1",
  E2E_SKIP_SERWIST_BUILD: "1",
  PORT: new URL(baseURL).port || "3000",
  SERWIST_LOCAL_FALLBACK: "1",
  TYPESENSE_API_KEY: "",
  TYPESENSE_HOST: "",
  VERCEL_ENV: "preview",
};

if (e2eDatabaseUrl) {
  localE2EWebServerEnv.DATABASE_URL = e2eDatabaseUrl;
}

if (shouldStartLocalE2EServer) {
  Object.assign(process.env, localE2EWebServerEnv);
}

const qaViewports = [
  {
    deviceScaleFactor: 1,
    hasTouch: false,
    height: 900,
    isMobile: false,
    name: "desktop",
    width: 1440,
  },
  {
    deviceScaleFactor: 1,
    hasTouch: true,
    height: 1024,
    isMobile: false,
    name: "tablet",
    width: 768,
  },
  {
    deviceScaleFactor: 2,
    hasTouch: true,
    height: 844,
    isMobile: true,
    name: "mobile",
    width: 390,
  },
] as const;

const qaBrowsers = [
  { browserName: "chromium" as const, name: "chromium" },
  { browserName: "firefox" as const, name: "firefox" },
  { browserName: "webkit" as const, name: "webkit" },
] as const;

const firefoxLaunchEnv = {
  MOZ_DISABLE_CONTENT_SANDBOX: "1",
  MOZ_DISABLE_GPU_SANDBOX: "1",
  MOZ_DISABLE_RDD_SANDBOX: "1",
} as const;

export default defineConfig({
  globalSetup: shouldStartLocalE2EServer
    ? "./tests/e2e/global-setup.ts"
    : undefined,
  globalTeardown: shouldStartLocalE2EServer
    ? "./tests/e2e/global-teardown.ts"
    : undefined,
  outputDir: playwrightOutputDir,
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: playwrightReportDir }],
  ],
  testDir: "./tests/e2e",
  timeout: 30_000,
  workers: Number(process.env.PLAYWRIGHT_WORKERS ?? 3),
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL,
    locale: "he-IL",
    screenshot: "only-on-failure",
    serviceWorkers: "block",
    trace: "on-first-retry",
  },
  projects: qaBrowsers.flatMap((browser) =>
    qaViewports.map((viewport) => ({
      name: `${browser.name}-${viewport.name}`,
      use: {
        ...(browser.browserName === "chromium" && viewport.name === "desktop"
          ? devices["Desktop Chrome"]
          : {}),
        browserName: browser.browserName,
        deviceScaleFactor: viewport.deviceScaleFactor,
        hasTouch: viewport.hasTouch,
        ...(browser.browserName === "firefox"
          ? { launchOptions: { env: createLaunchEnv(firefoxLaunchEnv) } }
          : { isMobile: viewport.isMobile }),
        viewport: {
          height: viewport.height,
          width: viewport.width,
        },
      },
    })),
  ),
});

function readDotenvValue(filePath: string, key: string) {
  if (!existsSync(filePath)) return undefined;

  const assignmentPattern = new RegExp(`^\\s*${key}\\s*=\\s*(.*)\\s*$`);
  const lines = readFileSync(filePath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const match = line.match(assignmentPattern);

    if (!match) continue;

    return normalizeDotenvValue(match[1] ?? "");
  }

  return undefined;
}

function createLaunchEnv(overrides: Record<string, string>) {
  const inheritedEnv: Record<string, string> = {};

  for (const [key, value] of Object.entries(process.env)) {
    if (typeof value === "string") {
      inheritedEnv[key] = value;
    }
  }

  return {
    ...inheritedEnv,
    ...overrides,
  };
}

function normalizeDotenvValue(value: string) {
  const trimmed = value.trim();

  if (!trimmed) return undefined;

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}
