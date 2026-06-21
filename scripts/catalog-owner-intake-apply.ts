import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { PrismaClient, type ProductMediaRole } from "@prisma/client";

import {
  parseCatalogOwnerIntakeRows,
  validateCatalogOwnerIntakeCsv,
  type CatalogOwnerIntakeColumn,
  type CatalogOwnerIntakeParsedRow,
  type CatalogOwnerIntakeValidationIssue,
} from "./catalog-owner-intake";
import { loadCatalogReadinessEnv } from "./catalog-readiness-audit";

type CatalogOwnerIntakeApplyOptions = {
  apply: boolean;
  envFiles: string[];
  filePath?: string;
  outDir?: string;
  replaceMedia: boolean;
  warningsAsErrors: boolean;
};

type CatalogOwnerIntakeApplyProduct = {
  id: string;
  slug: string;
};

type CatalogOwnerIntakeApplyIssue = CatalogOwnerIntakeValidationIssue;

type CatalogOwnerIntakeProductUpdate = {
  careInstructions: string;
  countryOfManufacture: string;
  deliveryPromise: string;
  factSourceReference: string;
  factVerifiedAt: string;
  factVerifiedBy: string;
  manufacturerOrImporter: string;
  materialDetails: string;
  measurements: string;
  policySourceReference: string;
  policyVerifiedAt: string;
  policyVerifiedBy: string;
  returnPolicy: string;
  stoneDetails: string | null;
  warranty: string;
};

type CatalogOwnerIntakeMediaReplacement = {
  alt: string;
  isPrimary: boolean;
  role: ProductMediaRole;
  sortOrder: number;
  url: string;
};

export type CatalogOwnerIntakeApplyPlan = {
  issueCounts: Record<"error" | "warning", number>;
  issues: CatalogOwnerIntakeApplyIssue[];
  mode: "apply" | "dry-run";
  productCount: number;
  products: {
    mediaReplacement: CatalogOwnerIntakeMediaReplacement[];
    productFound: boolean;
    productId?: string;
    productSlug: string;
    productUpdate: CatalogOwnerIntakeProductUpdate;
    rowNumber: number;
  }[];
  ready: boolean;
  replaceMedia: boolean;
};

const mediaRoleMappings = [
  {
    altField: "primaryAltText",
    isPrimary: true,
    role: "PRIMARY",
    sortOrder: 0,
    urlField: "primaryMediaUrl",
  },
  {
    altField: "alternateAltText",
    isPrimary: false,
    role: "ALTERNATE",
    sortOrder: 1,
    urlField: "alternateMediaUrl",
  },
  {
    altField: "scaleAltText",
    isPrimary: false,
    role: "SCALE",
    sortOrder: 2,
    urlField: "scaleMediaUrl",
  },
  {
    altField: "constructionAltText",
    isPrimary: false,
    role: "CONSTRUCTION",
    sortOrder: 3,
    urlField: "constructionMediaUrl",
  },
  {
    altField: "materialAltText",
    isPrimary: false,
    role: "MATERIAL",
    sortOrder: 4,
    urlField: "materialMediaUrl",
  },
  {
    altField: "contextAltText",
    isPrimary: false,
    role: "CONTEXT",
    sortOrder: 5,
    urlField: "contextMediaUrl",
  },
] as const satisfies readonly {
  altField: CatalogOwnerIntakeColumn;
  isPrimary: boolean;
  role: ProductMediaRole;
  sortOrder: number;
  urlField: CatalogOwnerIntakeColumn;
}[];

export function parseCatalogOwnerIntakeApplyArgs(
  args: readonly string[],
): CatalogOwnerIntakeApplyOptions {
  const options: CatalogOwnerIntakeApplyOptions = {
    apply: false,
    envFiles: [".env", ".env.local", ".env.development.local"],
    replaceMedia: false,
    warningsAsErrors: false,
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
    } else if (arg === "--env-file" && next) {
      options.envFiles.push(next);
      index += 1;
    } else if (arg === "--apply") {
      options.apply = true;
    } else if (arg === "--replace-media") {
      options.replaceMedia = true;
    } else if (arg === "--warnings-as-errors") {
      options.warningsAsErrors = true;
    }
  }

  return options;
}

