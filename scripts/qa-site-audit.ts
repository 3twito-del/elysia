import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import {
  chromium,
  firefox,
  webkit,
  type Browser,
  type BrowserType,
  type Page,
} from "@playwright/test";

import {
  createQaArtifactDir,
  getPerformanceQaRoutes,
  getVisualQaRoutes,
  writeRouteInventoryArtifacts,
} from "./qa-route-inventory";

type BrowserName = "chromium" | "firefox" | "webkit";
type ScreenshotMode = "all" | "failures" | "none";
type ViewportName = "desktop" | "mobile" | "tablet";

type AuditOptions = {
  artifactDir: string;
  baseUrl: string;
  browsers: BrowserName[];
  includeAllProducts: boolean;
  performanceOnly: boolean;
  repeats: number;
  screenshotMode: ScreenshotMode;
  viewports: ViewportName[];
};

type AuditResult = {
  browserName: BrowserName;
  cls: number;
  consoleErrors: string[];
  failedRequests: string[];
  hasContent: boolean;
  imageFailures: string[];
  lcpMs: number | null;
  navigationMs: number | null;
  objectiveFindings: string[];
  overlay: boolean;
  pageErrors: string[];
  path: string;
  screenshotPath: string | null;
  status: "FAIL" | "PASS";
  tbtMs: number | null;
  title: string;
  url: string;
  viewport: ViewportName;
  xOverflowPx: number;
};

type BrowserMetrics = {
  cls?: number;
  lcpMs?: number;
  longTasks?: Array<{ duration: number; startTime: number }>;
};

const strictBudgets = {
  cls: 0.1,
  mobileNavigationMs: 4_000,
  navigationMs: 3_000,
  tbtMs: 200,
};

const viewportMatrix = {
  desktop: { hasTouch: false, height: 900, isMobile: false, width: 1440 },
  mobile: { hasTouch: true, height: 844, isMobile: true, width: 390 },
  tablet: { hasTouch: true, height: 1024, isMobile: false, width: 768 },
} satisfies Record<
  ViewportName,
  { hasTouch: boolean; height: number; isMobile: boolean; width: number }
>;

const browserTypes = {
  chromium,
  firefox,
  webkit,
} satisfies Record<BrowserName, BrowserType>;

export async function runQaSiteAudit(options: AuditOptions) {
  const routes = options.performanceOnly
    ? getPerformanceQaRoutes()
    : getVisualQaRoutes({ includeAllProducts: options.includeAllProducts });
  const results: AuditResult[] = [];
  const screenshotsDir = path.join(options.artifactDir, "screenshots");

  mkdirSync(options.artifactDir, { recursive: true });
  mkdirSync(screenshotsDir, { recursive: true });
  writeRouteInventoryArtifacts({
    artifactDir: options.artifactDir,
    includeAllProducts: options.includeAllProducts,
  });

  for (const browserName of options.browsers) {
    const browser = await browserTypes[browserName].launch();

    try {
      for (const viewport of options.viewports) {
        for (let repeat = 1; repeat <= options.repeats; repeat += 1) {
          for (const route of routes) {
            const result = await auditRoute({
              baseUrl: options.baseUrl,
              browser,
              browserName,
              enforcePerformanceBudgets: options.performanceOnly,
              repeat,
              route,
              screenshotMode: options.screenshotMode,
              screenshotsDir,
              viewport,
            });

            results.push(result);
            console.log(
              `${result.status} ${browserName}/${viewport} ${route} objective=${result.objectiveFindings.length}`,
            );
          }
        }
      }
    } finally {
      await browser.close();
    }
  }

  const payload = {
    budgets: strictBudgets,
    generatedAt: new Date().toISOString(),
    options,
    results,
    summary: summarizeResults(results),
  };

  writeFileSync(
    path.join(options.artifactDir, "site-audit.json"),
    `${JSON.stringify(payload, null, 2)}\n`,
  );
  writeFileSync(
    path.join(options.artifactDir, "site-audit.md"),
    formatAuditMarkdown(payload),
  );
  writeFileSync(
    path.join(options.artifactDir, "design-review.md"),
    formatDesignReviewMarkdown(payload),
  );

  return payload;
}

