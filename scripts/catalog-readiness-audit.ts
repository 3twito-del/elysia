import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { PrismaClient, type ProductMediaRole } from "@prisma/client";

import {
  auditCatalogReadiness,
  formatCatalogReadinessMarkdown,
  type CatalogReadinessMediaFile,
  type CatalogReadinessMediaRole,
  type CatalogReadinessProduct,
} from "./lib/catalog-readiness";
import { listFixtureCatalogProducts } from "../src/server/services/catalog-fixtures";

type AuditSource = "database" | "fixtures";

type Options = {
  envFiles: string[];
  outDir?: string;
  source?: AuditSource;
  strict: boolean;
};

export function parseCatalogReadinessArgs(args: readonly string[]): Options {
  const options: Options = {
    envFiles: [".env", ".env.local", ".env.development.local"],
    strict: false,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    const next = args[index + 1];

    if (arg === "--strict") {
      options.strict = true;
    } else if (arg === "--source" && isAuditSource(next)) {
      options.source = next;
      index += 1;
    } else if (arg === "--out-dir" && next) {
      options.outDir = next;
      index += 1;
    } else if (arg === "--env-file" && next) {
      options.envFiles.push(next);
      index += 1;
    }
  }

  return options;
}

export function loadCatalogReadinessEnv(files: readonly string[]) {
  const values = new Map<string, string>();

  for (const filename of files) {
    if (!existsSync(filename)) continue;

    for (const line of readFileSync(filename, "utf8").split(/\r?\n/u)) {
      const match = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/u.exec(line);
      if (!match?.[1]) continue;

      const raw = match[2] ?? "";
      const value =
        (raw.startsWith('"') && raw.endsWith('"')) ||
        (raw.startsWith("'") && raw.endsWith("'"))
          ? raw.slice(1, -1)
          : raw;
      values.set(match[1], value);
    }
  }

  return Object.fromEntries(values);
}

export function createCatalogReadinessArtifactDir() {
  const stamp = new Date().toISOString().replace(/[:.]/gu, "-");
  return path.join(
    process.cwd(),
    "artifacts",
    "qa",
    `${stamp}-catalog-readiness`,
  );
}

async function loadDatabaseProducts(databaseUrl: string) {
  const prisma = new PrismaClient({ datasourceUrl: databaseUrl, log: [] });

  try {
    const products = await prisma.product.findMany({
      where: { status: "ACTIVE" },
      include: {
        category: true,
        collections: true,
        material: true,
        media: { orderBy: [{ sortOrder: "asc" }] },
        stone: true,
        variants: {
          include: { prices: true },
          orderBy: [{ sku: "asc" }],
        },
      },
      orderBy: [{ slug: "asc" }],
    });

    return products.map(
      (product): CatalogReadinessProduct => ({
        availabilityMode: product.availabilityMode,
        basePrice: Number(product.basePrice),
        careInstructions: product.careInstructions,
        category: {
          name: product.category.name,
          slug: product.category.slug,
        },
        collections: product.collections.map((collection) => ({
          name: collection.name,
          slug: collection.slug,
        })),
        commerceHighlights: product.commerceHighlights,
        deliveryPromise: product.deliveryPromise,
        description: product.description,
        externalHandle: product.externalHandle,
        externalProductId: product.externalProductId,
        externalProvider: product.externalProvider,
        factVerification: hasVerificationData({
          sourceReference: product.factSourceReference,
          verifiedAt: product.factVerifiedAt,
          verifiedBy: product.factVerifiedBy,
        })
          ? {
              sourceReference: product.factSourceReference ?? "",
              verifiedAt: product.factVerifiedAt ?? "",
              verifiedBy: product.factVerifiedBy ?? "",
            }
          : null,
        material: {
          name: product.material.name,
          slug: product.material.slug,
        },
        media: product.media.map((media) => ({
          alt: media.alt,
          height: media.height,
          isPrimary: media.isPrimary,
          kind: media.kind,
          role: toCatalogMediaRole(media.role),
          sortOrder: media.sortOrder,
          url: media.url,
          width: media.width,
        })),
        name: product.name,
        returnPolicy: product.returnPolicy,
        shortDescription: product.shortDescription,
        sku: product.sku,
        slug: product.slug,
        source: product.source,
        specifications: hasSpecificationData(product)
          ? {
              countryOfManufacture: product.countryOfManufacture ?? "",
              manufacturerOrImporter: product.manufacturerOrImporter ?? "",
              materialDetails: product.materialDetails ?? "",
              measurements: product.measurements ?? "",
              stoneDetails: product.stoneDetails,
            }
          : null,
        stone: product.stone
          ? { name: product.stone.name, slug: product.stone.slug }
          : null,
        supplierKey: product.supplierKey,
        tags: product.tags,
        variants: product.variants.map((variant) => ({
          externalVariantId: variant.externalVariantId,
          isDefault: variant.isDefault,
          metalColor: variant.metalColor,
          name: variant.name,
          prices: variant.prices.map((price) => ({
            amount: Number(price.amount),
            currency: price.currency,
            validTo: price.validTo,
          })),
          size: variant.size,
          sku: variant.sku,
          stoneColor: variant.stoneColor,
        })),
        warranty: product.warranty,
        policyVerification: hasVerificationData({
          sourceReference: product.policySourceReference,
          verifiedAt: product.policyVerifiedAt,
          verifiedBy: product.policyVerifiedBy,
        })
          ? {
              sourceReference: product.policySourceReference ?? "",
              verifiedAt: product.policyVerifiedAt ?? "",
              verifiedBy: product.policyVerifiedBy ?? "",
            }
          : null,
      }),
    );
  } finally {
    await prisma.$disconnect();
  }
}

