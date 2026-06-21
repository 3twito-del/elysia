import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { parseCsvRows, renderCsvRow } from "./lib/csv";

export const catalogOwnerIntakeHeader = [
  "productSlug",
  "priorityTier",
  "releaseScope",
  "directOwner",
  "acceptanceOwner",
  "residualRisk",
  "factSourceReference",
  "factVerifiedBy",
  "factVerifiedAt",
  "countryOfManufacture",
  "manufacturerOrImporter",
  "materialDetails",
  "measurements",
  "stoneDetails",
  "variantSkuMap",
  "policySourceReference",
  "policyVerifiedBy",
  "policyVerifiedAt",
  "deliveryPromise",
  "returnPolicy",
  "careInstructions",
  "warranty",
  "supplierOrderException",
  "primaryMediaUrl",
  "alternateMediaUrl",
  "scaleMediaUrl",
  "constructionMediaUrl",
  "materialMediaUrl",
  "contextMediaUrl",
  "mediaSourceReference",
  "mediaApprovedBy",
  "mediaApprovedAt",
  "primaryAltText",
  "alternateAltText",
  "scaleAltText",
  "constructionAltText",
  "materialAltText",
  "contextAltText",
  "altTextOwner",
] as const;

export type CatalogOwnerIntakeColumn =
  (typeof catalogOwnerIntakeHeader)[number];

type CatalogReadinessProductSummary = {
  issueCounts: {
    blocker: number;
    high: number;
    info: number;
    medium: number;
  };
  mediaCount: number;
  productSlug: string;
  publishReady: boolean;
  source: "DROPSHIP_SHOPIFY" | "OWN";
  variantCount: number;
};

type CatalogReadinessArtifact = {
  audit?: {
    products?: CatalogReadinessProductSummary[];
  };
};

type CatalogOwnerIntakeOptions = {
  auditPath?: string;
  includeAll: boolean;
  includeNamed: boolean;
  outPath?: string;
  perClass?: number;
  releaseScope?: string;
  slugs: string[];
};

export type CatalogOwnerIntakeValidationSeverity = "error" | "warning";

export type CatalogOwnerIntakeValidationIssue = {
  code: string;
  field?: CatalogOwnerIntakeColumn;
  message: string;
  productSlug?: string;
  rowNumber?: number;
  severity: CatalogOwnerIntakeValidationSeverity;
};

export type CatalogOwnerIntakeValidation = {
  issueCounts: Record<CatalogOwnerIntakeValidationSeverity, number>;
  issues: CatalogOwnerIntakeValidationIssue[];
  productCount: number;
  products: {
    issueCounts: Record<CatalogOwnerIntakeValidationSeverity, number>;
    productSlug: string;
    ready: boolean;
    rowNumber: number;
  }[];
  ready: boolean;
};

export type CatalogOwnerIntakeParsedRow = {
  rowNumber: number;
  values: Record<CatalogOwnerIntakeColumn, string>;
};

export type CatalogOwnerIntakeRowsParseResult = {
  headerIssues: CatalogOwnerIntakeValidationIssue[];
  rows: CatalogOwnerIntakeParsedRow[];
};

const namedPrioritySlugs = new Set([
  "hera-bracelet",
  "muse-necklace",
  "muse-pearl-earrings",
  "selene-chain",
  "selene-drop-earrings",
  "venus-line-ring",
]);

