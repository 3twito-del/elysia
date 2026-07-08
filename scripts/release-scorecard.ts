import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import {
  buildReleaseScorecard,
  formatReleaseScorecardMarkdown,
  type CatalogReadinessSummary,
  type ReleaseScorecardInput,
} from "./lib/release-scorecard";

type Options = {
  catalogReadinessPath?: string;
  configPath?: string;
  outDir?: string;
  strict: boolean;
};

export function parseReleaseScorecardArgs(args: readonly string[]): Options {
  const options: Options = { strict: false };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    const next = args[index + 1];

    if (arg === "--") {
      continue;
    } else if (arg === "--config" && next) {
      options.configPath = next;
      index += 1;
    } else if (arg === "--catalog-readiness" && next) {
      options.catalogReadinessPath = next;
      index += 1;
    } else if (arg === "--out-dir" && next) {
      options.outDir = next;
      index += 1;
    } else if (arg === "--strict") {
      options.strict = true;
    }
  }

  return options;
}

function createArtifactDir() {
  const stamp = new Date().toISOString().replace(/[:.]/gu, "-");
  return path.join(
    process.cwd(),
    "artifacts",
    "qa",
    `${stamp}-release-scorecard`,
  );
}

// Reduce a catalog-readiness audit artifact to the summary the scorecard needs.
export function readCatalogReadinessSummary(
  raw: string,
): CatalogReadinessSummary {
  const parsed = JSON.parse(raw) as {
    audit?: {
      issueCounts?: { blocker?: number; high?: number };
      productCount?: number;
      publishReadyCount?: number;
      ready?: boolean;
    };
  };
  const audit = parsed.audit;
  if (!audit || typeof audit.ready !== "boolean") {
    throw new Error(
      "Catalog readiness artifact is missing an `audit` object with a `ready` flag.",
    );
  }

  return {
    productCount: audit.productCount ?? 0,
    publishReadyCount: audit.publishReadyCount ?? 0,
    ready: audit.ready,
    blocker: audit.issueCounts?.blocker,
    high: audit.issueCounts?.high,
  };
}

function printHelp() {
  console.log(`Release scorecard (master plan L-11)

Usage:
  pnpm release:scorecard -- --config <scorecard.json> [options]

Options:
  --config <path>             JSON file declaring release field statuses/evidence.
  --catalog-readiness <path>  catalog-readiness.json artifact to derive
                              catalog/media completeness from the audit.
  --out-dir <path>            Write JSON and Markdown scorecard artifacts.
  --strict                    Exit non-zero when the release is NOT READY.
  --help                      Show this help.

The config JSON accepts:
  { "release", "commit", "deployment", "environment",
    "fields": { "<fieldKey>": { "status", "evidence", "note" } } }
Unprovided fields default to MISSING, keeping the release NOT READY.
`);
}

export async function main(args = process.argv.slice(2)) {
  if (args.includes("--help") || args.includes("-h")) {
    printHelp();
    return;
  }

  const options = parseReleaseScorecardArgs(args);

  const config: Omit<
    ReleaseScorecardInput,
    "generatedAt" | "catalogReadiness"
  > = options.configPath
    ? (JSON.parse(readFileSync(options.configPath, "utf8")) as Omit<
        ReleaseScorecardInput,
        "generatedAt" | "catalogReadiness"
      >)
    : {};

  const catalogReadiness = options.catalogReadinessPath
    ? readCatalogReadinessSummary(
        readFileSync(options.catalogReadinessPath, "utf8"),
      )
    : null;

  const generatedAt = new Date().toISOString();
  const scorecard = buildReleaseScorecard({
    ...config,
    catalogReadiness,
    generatedAt,
  });

  const outDir = options.outDir ?? createArtifactDir();
  mkdirSync(outDir, { recursive: true });
  writeFileSync(
    path.join(outDir, "release-scorecard.json"),
    `${JSON.stringify(scorecard, null, 2)}\n`,
  );
  writeFileSync(
    path.join(outDir, "release-scorecard.md"),
    formatReleaseScorecardMarkdown(scorecard),
  );

  console.log(
    JSON.stringify(
      {
        blockingFields: scorecard.blockingFields,
        gates: {
          L1: {
            ready: scorecard.gates.L1.ready,
            satisfiedCount: scorecard.gates.L1.satisfiedCount,
            totalCount: scorecard.gates.L1.totalCount,
          },
          L2: {
            ready: scorecard.gates.L2.ready,
            satisfiedCount: scorecard.gates.L2.satisfiedCount,
            totalCount: scorecard.gates.L2.totalCount,
          },
        },
        generatedAt,
        outDir,
        ready: scorecard.ready,
        satisfiedCount: scorecard.satisfiedCount,
        totalCount: scorecard.totalCount,
      },
      null,
      2,
    ),
  );

  if (options.strict && !scorecard.ready) process.exitCode = 1;
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