async function auditRoute({
  baseUrl,
  browser,
  browserName,
  enforcePerformanceBudgets,
  repeat,
  route,
  screenshotMode,
  screenshotsDir,
  viewport,
}: {
  baseUrl: string;
  browser: Browser;
  browserName: BrowserName;
  enforcePerformanceBudgets: boolean;
  repeat: number;
  route: string;
  screenshotMode: ScreenshotMode;
  screenshotsDir: string;
  viewport: ViewportName;
}): Promise<AuditResult> {
  const viewportConfig = viewportMatrix[viewport];
  const context = await browser.newContext({
    colorScheme: "light",
    hasTouch: viewportConfig.hasTouch,
    ...(browserName === "firefox" ? {} : { isMobile: viewportConfig.isMobile }),
    locale: "he-IL",
    serviceWorkers: "block",
    viewport: {
      height: viewportConfig.height,
      width: viewportConfig.width,
    },
  });
  await context.addInitScript(() => {
    window.localStorage.setItem(
      "elysia.accessibility-settings",
      JSON.stringify({
        highContrast: false,
        reduceMotion: true,
        textScale: "normal",
        underlineLinks: false,
      }),
    );
  });
  const page = await context.newPage();
  const consoleErrors: string[] = [];
  const failedRequests: string[] = [];
  const imageFailures: string[] = [];
  const pageErrors: string[] = [];
  const url = joinUrl(baseUrl, route);

  await installMetricObserver(page);
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => {
    if (isIgnorablePageError(error.message)) return;

    pageErrors.push(error.message);
  });
  page.on("requestfailed", (request) => {
    const failure = request.failure();
    const requestUrl = request.url();
    const errorText = failure?.errorText ?? "failed";

    if (isSameOrigin(requestUrl, baseUrl)) {
      if (
        isIgnorableCancelledRequest({
          errorText,
          method: request.method(),
          resourceType: request.resourceType(),
          url: requestUrl,
        })
      ) {
        return;
      }

      failedRequests.push(`${request.method()} ${requestUrl}: ${errorText}`);
    }
  });
  page.on("response", (response) => {
    const responseUrl = response.url();

    if (!isSameOrigin(responseUrl, baseUrl)) return;
    if (response.status() < 400) return;

    const request = response.request();
    failedRequests.push(
      `${request.method()} ${responseUrl}: ${response.status()}`,
    );
  });

  try {
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await page
      .waitForLoadState("networkidle", { timeout: 7_000 })
      .catch(() => undefined);
    await page.waitForTimeout(500);
  } catch (error) {
    pageErrors.push(error instanceof Error ? error.message : String(error));
  }

  const title = await page.title().catch(() => "");
  const pageState = await page
    .evaluate(() => {
      const images = Array.from(document.images)
        .filter((image) => image.complete && image.naturalWidth === 0)
        .map((image) => image.currentSrc || image.src);
      const metrics = (window as Window & { __qaMetrics?: BrowserMetrics })
        .__qaMetrics;
      const navigation = performance.getEntriesByType("navigation")[0] as
        | PerformanceNavigationTiming
        | undefined;

      return {
        bodyTextLength: document.body.innerText.trim().length,
        brokenImages: images,
        cls: metrics?.cls ?? 0,
        lcpMs: metrics?.lcpMs ?? null,
        navigationMs: navigation
          ? Math.round(navigation.loadEventEnd - navigation.startTime)
          : null,
        overlay: Boolean(
          document.querySelector(
            "[data-nextjs-dialog], [data-nextjs-dialog-overlay], [data-nextjs-error-overlay], .vite-error-overlay, #webpack-dev-server-client-overlay",
          ),
        ),
        tbtMs:
          metrics?.longTasks?.reduce(
            (total, task) => total + Math.max(task.duration - 50, 0),
            0,
          ) ?? null,
        xOverflowPx: Math.max(
          0,
          document.documentElement.scrollWidth -
            document.documentElement.clientWidth,
        ),
      };
    })
    .catch((error: unknown) => ({
      bodyTextLength: 0,
      brokenImages: [],
      cls: 0,
      lcpMs: null,
      navigationMs: null,
      overlay: true,
      tbtMs: null,
      xOverflowPx: 0,
      error: error instanceof Error ? error.message : String(error),
    }));

  if ("error" in pageState) pageErrors.push(pageState.error);
  imageFailures.push(...pageState.brokenImages);

  const objectiveFindings = buildObjectiveFindings({
    browserName,
    consoleErrors,
    enforcePerformanceBudgets,
    failedRequests,
    imageFailures,
    pageErrors,
    pageState,
    route,
    viewport,
  });
  const shouldCapture =
    screenshotMode === "all" ||
    (screenshotMode === "failures" && objectiveFindings.length > 0);
  const screenshotPath = shouldCapture
    ? path.join(
        screenshotsDir,
        `${safeFileName(`${browserName}-${viewport}-r${repeat}-${route}`)}.png`,
      )
    : null;

  if (screenshotPath) {
    await page
      .screenshot({ fullPage: true, path: screenshotPath })
      .catch(async (error: unknown) => {
        if (!String(error).includes("Cannot take screenshot larger than")) {
          throw error;
        }

        await page.screenshot({ fullPage: false, path: screenshotPath });
      });
  }

  await context.close();

  return {
    browserName,
    cls: pageState.cls,
    consoleErrors,
    failedRequests,
    hasContent: pageState.bodyTextLength > 0,
    imageFailures,
    lcpMs: pageState.lcpMs,
    navigationMs: pageState.navigationMs,
    objectiveFindings,
    overlay: pageState.overlay,
    pageErrors,
    path: route,
    screenshotPath,
    status: objectiveFindings.length === 0 ? "PASS" : "FAIL",
    tbtMs: pageState.tbtMs,
    title,
    url,
    viewport,
    xOverflowPx: pageState.xOverflowPx,
  };
}