function hasVerificationData(input: {
  sourceReference: string | null;
  verifiedAt: Date | null;
  verifiedBy: string | null;
}) {
  return [input.sourceReference, input.verifiedAt, input.verifiedBy].some(
    (value) => value != null && value !== "",
  );
}

function hasSpecificationData(input: {
  countryOfManufacture: string | null;
  manufacturerOrImporter: string | null;
  materialDetails: string | null;
  measurements: string | null;
  stoneDetails: string | null;
}) {
  return [
    input.countryOfManufacture,
    input.manufacturerOrImporter,
    input.materialDetails,
    input.measurements,
    input.stoneDetails,
  ].some((value) => value != null && value !== "");
}

function toCatalogMediaRole(
  role: ProductMediaRole | null,
): CatalogReadinessMediaRole | null {
  return role?.toLowerCase() as CatalogReadinessMediaRole | null;
}

function loadFixtureProducts(): CatalogReadinessProduct[] {
  return listFixtureCatalogProducts().map((product) => ({
    availabilityMode: product.availabilityMode,
    basePrice: product.price,
    careInstructions: product.careInstructions,
    category: { name: product.categoryName, slug: product.categorySlug },
    collections: product.collections.map((collection) => ({
      name: collection,
      slug: collection,
    })),
    commerceHighlights: product.commerceHighlights,
    deliveryPromise: product.deliveryPromise,
    description: product.description,
    externalHandle: product.requiresSeparateCheckout ? product.slug : null,
    externalProductId: product.requiresSeparateCheckout
      ? `fixture:${product.slug}`
      : null,
    externalProvider: product.requiresSeparateCheckout ? "shopify" : null,
    material: { name: product.material, slug: product.material },
    media: product.images.map((url, index) => ({
      alt: product.name,
      height: null,
      isPrimary: index === 0,
      kind: "IMAGE",
      sortOrder: index,
      url,
      width: null,
    })),
    name: product.name,
    returnPolicy: product.returnPolicy,
    shortDescription: product.shortDescription,
    sku: product.sku,
    slug: product.slug,
    source: product.requiresSeparateCheckout ? "DROPSHIP_SHOPIFY" : "OWN",
    stone: product.stone ? { name: product.stone, slug: product.stone } : null,
    supplierKey: product.requiresSeparateCheckout ? "fixture-supplier" : null,
    tags: product.tags,
    variants: product.variants.map((variant, index) => ({
      externalVariantId: product.requiresSeparateCheckout
        ? `fixture:${variant.sku}`
        : null,
      isDefault: index === 0,
      metalColor: variant.metalColor,
      name: variant.name,
      prices: [{ amount: variant.price, currency: "ILS" }],
      size: variant.size,
      sku: variant.sku,
      stoneColor: variant.stoneColor,
    })),
    warranty: product.warranty,
  }));
}

