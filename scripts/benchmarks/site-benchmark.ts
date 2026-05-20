import path from "node:path";
import { pathToFileURL } from "node:url";

import {
  DEFAULT_BENCHMARK_OUT_DIR,
  DEFAULT_BASE_URL,
  ensureLocalServer,
  parseBenchmarkArgs,
  readBenchmarkReports,
  runBenchmarkParts,
  stopLocalServer,
  writeBenchmarkIndex,
  writeBenchmarkReport,
  type BenchmarkOptions,
  type BenchmarkReport,
} from "./core";
import { benchmarkParts } from "./extractors/public-parts";

export {
  BENCHMARK_VIEWPORTS,
  buildBenchmarkMarkdown,
  captureBenchmarkSnapshot,
  createBenchmarkReport,
  parseBenchmarkArgs,
  scoreDiscreteMetric,
  scoreNumericMetric,
} from "./core";
export {
  benchmarkParts,
  publicSurfaceExtractor,
} from "./extractors/public-parts";

export async function runSiteBenchmark({
  options,
  partIds,
}: {
  options: BenchmarkOptions;
  partIds: string[];
}) {
  const selectedParts = benchmarkParts.filter((part) =>
    partIds.includes(part.id),
  );

  if (selectedParts.length !== partIds.length) {
    const available = benchmarkParts.map((part) => part.id).join(", ");
    const missing = partIds.filter(
      (partId) => !selectedParts.some((part) => part.id === partId),
    );

    throw new Error(
      `Unknown benchmark part(s): ${missing.join(", ")}. Available: ${available}`,
    );
  }

  const reports = await runBenchmarkParts(selectedParts, options);

  for (const report of reports) {
    const part = selectedParts.find(
      (candidate) => candidate.id === report.part.id,
    );

    if (!part) continue;

    await writeBenchmarkReport({
      config: part,
      outDir: options.outDir,
      report,
    });

    const alignment =
      report.summary.alignmentRatio === null
        ? "n/a"
        : `${Math.round(report.summary.alignmentRatio * 100)}%`;

    console.log(
      `${part.id} benchmark ${report.summary.status}: ${alignment} alignment, ${report.summary.referenceSitesEnoughData}/${report.activeCorpus.length} active reference sites.`,
    );
  }

  const existingReports = await readBenchmarkReports({
    configs: benchmarkParts,
    outDir: options.outDir,
  });
  const indexReports = benchmarkParts
    .map(
      (part) =>
        reports.find((report) => report.part.id === part.id) ??
        existingReports.find((report) => report.part.id === part.id),
    )
    .filter((report): report is BenchmarkReport => Boolean(report));

  await writeBenchmarkIndex({ outDir: options.outDir, reports: indexReports });

  return reports;
}

export function getPartIds({ all, parts }: { all: boolean; parts: string[] }) {
  if (all) return benchmarkParts.map((part) => part.id);
  if (parts.length > 0) return parts;

  return ["header"];
}

function printHelp() {
  console.log(`Public site benchmark

Usage:
  pnpm tsx scripts/benchmarks/site-benchmark.ts [options]

Options:
  --part <id>           Benchmark one part. Can be repeated.
  --all                 Benchmark all configured public parts.
  --base-url <url>      Local Elysia URL. Defaults to ${DEFAULT_BASE_URL}
  --out-dir <path>      Report directory. Defaults to ${DEFAULT_BENCHMARK_OUT_DIR}
  --headed              Run browser headed for manual inspection.
  --skip-external       Capture Elysia only and mark reports local-only.
  --replace-blocked     Replace blocked canonical sites with reserve sites.
  --help                Show this help.

Parts:
  ${benchmarkParts.map((part) => part.id).join(", ")}
`);
}

async function main() {
  const parsed = parseBenchmarkArgs();

  if (parsed.help) {
    printHelp();
    return;
  }

  const partIds = getPartIds(parsed);
  let devServer: Awaited<ReturnType<typeof ensureLocalServer>> = null;

  try {
    devServer = await ensureLocalServer(parsed.baseUrl);
    await runSiteBenchmark({
      options: {
        baseUrl: parsed.baseUrl,
        headed: parsed.headed,
        outDir: parsed.outDir,
        replaceBlocked: parsed.replaceBlocked,
        skipExternal: parsed.skipExternal,
      },
      partIds,
    });
    console.log(
      `Wrote benchmark index to ${path.join(parsed.outDir, "benchmark-index.md")}`,
    );
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
