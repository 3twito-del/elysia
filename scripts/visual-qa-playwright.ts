import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { chromium, type Page } from "@playwright/test";

type Viewport = {
  height: number;
  name: string;
  width: number;
};

type VisualQaArgs = {
  allProducts: boolean;
  artifactDir?: string;
  baseUrl: string;
  deploymentId?: string;
  noScreenshot: boolean;
  routeSetName: string;
  viewports: string[];
};

const defaultViewports = [
  "desktop:1440x900",
  "tablet:768x1024",
  "mobile:390x844",
];

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const viewports = args.viewports.map(parseViewport);
  const routes = getInventoryRoutes(args.allProducts);
  const artifactDir = args.artifactDir ?? createArtifactDir(args);
  const screenshotDir = join(artifactDir, "agent-browser-screenshots");

  mkdirSync(screenshotDir, { recursive: true });
  writeJson(join(artifactDir, "agent-browser-visual-qa-metadata.json"), {
    GeneratedAt: new Date().toISOString(),
    BaseUrl: args.baseUrl,
    DeploymentId: args.deploymentId ?? "local",
    RouteSetName: args.allProducts ? "all-products" : args.routeSetName,
    Viewports: args.viewports,
    Routes: routes,
    ArtifactNaming:
      "artifacts/qa/<utc>-<route-set>-<deployment-id>-agent-browser",
    Engine: "playwright-fallback",
    ConsoleErrorBudget:
      "zero production console errors; known local development-only noise must be documented outside production evidence",
  });

  const browser = await chromium.launch({ headless: true });
  const results: unknown[] = [];
  const failures: string[] = [];

  try {
    for (const viewport of viewports) {
      const context = await browser.newContext({
        colorScheme: "light",
        locale: "he-IL",
        reducedMotion: "reduce",
        viewport: {
          height: viewport.height,
          width: viewport.width,
        },
      });
      context.setDefaultTimeout(10_000);
      context.setDefaultNavigationTimeout(20_000);

      for (const [index, route] of routes.entries()) {
        const startedAt = Date.now();
        console.log(
          `[visual:playwright] ${viewport.name} ${index + 1}/${routes.length} ${route || "/"} start`,
        );
        const result = await inspectRoute({
          baseUrl: args.baseUrl,
          noScreenshot: args.noScreenshot,
          route,
          routeIndex: index,
          screenshotDir,
          viewport,
          page: await context.newPage(),
        });

        results.push(result);

        if (result.Status === "FAIL") {
          failures.push(
            `${result.Viewport} ${result.Route} content=${result.Content} overlay=${result.Overlay} overflow=${result.Overflow} brokenImages=${result.BrokenImages} errors=${result.Errors}`,
          );
        }

        console.log(
          `[visual:playwright] ${viewport.name} ${index + 1}/${routes.length} ${route || "/"} ${result.Status} ${Date.now() - startedAt}ms`,
        );
      }

      await context.close();
    }
  } finally {
    await browser.close();
  }

  writeJson(join(artifactDir, "agent-browser-visual-qa.json"), results);

  if (failures.length > 0) {
    throw new Error(`Visual QA failed: ${failures.join("; ")}`);
  }

  console.log(
    `Visual QA passed for ${routes.length} route(s) across ${viewports.length} viewport(s). Artifacts: ${artifactDir}`,
  );
}

