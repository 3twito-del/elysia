import {
  execFileSync,
  spawn,
  type ChildProcessWithoutNullStreams,
} from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { chromium, type Browser, type Page } from "@playwright/test";

import {
  canonicalBenchmarkSites,
  reserveBenchmarkSites,
  type BenchmarkCorpusSite,
} from "./corpus";

export type BenchmarkMetricType = "boolean" | "category" | "number";
export type BenchmarkMetricValue = boolean | number | string | null;
export type BenchmarkMatchStatus = "match" | "mismatch" | "notComparable";
export type BenchmarkStatus = "pass" | "warn" | "inconclusive" | "local-only";

export type BenchmarkViewport = {
  height: number;
  name: "desktop" | "tablet" | "mobile";
  width: number;
};

export type BenchmarkMetricDefinition = {
  group: string;
  key: string;
  numericComparison?: "higherIsBetter" | "lowerIsBetter" | "range";
  type: BenchmarkMetricType;
};

export type BenchmarkTarget = {
  label: string;
  path: string;
};

export type BenchmarkSnapshot = {
  captured: boolean;
  enoughData: boolean;
  error?: string;
  loadStatus: "blocked" | "error" | "ok" | "skipped";
  metrics: Record<string, BenchmarkMetricValue>;
  siteName: string;
  sourceUrl: string;
  targetLabel: string;
  targetUrl: string;
  viewport: BenchmarkViewport;
  weight: number;
};

export type BenchmarkCorpusBaseline =
  | {
      majorityValue: boolean | string;
      sampleWeight: number;
      supportWeight: number;
      type: "boolean" | "category";
    }
  | {
      max: number;
      median: number;
      min: number;
      q1: number;
      q3: number;
      sampleWeight: number;
      type: "number";
    }
  | {
      reason: string;
      type: BenchmarkMetricType;
    };

export type BenchmarkMetricComparison = {
  elysiaValue: BenchmarkMetricValue;
  corpusBaseline: BenchmarkCorpusBaseline;
  evidenceSiteCount: number;
  evidenceWeight: number;
  group: string;
  key: string;
  matchStatus: BenchmarkMatchStatus;
  targetLabel: string;
  viewport: BenchmarkViewport["name"];
};

export type BenchmarkSiteResult = {
  enoughViewportCount: number;
  loadStatus: "blocked" | "error" | "ok" | "skipped";
  name: string;
  role: BenchmarkCorpusSite["role"];
  sourceUrl: string;
  snapshots: BenchmarkSnapshot[];
  weight: number;
};

export type BenchmarkSubstitution = {
  blockedSite: BenchmarkCorpusSite;
  replacementSite: BenchmarkCorpusSite;
};

export type BenchmarkReport = {
  activeCorpus: BenchmarkCorpusSite[];
  activeWeight: number;
  elysia: BenchmarkSiteResult;
  blockedSites: BenchmarkCorpusSite[];
  canonicalCorpus: BenchmarkCorpusSite[];
  metrics: BenchmarkMetricComparison[];
  part: {
    id: string;
    title: string;
  };
  runAt: string;
  sites: BenchmarkSiteResult[];
  substitutions: BenchmarkSubstitution[];
  summary: {
    alignmentRatio: number | null;
    comparableMetricCount: number;
    inconclusiveReason?: string;
    matchCount: number;
    mismatchCount: number;
    notComparableCount: number;
    referenceSitesEnoughData: number;
    status: BenchmarkStatus;
    thresholdWeight: number;
    totalMetricCount: number;
  };
  viewports: BenchmarkViewport[];
};

export type BenchmarkExtractor = (input: {
  metricKeys: string[];
  partId: string;
  siteName: string;
}) => {
  captured: boolean;
  enoughData: boolean;
  metrics: Record<string, BenchmarkMetricValue>;
};

export type BenchmarkPartConfig = {
  externalComparison?: boolean;
  extractor: BenchmarkExtractor;
  id: string;
  lessons: string[];
  localTargets: BenchmarkTarget[];
  metricDefinitions: BenchmarkMetricDefinition[];
  minReferenceSitesForConclusiveReport?: number;
  recommendations: string[];
  resolveExternalUrl?: (site: BenchmarkCorpusSite) => string;
  title: string;
};

export type BenchmarkOptions = {
  baseUrl: string;
  headed: boolean;
  outDir: string;
  replaceBlocked: boolean;
  skipExternal: boolean;
};

export type ParsedBenchmarkArgs = BenchmarkOptions & {
  all: boolean;
  help: boolean;
  parts: string[];
};

export const BENCHMARK_VIEWPORTS: BenchmarkViewport[] = [
  { height: 900, name: "desktop", width: 1440 },
  { height: 900, name: "tablet", width: 768 },
  { height: 844, name: "mobile", width: 390 },
];

export const DEFAULT_BASE_URL = "http://localhost:3000";
export const DEFAULT_BENCHMARK_OUT_DIR = "docs/qa";

const LOCAL_SITE_TIMEOUT_MS = 30_000;
const EXTERNAL_SITE_TIMEOUT_MS = 18_000;
const MIN_REFERENCE_SITES_FOR_CONCLUSIVE_REPORT = 12;