const requiredCatalogOwnerIntakeFields = [
  "productSlug",
  "priorityTier",
  "releaseScope",
  "directOwner",
  "acceptanceOwner",
  "residualRisk",
  "factSourceReference",
  "factVerifiedBy",
  "factVerifiedAt",
  "countryOfManufacture",
  "manufacturerOrImporter",
  "materialDetails",
  "measurements",
  "variantSkuMap",
  "policySourceReference",
  "policyVerifiedBy",
  "policyVerifiedAt",
  "deliveryPromise",
  "returnPolicy",
  "careInstructions",
  "warranty",
  "primaryMediaUrl",
  "alternateMediaUrl",
  "scaleMediaUrl",
  "constructionMediaUrl",
  "materialMediaUrl",
  "contextMediaUrl",
  "mediaSourceReference",
  "mediaApprovedBy",
  "mediaApprovedAt",
  "primaryAltText",
  "alternateAltText",
  "scaleAltText",
  "constructionAltText",
  "materialAltText",
  "contextAltText",
  "altTextOwner",
] as const satisfies readonly CatalogOwnerIntakeColumn[];

const catalogOwnerIntakeDateFields = [
  "factVerifiedAt",
  "policyVerifiedAt",
  "mediaApprovedAt",
] as const satisfies readonly CatalogOwnerIntakeColumn[];

const catalogOwnerIntakeUrlFields = [
  "primaryMediaUrl",
  "alternateMediaUrl",
  "scaleMediaUrl",
  "constructionMediaUrl",
  "materialMediaUrl",
  "contextMediaUrl",
] as const satisfies readonly CatalogOwnerIntakeColumn[];

const catalogOwnerIntakeAltTextFields = [
  "primaryAltText",
  "alternateAltText",
  "scaleAltText",
  "constructionAltText",
  "materialAltText",
  "contextAltText",
] as const satisfies readonly CatalogOwnerIntakeColumn[];

const priorityTierValues = new Set([
  "hero",
  "category-anchor",
  "gift-anchor",
  "essential",
  "defer",
]);

const releaseScopeValues = new Set([
  "wave-0-priority",
  "later",
  "draft-until-ready",
]);

export function parseCatalogOwnerIntakeArgs(
  args: readonly string[],
): CatalogOwnerIntakeOptions {
  const options: CatalogOwnerIntakeOptions = {
    includeAll: false,
    includeNamed: false,
    slugs: [],
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    const next = args[index + 1];

    if (arg === "--") {
      continue;
    } else if (arg === "--all") {
      options.includeAll = true;
    } else if (arg === "--audit" && next) {
      options.auditPath = next;
      index += 1;
    } else if (arg === "--include-named") {
      options.includeNamed = true;
    } else if (arg === "--out" && next) {
      options.outPath = next;
      index += 1;
    } else if (arg === "--per-class" && next) {
      options.perClass = parsePositiveInteger(next, "--per-class");
      index += 1;
    } else if (arg === "--release-scope" && next) {
      options.releaseScope = next;
      index += 1;
    } else if (arg === "--slugs" && next) {
      options.slugs.push(...parseSlugList(next));
      index += 1;
    }
  }

  return options;
}

export function createCatalogOwnerIntakeCsv(input: {
  products: readonly CatalogReadinessProductSummary[];
  releaseScope?: string;
  selectedSlugs: readonly string[];
}) {
  const productsBySlug = new Map(
    input.products.map((product) => [product.productSlug, product] as const),
  );
  const rows = input.selectedSlugs.map((slug) => {
    const product = productsBySlug.get(slug);
    const residualRisk = product
      ? [
          `${product.issueCounts.blocker} blockers`,
          `${product.issueCounts.high} high findings`,
          `${product.mediaCount} media`,
          `${product.variantCount} variants`,
          product.source,
        ].join("; ")
      : "slug not found in audit";

    const row: Record<CatalogOwnerIntakeColumn, string> = {
      acceptanceOwner: "",
      altTextOwner: "",
      alternateMediaUrl: "",
      alternateAltText: "",
      careInstructions: "",
      constructionMediaUrl: "",
      constructionAltText: "",
      contextMediaUrl: "",
      contextAltText: "",
      countryOfManufacture: "",
      deliveryPromise: "",
      directOwner: "",
      factSourceReference: "",
      factVerifiedAt: "",
      factVerifiedBy: "",
      manufacturerOrImporter: "",
      materialDetails: "",
      materialMediaUrl: "",
      materialAltText: "",
      measurements: "",
      mediaApprovedAt: "",
      mediaApprovedBy: "",
      mediaSourceReference: "",
      primaryAltText: "",
      policySourceReference: "",
      policyVerifiedAt: "",
      policyVerifiedBy: "",
      primaryMediaUrl: "",
      priorityTier: "",
      productSlug: slug,
      releaseScope: input.releaseScope ?? "",
      residualRisk,
      returnPolicy: "",
      scaleMediaUrl: "",
      scaleAltText: "",
      stoneDetails: "",
      supplierOrderException: "",
      variantSkuMap: "",
      warranty: "",
    };

    return renderCsvRow(catalogOwnerIntakeHeader.map((column) => row[column]));
  });

  return `${catalogOwnerIntakeHeader.join(",")}\n${rows.join("\n")}\n`;
}