async function inspectRoute(input: {
  baseUrl: string;
  noScreenshot: boolean;
  page: Page;
  route: string;
  routeIndex: number;
  screenshotDir: string;
  viewport: Viewport;
}) {
  const { page, route, viewport } = input;
  const consoleErrors: string[] = [];
  const url = joinRouteUrl(input.baseUrl, route);

  page.on("console", (message) => {
    const text = message.text();

    if (
      message.type() === "error" &&
      !isIgnorableConsoleError({ message: text, route })
    ) {
      consoleErrors.push(text);
    }
  });
  page.on("pageerror", (error) => {
    consoleErrors.push(error.message);
  });

  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20_000 });
    await page.waitForLoadState("networkidle", { timeout: 5_000 }).catch(() => {
      // Some pages keep long-lived requests. The visual checks below are the gate.
    });
    await page.waitForTimeout(900);

    const [hasContent, hasOverlay, hasOverflow, brokenImages, title] =
      await Promise.all([
        page.evaluate<boolean>("document.body.innerText.trim().length > 0"),
        page
          .locator(
            "[data-nextjs-dialog], [data-nextjs-dialog-overlay], [data-nextjs-error-overlay], .vite-error-overlay, #webpack-dev-server-client-overlay",
          )
          .count()
          .then((count) => count > 0),
        page.evaluate<boolean>(
          "document.documentElement.scrollWidth > document.documentElement.clientWidth + 1",
        ),
        getBrokenImageCount(page),
        page.title(),
      ]);

    const isPass =
      hasContent &&
      !hasOverlay &&
      !hasOverflow &&
      brokenImages === 0 &&
      consoleErrors.length === 0;
    const screenshotPath = await maybeScreenshot({
      isPass,
      noScreenshot: input.noScreenshot,
      page,
      route,
      routeIndex: input.routeIndex,
      screenshotDir: input.screenshotDir,
      viewport,
    });

    return {
      Viewport: viewport.name,
      Route: route,
      Content: hasContent ? "HAS_CONTENT" : "BLANK",
      Overlay: hasOverlay ? "ERROR_OVERLAY" : "OK",
      Overflow: hasOverflow ? "X_OVERFLOW" : "NO_X_OVERFLOW",
      BrokenImages: String(brokenImages),
      Errors: consoleErrors.join("\n"),
      Title: title,
      Screenshot: screenshotPath,
      Status: isPass ? "PASS" : "FAIL",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const screenshotPath = await maybeScreenshot({
      isPass: false,
      noScreenshot: input.noScreenshot,
      page,
      route,
      routeIndex: input.routeIndex,
      screenshotDir: input.screenshotDir,
      viewport,
    });

    return {
      Viewport: viewport.name,
      Route: route,
      Content: "ERROR",
      Overlay: "UNKNOWN",
      Overflow: "UNKNOWN",
      BrokenImages: "UNKNOWN",
      Errors: message,
      Title: "",
      Screenshot: screenshotPath,
      Status: "FAIL",
    };
  } finally {
    await page.close().catch(() => undefined);
  }
}

async function getBrokenImageCount(page: Page) {
  return page.evaluate<number>(`(async () => {
    const sleep = (milliseconds) =>
      new Promise((resolve) => setTimeout(resolve, milliseconds));
    const getBrokenImages = () =>
      Array.from(document.images).filter((image) => {
        const source = image.currentSrc || image.src;

        return Boolean(source) && image.complete && image.naturalWidth === 0;
      });
    const waitForPendingImages = async () => {
      const pendingImages = Array.from(document.images).filter(
        (image) => !image.complete,
      );

      await Promise.all(
        pendingImages.map(
          (image) =>
            new Promise((resolve) => {
              const done = () => resolve(undefined);

              image.addEventListener("load", done, { once: true });
              image.addEventListener("error", done, { once: true });
              setTimeout(done, 650);
            }),
        ),
      );
    };

    for (let attempt = 0; attempt < 4; attempt += 1) {
      const brokenImages = getBrokenImages();

      if (brokenImages.length === 0) return 0;

      await waitForPendingImages();
      await sleep(250);
    }

    return getBrokenImages().length;
  })()`);
}

async function maybeScreenshot(input: {
  isPass: boolean;
  noScreenshot: boolean;
  page: Page;
  route: string;
  routeIndex: number;
  screenshotDir: string;
  viewport: Viewport;
}) {
  if (
    input.noScreenshot ||
    (input.isPass &&
      !(input.routeIndex === 0 && input.viewport.name === "desktop"))
  ) {
    return "";
  }

  const routeSegment = sanitizeSegment(input.route || "home", "home");
  const screenshotPath = join(
    input.screenshotDir,
    `${input.viewport.name}-${routeSegment}.png`,
  );
  await input.page.screenshot({
    fullPage: true,
    path: screenshotPath,
    timeout: 10_000,
  });

  return screenshotPath;
}