export function parseBenchmarkArgs(
  argv = process.argv.slice(2),
): ParsedBenchmarkArgs {
  const parsed: ParsedBenchmarkArgs = {
    all: false,
    baseUrl: DEFAULT_BASE_URL,
    headed: false,
    help: false,
    outDir: DEFAULT_BENCHMARK_OUT_DIR,
    parts: [],
    replaceBlocked: false,
    skipExternal: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (!arg) continue;
    if (arg === "--help" || arg === "-h") {
      parsed.help = true;
      continue;
    }
    if (arg === "--all") {
      parsed.all = true;
      continue;
    }
    if (arg === "--headed") {
      parsed.headed = true;
      continue;
    }
    if (arg === "--skip-external") {
      parsed.skipExternal = true;
      continue;
    }
    if (arg === "--replace-blocked") {
      parsed.replaceBlocked = true;
      continue;
    }

    if (arg === "--part" || arg === "--base-url" || arg === "--out-dir") {
      const value = argv[index + 1];

      if (!value) throw new Error(`Missing value for ${arg}.`);
      if (arg === "--part") parsed.parts.push(value);
      if (arg === "--base-url") parsed.baseUrl = value;
      if (arg === "--out-dir") parsed.outDir = value;
      index += 1;
      continue;
    }

    if (arg.startsWith("--part=")) {
      parsed.parts.push(arg.slice("--part=".length));
      continue;
    }
    if (arg.startsWith("--base-url=")) {
      parsed.baseUrl = arg.slice("--base-url=".length);
      continue;
    }
    if (arg.startsWith("--out-dir=")) {
      parsed.outDir = arg.slice("--out-dir=".length);
      continue;
    }

    throw new Error(`Unknown benchmark argument: ${arg}`);
  }

  return parsed;
}

export async function runBenchmarkPart(
  config: BenchmarkPartConfig,
  options: BenchmarkOptions,
): Promise<BenchmarkReport> {
  const reports = await runBenchmarkParts([config], options);
  const report = reports[0];

  if (!report) throw new Error(`Benchmark did not produce ${config.id}.`);

  return report;
}

export async function runBenchmarkParts(
  configs: BenchmarkPartConfig[],
  options: BenchmarkOptions,
): Promise<BenchmarkReport[]> {
  const browser = await chromium.launch({ headless: !options.headed });

  try {
    const runAt = new Date().toISOString();
    const elysiaSnapshotsByPart = new Map<string, BenchmarkSnapshot[]>();
    const externalConfigs = configs.filter(
      (config) => config.externalComparison !== false,
    );

    for (const config of configs) {
      elysiaSnapshotsByPart.set(
        config.id,
        await captureElysia(browser, config, options),
      );
    }

    const canonicalSnapshotsByPart = options.skipExternal
      ? emptySnapshotMap(configs)
      : await captureCorpusSitesForParts(
          browser,
          externalConfigs,
          canonicalBenchmarkSites,
        );
    const needsReserveSnapshots =
      !options.skipExternal &&
      options.replaceBlocked &&
      externalConfigs.some((config) => {
        const canonicalSnapshots =
          canonicalSnapshotsByPart.get(config.id) ?? [];
        const blockedCount = canonicalBenchmarkSites.filter(
          (site) =>
            toSiteResult(site, snapshotsForSite(canonicalSnapshots, site.name))
              .enoughViewportCount < 2,
        ).length;

        return blockedCount > 0;
      });
    const reserveSnapshotsByPart = needsReserveSnapshots
      ? await captureCorpusSitesForParts(
          browser,
          externalConfigs,
          reserveBenchmarkSites,
        )
      : emptySnapshotMap(configs);

    return configs.map((config) => {
      const skipExternalForPart =
        options.skipExternal || config.externalComparison === false;
      const elysiaSnapshots = elysiaSnapshotsByPart.get(config.id) ?? [];
      const canonicalSnapshots = skipExternalForPart
        ? []
        : (canonicalSnapshotsByPart.get(config.id) ?? []);
      const blockedCanonicalCount = skipExternalForPart
        ? 0
        : canonicalBenchmarkSites.filter(
            (site) =>
              toSiteResult(
                site,
                snapshotsForSite(canonicalSnapshots, site.name),
              ).enoughViewportCount < 2,
          ).length;
      const {
        blockedReserveSites,
        blockedReserveSnapshots,
        replacementSites,
        replacementSnapshots,
      } =
        !skipExternalForPart &&
        options.replaceBlocked &&
        blockedCanonicalCount > 0
          ? selectReplacementSites(
              reserveSnapshotsByPart.get(config.id) ?? [],
              blockedCanonicalCount,
            )
          : {
              blockedReserveSites: [],
              blockedReserveSnapshots: [],
              replacementSites: [],
              replacementSnapshots: [],
            };

      return createBenchmarkReport({
        elysiaSnapshots,
        blockedReserveSites,
        blockedReserveSnapshots,
        canonicalSnapshots,
        config,
        replacementSnapshots,
        replacementSites,
        runAt,
        skipExternal: skipExternalForPart,
      });
    });
  } finally {
    await browser.close();
  }
}

export async function captureBenchmarkSnapshot(
  page: Page,
  config: BenchmarkPartConfig,
  site: BenchmarkCorpusSite,
  viewport: BenchmarkViewport,
  target: BenchmarkTarget,
): Promise<BenchmarkSnapshot> {
  try {
    await page.evaluate(() => {
      const globalObject = globalThis as typeof globalThis & {
        __name?: <T>(target: T) => T;
      };

      globalObject.__name ??= (target) => target;
    });

    const result = await page.evaluate(config.extractor, {
      metricKeys: config.metricDefinitions.map((metric) => metric.key),
      partId: config.id,
      siteName: site.name,
    });

    return {
      ...result,
      loadStatus: result.captured ? "ok" : "blocked",
      siteName: site.name,
      sourceUrl: site.sourceUrl,
      targetLabel: target.label,
      targetUrl: target.path,
      viewport,
      weight: site.weight,
    };
  } catch (error) {
    return {
      captured: false,
      enoughData: false,
      error: error instanceof Error ? error.message : String(error),
      loadStatus: "error",
      metrics: emptyMetricValues(config),
      siteName: site.name,
      sourceUrl: site.sourceUrl,
      targetLabel: target.label,
      targetUrl: target.path,
      viewport,
      weight: site.weight,
    };
  }
}