async function installMetricObserver(page: Page) {
  await page.addInitScript(() => {
    const state = window as Window & { __qaMetrics?: BrowserMetrics };

    state.__qaMetrics = {
      cls: 0,
      longTasks: [],
    };

    try {
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const layoutShift = entry as PerformanceEntry & {
            hadRecentInput?: boolean;
            value?: number;
          };

          if (!layoutShift.hadRecentInput) {
            state.__qaMetrics!.cls =
              (state.__qaMetrics!.cls ?? 0) + (layoutShift.value ?? 0);
          }
        }
      });

      clsObserver.observe({ buffered: true, type: "layout-shift" });
    } catch {
      // Browser does not expose layout-shift entries.
    }

    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const last = entries[entries.length - 1];

        if (last) state.__qaMetrics!.lcpMs = Math.round(last.startTime);
      });

      lcpObserver.observe({
        buffered: true,
        type: "largest-contentful-paint",
      });
    } catch {
      // Browser does not expose LCP entries.
    }

    try {
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          state.__qaMetrics!.longTasks!.push({
            duration: entry.duration,
            startTime: entry.startTime,
          });
        }
      });

      longTaskObserver.observe({ buffered: true, type: "longtask" });
    } catch {
      // Browser does not expose longtask entries.
    }
  });
}

function buildObjectiveFindings({
  browserName,
  consoleErrors,
  enforcePerformanceBudgets,
  failedRequests,
  imageFailures,
  pageErrors,
  pageState,
  route,
  viewport,
}: {
  browserName: BrowserName;
  consoleErrors: string[];
  enforcePerformanceBudgets: boolean;
  failedRequests: string[];
  imageFailures: string[];
  pageErrors: string[];
  pageState: {
    bodyTextLength: number;
    cls: number;
    navigationMs: number | null;
    overlay: boolean;
    tbtMs: number | null;
    xOverflowPx: number;
  };
  route: string;
  viewport: ViewportName;
}) {
  const findings: string[] = [];
  const navigationBudget =
    viewport === "mobile"
      ? strictBudgets.mobileNavigationMs
      : strictBudgets.navigationMs;

  if (pageState.bodyTextLength === 0) findings.push("blank body content");
  if (pageState.overlay) findings.push("framework error overlay visible");
  if (pageState.xOverflowPx > 1) {
    findings.push(`horizontal overflow ${pageState.xOverflowPx}px`);
  }
  if (consoleErrors.length > 0) {
    findings.push(`${consoleErrors.length} console error(s)`);
  }
  if (pageErrors.length > 0)
    findings.push(`${pageErrors.length} page error(s)`);
  if (failedRequests.length > 0) {
    findings.push(`${failedRequests.length} same-origin request failure(s)`);
  }
  if (imageFailures.length > 0) {
    findings.push(`${imageFailures.length} broken image(s)`);
  }
  if (pageState.cls > strictBudgets.cls) {
    findings.push(`CLS ${pageState.cls.toFixed(3)} > ${strictBudgets.cls}`);
  }
  if (enforcePerformanceBudgets) {
    if (
      pageState.navigationMs !== null &&
      pageState.navigationMs > navigationBudget
    ) {
      findings.push(`load ${pageState.navigationMs}ms > ${navigationBudget}ms`);
    }
    if (
      browserName === "chromium" &&
      pageState.tbtMs !== null &&
      pageState.tbtMs > strictBudgets.tbtMs
    ) {
      findings.push(
        `TBT ${Math.round(pageState.tbtMs)}ms > ${strictBudgets.tbtMs}ms`,
      );
    }
  }

  return findings.map((finding) => `${route} ${viewport}: ${finding}`);
}

