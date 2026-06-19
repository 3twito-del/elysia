import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import {
  buildCatalogQualityReport,
  formatCatalogQualityReportMarkdown,
  type CatalogQualityAudit,
} from "./lib/catalog-quality-report";

type Options = {
  auditPath?: string;
  outDir?: string;
  sampleSize?: number;
  strict: boolean;
};

export function parseCatalogQualityReportArgs(
  args: readonly string[],
): Options {
  const options: Options = { strict: false };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    const next = args[index + 1];

    if (arg === "--") {
      continue;
    } else if ((arg === "--audit" || arg === "--readiness") && next) {
      options.auditPath = next;
      index += 1;
    } else if (arg === "--out-dir" && next) {
      options.outDir = next;
      index += 1;
    } else if (arg === "--sample-size" && next) {
      options.sampleSize = Number.parseInt(next, 10);
      index += 1;
    } else if (arg === "--strict") {
      options.strict = true;
    }
  }

  return options;
}

export function readCatalogQualityAudit(raw: string): CatalogQualityAudit {
  const parsed = JSON.parse(raw) as { audit?: CatalogQualityAudit };
  const audit = parsed.audit;
  if (
    !audit ||
    !Array.isArray(audit.issues) ||
    !Array.isArray(audit.products)
  ) {
    throw new Error(
      "Catalog readiness artifact is missing an `audit` object with `issues` and `products` arrays.",
    );
  }

  return audit;
}

function createArtifactDir() {
  const stamp = new Date().toISOString().replace(/[:.]/gu, "-");
  return path.join(
    process.cwd(),
    "artifacts",
    "qa",
    `${stamp}-catalog-quality-report`,
  );
}

function printHelp() {
  console.log(`Catalog quality report (master plan C-08)

Usage:
  pnpm catalog:quality -- --audit <catalog-readiness.json> [options]

Options:
  --audit <path>       catalog-readiness.json artifact to summarize.
  --out-dir <path>     Write JSON and Markdown report artifacts.
  --sample-size <n>    Sample product slugs per finding (default 5).
  --strict             Exit non-zero when the audit is not ready.
  --help               Show this help.
`);
}

export async function main(args = process.argv.slice(2)) {
  if (args.includes("--help") || args.includes("-h")) {
    printHelp();
    return;
  }

  const options = parseCatalogQualityReportArgs(args);
  if (!options.auditPath) {
    throw new Error("--audit <catalog-readiness.json> is required.");
  }

  const audit = readCatalogQualityAudit(
    readFileSync(options.auditPath, "utf8"),
  );
  const generatedAt = new Date().toISOString();
  const report = buildCatalogQualityReport(audit, {
    sampleSize: options.sampleSize,
  });

  const outDir = options.outDir ?? createArtifactDir();
  mkdirSync(outDir, { recursive: true });
  writeFileSync(
    path.join(outDir, "catalog-quality-report.json"),
    `${JSON.stringify({ generatedAt, report }, null, 2)}\n`,
  );
  writeFileSync(
    path.join(outDir, "catalog-quality-report.md"),
    formatCatalogQualityReportMarkdown({
      generatedAt,
      report,
      source: options.auditPath,
    }),
  );

  console.log(
    JSON.stringify(
      {
        generatedAt,
        outDir,
        productCount: report.productCount,
        publishReadyCount: report.publishReadyCount,
        ready: report.ready,
        totalBlockers: report.totalBlockers,
      },
      null,
      2,
    ),
  );

  if (options.strict && !report.ready) process.exitCode = 1;
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