export function createBenchmarkReport({
  elysiaSnapshots,
  canonicalSnapshots,
  config,
  blockedReserveSites = [],
  blockedReserveSnapshots = [],
  replacementSnapshots,
  replacementSites,
  runAt,
  skipExternal,
}: {
  elysiaSnapshots: BenchmarkSnapshot[];
  blockedReserveSites?: BenchmarkCorpusSite[];
  blockedReserveSnapshots?: BenchmarkSnapshot[];
  canonicalSnapshots: BenchmarkSnapshot[];
  config: BenchmarkPartConfig;
  replacementSnapshots: BenchmarkSnapshot[];
  replacementSites: BenchmarkCorpusSite[];
  runAt: string;
  skipExternal: boolean;
}): BenchmarkReport {
  const canonicalResults = canonicalBenchmarkSites.map((site) =>
    toSiteResult(site, snapshotsForSite(canonicalSnapshots, site.name)),
  );
  const blockedCanonicalSites = skipExternal
    ? []
    : canonicalResults
        .filter((site) => site.enoughViewportCount < 2)
        .map((site) => toCorpusSite(site));
  const blockedSites = [...blockedCanonicalSites, ...blockedReserveSites];
  const substitutions = blockedCanonicalSites
    .slice(0, replacementSites.length)
    .map((blockedSite, index) => ({
      blockedSite,
      replacementSite: replacementSites[index]!,
    }));
  const activeCorpus = skipExternal
    ? []
    : [
        ...canonicalBenchmarkSites.filter(
          (site) =>
            !blockedCanonicalSites.some(
              (blockedSite) => blockedSite.name === site.name,
            ),
        ),
        ...replacementSites,
      ];
  const allReferenceSnapshots = [
    ...canonicalSnapshots,
    ...replacementSnapshots,
  ];
  const attemptedReferenceSnapshots = [
    ...canonicalSnapshots,
    ...replacementSnapshots,
    ...blockedReserveSnapshots,
  ];
  const activeReferenceSnapshots = allReferenceSnapshots.filter((snapshot) =>
    activeCorpus.some((site) => site.name === snapshot.siteName),
  );
  const activeWeight = activeCorpus.reduce((sum, site) => sum + site.weight, 0);
  const thresholdWeight = activeWeight / 2;
  const metrics = elysiaSnapshots.flatMap((elysiaSnapshot) =>
    config.metricDefinitions.map((definition) =>
      scoreMetric({
        activeWeight,
        elysiaSnapshot,
        definition,
        referenceSnapshots: activeReferenceSnapshots.filter(
          (snapshot) =>
            snapshot.viewport.name === elysiaSnapshot.viewport.name &&
            snapshot.enoughData &&
            snapshot.loadStatus === "ok",
        ),
        thresholdWeight,
      }),
    ),
  );
  const matchCount = metrics.filter(
    (metric) => metric.matchStatus === "match",
  ).length;
  const mismatchCount = metrics.filter(
    (metric) => metric.matchStatus === "mismatch",
  ).length;
  const notComparableCount = metrics.filter(
    (metric) => metric.matchStatus === "notComparable",
  ).length;
  const comparableMetricCount = matchCount + mismatchCount;
  const alignmentRatio =
    comparableMetricCount > 0 ? matchCount / comparableMetricCount : null;
  const referenceSitesEnoughData = activeCorpus.filter(
    (site) =>
      toSiteResult(site, snapshotsForSite(activeReferenceSnapshots, site.name))
        .enoughViewportCount >= 2,
  ).length;
  const elysia = toSiteResult(
    {
      name: "Elysia",
      role: "local",
      sourceUrl: elysiaSnapshots[0]?.sourceUrl ?? DEFAULT_BASE_URL,
      weight: 0,
    },
    elysiaSnapshots,
  );
  const status = getReportStatus({
    alignmentRatio,
    elysia,
    minReferenceSites:
      config.minReferenceSitesForConclusiveReport ??
      MIN_REFERENCE_SITES_FOR_CONCLUSIVE_REPORT,
    referenceSitesEnoughData,
    skipExternal,
  });

  return {
    activeCorpus,
    activeWeight,
    elysia,
    blockedSites,
    canonicalCorpus: canonicalBenchmarkSites,
    metrics,
    part: { id: config.id, title: config.title },
    runAt,
    sites: (skipExternal
      ? []
      : [
          ...canonicalBenchmarkSites,
          ...replacementSites,
          ...blockedReserveSites,
        ]
    ).map((site) =>
      toSiteResult(
        site,
        snapshotsForSite(attemptedReferenceSnapshots, site.name),
      ),
    ),
    substitutions,
    summary: {
      alignmentRatio,
      comparableMetricCount,
      inconclusiveReason:
        status === "inconclusive"
          ? `Only ${referenceSitesEnoughData} active reference sites produced enough ${config.title} data.`
          : undefined,
      matchCount,
      mismatchCount,
      notComparableCount,
      referenceSitesEnoughData,
      status,
      thresholdWeight,
      totalMetricCount: metrics.length,
    },
    viewports: BENCHMARK_VIEWPORTS,
  };
}