function getInventoryRoutes(allProducts: boolean) {
  const pnpmArgs = [
    "exec",
    "tsx",
    "scripts/qa-route-inventory.ts",
    "--visual-routes",
  ];

  if (allProducts) {
    pnpmArgs.push("--all-products");
  }

  const command = process.platform === "win32" ? "cmd.exe" : "pnpm";
  const args =
    process.platform === "win32"
      ? ["/d", "/s", "/c", "pnpm.cmd", ...pnpmArgs]
      : pnpmArgs;

  const result = spawnSync(command, args, {
    encoding: "utf8",
    shell: false,
    stdio: ["ignore", "pipe", "pipe"],
  });

  if (result.status !== 0) {
    const output = [result.error?.message, result.stderr, result.stdout]
      .map((value) => String(value ?? "").trim())
      .filter(Boolean)
      .join("\n");

    throw new Error(
      `Failed to load QA route inventory.${output ? `\n${output}` : ""}`,
    );
  }

  const stdout = String(result.stdout ?? "");
  const routes = stdout
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean);

  if (routes.length === 0) {
    throw new Error("Failed to load QA route inventory. No routes returned.");
  }

  return routes;
}

function parseArgs(argv: string[]): VisualQaArgs {
  const args: VisualQaArgs = {
    allProducts: false,
    baseUrl: process.env.SMOKE_BASE_URL ?? "http://localhost:3000",
    noScreenshot: false,
    routeSetName: process.env.QA_ROUTE_SET_NAME ?? "representative",
    viewports: [...defaultViewports],
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    const next = () => argv[++index] ?? "";

    if (value === "--base-url") args.baseUrl = next();
    else if (value === "--artifact-dir") args.artifactDir = next();
    else if (value === "--deployment-id") args.deploymentId = next();
    else if (value === "--route-set-name") args.routeSetName = next();
    else if (value === "--viewport") args.viewports.push(next());
    else if (value === "--all-products") args.allProducts = true;
    else if (value === "--no-screenshot") args.noScreenshot = true;
  }

  if (args.viewports.length > defaultViewports.length) {
    args.viewports = args.viewports.slice(defaultViewports.length);
  }

  return args;
}

function parseViewport(value: string): Viewport {
  const match = /^([^:]+):(\d+)x(\d+)$/u.exec(value);

  if (!match) {
    throw new Error(`Invalid viewport '${value}'. Expected name:WIDTHxHEIGHT.`);
  }

  return {
    name: match[1]!,
    width: Number(match[2]),
    height: Number(match[3]),
  };
}

function createArtifactDir(args: VisualQaArgs) {
  const timestamp = new Date()
    .toISOString()
    .replace(/:/gu, "-")
    .replace(/\.\d{3}Z$/u, "Z");
  const routeSet = sanitizeSegment(
    args.allProducts ? "all-products" : args.routeSetName,
    "representative",
  );
  const deployment = sanitizeSegment(args.deploymentId ?? "local", "local");
  const artifactDir = join(
    process.cwd(),
    "artifacts",
    "qa",
    `${timestamp}-${routeSet}-${deployment}-agent-browser`,
  );

  mkdirSync(artifactDir, { recursive: true });

  return artifactDir;
}

function sanitizeSegment(value: string, fallback: string) {
  const safe = value
    .replace(/[^a-zA-Z0-9._-]+/gu, "-")
    .replace(/^-+|-+$/gu, "");

  return safe || fallback;
}

function joinRouteUrl(root: string, route: string) {
  const trimmedRoot = root.replace(/\/+$/u, "");

  if (route.startsWith("/")) {
    return `${trimmedRoot}${route}`;
  }

  return `${trimmedRoot}/${route}`;
}

function isIgnorableConsoleError({
  message,
  route,
}: {
  message: string;
  route: string;
}) {
  return (
    route === "/category/not-a-real-category" &&
    message.includes("Failed to load resource") &&
    message.includes("404")
  );
}

function writeJson(path: string, value: unknown) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error ? (error.stack ?? error.message) : error,
  );
  process.exit(1);
});
