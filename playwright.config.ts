import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const webServerReadyUrl = new URL("/manifest.webmanifest", baseURL).toString();
const webServerCommand =
  process.env.E2E_WEB_SERVER_COMMAND ??
  "pnpm exec next build && pnpm exec next start -p 3000";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  workers: 1,
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
    serviceWorkers: "block",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-chromium",
      use: { ...devices["Pixel 7"] },
    },
  ],
});