export async function writeBenchmarkReport({
  config,
  outDir,
  report,
}: {
  config: BenchmarkPartConfig;
  outDir: string;
  report: BenchmarkReport;
}) {
  const targetDir = path.join(outDir, `${config.id}-benchmark`);

  await mkdir(targetDir, { recursive: true });
  await writeFile(
    path.join(targetDir, "benchmark.json"),
    `${JSON.stringify(report, null, 2)}\n`,
    "utf8",
  );
  await writeFile(
    path.join(targetDir, "benchmark.md"),
    buildBenchmarkMarkdown(report, config),
    "utf8",
  );

  if (config.id === "header") {
    await writeFile(
      path.join(targetDir, "header-benchmark.json"),
      `${JSON.stringify(report, null, 2)}\n`,
      "utf8",
    );
    await writeFile(
      path.join(targetDir, "header-benchmark.md"),
      buildBenchmarkMarkdown(report, config),
      "utf8",
    );
  }
}

export function buildBenchmarkMarkdown(
  report: BenchmarkReport,
  config: BenchmarkPartConfig,
) {
  const title =
    report.part.id === "header"
      ? "Header Benchmark: High-Jewelry Alignment"
      : `${config.title} Benchmark`;
  const alignment =
    report.summary.alignmentRatio === null
      ? "n/a"
      : `${Math.round(report.summary.alignmentRatio * 100)}%`;
  const mismatches = report.metrics
    .filter((metric) => metric.matchStatus === "mismatch")
    .slice(0, 24);
  const lines = [
    `# ${title}`,
    "",
    `Generated: ${report.runAt}`,
    "",
    "## Summary",
    "",
    `- Status: ${report.summary.status}`,
    `- Active corpus: ${report.summary.referenceSitesEnoughData}/${report.activeCorpus.length} sites produced enough data`,
    `- Alignment: ${alignment}`,
    `- Metrics: ${report.summary.matchCount} match, ${report.summary.mismatchCount} mismatch, ${report.summary.notComparableCount} not comparable`,
    `- Active weight: ${round(report.activeWeight, 2)}; threshold weight: ${round(report.summary.thresholdWeight, 2)}`,
    "",
    "This benchmark measures Elysia against the high-jewelry QA corpus. Reserve-site substitutions affect QA reports only and do not change the High Jewelry Reference Gate.",
    "",
    "## Corpus Substitutions",
    "",
  ];

  if (report.substitutions.length === 0) {
    lines.push("- None.");
  } else {
    for (const substitution of report.substitutions) {
      lines.push(
        `- ${substitution.blockedSite.name} replaced by ${substitution.replacementSite.name}.`,
      );
    }
  }

  lines.push("", "## Blocked Sites", "");
  if (report.blockedSites.length === 0) {
    lines.push("- None.");
  } else {
    for (const site of report.blockedSites) {
      lines.push(`- ${site.name} (${site.role}; weight ${site.weight}).`);
    }
  }

  lines.push("", "## Top Mismatches", "");
  if (mismatches.length === 0) {
    lines.push("- None in comparable metrics.");
  } else {
    for (const metric of mismatches) {
      lines.push(
        `- ${metric.targetLabel} / ${metric.viewport} / ${metric.group} / ${metric.key}: Elysia=${formatMetricValue(metric.elysiaValue)}; baseline=${formatBaseline(metric.corpusBaseline)}`,
      );
    }
  }

  lines.push("", "## Lessons", "");
  for (const lesson of config.lessons) lines.push(`- ${lesson}`);

  lines.push("", "## Implementation Recommendations", "");
  for (const recommendation of config.recommendations) {
    lines.push(`- ${recommendation}`);
  }

  lines.push(
    "",
    "## Schema",
    "",
    "The JSON artifact contains `canonicalCorpus`, `activeCorpus`, `substitutions`, `blockedSites`, `activeWeight`, `thresholdWeight`, `viewports`, `sites`, `elysia`, `metrics`, and `summary`.",
    "Each metric includes `key`, `group`, `targetLabel`, `viewport`, `elysiaValue`, `corpusBaseline`, `matchStatus`, `evidenceSiteCount`, and `evidenceWeight`.",
    "",
  );

  return `${lines.join("\n")}\n`;
}

export async function writeBenchmarkIndex({
  outDir,
  reports,
}: {
  outDir: string;
  reports: BenchmarkReport[];
}) {
  await mkdir(outDir, { recursive: true });
  const lines = [
    "# Public Benchmark Index",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "## Latest Results",
    "",
    "| Part | Status | Alignment | Active Corpus | Substitutions | Report |",
    "| --- | --- | ---: | ---: | --- | --- |",
  ];

  for (const report of reports) {
    const alignment =
      report.summary.alignmentRatio === null
        ? "n/a"
        : `${Math.round(report.summary.alignmentRatio * 100)}%`;
    const substitutions =
      report.substitutions.length === 0
        ? "None"
        : report.substitutions
            .map(
              (substitution) =>
                `${substitution.blockedSite.name} -> ${substitution.replacementSite.name}`,
            )
            .join("; ");

    lines.push(
      `| ${report.part.title} | ${report.summary.status} | ${alignment} | ${report.summary.referenceSitesEnoughData}/${report.activeCorpus.length} | ${substitutions} | [report](./${report.part.id}-benchmark/benchmark.md) |`,
    );
  }

  lines.push(
    "",
    "## Cross-Surface Lessons",
    "",
    "- Treat live-site failures as evidence-quality signals, not automatic Elysia failures.",
    "- Use recommendations as candidates for the Public Change Gate; do not implement public UI changes directly from benchmark output.",
    "- Re-run local benchmarks before UI work and live benchmarks before changing gate policy.",
    "",
    "## Implementation Recommendations By Priority",
    "",
    "1. Prioritize repeated mismatches that appear across header, listing, PDP, and checkout surfaces.",
    "2. Route any public UI adjustment through `docs/PUBLIC_CHANGE_GATE.md` before implementation.",
    "3. Re-run the affected benchmark locally after design changes, then run live reference crawling before changing policy.",
    "",
  );

  await writeFile(
    path.join(outDir, "benchmark-index.md"),
    `${lines.join("\n")}\n`,
    "utf8",
  );
}