export function createCatalogOwnerIntakeApplyPlan(input: {
  mode: "apply" | "dry-run";
  products: readonly CatalogOwnerIntakeApplyProduct[];
  replaceMedia: boolean;
  rows: readonly CatalogOwnerIntakeParsedRow[];
  validationIssues?: readonly CatalogOwnerIntakeValidationIssue[];
  warningsAsErrors?: boolean;
}): CatalogOwnerIntakeApplyPlan {
  const productsBySlug = new Map(
    input.products.map((product) => [product.slug, product] as const),
  );
  const issues: CatalogOwnerIntakeApplyIssue[] = [
    ...(input.validationIssues ?? []),
  ];

  if (!input.replaceMedia) {
    issues.push({
      code: "MEDIA_REPLACEMENT_NOT_SELECTED",
      message:
        "Media rows are validated but will not be written unless --replace-media is passed.",
      severity: input.warningsAsErrors ? "error" : "warning",
    });
  }

  const products = input.rows.map((row) => {
    const productSlug = row.values.productSlug.trim();
    const product = productsBySlug.get(productSlug);

    if (!product) {
      issues.push({
        code: "PRODUCT_NOT_FOUND",
        field: "productSlug",
        message: "Product slug was not found in the selected database.",
        productSlug,
        rowNumber: row.rowNumber,
        severity: "error",
      });
    }

    return {
      mediaReplacement: createMediaReplacement(row),
      productFound: Boolean(product),
      productId: product?.id,
      productSlug,
      productUpdate: createProductUpdate(row),
      rowNumber: row.rowNumber,
    };
  });
  const issueCounts = countApplyIssues(issues);

  return {
    issueCounts,
    issues: issues.sort(compareApplyIssues),
    mode: input.mode,
    productCount: products.length,
    products,
    ready: issueCounts.error === 0 && products.length > 0,
    replaceMedia: input.replaceMedia,
  };
}