function summarizeResults(results: AuditResult[]) {
  const failures = results.filter((result) => result.status === "FAIL");

  return {
    failed: failures.length,
    passed: results.length - failures.length,
    status: failures.length === 0 ? "PASS" : "FAIL",
    total: results.length,
  };
}

function formatAuditMarkdown(payload: {
  generatedAt: string;
  results: AuditResult[];
  summary: ReturnType<typeof summarizeResults>;
}) {
  const failed = payload.results.filter((result) => result.status === "FAIL");
  const lines = [
    "# QA Site Audit",
    "",
    `Generated: ${payload.generatedAt}`,
    `Status: ${payload.summary.status}`,
    `Passed: ${payload.summary.passed}`,
    `Failed: ${payload.summary.failed}`,
    "",
    "## Objective Failures",
    "",
    ...(failed.length === 0
      ? ["None."]
      : failed.flatMap((result) => [
          `### ${result.browserName}/${result.viewport} ${result.path}`,
          "",
          ...result.objectiveFindings.map((finding) => `- ${finding}`),
          result.screenshotPath
            ? `- Screenshot: \`${result.screenshotPath}\``
            : "",
          "",
        ])),
    "",
    "## Route Results",
    "",
    "| Status | Browser | Viewport | Path | CLS | TBT | Load |",
    "| --- | --- | --- | --- | --- | --- | --- |",
    ...payload.results.map(
      (result) =>
        `| ${result.status} | ${result.browserName} | ${result.viewport} | \`${result.path}\` | ${result.cls.toFixed(3)} | ${result.tbtMs === null ? "n/a" : `${Math.round(result.tbtMs)}ms`} | ${result.navigationMs === null ? "n/a" : `${result.navigationMs}ms`} |`,
    ),
    "",
  ];

  return `${lines.join("\n")}\n`;
}