export async function readBenchmarkReports({
  configs,
  outDir,
}: {
  configs: BenchmarkPartConfig[];
  outDir: string;
}) {
  const reports: BenchmarkReport[] = [];

  for (const config of configs) {
    const reportPath = path.join(
      outDir,
      `${config.id}-benchmark`,
      "benchmark.json",
    );

    try {
      reports.push(
        JSON.parse(await readFile(reportPath, "utf8")) as BenchmarkReport,
      );
    } catch (error) {
      if (
        error instanceof Error &&
        "code" in error &&
        error.code === "ENOENT"
      ) {
        continue;
      }

      throw error;
    }
  }

  return reports;
}

export async function ensureLocalServer(baseUrl: string) {
  if (!isLocalhostUrl(baseUrl) || (await canReach(baseUrl))) return null;

  const isWindows = process.platform === "win32";
  const serverEnv = buildLocalBenchmarkServerEnv(baseUrl);
  const child = spawn(
    isWindows ? "cmd.exe" : "pnpm",
    isWindows ? ["/d", "/s", "/c", "pnpm", "dev"] : ["dev"],
    {
      cwd: process.cwd(),
      env: { ...process.env, ...serverEnv },
      stdio: "pipe",
    },
  );

  child.stdout.on("data", (data) =>
    process.stdout.write(`[dev] ${String(data)}`),
  );
  child.stderr.on("data", (data) =>
    process.stderr.write(`[dev] ${String(data)}`),
  );

  await waitForUrl(baseUrl, 120_000, child);

  return child;
}

function buildLocalBenchmarkServerEnv(baseUrl: string) {
  const safeEnv: Record<string, string> = {
    AI_SEMANTIC_SEARCH_ENABLED: "false",
    BROWSER: "none",
    CATALOG_DB_ERROR_FALLBACK: "1",
    E2E_CATALOG_FIXTURES: "1",
    TYPESENSE_API_KEY: "",
    TYPESENSE_HOST: "",
    VERCEL_ENV: "preview",
  };

  try {
    const url = new URL(baseUrl);

    if (url.port) safeEnv.PORT = url.port;
  } catch {
    // Keep the default Next.js dev port when the URL cannot be parsed.
  }

  return safeEnv;
}

export function stopLocalServer(child: ChildProcessWithoutNullStreams | null) {
  if (!child || child.killed) return;

  if (process.platform === "win32" && child.pid) {
    execFileSync("taskkill", ["/pid", String(child.pid), "/t", "/f"], {
      stdio: "ignore",
    });
    return;
  }

  child.kill("SIGTERM");
}

async function captureElysia(
  browser: Browser,
  config: BenchmarkPartConfig,
  options: BenchmarkOptions,
) {
  const site: BenchmarkCorpusSite = {
    name: "Elysia",
    role: "local",
    sourceUrl: options.baseUrl,
    weight: 0,
  };
  const targets = config.localTargets;

  return captureTargets(browser, config, site, targets, true);
}

function selectReplacementSites(
  reserveSnapshots: BenchmarkSnapshot[],
  neededCount: number,
) {
  const blockedReserveSites: BenchmarkCorpusSite[] = [];
  const blockedReserveSnapshots: BenchmarkSnapshot[] = [];
  const replacementSites: BenchmarkCorpusSite[] = [];
  const replacementSnapshots: BenchmarkSnapshot[] = [];

  for (const reserveSite of reserveBenchmarkSites) {
    if (replacementSites.length >= neededCount) break;

    const snapshots = snapshotsForSite(reserveSnapshots, reserveSite.name);
    const result = toSiteResult(reserveSite, snapshots);

    if (result.enoughViewportCount >= 2) {
      replacementSites.push(reserveSite);
      replacementSnapshots.push(...snapshots);
    } else {
      blockedReserveSites.push(reserveSite);
      blockedReserveSnapshots.push(...snapshots);
    }
  }

  return {
    blockedReserveSites,
    blockedReserveSnapshots,
    replacementSites,
    replacementSnapshots,
  };
}