export function formatCatalogOwnerIntakeApplyPlanMarkdown(input: {
  generatedAt: string;
  plan: CatalogOwnerIntakeApplyPlan;
  sourcePath: string;
}) {
  const { plan } = input;
  const lines = [
    "# Catalog Owner Intake Apply Plan",
    "",
    `Generated: ${input.generatedAt}`,
    `Source: ${input.sourcePath}`,
    `Mode: ${plan.mode}`,
    `Replace media: ${plan.replaceMedia ? "yes" : "no"}`,
    `Status: ${plan.ready ? "READY" : "BLOCKED"}`,
    "",
    "## Summary",
    "",
    "| Metric | Value |",
    "| --- | ---: |",
    `| Products | ${plan.productCount} |`,
    `| Errors | ${plan.issueCounts.error} |`,
    `| Warnings | ${plan.issueCounts.warning} |`,
    "",
    "## Product Plan",
    "",
    "| Row | Product | DB product | Product fields | Media roles |",
    "| ---: | --- | --- | ---: | ---: |",
    ...plan.products.map(
      (product) =>
        `| ${product.rowNumber} | \`${product.productSlug || "missing-productSlug"}\` | ${product.productFound ? "yes" : "no"} | ${Object.keys(product.productUpdate).length} | ${product.mediaReplacement.length} |`,
    ),
    "",
    "## Issues",
    "",
    ...(plan.issues.length === 0
      ? ["None."]
      : plan.issues.map(
          (issue) =>
            `- **${issue.severity.toUpperCase()}** \`${issue.code}\`${issue.rowNumber ? ` on row ${issue.rowNumber}` : ""}${issue.productSlug ? ` (\`${issue.productSlug}\`)` : ""}${issue.field ? ` \`${issue.field}\`` : ""}: ${issue.message}`,
        )),
    "",
  ];

  return `${lines.join("\n")}\n`;
}

async function applyCatalogOwnerIntakePlan(input: {
  plan: CatalogOwnerIntakeApplyPlan;
  prisma: PrismaClient;
}) {
  if (!input.plan.ready) {
    throw new Error(
      "Owner intake apply plan is blocked and cannot be applied.",
    );
  }

  for (const product of input.plan.products) {
    if (!product.productId) continue;

    await input.prisma.$transaction(async (tx) => {
      await tx.product.update({
        data: createPrismaProductUpdate(product.productUpdate),
        where: { id: product.productId },
      });

      if (!input.plan.replaceMedia) return;

      await tx.productMedia.deleteMany({
        where: {
          productId: product.productId,
          role: { in: mediaRoleMappings.map((mapping) => mapping.role) },
        },
      });
      await tx.productMedia.createMany({
        data: product.mediaReplacement.map((media) => ({
          alt: media.alt,
          isPrimary: media.isPrimary,
          kind: "IMAGE",
          productId: product.productId!,
          role: media.role,
          sortOrder: media.sortOrder,
          url: media.url,
        })),
      });
    });
  }
}

async function loadProductsForRows(input: {
  databaseUrl: string;
  rows: readonly CatalogOwnerIntakeParsedRow[];
}) {
  const prisma = new PrismaClient({
    datasourceUrl: input.databaseUrl,
    log: [],
  });

  try {
    const slugs = [...new Set(input.rows.map((row) => row.values.productSlug))];

    return {
      prisma,
      products: await prisma.product.findMany({
        select: { id: true, slug: true },
        where: { slug: { in: slugs } },
      }),
    };
  } catch (error) {
    await prisma.$disconnect();
    throw error;
  }
}

function createProductUpdate(
  row: CatalogOwnerIntakeParsedRow,
): CatalogOwnerIntakeProductUpdate {
  return {
    careInstructions: row.values.careInstructions,
    countryOfManufacture: row.values.countryOfManufacture,
    deliveryPromise: row.values.deliveryPromise,
    factSourceReference: row.values.factSourceReference,
    factVerifiedAt: toIsoDate(row.values.factVerifiedAt),
    factVerifiedBy: row.values.factVerifiedBy,
    manufacturerOrImporter: row.values.manufacturerOrImporter,
    materialDetails: row.values.materialDetails,
    measurements: row.values.measurements,
    policySourceReference: row.values.policySourceReference,
    policyVerifiedAt: toIsoDate(row.values.policyVerifiedAt),
    policyVerifiedBy: row.values.policyVerifiedBy,
    returnPolicy: row.values.returnPolicy,
    stoneDetails: row.values.stoneDetails.trim() || null,
    warranty: row.values.warranty,
  };
}

function createPrismaProductUpdate(update: CatalogOwnerIntakeProductUpdate) {
  return {
    careInstructions: update.careInstructions,
    countryOfManufacture: update.countryOfManufacture,
    deliveryPromise: update.deliveryPromise,
    factSourceReference: update.factSourceReference,
    factVerifiedAt: new Date(update.factVerifiedAt),
    factVerifiedBy: update.factVerifiedBy,
    manufacturerOrImporter: update.manufacturerOrImporter,
    materialDetails: update.materialDetails,
    measurements: update.measurements,
    policySourceReference: update.policySourceReference,
    policyVerifiedAt: new Date(update.policyVerifiedAt),
    policyVerifiedBy: update.policyVerifiedBy,
    returnPolicy: update.returnPolicy,
    stoneDetails: update.stoneDetails,
    warranty: update.warranty,
  };
}

function createMediaReplacement(
  row: CatalogOwnerIntakeParsedRow,
): CatalogOwnerIntakeMediaReplacement[] {
  return mediaRoleMappings.map((mapping) => ({
    alt: row.values[mapping.altField],
    isPrimary: mapping.isPrimary,
    role: mapping.role,
    sortOrder: mapping.sortOrder,
    url: row.values[mapping.urlField],
  }));
}

function countApplyIssues(issues: readonly CatalogOwnerIntakeApplyIssue[]) {
  const counts: Record<"error" | "warning", number> = {
    error: 0,
    warning: 0,
  };

  for (const issue of issues) counts[issue.severity] += 1;

  return counts;
}

function compareApplyIssues(
  left: CatalogOwnerIntakeApplyIssue,
  right: CatalogOwnerIntakeApplyIssue,
) {
  const severityRank: Record<"error" | "warning", number> = {
    error: 0,
    warning: 1,
  };

  return (
    severityRank[left.severity] - severityRank[right.severity] ||
    (left.rowNumber ?? 0) - (right.rowNumber ?? 0) ||
    (left.productSlug ?? "").localeCompare(right.productSlug ?? "") ||
    left.code.localeCompare(right.code) ||
    (left.field ?? "").localeCompare(right.field ?? "")
  );
}

function createArtifactDir() {
  const stamp = new Date().toISOString().replace(/[:.]/gu, "-");

  return path.join(
    process.cwd(),
    "artifacts",
    "qa",
    `${stamp}-catalog-owner-intake-apply`,
  );
}

function writeArtifacts(input: {
  generatedAt: string;
  outDir: string;
  plan: CatalogOwnerIntakeApplyPlan;
  sourcePath: string;
}) {
  mkdirSync(input.outDir, { recursive: true });
  writeFileSync(
    path.join(input.outDir, "catalog-owner-intake-apply.json"),
    `${JSON.stringify(input, null, 2)}\n`,
  );
  writeFileSync(
    path.join(input.outDir, "catalog-owner-intake-apply.md"),
    formatCatalogOwnerIntakeApplyPlanMarkdown(input),
  );
}

function toIsoDate(value: string) {
  return new Date(value).toISOString();
}

function requireDatabaseUrl(value: string | undefined) {
  if (!value?.trim()) {
    throw new Error("DATABASE_URL is required to create an apply plan.");
  }

  return value;
}

function printHelp() {
  console.log(`Catalog owner intake apply plan

Usage:
  pnpm catalog:intake:apply -- --file <catalog-owner-intake.csv> [options]

Options:
  --file <path>          Filled owner-intake CSV to validate and plan.
  --out-dir <path>       Write JSON and Markdown apply-plan artifacts.
  --env-file <path>      Load an additional environment file.
  --apply                Write approved product truth and policy fields.
  --replace-media        With --apply, replace the six governed media roles.
  --warnings-as-errors   Treat warnings as blocking issues.
  --help                 Show this help.

Default mode is dry-run. The script refuses to plan or apply a CSV that fails
catalog:intake:validate.
`);
}

async function main(args = process.argv.slice(2)) {
  if (args.includes("--help") || args.includes("-h")) {
    printHelp();
    return;
  }

  const options = parseCatalogOwnerIntakeApplyArgs(args);
  if (!options.filePath) {
    throw new Error("--file <catalog-owner-intake.csv> is required.");
  }

  const content = readFileSync(options.filePath, "utf8");
  const validation = validateCatalogOwnerIntakeCsv(content);
  if (!validation.ready) {
    throw new Error(
      "Owner intake validation failed. Run pnpm catalog:intake:validate before creating an apply plan.",
    );
  }

  const { rows } = parseCatalogOwnerIntakeRows(content);
  const env = loadCatalogReadinessEnv(options.envFiles);
  const { prisma, products } = await loadProductsForRows({
    databaseUrl: requireDatabaseUrl(env.DATABASE_URL),
    rows,
  });

  try {
    const generatedAt = new Date().toISOString();
    const plan = createCatalogOwnerIntakeApplyPlan({
      mode: options.apply ? "apply" : "dry-run",
      products,
      replaceMedia: options.replaceMedia,
      rows,
      warningsAsErrors: options.warningsAsErrors,
    });
    const outDir = options.outDir ?? createArtifactDir();

    writeArtifacts({
      generatedAt,
      outDir,
      plan,
      sourcePath: options.filePath,
    });

    if (options.apply) {
      await applyCatalogOwnerIntakePlan({ plan, prisma });
    }

    console.log(
      JSON.stringify(
        {
          applied: options.apply && plan.ready,
          generatedAt,
          issueCounts: plan.issueCounts,
          mode: plan.mode,
          outDir,
          productCount: plan.productCount,
          ready: plan.ready,
          replaceMedia: plan.replaceMedia,
          sourcePath: options.filePath,
        },
        null,
        2,
      ),
    );

    if (!plan.ready) process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
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
