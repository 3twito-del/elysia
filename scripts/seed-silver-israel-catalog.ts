import { existsSync, readFileSync } from "node:fs";

import { PrismaClient, type Prisma } from "@prisma/client";

import {
  getSeedProducts,
  seedCategories,
  seedCollections,
  seedMaterials,
  seedStones,
  type SeedProduct,
} from "../prisma/seed-catalog";

const SUPPLIER_KEY = "silver-israel";
const EXPECTED_PRODUCT_COUNT = 104;

loadEnvFile(getArgValue("--env-file"));

const prisma = new PrismaClient();

type SeedTaxonomy = {
  categoriesBySlug: Map<string, { id: string; slug: string }>;
  collectionsBySlug: Map<string, { id: string; slug: string }>;
  materialsBySlug: Map<string, { id: string; slug: string }>;
  stonesBySlug: Map<string, { id: string; slug: string }>;
};

async function main() {
  if (!process.env.DATABASE_URL?.trim()) {
    throw new Error("DATABASE_URL is required to seed the catalog.");
  }

  if (hasArg("--summary-only")) {
    await printSummary();
    return;
  }

  const products = getSeedProducts();

  if (products.length !== EXPECTED_PRODUCT_COUNT) {
    throw new Error(
      `Expected ${EXPECTED_PRODUCT_COUNT} Silver Israel products, got ${products.length}.`,
    );
  }

  const taxonomy = await upsertTaxonomy();
  const onlineService = await upsertOnlineServiceBranch();
  const summary = {
    categories: seedCategories.length,
    collections: seedCollections.length,
    created: 0,
    materials: seedMaterials.length,
    media: 0,
    products: products.length,
    stones: seedStones.length,
    updated: 0,
    variants: 0,
  };

  for (const product of products) {
    const result = await prisma.$transaction(
      (tx) => upsertSilverIsraelProduct(tx, product, taxonomy, onlineService.id),
      { maxWait: 10_000, timeout: 30_000 },
    );

    if (result.created) {
      summary.created += 1;
    } else {
      summary.updated += 1;
    }

    summary.media += result.media;
    summary.variants += result.variants;
  }

  const countsByCategory: Record<string, number> =
    await getSilverIsraelCountsByCategory();
  const activeCount = Object.values(countsByCategory).reduce(
    (sum, count) => sum + count,
    0,
  );

  console.log(
    JSON.stringify(
      {
        activeCount,
        countsByCategory,
        supplierKey: SUPPLIER_KEY,
        summary,
      },
      null,
      2,
    ),
  );
}

async function printSummary() {
  const countsByCategory: Record<string, number> =
    await getSilverIsraelCountsByCategory();
  const [activeCount, totalCount, variantCount, mediaCount] = await Promise.all([
    prisma.product.count({
      where: {
        externalProvider: SUPPLIER_KEY,
        status: "ACTIVE",
        supplierKey: SUPPLIER_KEY,
      },
    }),
    prisma.product.count({
      where: {
        externalProvider: SUPPLIER_KEY,
        supplierKey: SUPPLIER_KEY,
      },
    }),
    prisma.productVariant.count({
      where: { product: { supplierKey: SUPPLIER_KEY } },
    }),
    prisma.productMedia.count({
      where: { product: { supplierKey: SUPPLIER_KEY } },
    }),
  ]);

  console.log(
    JSON.stringify(
      {
        activeCount,
        countsByCategory,
        mediaCount,
        supplierKey: SUPPLIER_KEY,
        totalCount,
        variantCount,
      },
      null,
      2,
    ),
  );
}

async function upsertTaxonomy(): Promise<SeedTaxonomy> {
  const [categories, materials, stones, collections] = await Promise.all([
    Promise.all(
      seedCategories.map((category) =>
        prisma.category.upsert({
          where: { slug: category.slug },
          create: category,
          update: {
            description: category.description,
            imageUrl: category.imageUrl,
            name: category.name,
            sortOrder: category.sortOrder,
          },
        }),
      ),
    ),
    Promise.all(
      seedMaterials.map((material) =>
        prisma.material.upsert({
          where: { slug: material.slug },
          create: material,
          update: { name: material.name },
        }),
      ),
    ),
    Promise.all(
      seedStones.map((stone) =>
        prisma.stone.upsert({
          where: { slug: stone.slug },
          create: stone,
          update: { name: stone.name },
        }),
      ),
    ),
    Promise.all(
      seedCollections.map((collection) =>
        prisma.collection.upsert({
          where: { slug: collection.slug },
          create: collection,
          update: {
            description: collection.description,
            heroImageUrl: collection.heroImageUrl,
            isFeatured: collection.isFeatured,
            name: collection.name,
          },
        }),
      ),
    ),
  ]);

  return {
    categoriesBySlug: createSlugMap(categories),
    collectionsBySlug: createSlugMap(collections),
    materialsBySlug: createSlugMap(materials),
    stonesBySlug: createSlugMap(stones),
  };
}