async function captureCorpusSitesForParts(
  browser: Browser,
  configs: BenchmarkPartConfig[],
  sites: BenchmarkCorpusSite[],
) {
  const snapshotsByPart = emptySnapshotMap(configs);

  for (const site of sites) {
    const configsByUrl = new Map<string, BenchmarkPartConfig[]>();

    for (const config of configs) {
      const targetUrl = config.resolveExternalUrl?.(site) ?? site.sourceUrl;
      const configsForUrl = configsByUrl.get(targetUrl) ?? [];

      configsForUrl.push(config);
      configsByUrl.set(targetUrl, configsForUrl);
    }

    for (const [targetUrl, configsForUrl] of configsByUrl) {
      for (const viewport of BENCHMARK_VIEWPORTS) {
        const context = await browser.newContext({
          ignoreHTTPSErrors: true,
          locale: "en-US",
          reducedMotion: "no-preference",
          viewport: { height: viewport.height, width: viewport.width },
        });
        const page = await context.newPage();

        page.setDefaultNavigationTimeout(EXTERNAL_SITE_TIMEOUT_MS);
        page.setDefaultTimeout(EXTERNAL_SITE_TIMEOUT_MS);

        try {
          await page.goto(targetUrl, {
            timeout: EXTERNAL_SITE_TIMEOUT_MS,
            waitUntil: "domcontentloaded",
          });
          await dismissCommonConsent(page);
          await page
            .waitForLoadState("networkidle", { timeout: 5_000 })
            .catch(() => undefined);
          await page.waitForTimeout(1_200);

          if (await looksBlocked(page)) {
            for (const config of configsForUrl) {
              snapshotsByPart.get(config.id)?.push(
                unavailableSnapshot({
                  config,
                  error: "Blocked, access denied, or bot challenge page.",
                  loadStatus: "blocked",
                  site,
                  targetLabel: "reference",
                  targetUrl,
                  viewport,
                }),
              );
            }
            continue;
          }

          for (const config of configsForUrl) {
            snapshotsByPart.get(config.id)?.push(
              await captureBenchmarkSnapshot(page, config, site, viewport, {
                label: "reference",
                path: targetUrl,
              }),
            );
          }
        } catch (error) {
          for (const config of configsForUrl) {
            snapshotsByPart.get(config.id)?.push(
              unavailableSnapshot({
                config,
                error: error instanceof Error ? error.message : String(error),
                loadStatus: "error",
                site,
                targetLabel: "reference",
                targetUrl,
                viewport,
              }),
            );
          }
        } finally {
          await context.close();
        }
      }
    }
  }

  return snapshotsByPart;
}

async function captureTargets(
  browser: Browser,
  config: BenchmarkPartConfig,
  site: BenchmarkCorpusSite,
  targets: BenchmarkTarget[],
  isLocal: boolean,
) {
  const snapshots: BenchmarkSnapshot[] = [];

  for (const target of targets) {
    for (const viewport of BENCHMARK_VIEWPORTS) {
      const context = await browser.newContext({
        ignoreHTTPSErrors: true,
        locale: isLocal ? "he-IL" : "en-US",
        reducedMotion: "no-preference",
        viewport: { height: viewport.height, width: viewport.width },
      });
      const page = await context.newPage();
      const timeout = isLocal
        ? LOCAL_SITE_TIMEOUT_MS
        : EXTERNAL_SITE_TIMEOUT_MS;
      const targetUrl = isLocal
        ? joinUrl(site.sourceUrl, target.path)
        : target.path;

      page.setDefaultNavigationTimeout(timeout);
      page.setDefaultTimeout(timeout);

      try {
        await page.goto(targetUrl, { timeout, waitUntil: "domcontentloaded" });
        await dismissCommonConsent(page);
        await page
          .waitForLoadState("networkidle", { timeout: 5_000 })
          .catch(() => undefined);
        await page.waitForTimeout(isLocal ? 350 : 1_200);

        if (!isLocal && (await looksBlocked(page))) {
          snapshots.push({
            captured: false,
            enoughData: false,
            error: "Blocked, access denied, or bot challenge page.",
            loadStatus: "blocked",
            metrics: emptyMetricValues(config),
            siteName: site.name,
            sourceUrl: site.sourceUrl,
            targetLabel: target.label,
            targetUrl,
            viewport,
            weight: site.weight,
          });
          continue;
        }

        snapshots.push(
          await captureBenchmarkSnapshot(page, config, site, viewport, {
            ...target,
            path: targetUrl,
          }),
        );
      } catch (error) {
        snapshots.push({
          captured: false,
          enoughData: false,
          error: error instanceof Error ? error.message : String(error),
          loadStatus: "error",
          metrics: emptyMetricValues(config),
          siteName: site.name,
          sourceUrl: site.sourceUrl,
          targetLabel: target.label,
          targetUrl,
          viewport,
          weight: site.weight,
        });
      } finally {
        await context.close();
      }
    }
  }

  return snapshots;
}

async function dismissCommonConsent(page: Page) {
  const candidates = page.locator("button, a, [role='button']").filter({
    hasText: /accept|agree|allow all|continue|got it|ok|yes|i understand/i,
  });
  const count = Math.min(await candidates.count().catch(() => 0), 3);

  for (let index = 0; index < count; index += 1) {
    await candidates
      .nth(index)
      .click({ timeout: 1_000 })
      .catch(() => undefined);
  }
}

async function looksBlocked(page: Page) {
  const title = await page.title().catch(() => "");
  const bodyText = await page
    .locator("body")
    .innerText({ timeout: 1_000 })
    .catch(() => "");
  const evidence = `${title}\n${bodyText.slice(0, 2_000)}`;

  return /access denied|forbidden|captcha|bot challenge|verify you are human|temporarily unavailable|request blocked|akamai|cloudflare/iu.test(
    evidence,
  );
}