export function inspectLocalMediaFiles(
  products: readonly CatalogReadinessProduct[],
) {
  const result: Record<string, CatalogReadinessMediaFile> = {};
  const urls = new Set(
    products.flatMap((product) => product.media.map((media) => media.url)),
  );

  for (const url of urls) {
    if (!url.startsWith("/") || url.startsWith("//")) continue;

    const pathname = url.split(/[?#]/u)[0] ?? url;
    const filePath = path.resolve(process.cwd(), "public", `.${pathname}`);
    const publicRoot = path.resolve(process.cwd(), "public");

    if (!filePath.startsWith(`${publicRoot}${path.sep}`)) {
      result[url] = { exists: false };
      continue;
    }

    const exists = existsSync(filePath) && statSync(filePath).isFile();
    result[url] = {
      exists,
      sha256: exists
        ? createHash("sha256").update(readFileSync(filePath)).digest("hex")
        : undefined,
    };
  }

  return result;
}

function writeArtifacts(input: {
  audit: ReturnType<typeof auditCatalogReadiness>;
  generatedAt: string;
  outDir: string;
  source: AuditSource;
}) {
  mkdirSync(input.outDir, { recursive: true });
  const payload = {
    ...input,
    outDir: undefined,
  };

  writeFileSync(
    path.join(input.outDir, "catalog-readiness.json"),
    `${JSON.stringify(payload, null, 2)}\n`,
  );
  writeFileSync(
    path.join(input.outDir, "catalog-readiness.md"),
    formatCatalogReadinessMarkdown(input),
  );
}

function printHelp() {
  console.log(`Catalog readiness audit

Usage:
  pnpm catalog:readiness [options]

Options:
  --source database|fixtures  Choose active database products or deterministic fixtures.
                              Defaults to database when DATABASE_URL is available.
  --out-dir <path>            Write catalog-readiness.json and catalog-readiness.md.
  --env-file <path>           Load an additional environment file.
  --strict                    Return a non-zero exit code for blocker/high findings.
  --help                      Show this help.
`);
}

async function main(args = process.argv.slice(2)) {
  if (args.includes("--help") || args.includes("-h")) {
    printHelp();
    return;
  }

  const options = parseCatalogReadinessArgs(args);
  const env = loadCatalogReadinessEnv(options.envFiles);
  const source = options.source ?? (env.DATABASE_URL ? "database" : "fixtures");
  const products =
    source === "database"
      ? await loadDatabaseProducts(requireDatabaseUrl(env.DATABASE_URL))
      : loadFixtureProducts();
  const generatedAt = new Date().toISOString();
  const audit = auditCatalogReadiness(products, {
    mediaFiles: inspectLocalMediaFiles(products),
  });
  const outDir = options.outDir ?? createCatalogReadinessArtifactDir();

  writeArtifacts({ audit, generatedAt, outDir, source });
  console.log(
    JSON.stringify(
      {
        generatedAt,
        issueCounts: audit.issueCounts,
        outDir,
        productCount: audit.productCount,
        publishReadyCount: audit.publishReadyCount,
        ready: audit.ready,
        source,
      },
      null,
      2,
    ),
  );

  if (options.strict && !audit.ready) process.exitCode = 1;
}

function isAuditSource(value: string | undefined): value is AuditSource {
  return value === "database" || value === "fixtures";
}

function requireDatabaseUrl(value: string | undefined) {
  if (!value?.trim()) {
    throw new Error(
      "DATABASE_URL is required for --source database. Use --source fixtures for deterministic local evidence.",
    );
  }

  return value;
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
