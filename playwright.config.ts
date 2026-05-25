import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const webServerReadyUrl = new URL("/manifest.webmanifest", baseURL).toString();
const webServerCommand =
  process.env.E2E_WEB_SERVER_COMMAND ??
  "pnpm exec next build && pnpm exec next start -p 3000";
const qaArtifactDir = process.env.QA_ARTIFACT_DIR;
const playwrightOutputDir = qaArtifactDir
  ? `${qaArtifactDir}/playwright-results`
  : "test-results";
const playwrightReportDir = qaArtifactDir
  ? `${qaArtifactDir}/playwright-report`
  : "playwright-report";

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

export default defineConfig({
  outputDir: playwrightOutputDir,
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: playwrightReportDir }],
  ],
  testDir: "./tests/e2e",
  timeout: 30_000,
  workers: Number(process.env.PLAYWRIGHT_WORKERS ?? 3),
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: webServerCommand,
        env: {
          AI_SEMANTIC_SEARCH_ENABLED: "false",
          E2E_CATALOG_FIXTURES: "1",
          TYPESENSE_API_KEY: "",
          TYPESENSE_HOST: "",
          VERCEL_ENV: "preview",
        },
        reuseExistingServer: process.env.E2E_REUSE_EXISTING_SERVER === "1",
        timeout: 180_000,
        url: webServerReadyUrl,
      },
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
          ? {}
          : { isMobile: viewport.isMobile }),
        viewport: {
          height: viewport.height,
          width: viewport.width,
        },
      },
    })),
  ),
});