function scoreMetric({
  activeWeight,
  elysiaSnapshot,
  definition,
  referenceSnapshots,
  thresholdWeight,
}: {
  activeWeight: number;
  elysiaSnapshot: BenchmarkSnapshot;
  definition: BenchmarkMetricDefinition;
  referenceSnapshots: BenchmarkSnapshot[];
  thresholdWeight: number;
}): BenchmarkMetricComparison {
  const elysiaValue = elysiaSnapshot.metrics[definition.key] ?? null;

  if (!elysiaSnapshot.enoughData) {
    return notComparableMetric({
      elysiaValue,
      definition,
      reason: "Elysia data was not available.",
      targetLabel: elysiaSnapshot.targetLabel,
      viewportName: elysiaSnapshot.viewport.name,
    });
  }

  const values = referenceSnapshots
    .map((snapshot) => ({
      value: snapshot.metrics[definition.key],
      weight: snapshot.weight,
    }))
    .filter(
      (
        sample,
      ): sample is {
        value: Exclude<BenchmarkMetricValue, null>;
        weight: number;
      } => sample.value !== null,
    );

  if (definition.type === "number") {
    return scoreNumericMetric({
      activeWeight,
      elysiaValue,
      definition,
      samples: values,
      targetLabel: elysiaSnapshot.targetLabel,
      viewportName: elysiaSnapshot.viewport.name,
    });
  }

  return scoreDiscreteMetric({
    elysiaValue,
    definition,
    samples: values,
    targetLabel: elysiaSnapshot.targetLabel,
    thresholdWeight,
    viewportName: elysiaSnapshot.viewport.name,
  });
}

export function scoreDiscreteMetric({
  elysiaValue,
  definition,
  samples,
  targetLabel = "fixture",
  thresholdWeight,
  viewportName = "desktop",
}: {
  elysiaValue: BenchmarkMetricValue;
  definition: BenchmarkMetricDefinition;
  samples: Array<{
    value: Exclude<BenchmarkMetricValue, null>;
    weight: number;
  }>;
  targetLabel?: string;
  thresholdWeight: number;
  viewportName?: BenchmarkViewport["name"];
}): BenchmarkMetricComparison {
  const counts = new Map<boolean | string, number>();
  let sampleWeight = 0;

  for (const sample of samples) {
    if (
      (definition.type === "boolean" && typeof sample.value !== "boolean") ||
      (definition.type === "category" && typeof sample.value !== "string")
    ) {
      continue;
    }

    const value = sample.value as boolean | string;

    sampleWeight += sample.weight;
    counts.set(value, (counts.get(value) ?? 0) + sample.weight);
  }

  const majority = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];

  if (!majority || majority[1] < thresholdWeight) {
    return notComparableMetric({
      elysiaValue,
      definition,
      reason: "No weighted reference majority reached the active threshold.",
      sampleWeight,
      targetLabel,
      viewportName,
    });
  }

  return {
    elysiaValue,
    corpusBaseline: {
      majorityValue: majority[0],
      sampleWeight,
      supportWeight: majority[1],
      type: definition.type === "boolean" ? "boolean" : "category",
    },
    evidenceSiteCount: samples.length,
    evidenceWeight: majority[1],
    group: definition.group,
    key: definition.key,
    matchStatus: elysiaValue === majority[0] ? "match" : "mismatch",
    targetLabel,
    viewport: viewportName,
  };
}

export function scoreNumericMetric({
  activeWeight,
  elysiaValue,
  definition,
  samples,
  targetLabel = "fixture",
  viewportName = "desktop",
}: {
  activeWeight: number;
  elysiaValue: BenchmarkMetricValue;
  definition: BenchmarkMetricDefinition;
  samples: Array<{
    value: Exclude<BenchmarkMetricValue, null>;
    weight: number;
  }>;
  targetLabel?: string;
  viewportName?: BenchmarkViewport["name"];
}): BenchmarkMetricComparison {
  const numericSamples = samples
    .filter(
      (sample): sample is { value: number; weight: number } =>
        typeof sample.value === "number" && Number.isFinite(sample.value),
    )
    .sort((a, b) => a.value - b.value);
  const sampleWeight = numericSamples.reduce(
    (sum, sample) => sum + sample.weight,
    0,
  );

  if (
    typeof elysiaValue !== "number" ||
    !Number.isFinite(elysiaValue) ||
    sampleWeight < activeWeight / 2
  ) {
    return notComparableMetric({
      elysiaValue,
      definition,
      reason: "Insufficient weighted numeric reference samples.",
      sampleWeight,
      targetLabel,
      viewportName,
    });
  }

  const q1 = weightedPercentile(numericSamples, 0.25);
  const median = weightedPercentile(numericSamples, 0.5);
  const q3 = weightedPercentile(numericSamples, 0.75);
  const iqr = q3 - q1;
  const tolerance = Math.max(1, Math.abs(median) * 0.1);
  const rangeIsNarrow = iqr <= Math.max(1, Math.abs(median) * 0.05);
  const numericComparison = definition.numericComparison ?? "range";
  const matches =
    numericComparison === "higherIsBetter"
      ? elysiaValue >= (rangeIsNarrow ? median - tolerance : q1)
      : numericComparison === "lowerIsBetter"
        ? elysiaValue <= (rangeIsNarrow ? median + tolerance : q3)
        : rangeIsNarrow
          ? Math.abs(elysiaValue - median) <= tolerance
          : elysiaValue >= q1 && elysiaValue <= q3;

  return {
    elysiaValue,
    corpusBaseline: {
      max: numericSamples[numericSamples.length - 1]?.value ?? median,
      median,
      min: numericSamples[0]?.value ?? median,
      q1,
      q3,
      sampleWeight,
      type: "number",
    },
    evidenceSiteCount: numericSamples.length,
    evidenceWeight: sampleWeight,
    group: definition.group,
    key: definition.key,
    matchStatus: matches ? "match" : "mismatch",
    targetLabel,
    viewport: viewportName,
  };
}

function notComparableMetric({
  elysiaValue,
  definition,
  reason,
  sampleWeight = 0,
  targetLabel,
  viewportName,
}: {
  elysiaValue: BenchmarkMetricValue;
  definition: BenchmarkMetricDefinition;
  reason: string;
  sampleWeight?: number;
  targetLabel: string;
  viewportName: BenchmarkViewport["name"];
}): BenchmarkMetricComparison {
  return {
    elysiaValue,
    corpusBaseline: { reason, type: definition.type },
    evidenceSiteCount: 0,
    evidenceWeight: sampleWeight,
    group: definition.group,
    key: definition.key,
    matchStatus: "notComparable",
    targetLabel,
    viewport: viewportName,
  };
}