function formatDesignReviewMarkdown(payload: {
  generatedAt: string;
  results: AuditResult[];
}) {
  const visualCandidates = payload.results.filter(
    (result) =>
      result.status === "PASS" &&
      result.viewport === "mobile" &&
      [
        "/",
        "/search?q=venus",
        "/category/earrings",
        "/product/venus-line-ring",
      ].includes(result.path),
  );
  const lines = [
    "# Subjective Design Review Queue",
    "",
    `Generated: ${payload.generatedAt}`,
    "",
    "No subjective design changes were applied automatically.",
    "Use the screenshots and benchmark reports to approve visual polish items one at a time.",
    "",
    "| Route | Browser | Viewport | Screenshot | Notes |",
    "| --- | --- | --- | --- | --- |",
    ...(visualCandidates.length === 0
      ? ["| - | - | - | - | No auto-generated subjective candidates. |"]
      : visualCandidates.map(
          (result) =>
            `| \`${result.path}\` | ${result.browserName} | ${result.viewport} | ${result.screenshotPath ? `\`${result.screenshotPath}\`` : "-"} | Candidate only; no change approved. |`,
        )),
    "",
  ];

  return `${lines.join("\n")}\n`;
}

function joinUrl(baseUrl: string, route: string) {
  const root = baseUrl.replace(/\/+$/u, "");
  const suffix = route.startsWith("/") ? route : `/${route}`;

  return `${root}${suffix}`;
}

function isSameOrigin(targetUrl: string, baseUrl: string) {
  try {
    return new URL(targetUrl).origin === new URL(baseUrl).origin;
  } catch {
    return false;
  }
}

function isIgnorableCancelledRequest({
  errorText,
  method,
  resourceType,
  url,
}: {
  errorText: string;
  method: string;
  resourceType: string;
  url: string;
}) {
  if (method !== "GET") return false;
  if (
    !["Load request cancelled", "NS_BINDING_ABORTED", "net::ERR_ABORTED"].some(
      (expected) => errorText.includes(expected),
    )
  ) {
    return false;
  }

  const parsed = new URL(url);

  return (
    parsed.searchParams.has("_rsc") ||
    (parsed.pathname.startsWith("/_next/static/") &&
      ["fetch", "script"].includes(resourceType))
  );
}

function isIgnorablePageError(message: string) {
  return (
    message.includes("due to access control checks") &&
    message.includes("_rsc=")
  );
}

function safeFileName(value: string) {
  return value
    .replace(/[?#]/gu, "-")
    .replace(/[^a-z0-9._-]+/giu, "-")
    .replace(/^-+|-+$/gu, "")
    .slice(0, 160);
}

function parseCsvOption<T extends string>(
  value: string | undefined,
  fallback: T[],
  allowed: readonly T[],
) {
  if (!value) return fallback;

  const parsed = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const invalid = parsed.filter((item) => !allowed.includes(item as T));

  if (invalid.length > 0) {
    throw new Error(`Invalid option value(s): ${invalid.join(", ")}`);
  }

  return parsed as T[];
}

function parseArgs(argv = process.argv.slice(2)): AuditOptions {
  const get = (name: string) => {
    const index = argv.indexOf(name);

    return index >= 0 ? argv[index + 1] : undefined;
  };
  const performanceOnly = argv.includes("--performance-only");
  const artifactDir =
    get("--out-dir") ??
    process.env.QA_ARTIFACT_DIR ??
    createQaArtifactDir(performanceOnly ? "performance" : "site-audit");
  const screenshotMode =
    (get("--screenshots") as ScreenshotMode | undefined) ??
    (performanceOnly ? "none" : "failures");

  if (!["all", "failures", "none"].includes(screenshotMode)) {
    throw new Error(`Invalid --screenshots value: ${screenshotMode}`);
  }

  return {
    artifactDir,
    baseUrl:
      get("--base-url") ?? process.env.E2E_BASE_URL ?? "http://localhost:3000",
    browsers: parseCsvOption<BrowserName>(
      get("--browsers"),
      performanceOnly ? ["chromium"] : ["chromium", "firefox", "webkit"],
      ["chromium", "firefox", "webkit"],
    ),
    includeAllProducts: argv.includes("--all-products"),
    performanceOnly,
    repeats: Number(get("--repeats") ?? (performanceOnly ? "3" : "1")),
    screenshotMode,
    viewports: parseCsvOption<ViewportName>(
      get("--viewports"),
      performanceOnly ? ["desktop", "mobile"] : ["desktop", "tablet", "mobile"],
      ["desktop", "tablet", "mobile"],
    ),
  };
}

function printHelp() {
  console.log(`QA site audit

Usage:
  pnpm exec tsx scripts/qa-site-audit.ts [options]

Options:
  --base-url <url>           Site URL. Defaults to E2E_BASE_URL or localhost:3000.
  --out-dir <path>           Artifact output directory.
  --browsers <csv>           chromium,firefox,webkit. Defaults to all.
  --viewports <csv>          desktop,tablet,mobile. Defaults to all.
  --all-products             Include every seeded product route.
  --performance-only         Audit the performance route subset with strict budgets.
  --repeats <n>              Repetitions per route. Defaults to 1, or 3 for performance.
  --screenshots <mode>       all, failures, none. Defaults to failures.
`);
}

async function main(argv = process.argv.slice(2)) {
  if (argv.includes("--help") || argv.includes("-h")) {
    printHelp();
    return;
  }

  const payload = await runQaSiteAudit(parseArgs(argv));

  if (payload.summary.status !== "PASS") {
    process.exitCode = 1;
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
