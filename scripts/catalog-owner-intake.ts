import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const catalogOwnerIntakeHeader = [
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
  "altTextOwner",
] as const;

type CatalogOwnerIntakeColumn = (typeof catalogOwnerIntakeHeader)[number];

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

const namedPrioritySlugs = new Set([
  "hera-bracelet",
  "muse-necklace",
  "muse-pearl-earrings",
  "selene-chain",
  "selene-drop-earrings",
  "venus-line-ring",
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

    return renderCsvRow({
      acceptanceOwner: "",
      altTextOwner: "",
      alternateMediaUrl: "",
      careInstructions: "",
      constructionMediaUrl: "",
      contextMediaUrl: "",
      countryOfManufacture: "",
      deliveryPromise: "",
      directOwner: "",
      factSourceReference: "",
      factVerifiedAt: "",
      factVerifiedBy: "",
      manufacturerOrImporter: "",
      materialDetails: "",
      materialMediaUrl: "",
      measurements: "",
      mediaApprovedAt: "",
      mediaApprovedBy: "",
      mediaSourceReference: "",
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
      stoneDetails: "",
      supplierOrderException: "",
      variantSkuMap: "",
      warranty: "",
    });
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

function renderCsvRow(row: Record<CatalogOwnerIntakeColumn, string>) {
  return catalogOwnerIntakeHeader
    .map((column) => escapeCsvValue(row[column]))
    .join(",");
}

function escapeCsvValue(value: string) {
  return /[",\r\n]/u.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
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
