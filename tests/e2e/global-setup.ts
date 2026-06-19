import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import type { FullConfig } from "@playwright/test";

const serverStatePath = path.join(
  process.cwd(),
  ".tmp",
  "playwright-web-server.json",
);
const serverScriptPath = path.join(
  process.cwd(),
  "scripts",
  "playwright-web-server.mjs",
);

export default async function globalSetup(config: FullConfig) {
  const baseURL = getBaseURL(config);
  const readyURL = new URL("/manifest.webmanifest", baseURL).toString();
  const serverProcess = spawn(process.execPath, [serverScriptPath], {
    cwd: process.cwd(),
    detached: true,
    env: process.env,
    shell: false,
    stdio: "ignore",
    windowsHide: true,
  });

  if (!serverProcess.pid) {
    throw new Error("Failed to start the Playwright web server process.");
  }

  mkdirSync(path.dirname(serverStatePath), { recursive: true });
  writeFileSync(
    serverStatePath,
    JSON.stringify(
      {
        baseURL,
        pid: serverProcess.pid,
        startedAt: new Date().toISOString(),
      },
      null,
      2,
    ),
  );

  serverProcess.unref();

  await Promise.race([
    waitForURL(readyURL, 180_000),
    new Promise<never>((_, reject) => {
      serverProcess.once("exit", (code, signal) => {
        reject(
          new Error(
            `Playwright web server exited before becoming ready (${describeExit(
              code,
              signal,
            )}).`,
          ),
        );
      });
    }),
  ]);
}

async function waitForURL(url: string, timeoutMs: number) {
  const deadline = Date.now() + timeoutMs;
  let lastError: unknown;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, { cache: "no-store" });

      if (response.status < 500) return;
    } catch (error) {
      lastError = error;
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  const suffix =
    lastError instanceof Error ? ` Last error: ${lastError.message}` : "";

  throw new Error(`Timed out waiting for ${url}.${suffix}`);
}

function getBaseURL(config: FullConfig) {
  const configuredBaseURL = config.projects[0]?.use.baseURL;

  return typeof configuredBaseURL === "string"
    ? configuredBaseURL
    : (process.env.E2E_BASE_URL ?? "http://localhost:3000");
}

function describeExit(code: number | null, signal: NodeJS.Signals | null) {
  if (code !== null) return `code ${code}`;
  if (signal) return `signal ${signal}`;

  return "unknown status";
}
