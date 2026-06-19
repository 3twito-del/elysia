import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import {
  formatCatalogOwnerIntakeValidationMarkdown,
  validateCatalogOwnerIntakeCsv,
} from "./catalog-owner-intake";

type CatalogOwnerIntakeValidateOptions = {
  filePath?: string;
  outDir?: string;
  strict: boolean;
};

export function parseCatalogOwnerIntakeValidateArgs(
  args: readonly string[],
): CatalogOwnerIntakeValidateOptions {
  const options: CatalogOwnerIntakeValidateOptions = {
    strict: false,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    const next = args[index + 1];

    if (arg === "--") {
      continue;
    } else if ((arg === "--file" || arg === "--intake") && next) {
      options.filePath = next;
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

function createCatalogOwnerIntakeValidationArtifactDir() {
  const stamp = new Date().toISOString().replace(/[:.]/gu, "-");

  return path.join(
    process.cwd(),
    "artifacts",
    "qa",
    `${stamp}-catalog-owner-intake-validation`,
  );
}

function writeArtifacts(input: {
  generatedAt: string;
  outDir: string;
  sourcePath: string;
  validation: ReturnType<typeof validateCatalogOwnerIntakeCsv>;
}) {
  mkdirSync(input.outDir, { recursive: true });
  writeFileSync(
    path.join(input.outDir, "catalog-owner-intake-validation.json"),
    `${JSON.stringify(
      {
        generatedAt: input.generatedAt,
        sourcePath: input.sourcePath,
        validation: input.validation,
      },
      null,
      2,
    )}\n`,
  );
  writeFileSync(
    path.join(input.outDir, "catalog-owner-intake-validation.md"),
    formatCatalogOwnerIntakeValidationMarkdown(input),
  );
}

function printHelp() {
  console.log(`Catalog owner intake validation

Usage:
  pnpm catalog:intake:validate -- --file <catalog-owner-intake.csv> [options]

Options:
  --file <path>      Filled owner-intake CSV to validate.
  --out-dir <path>   Write JSON and Markdown validation artifacts.
  --strict           Return a non-zero exit code when validation has errors.
  --help             Show this help.
`);
}

async function main(args = process.argv.slice(2)) {
  if (args.includes("--help") || args.includes("-h")) {
    printHelp();
    return;
  }

  const options = parseCatalogOwnerIntakeValidateArgs(args);
  if (!options.filePath) {
    throw new Error("--file <catalog-owner-intake.csv> is required.");
  }

  const generatedAt = new Date().toISOString();
  const validation = validateCatalogOwnerIntakeCsv(
    readFileSync(options.filePath, "utf8"),
    { now: new Date(generatedAt) },
  );
  const outDir =
    options.outDir ?? createCatalogOwnerIntakeValidationArtifactDir();

  writeArtifacts({
    generatedAt,
    outDir,
    sourcePath: options.filePath,
    validation,
  });
  console.log(
    JSON.stringify(
      {
        generatedAt,
        issueCounts: validation.issueCounts,
        outDir,
        productCount: validation.productCount,
        ready: validation.ready,
        sourcePath: options.filePath,
      },
      null,
      2,
    ),
  );

  if (options.strict && !validation.ready) process.exitCode = 1;
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
