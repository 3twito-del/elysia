import { pathToFileURL } from "node:url";

import {
  DEFAULT_BENCHMARK_OUT_DIR,
  parseBenchmarkArgs,
  type BenchmarkMetricComparison as HeaderMetricComparison,
  type BenchmarkMetricDefinition as HeaderMetricDefinition,
  type BenchmarkMetricType as HeaderMetricType,
  type BenchmarkMetricValue as HeaderMetricValue,
  type BenchmarkReport as HeaderBenchmarkReport,
  type BenchmarkSiteResult as HeaderBenchmarkSiteResult,
  type BenchmarkSnapshot as HeaderSiteSnapshot,
  type BenchmarkStatus as HeaderBenchmarkStatus,
  type BenchmarkViewport as HeaderBenchmarkViewport,
  type BenchmarkCorpusBaseline as HeaderCorpusBaseline,
  BENCHMARK_VIEWPORTS,
  buildBenchmarkMarkdown,
  captureBenchmarkSnapshot,
  createBenchmarkReport,
  ensureLocalServer,
  runBenchmarkPart,
  scoreDiscreteMetric as coreScoreDiscreteMetric,
  scoreNumericMetric as coreScoreNumericMetric,
  stopLocalServer,
  type BenchmarkMetricDefinition,
  type BenchmarkMetricValue,
  type BenchmarkOptions,
} from "./benchmarks/core";
import { benchmarkParts } from "./benchmarks/extractors/public-parts";
import { getPartIds, runSiteBenchmark } from "./benchmarks/site-benchmark";

export type {
  HeaderBenchmarkReport,
  HeaderBenchmarkSiteResult,
  HeaderBenchmarkStatus,
  HeaderBenchmarkViewport,
  HeaderCorpusBaseline,
  HeaderMetricComparison,
  HeaderMetricDefinition,
  HeaderMetricType,
  HeaderMetricValue,
  HeaderSiteSnapshot,
};

export const HEADER_BENCHMARK_VIEWPORTS = BENCHMARK_VIEWPORTS;
export const HEADER_BENCHMARK_DEFAULT_OUT_DIR = `${DEFAULT_BENCHMARK_OUT_DIR}/header-benchmark`;
const headerBenchmarkPart = benchmarkParts.find(
  (part) => part.id === "header",
)!;
export const HEADER_METRIC_DEFINITIONS = headerBenchmarkPart.metricDefinitions;

export function buildHeaderBenchmarkMarkdown(report: HeaderBenchmarkReport) {
  return buildBenchmarkMarkdown(report, headerBenchmarkPart);
}

export function createHeaderBenchmarkReport({
  elysiaSnapshots,
  referenceSnapshots,
  runAt,
  skipExternal,
}: {
  elysiaSnapshots: HeaderSiteSnapshot[];
  referenceSnapshots: HeaderSiteSnapshot[];
  runAt: string;
  skipExternal: boolean;
}) {
  return createBenchmarkReport({
    elysiaSnapshots,
    canonicalSnapshots: referenceSnapshots,
    config: headerBenchmarkPart,
    replacementSnapshots: [],
    replacementSites: [],
    runAt,
    skipExternal,
  });
}

export function scoreDiscreteMetric({
  elysiaValue,
  definition,
  values,
  viewportName = "desktop",
}: {
  elysiaValue: BenchmarkMetricValue;
  definition: BenchmarkMetricDefinition;
  values: Exclude<BenchmarkMetricValue, null>[];
  viewportName?: HeaderBenchmarkViewport["name"];
}) {
  return coreScoreDiscreteMetric({
    elysiaValue,
    definition,
    samples: values.map((value) => ({ value, weight: 1.5 })),
    thresholdWeight: 12,
    viewportName,
  });
}

export function scoreNumericMetric({
  elysiaValue,
  definition,
  values,
  viewportName = "desktop",
}: {
  elysiaValue: BenchmarkMetricValue;
  definition: BenchmarkMetricDefinition;
  values: Exclude<BenchmarkMetricValue, null>[];
  viewportName?: HeaderBenchmarkViewport["name"];
}) {
  return coreScoreNumericMetric({
    activeWeight: 12,
    elysiaValue,
    definition,
    samples: values.map((value) => ({ value, weight: 1.5 })),
    viewportName,
  });
}

export async function runHeaderBenchmark(options: BenchmarkOptions) {
  return runBenchmarkPart(headerBenchmarkPart, options);
}

export async function captureHeaderSnapshot(
  page: Parameters<typeof captureBenchmarkSnapshot>[0],
  target: { name: string; sourceUrl: string },
  viewport: HeaderBenchmarkViewport,
) {
  return captureBenchmarkSnapshot(
    page,
    headerBenchmarkPart,
    {
      name: target.name,
      role: target.name === "Elysia" ? "local" : "canonical",
      sourceUrl: target.sourceUrl,
      weight: target.name === "Elysia" ? 0 : 1.5,
    },
    viewport,
    { label: "header", path: target.sourceUrl },
  );
}

export function parseHeaderBenchmarkArgs(argv = process.argv.slice(2)) {
  const normalizedArgs = argv.includes("--part")
    ? argv
    : ["--part", "header", ...argv];
  const parsed = parseBenchmarkArgs(normalizedArgs);

  return {
    ...parsed,
    outDir:
      parsed.outDir === DEFAULT_BENCHMARK_OUT_DIR
        ? HEADER_BENCHMARK_DEFAULT_OUT_DIR
        : parsed.outDir,
  };
}

async function main() {
  const parsed = parseHeaderBenchmarkArgs();
  let devServer: Awaited<ReturnType<typeof ensureLocalServer>> = null;

  try {
    devServer = await ensureLocalServer(parsed.baseUrl);
    await runSiteBenchmark({
      options: {
        baseUrl: parsed.baseUrl,
        headed: parsed.headed,
        outDir:
          parsed.outDir === HEADER_BENCHMARK_DEFAULT_OUT_DIR
            ? DEFAULT_BENCHMARK_OUT_DIR
            : parsed.outDir,
        replaceBlocked: parsed.replaceBlocked,
        skipExternal: parsed.skipExternal,
      },
      partIds: getPartIds({ all: false, parts: ["header"] }),
    });
  } finally {
    stopLocalServer(devServer);
  }
}

const isMain =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