function weightedPercentile(
  samples: Array<{ value: number; weight: number }>,
  percentile: number,
) {
  const total = samples.reduce((sum, sample) => sum + sample.weight, 0);
  const threshold = total * percentile;
  let running = 0;

  for (const sample of samples) {
    running += sample.weight;
    if (running >= threshold) return sample.value;
  }

  return samples[samples.length - 1]?.value ?? 0;
}

function getReportStatus({
  alignmentRatio,
  elysia,
  minReferenceSites,
  referenceSitesEnoughData,
  skipExternal,
}: {
  alignmentRatio: number | null;
  elysia: BenchmarkSiteResult;
  minReferenceSites: number;
  referenceSitesEnoughData: number;
  skipExternal: boolean;
}): BenchmarkStatus {
  if (skipExternal) return "local-only";
  if (elysia.enoughViewportCount < 2) return "inconclusive";
  if (referenceSitesEnoughData < minReferenceSites) {
    return "inconclusive";
  }

  return alignmentRatio !== null && alignmentRatio >= 0.8 ? "pass" : "warn";
}

function toSiteResult(
  site: BenchmarkCorpusSite,
  snapshots: BenchmarkSnapshot[],
): BenchmarkSiteResult {
  const enoughViewportCount = new Set(
    snapshots
      .filter((snapshot) => snapshot.enoughData)
      .map((snapshot) => snapshot.viewport.name),
  ).size;
  const hasError = snapshots.some(
    (snapshot) => snapshot.loadStatus === "error",
  );
  const hasBlocked = snapshots.some(
    (snapshot) => snapshot.loadStatus === "blocked",
  );

  return {
    enoughViewportCount,
    loadStatus:
      snapshots.length === 0
        ? "skipped"
        : enoughViewportCount > 0
          ? "ok"
          : hasError
            ? "error"
            : hasBlocked
              ? "blocked"
              : "skipped",
    name: site.name,
    role: site.role,
    snapshots,
    sourceUrl: site.sourceUrl,
    weight: site.weight,
  };
}

function toCorpusSite(site: BenchmarkSiteResult): BenchmarkCorpusSite {
  return {
    name: site.name,
    role: site.role,
    sourceUrl: site.sourceUrl,
    weight: site.weight,
  };
}

function emptySnapshotMap(configs: BenchmarkPartConfig[]) {
  return new Map(
    configs.map((config) => [config.id, [] as BenchmarkSnapshot[]]),
  );
}

function snapshotsForSite(snapshots: BenchmarkSnapshot[], siteName: string) {
  return snapshots.filter((snapshot) => snapshot.siteName === siteName);
}

function unavailableSnapshot({
  config,
  error,
  loadStatus,
  site,
  targetLabel,
  targetUrl,
  viewport,
}: {
  config: BenchmarkPartConfig;
  error: string;
  loadStatus: "blocked" | "error";
  site: BenchmarkCorpusSite;
  targetLabel: string;
  targetUrl: string;
  viewport: BenchmarkViewport;
}): BenchmarkSnapshot {
  return {
    captured: false,
    enoughData: false,
    error,
    loadStatus,
    metrics: emptyMetricValues(config),
    siteName: site.name,
    sourceUrl: site.sourceUrl,
    targetLabel,
    targetUrl,
    viewport,
    weight: site.weight,
  };
}

function emptyMetricValues(config: BenchmarkPartConfig) {
  return Object.fromEntries(
    config.metricDefinitions.map((metric) => [metric.key, null]),
  ) as Record<string, BenchmarkMetricValue>;
}

function formatMetricValue(value: BenchmarkMetricValue) {
  return value === null ? "null" : JSON.stringify(value);
}

function formatBaseline(baseline: BenchmarkCorpusBaseline) {
  if ("median" in baseline) {
    return `median ${round(baseline.median, 2)}; IQR ${round(baseline.q1, 2)}-${round(baseline.q3, 2)}; weight=${round(baseline.sampleWeight, 2)}`;
  }

  if ("majorityValue" in baseline) {
    return `${JSON.stringify(baseline.majorityValue)} (${round(baseline.supportWeight, 2)}/${round(baseline.sampleWeight, 2)})`;
  }

  return baseline.reason;
}

function round(value: number, precision = 0) {
  const multiplier = 10 ** precision;

  return Math.round(value * multiplier) / multiplier;
}

function isLocalhostUrl(value: string) {
  try {
    const url = new URL(value);

    return url.hostname === "localhost" || url.hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

async function canReach(baseUrl: string) {
  try {
    const response = await fetch(baseUrl, { redirect: "manual" });

    return response.status < 500;
  } catch {
    return false;
  }
}

async function waitForUrl(
  baseUrl: string,
  timeoutMs: number,
  child: ChildProcessWithoutNullStreams,
) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    if (child.exitCode !== null) {
      throw new Error(`Local dev server exited with code ${child.exitCode}.`);
    }

    if (await canReach(baseUrl)) return;
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }

  throw new Error(`Timed out waiting for ${baseUrl}.`);
}

function joinUrl(baseUrl: string, targetPath: string) {
  if (/^https?:\/\//u.test(targetPath)) return targetPath;

  return `${baseUrl.replace(/\/+$/u, "")}/${targetPath.replace(/^\/+/u, "")}`;
}