async function upsertOnlineServiceBranch() {
  return prisma.branch.upsert({
    where: { slug: "online-service" },
    create: {
      slug: "online-service",
      name: "Online service",
      address: "Online",
      city: "Online",
      phone: "050-0000000",
      whatsapp: "972500000000",
      openingHours: {
        friday: "09:30-13:00",
        saturday: "Closed",
        sundayThursday: "10:00-18:00",
      },
      services: ["Remote service", "Phone support", "Catalog orders"],
      kind: "ONLINE",
      isApproved: true,
      isPublic: false,
      isActive: true,
      sortOrder: 0,
    },
    update: {
      kind: "ONLINE",
      isActive: true,
      sortOrder: 0,
    },
  });
}

async function upsertSilverIsraelProduct(
  tx: Prisma.TransactionClient,
  productData: SeedProduct,
  taxonomy: SeedTaxonomy,
  onlineServiceBranchId: string,
) {
  const category = getRequired(taxonomy.categoriesBySlug, productData.categorySlug);
  const material = getRequired(taxonomy.materialsBySlug, productData.materialSlug);
  const stone = productData.stoneSlug
    ? getRequired(taxonomy.stonesBySlug, productData.stoneSlug)
    : null;
  const collections = productData.collectionSlugs.map((slug) =>
    getRequired(taxonomy.collectionsBySlug, slug),
  );
  const existingProduct = await tx.product.findUnique({
    where: { slug: productData.slug },
    select: {
      externalProvider: true,
      id: true,
      supplierKey: true,
    },
  });

  if (
    existingProduct &&
    existingProduct.supplierKey !== SUPPLIER_KEY &&
    existingProduct.externalProvider !== SUPPLIER_KEY
  ) {
    throw new Error(
      `Product slug collision for "${productData.slug}" outside ${SUPPLIER_KEY}.`,
    );
  }

  const now = new Date();
  const product = existingProduct
    ? await tx.product.update({
        where: { id: existingProduct.id },
        data: {
          ...getProductWriteData(productData, now),
          category: { connect: { id: category.id } },
          collections: { set: collections.map(({ id }) => ({ id })) },
          material: { connect: { id: material.id } },
          stone: stone ? { connect: { id: stone.id } } : { disconnect: true },
        },
      })
    : await tx.product.create({
        data: {
          slug: productData.slug,
          ...getProductWriteData(productData, now),
          category: { connect: { id: category.id } },
          collections: { connect: collections.map(({ id }) => ({ id })) },
          material: { connect: { id: material.id } },
          ...(stone ? { stone: { connect: { id: stone.id } } } : {}),
        },
      });

  await tx.productMedia.deleteMany({ where: { productId: product.id } });
  await tx.productMedia.createMany({
    data: productData.media.map((media) => ({
      alt: media.alt,
      height: 1400,
      isPrimary: media.role === "PRIMARY",
      kind: "IMAGE",
      productId: product.id,
      role: media.role,
      sortOrder: media.sortOrder,
      url: media.url,
      width: 1400,
    })),
  });

  await tx.productVariant.updateMany({
    where: { productId: product.id },
    data: { isDefault: false },
  });

  for (const [index, variantData] of productData.variants.entries()) {
    const existingVariant = await tx.productVariant.findUnique({
      where: { sku: variantData.sku },
      select: { id: true, productId: true },
    });

    if (existingVariant && existingVariant.productId !== product.id) {
      throw new Error(
        `Variant SKU collision for "${variantData.sku}" outside product "${productData.slug}".`,
      );
    }

    const variant = existingVariant
      ? await tx.productVariant.update({
          where: { id: existingVariant.id },
          data: {
            isDefault: index === 0,
            metalColor: variantData.metalColor,
            name: variantData.name,
            priceDelta: variantData.priceDelta,
            size: variantData.size,
            stoneColor: variantData.stoneColor,
          },
        })
      : await tx.productVariant.create({
          data: {
            productId: product.id,
            sku: variantData.sku,
            isDefault: index === 0,
            metalColor: variantData.metalColor,
            name: variantData.name,
            priceDelta: variantData.priceDelta,
            size: variantData.size,
            stoneColor: variantData.stoneColor,
          },
        });

    await tx.price.deleteMany({ where: { variantId: variant.id } });
    await tx.price.create({
      data: {
        amount: productData.basePrice,
        currency: "ILS",
        variantId: variant.id,
      },
    });

    await tx.inventoryItem.upsert({
      where: {
        branchId_variantId: {
          branchId: onlineServiceBranchId,
          variantId: variant.id,
        },
      },
      create: {
        branchId: onlineServiceBranchId,
        quantity: variantData.quantityTlv + variantData.quantityJerusalem,
        reserved: 0,
        safetyStock: variantData.safetyStock,
        variantId: variant.id,
      },
      update: {
        quantity: variantData.quantityTlv + variantData.quantityJerusalem,
        safetyStock: variantData.safetyStock,
      },
    });
  }

  return {
    created: !existingProduct,
    media: productData.media.length,
    variants: productData.variants.length,
  };
}