export function selectCatalogOwnerIntakeSlugs(
  products: readonly CatalogReadinessProductSummary[],
  options: Pick<
    CatalogOwnerIntakeOptions,
    "includeAll" | "includeNamed" | "perClass" | "slugs"
  >,
) {
  const selected = new Set<string>();
  const sortedProducts = [...products].sort((left, right) =>
    left.productSlug.localeCompare(right.productSlug),
  );

  if (options.includeAll) {
    sortedProducts.forEach((product) => selected.add(product.productSlug));
  }

  for (const slug of options.slugs) selected.add(slug);

  if (options.includeNamed) {
    sortedProducts
      .filter((product) => namedPrioritySlugs.has(product.productSlug))
      .forEach((product) => selected.add(product.productSlug));
  }

  if (options.perClass) {
    const byClass = new Map<string, CatalogReadinessProductSummary[]>();

    for (const product of sortedProducts) {
      const productClass = getProductClass(product.productSlug);
      const productsForClass = byClass.get(productClass) ?? [];
      productsForClass.push(product);
      byClass.set(productClass, productsForClass);
    }

    [...byClass.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .forEach(([, productsForClass]) => {
        productsForClass
          .slice(0, options.perClass)
          .forEach((product) => selected.add(product.productSlug));
      });
  }

  return [...selected].sort((left, right) => left.localeCompare(right));
}

export function readCatalogOwnerIntakeProducts(auditPath: string) {
  const artifact = JSON.parse(
    readFileSync(auditPath, "utf8"),
  ) as CatalogReadinessArtifact;
  const products = artifact.audit?.products;

  if (!Array.isArray(products)) {
    throw new Error(`No audit.products array found in ${auditPath}.`);
  }

  return products;
}

export function validateCatalogOwnerIntakeCsv(
  content: string,
  options: { now?: Date } = {},
): CatalogOwnerIntakeValidation {
  const now = options.now ?? new Date();
  const { headerIssues, rows } = parseCatalogOwnerIntakeRows(content);
  const issues = [...headerIssues];
  const seenRowsBySlug = new Map<string, number>();

  for (const row of rows) {
    const productSlug = row.values.productSlug.trim();

    if (productSlug) {
      const previousRow = seenRowsBySlug.get(productSlug);
      if (previousRow) {
        issues.push({
          code: "PRODUCT_SLUG_DUPLICATE",
          field: "productSlug",
          message: `Product slug is duplicated; first seen on row ${previousRow}.`,
          productSlug,
          rowNumber: row.rowNumber,
          severity: "error",
        });
      } else {
        seenRowsBySlug.set(productSlug, row.rowNumber);
      }
    }

    for (const field of requiredCatalogOwnerIntakeFields) {
      if (row.values[field].trim()) continue;

      issues.push({
        code: "REQUIRED_FIELD_MISSING",
        field,
        message: `${field} is required before owner intake can be accepted.`,
        productSlug,
        rowNumber: row.rowNumber,
        severity: "error",
      });
    }

    for (const field of catalogOwnerIntakeDateFields) {
      validateOwnerIntakeDate({
        field,
        issues,
        now,
        productSlug,
        rowNumber: row.rowNumber,
        value: row.values[field],
      });
    }

    for (const field of catalogOwnerIntakeUrlFields) {
      validateOwnerIntakeMediaUrl({
        field,
        issues,
        productSlug,
        rowNumber: row.rowNumber,
        value: row.values[field],
      });
    }

    validateOwnerIntakeMediaUniqueness(row, issues);
    validateOwnerIntakeSuggestedValues(row, issues);
    validateOwnerIntakeConditionalFields(row, issues);
  }

  const sortedIssues = issues.sort(compareOwnerIntakeIssues);
  const productResults = rows.map((row) => {
    const productIssues = sortedIssues.filter(
      (issue) => issue.rowNumber === row.rowNumber,
    );
    const issueCounts = countOwnerIntakeIssues(productIssues);

    return {
      issueCounts,
      productSlug: row.values.productSlug.trim(),
      ready: issueCounts.error === 0,
      rowNumber: row.rowNumber,
    };
  });
  const issueCounts = countOwnerIntakeIssues(sortedIssues);

  return {
    issueCounts,
    issues: sortedIssues,
    productCount: rows.length,
    products: productResults,
    ready: rows.length > 0 && issueCounts.error === 0,
  };
}

export function formatCatalogOwnerIntakeValidationMarkdown(input: {
  generatedAt: string;
  sourcePath: string;
  validation: CatalogOwnerIntakeValidation;
}) {
  const { validation } = input;
  const issueGroups = groupOwnerIntakeIssues(validation.issues);
  const lines = [
    "# Catalog Owner Intake Validation",
    "",
    `Generated: ${input.generatedAt}`,
    `Source: ${input.sourcePath}`,
    `Status: ${validation.ready ? "PASS" : "FAIL"}`,
    "",
    "## Summary",
    "",
    "| Metric | Value |",
    "| --- | ---: |",
    `| Products | ${validation.productCount} |`,
    `| Ready rows | ${validation.products.filter((product) => product.ready).length} |`,
    `| Errors | ${validation.issueCounts.error} |`,
    `| Warnings | ${validation.issueCounts.warning} |`,
    "",
    "## Issue Types",
    "",
    "| Severity | Code | Field | Findings | Examples |",
    "| --- | --- | --- | ---: | --- |",
    ...(issueGroups.length
      ? issueGroups.map(
          (group) =>
            `| ${group.severity} | \`${group.code}\` | ${group.field ? `\`${group.field}\`` : "-"} | ${group.count} | ${
              group.examples
                .slice(0, 5)
                .map((example) => `\`${example}\``)
                .join(", ") || "-"
            } |`,
        )
      : ["| - | - | - | 0 | - |"]),
    "",
    "## Product Matrix",
    "",
    "| Row | Product | Ready | Errors | Warnings |",
    "| ---: | --- | --- | ---: | ---: |",
    ...validation.products.map(
      (product) =>
        `| ${product.rowNumber} | \`${product.productSlug || "missing-productSlug"}\` | ${product.ready ? "yes" : "no"} | ${product.issueCounts.error} | ${product.issueCounts.warning} |`,
    ),
    "",
    "## Detailed Findings",
    "",
    ...(validation.issues.length === 0
      ? ["None."]
      : validation.issues.map(
          (issue) =>
            `- **${issue.severity.toUpperCase()}** \`${issue.code}\`${issue.rowNumber ? ` on row ${issue.rowNumber}` : ""}${issue.productSlug ? ` (\`${issue.productSlug}\`)` : ""}${issue.field ? ` \`${issue.field}\`` : ""}: ${issue.message}`,
        )),
    "",
  ];

  return `${lines.join("\n")}\n`;
}

function getProductClass(slug: string) {
  const [productClass] = slug.split("-");

  return productClass ?? slug;
}

function parsePositiveInteger(value: string, label: string) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${label} must be a positive integer.`);
  }

  return parsed;
}

function parseSlugList(value: string) {
  return value
    .split(",")
    .map((slug) => slug.trim())
    .filter(Boolean);
}

export function parseCatalogOwnerIntakeRows(
  content: string,
): CatalogOwnerIntakeRowsParseResult {
  const csvRows = parseCsvRows(content).filter((row) =>
    row.some((cell) => cell.trim()),
  );
  const header = csvRows[0]?.map((cell) => cell.trim()) ?? [];
  const headerSet = new Set(header);
  const headerIssues: CatalogOwnerIntakeValidationIssue[] = [];

  for (const column of catalogOwnerIntakeHeader) {
    if (headerSet.has(column)) continue;

    headerIssues.push({
      code: "CSV_COLUMN_MISSING",
      field: column,
      message: `CSV header is missing ${column}.`,
      severity: "error",
    });
  }

  for (const column of header) {
    if ((catalogOwnerIntakeHeader as readonly string[]).includes(column)) {
      continue;
    }

    headerIssues.push({
      code: "CSV_COLUMN_UNKNOWN",
      message: `CSV header includes unknown column ${column}.`,
      severity: "warning",
    });
  }

  return {
    headerIssues,
    rows: csvRows.slice(1).map((row, index) => ({
      rowNumber: index + 2,
      values: createCatalogOwnerIntakeRow(header, row),
    })),
  };
}

function createCatalogOwnerIntakeRow(header: readonly string[], row: string[]) {
  const rawByColumn = new Map(
    header.map((column, index) => [column, row[index]?.trim() ?? ""] as const),
  );

  return Object.fromEntries(
    catalogOwnerIntakeHeader.map((column) => [
      column,
      rawByColumn.get(column) ?? "",
    ]),
  ) as Record<CatalogOwnerIntakeColumn, string>;
}

function validateOwnerIntakeDate(input: {
  field: (typeof catalogOwnerIntakeDateFields)[number];
  issues: CatalogOwnerIntakeValidationIssue[];
  now: Date;
  productSlug: string;
  rowNumber: number;
  value: string;
}) {
  const value = input.value.trim();
  if (!value) return;

  if (!/^\d{4}-\d{2}-\d{2}(?:T.*)?$/u.test(value)) {
    input.issues.push({
      code: "DATE_FORMAT_INVALID",
      field: input.field,
      message: `${input.field} must be an ISO date such as 2026-06-19.`,
      productSlug: input.productSlug,
      rowNumber: input.rowNumber,
      severity: "error",
    });
    return;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    input.issues.push({
      code: "DATE_INVALID",
      field: input.field,
      message: `${input.field} is not a valid date.`,
      productSlug: input.productSlug,
      rowNumber: input.rowNumber,
      severity: "error",
    });
    return;
  }

  if (parsed.getTime() > input.now.getTime()) {
    input.issues.push({
      code: "DATE_FUTURE",
      field: input.field,
      message: `${input.field} cannot be future-dated.`,
      productSlug: input.productSlug,
      rowNumber: input.rowNumber,
      severity: "error",
    });
  }
}

function validateOwnerIntakeMediaUrl(input: {
  field: (typeof catalogOwnerIntakeUrlFields)[number];
  issues: CatalogOwnerIntakeValidationIssue[];
  productSlug: string;
  rowNumber: number;
  value: string;
}) {
  const value = input.value.trim();
  if (!value) return;

  if (value.startsWith("/") && !value.startsWith("//")) return;

  try {
    const url = new URL(value);
    if (url.protocol === "https:" || url.protocol === "http:") return;
  } catch {
    // Fall through to the validation issue below.
  }

  input.issues.push({
    code: "MEDIA_URL_INVALID",
    field: input.field,
    message: `${input.field} must be a local public path or HTTP(S) URL.`,
    productSlug: input.productSlug,
    rowNumber: input.rowNumber,
    severity: "error",
  });
}

function validateOwnerIntakeMediaUniqueness(
  row: { rowNumber: number; values: Record<CatalogOwnerIntakeColumn, string> },
  issues: CatalogOwnerIntakeValidationIssue[],
) {
  const firstFieldByUrl = new Map<string, CatalogOwnerIntakeColumn>();

  for (const field of catalogOwnerIntakeUrlFields) {
    const value = row.values[field].trim();
    if (!value) continue;

    const firstField = firstFieldByUrl.get(value);
    if (firstField) {
      issues.push({
        code: "MEDIA_URL_REPEATED_WITHIN_ROW",
        field,
        message: `${field} repeats the same URL as ${firstField}.`,
        productSlug: row.values.productSlug.trim(),
        rowNumber: row.rowNumber,
        severity: "error",
      });
    } else {
      firstFieldByUrl.set(value, field);
    }
  }

  for (const field of catalogOwnerIntakeAltTextFields) {
    const value = row.values[field].trim();
    if (!value || value.length >= 12) continue;

    issues.push({
      code: "ALT_TEXT_TOO_SHORT",
      field,
      message: `${field} is present but too short to be decision-useful.`,
      productSlug: row.values.productSlug.trim(),
      rowNumber: row.rowNumber,
      severity: "warning",
    });
  }
}

function validateOwnerIntakeSuggestedValues(
  row: { rowNumber: number; values: Record<CatalogOwnerIntakeColumn, string> },
  issues: CatalogOwnerIntakeValidationIssue[],
) {
  const priorityTier = row.values.priorityTier.trim();
  if (priorityTier && !priorityTierValues.has(priorityTier)) {
    issues.push({
      code: "PRIORITY_TIER_UNKNOWN",
      field: "priorityTier",
      message: "priorityTier is outside the governed suggested values.",
      productSlug: row.values.productSlug.trim(),
      rowNumber: row.rowNumber,
      severity: "warning",
    });
  }

  const releaseScope = row.values.releaseScope.trim();
  if (releaseScope && !releaseScopeValues.has(releaseScope)) {
    issues.push({
      code: "RELEASE_SCOPE_UNKNOWN",
      field: "releaseScope",
      message: "releaseScope is outside the governed suggested values.",
      productSlug: row.values.productSlug.trim(),
      rowNumber: row.rowNumber,
      severity: "warning",
    });
  }

  const directOwner = row.values.directOwner.trim().toLowerCase();
  const acceptanceOwner = row.values.acceptanceOwner.trim().toLowerCase();
  if (directOwner && directOwner === acceptanceOwner) {
    issues.push({
      code: "OWNER_ACCEPTANCE_CONCENTRATED",
      field: "acceptanceOwner",
      message:
        "directOwner and acceptanceOwner match; this needs explicit founder acceptance.",
      productSlug: row.values.productSlug.trim(),
      rowNumber: row.rowNumber,
      severity: "warning",
    });
  }
}

function validateOwnerIntakeConditionalFields(
  row: { rowNumber: number; values: Record<CatalogOwnerIntakeColumn, string> },
  issues: CatalogOwnerIntakeValidationIssue[],
) {
  const residualRisk = row.values.residualRisk;
  const productSlug = row.values.productSlug.trim();

  if (
    /DROPSHIP_SHOPIFY|supplier|shopify/i.test(residualRisk) &&
    !row.values.supplierOrderException.trim()
  ) {
    issues.push({
      code: "SUPPLIER_EXCEPTION_MISSING",
      field: "supplierOrderException",
      message:
        "Supplier or dropship products need an approved supplier-order exception.",
      productSlug,
      rowNumber: row.rowNumber,
      severity: "error",
    });
  }

  if (!row.values.stoneDetails.trim()) {
    issues.push({
      code: "STONE_DETAILS_UNCONFIRMED",
      field: "stoneDetails",
      message:
        "stoneDetails is conditional; fill it for stone-bearing products or record an approved reason to leave it blank.",
      productSlug,
      rowNumber: row.rowNumber,
      severity: "warning",
    });
  }
}

function compareOwnerIntakeIssues(
  left: CatalogOwnerIntakeValidationIssue,
  right: CatalogOwnerIntakeValidationIssue,
) {
  const severityRank: Record<CatalogOwnerIntakeValidationSeverity, number> = {
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

function countOwnerIntakeIssues(
  issues: readonly CatalogOwnerIntakeValidationIssue[],
) {
  const counts: Record<CatalogOwnerIntakeValidationSeverity, number> = {
    error: 0,
    warning: 0,
  };

  for (const issue of issues) counts[issue.severity] += 1;

  return counts;
}

function groupOwnerIntakeIssues(
  issues: readonly CatalogOwnerIntakeValidationIssue[],
) {
  const groups = new Map<
    string,
    {
      code: string;
      count: number;
      examples: string[];
      field?: CatalogOwnerIntakeColumn;
      severity: CatalogOwnerIntakeValidationSeverity;
    }
  >();

  for (const issue of issues) {
    const key = `${issue.severity}:${issue.code}:${issue.field ?? ""}`;
    const group = groups.get(key) ?? {
      code: issue.code,
      count: 0,
      examples: [],
      field: issue.field,
      severity: issue.severity,
    };
    group.count += 1;
    const productSlug = issue.productSlug?.trim();
    const example =
      productSlug && productSlug.length > 0
        ? productSlug
        : `row-${issue.rowNumber ?? "header"}`;
    if (!group.examples.includes(example)) group.examples.push(example);
    groups.set(key, group);
  }

  return [...groups.values()].sort(
    (left, right) =>
      left.severity.localeCompare(right.severity) ||
      left.code.localeCompare(right.code) ||
      (left.field ?? "").localeCompare(right.field ?? ""),
  );
}

function printHelp() {
  console.log(`Catalog owner intake CSV

Usage:
  pnpm catalog:intake -- --audit <catalog-readiness.json> [selection] [options]

Selection:
  --all                 Include every product from the audit.
  --per-class <count>   Include the first N products for each slug prefix.
  --include-named       Include known named products when present.
  --slugs <a,b,c>       Include explicit product slugs.

Options:
  --out <path>          Write CSV to a file instead of stdout.
  --release-scope <v>   Pre-fill the releaseScope column.
  --help                Show this help.

Examples:
  pnpm catalog:intake -- --audit artifacts/qa/run/catalog-readiness.json --per-class 6 --include-named --out artifacts/qa/intake/catalog-owner-intake.csv
  pnpm catalog:intake -- --audit artifacts/qa/run/catalog-readiness.json --all --out artifacts/qa/intake/all-products-owner-intake.csv
`);
}

async function main(args = process.argv.slice(2)) {
  if (args.includes("--help") || args.includes("-h")) {
    printHelp();
    return;
  }

  const options = parseCatalogOwnerIntakeArgs(args);

  if (!options.auditPath) {
    throw new Error("--audit <catalog-readiness.json> is required.");
  }

  const products = readCatalogOwnerIntakeProducts(options.auditPath);
  const selectedSlugs = selectCatalogOwnerIntakeSlugs(products, options);

  if (selectedSlugs.length === 0) {
    throw new Error(
      "No products selected. Use --all, --per-class, --include-named, or --slugs.",
    );
  }

  const csv = createCatalogOwnerIntakeCsv({
    products,
    releaseScope: options.releaseScope,
    selectedSlugs,
  });

  if (options.outPath) {
    mkdirSync(path.dirname(options.outPath), { recursive: true });
    writeFileSync(options.outPath, csv);
    console.log(
      JSON.stringify(
        {
          auditPath: options.auditPath,
          outPath: options.outPath,
          productCount: selectedSlugs.length,
        },
        null,
        2,
      ),
    );
    return;
  }

  process.stdout.write(csv);
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