function getProductWriteData(productData: SeedProduct, syncedAt: Date) {
  return {
    availabilityMode: "READY_TO_ORDER" as const,
    basePrice: productData.basePrice,
    careInstructions:
      "Keep away from perfume, chlorine, and harsh cleaning materials.",
    commerceHighlights: [
      "Details are checked before order approval.",
      "Inspected before delivery.",
    ],
    deliveryPromise: "Home delivery after item details are approved.",
    description: productData.description,
    externalHandle: productData.sourceHandle,
    externalProductId: productData.sourceCode,
    externalProvider: SUPPLIER_KEY,
    externalSyncedAt: syncedAt,
    factSourceReference: productData.sourceUrl,
    name: productData.name,
    returnPolicy: "Exchange or return by personal coordination under policy.",
    shortDescription: productData.shortDescription,
    sku: productData.sku,
    source: "OWN" as const,
    status: "ACTIVE" as const,
    supplierKey: productData.supplierKey,
    tags: productData.tags,
    warranty: "One year warranty for manufacturing defects.",
  };
}

async function getSilverIsraelCountsByCategory(): Promise<Record<string, number>> {
  const rows = await prisma.product.groupBy({
    by: ["categoryId"],
    where: {
      externalProvider: SUPPLIER_KEY,
      status: "ACTIVE",
      supplierKey: SUPPLIER_KEY,
    },
    _count: { _all: true },
  });
  const categories = await prisma.category.findMany({
    where: { id: { in: rows.map((row) => row.categoryId) } },
    select: { id: true, slug: true },
  });
  const slugById = new Map(categories.map((category) => [category.id, category.slug]));

  const counts: Record<string, number> = {};

  for (const row of rows) {
    counts[slugById.get(row.categoryId) ?? row.categoryId] = row._count._all;
  }

  return Object.fromEntries(
    Object.entries(counts).sort(([left], [right]) =>
      left.localeCompare(right),
    ),
  );
}

function createSlugMap<T extends { id: string; slug: string }>(records: T[]) {
  return new Map(records.map((record) => [record.slug, record] as const));
}

function getRequired<T>(recordsBySlug: Map<string, T>, slug: string) {
  const record = recordsBySlug.get(slug);

  if (!record) {
    throw new Error(`Missing required seed record for slug "${slug}".`);
  }

  return record;
}

function getArgValue(name: string) {
  const index = process.argv.indexOf(name);

  if (index < 0) return undefined;

  return process.argv[index + 1];
}

function hasArg(name: string) {
  return process.argv.includes(name);
}

function loadEnvFile(filename: string | undefined) {
  if (!filename) return;

  if (!existsSync(filename)) {
    throw new Error(`Env file not found: ${filename}`);
  }

  for (const line of readFileSync(filename, "utf8").split(/\r?\n/u)) {
    const match = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)?\s*$/u.exec(line);

    if (!match?.[1]) continue;

    process.env[match[1]] = parseEnvValue(match[2] ?? "");
  }
}

function parseEnvValue(value: string) {
  const trimmed = value.trim();
  const quoted =
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"));

  return quoted ? trimmed.slice(1, -1) : trimmed;
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
