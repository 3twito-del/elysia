import type { Prisma } from "@prisma/client";
import { unstable_cache } from "next/cache";
import { cache } from "react";

import { formatPrice } from "~/lib/format";
import {
  getPublicCategoryName,
  getPublicCollectionName,
  getPublicMaterialName,
  getPublicStoneName,
  getPublicVariantOptionName,
} from "~/lib/product-display";
import { db } from "~/server/db";
import {
  CATALOG_CACHE_TAGS,
  categoryCacheTag,
  productCacheTag,
} from "~/server/services/catalog-cache";
import {
  DEFAULT_CATALOG_IMAGE,
  getCatalogCategoryImage,
  getDisplayCatalogImages,
} from "~/server/services/catalog-assets";
import {
  getFixtureCatalogBranches,
  getFixtureCatalogCategories,
  getFixtureCatalogCategoryBySlug,
  getFixtureCatalogProductBySlug,
  getFixtureFeaturedCatalogProducts,
  listFixtureCatalogProducts,
  shouldFallbackToCatalogFixturesOnDatabaseError,
  shouldUseCatalogFixtures,
} from "~/server/services/catalog-fixtures";
import { getPublicCatalogSku } from "~/server/services/public-catalog-identifiers";
import type {
  CatalogBranch,
  CatalogCategory,
  CatalogFacets,
  CatalogProduct,
  CatalogProductVariant,
  CatalogSearchInput,
} from "~/server/services/catalog-types";

const ACTIVE_PRODUCT_WHERE = {
  status: "ACTIVE",
} satisfies Prisma.ProductWhereInput;
const CATALOG_MEDIA_VERSION = "boutique-v10";
const CATALOG_REVALIDATE_SECONDS = 60 * 60;
const publicCatalogCopyReplacements = [
  ["יוקרה", "נוכחות עדינה"],
  ["רשת תכשיטים", "תכשיטי Elysia"],
  ["תכשיטים אונליין", "תכשיטי Elysia"],
  ["תכשיטי Elysia", "תכשיטי Elysia"],
  ["תכשיטים זמינים לקנייה", "פריטים זמינים מן הקולקציה"],
  ["רכישה אונליין", "הזמנה באתר"],
  ["קנייה אונליין", "הזמנה באתר"],
  ["חוויית הקנייה", "חוויית תכשיטים"],
  ["מחיר גלוי לפני שמירה", "פרטים מאומתים לפני הזמנה"],
  ["מחיר גלוי לפני התאמה", "פרטי ההתאמה יאושרו מראש"],
  ["מחיר גלוי", "מחיר לפני הזמנה"],
  ["בדיקת איכות לפני מסירה", "נבדק לפני מסירה"],
  ["שירות וקנייה", "שאלה והזמנה"],
  ["לאחר קנייה", "לאחר מסירה"],
  ["צפייה וקנייה", "לפרטי התכשיט"],
  ["מוצרים מומלצים", "תכשיטים מומלצים"],
  ["מוצרים שנצפו", "תכשיטים שנצפו"],
  ["מוצרים קיימים", "תכשיטים קיימים"],
  ["מסחר אונליין", "הזמנה אונליין"],
  ["קטלוג אונליין", "תכשיטי Elysia"],
  ["קטלוג דיגיטלי", "תכשיטי Elysia"],
  ["הזמנה דיגיטלית", "הזמנה אישית"],
  ["תקציב", "מחיר"],
  ["מוצרים", "תכשיטים"],
  ["מוצר", "תכשיט"],
  ["רכישה", "הזמנה"],
] as const;
const privateCatalogCopyPattern =
  /supplier|shopify|dropship|configured as|active product|supplier-backed|supplied through|ספק/iu;
export { DEFAULT_CATALOG_IMAGE };

export { formatPrice };
export type {
  CatalogBranch,
  CatalogCategory,
  CatalogFacets,
  CatalogProduct,
  CatalogProductVariant,
  CatalogSearchInput,
};

type CatalogProductRecord = Prisma.ProductGetPayload<{
  include: ReturnType<typeof createCatalogProductInclude>;
}>;

function getCatalogDataSourceCacheKey() {
  if (shouldUseCatalogFixtures()) return `fixtures:${CATALOG_MEDIA_VERSION}`;

  const source = shouldFallbackToCatalogFixturesOnDatabaseError()
    ? "database-with-fixture-fallback"
    : "database";

  return `${source}:${CATALOG_MEDIA_VERSION}`;
}

async function readCatalogData<T>({
  database,
  fallback,
  label,
}: {
  database: () => Promise<T>;
  fallback: () => Promise<T> | T;
  label: string;
}) {
  if (shouldUseCatalogFixtures()) {
    return fallback();
  }

  try {
    return await database();
  } catch (error) {
    if (
      !shouldFallbackToCatalogFixturesOnDatabaseError() ||
      !isCatalogDatabaseReadError(error)
    ) {
      throw error;
    }

    warnCatalogFixtureFallback(label, error);

    return fallback();
  }
}

const catalogFallbackWarningKeys = new Set<string>();
const catalogDatabaseReadErrorCodes = new Set([
  "P1000",
  "P1001",
  "P1002",
  "P1008",
  "P1017",
  "P2024",
]);

function isCatalogDatabaseReadError(error: unknown) {
  const code =
    error && typeof error === "object" && "code" in error
      ? (error as { code?: unknown }).code
      : undefined;
  const message = getCatalogErrorMessage(error);

  return (
    (typeof code === "string" && catalogDatabaseReadErrorCodes.has(code)) ||
    /Can't reach database server|Authentication failed|Timed out fetching a new connection|Unable to start a transaction|Connection pool timeout|DATABASE_URL is required|Error opening a TLS connection|No credentials are available in the security package/i.test(
      message,
    )
  );
}

function getCatalogErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function warnCatalogFixtureFallback(label: string, error: unknown) {
  const warningKey = label.split(":")[0] ?? label;

  if (catalogFallbackWarningKeys.has(warningKey)) return;

  catalogFallbackWarningKeys.add(warningKey);
  console.warn(
    `[catalog] Falling back to fixture data for ${warningKey} after database read failed: ${getCatalogLogMessage(error)}`,
  );
}

function getCatalogLogMessage(error: unknown) {
  return getCatalogErrorMessage(error)
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 240);
}

const getCatalogCategoriesCached = unstable_cache(
  async (): Promise<CatalogCategory[]> => {
    return readCatalogData({
      label: "categories",
      fallback: getFixtureCatalogCategories,
      database: async () => {
        const categories = await db.category.findMany({
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
          include: createCategoryImageInclude(),
        });

        return categories.map(mapCatalogCategory);
      },
    });
  },
  ["catalog:categories", getCatalogDataSourceCacheKey()],
  {
    revalidate: CATALOG_REVALIDATE_SECONDS,
    tags: [CATALOG_CACHE_TAGS.categories],
  },
);

export const getCatalogCategories = cache(
  async (): Promise<CatalogCategory[]> => getCatalogCategoriesCached(),
);

export async function getCatalogCategoryBySlug(slug: string) {
  const getCatalogCategoryBySlugCached = unstable_cache(
    async () => {
      return readCatalogData({
        label: `category:${slug}`,
        fallback: () => getFixtureCatalogCategoryBySlug(slug),
        database: async () => {
          const category = await db.category.findUnique({
            where: { slug },
            include: createCategoryImageInclude(),
          });

          if (!category) return null;

          return mapCatalogCategory(category);
        },
      });
    },
    ["catalog:category", getCatalogDataSourceCacheKey(), slug],
    {
      revalidate: CATALOG_REVALIDATE_SECONDS,
      tags: [CATALOG_CACHE_TAGS.categories, categoryCacheTag(slug)],
    },
  );

  return getCatalogCategoryBySlugCached();
}

export const getCatalogCategoryBySlugCachedRequest = cache(
  getCatalogCategoryBySlug,
);

const getCatalogBranchesCached = unstable_cache(
  async (): Promise<CatalogBranch[]> => {
    return readCatalogData({
      label: "branches",
      fallback: getFixtureCatalogBranches,
      database: async () => {
        const settings = await db.serviceSettings.findUnique({
          where: { id: "default" },
        });

        if (!settings?.physicalBranchesEnabled) return [];

        const branches = await db.branch.findMany({
          where: {
            kind: "PHYSICAL",
            isActive: true,
            isApproved: true,
            isPublic: true,
          },
          orderBy: [{ sortOrder: "asc" }, { city: "asc" }, { name: "asc" }],
        });

        return branches.map(mapCatalogBranch);
      },
    });
  },
  ["catalog:branches", getCatalogDataSourceCacheKey()],
  {
    revalidate: CATALOG_REVALIDATE_SECONDS,
    tags: [CATALOG_CACHE_TAGS.branches],
  },
);

export const getCatalogBranches = cache(
  async (): Promise<CatalogBranch[]> => getCatalogBranchesCached(),
);

const getFeaturedCatalogProductsCached = unstable_cache(
  async (take: number) => {
    return readCatalogData({
      label: "featured-products",
      fallback: () => getFixtureFeaturedCatalogProducts(take),
      database: async () => {
        const records = await db.product.findMany({
          where: ACTIVE_PRODUCT_WHERE,
          include: createCatalogProductInclude(),
          orderBy: [{ createdAt: "desc" }],
        });

        return selectFeaturedCatalogProducts(
          records.map(mapCatalogProduct),
          take,
        );
      },
    });
  },
  ["catalog:featured-products:v5", getCatalogDataSourceCacheKey()],
  {
    revalidate: CATALOG_REVALIDATE_SECONDS,
    tags: [CATALOG_CACHE_TAGS.products],
  },
);

export const getFeaturedCatalogProducts = cache(async (take = 4) =>
  getFeaturedCatalogProductsCached(take),
);

function selectFeaturedCatalogProducts(
  products: CatalogProduct[],
  take: number,
) {
  const selected: CatalogProduct[] = [];
  const selectedCategories = new Set<string>();

  for (const product of products) {
    if (selected.length >= take) break;
    if (selectedCategories.has(product.categorySlug)) continue;

    selected.push(product);
    selectedCategories.add(product.categorySlug);
  }

  for (const product of products) {
    if (selected.length >= take) break;
    if (
      selected.some((selectedProduct) => selectedProduct.slug === product.slug)
    ) {
      continue;
    }

    selected.push(product);
  }

  return selected;
}

export async function listCatalogProducts(input: { category?: string } = {}) {
  const getCatalogProductsCached = unstable_cache(
    async () => {
      return readCatalogData({
        label: input.category
          ? `products:category:${input.category}`
          : "products",
        fallback: () => listFixtureCatalogProducts(input),
        database: async () => {
          const records = await db.product.findMany({
            where: {
              ...ACTIVE_PRODUCT_WHERE,
              ...(input.category ? { category: { slug: input.category } } : {}),
            },
            include: createCatalogProductInclude(),
            orderBy: [{ createdAt: "desc" }],
          });

          return records.map(mapCatalogProduct);
        },
      });
    },
    [
      "catalog:products:v5",
      getCatalogDataSourceCacheKey(),
      input.category ?? "all",
    ],
    {
      revalidate: CATALOG_REVALIDATE_SECONDS,
      tags: [
        CATALOG_CACHE_TAGS.products,
        ...(input.category ? [categoryCacheTag(input.category)] : []),
      ],
    },
  );

  return getCatalogProductsCached();
}

export const listCatalogProductsCachedRequest = cache(listCatalogProducts);

export async function getCatalogProductBySlug(slug: string) {
  const getCatalogProductBySlugCached = unstable_cache(
    async () => {
      return readCatalogData({
        label: `product:${slug}`,
        fallback: () => getFixtureCatalogProductBySlug(slug),
        database: async () => {
          const record = await db.product.findFirst({
            where: { ...ACTIVE_PRODUCT_WHERE, slug },
            include: createCatalogProductInclude(),
          });

          return record ? mapCatalogProduct(record) : null;
        },
      });
    },
    ["catalog:product:v5", getCatalogDataSourceCacheKey(), slug],
    {
      revalidate: CATALOG_REVALIDATE_SECONDS,
      tags: [CATALOG_CACHE_TAGS.products, productCacheTag(slug)],
    },
  );

  return getCatalogProductBySlugCached();
}

export const getCatalogProductBySlugCachedRequest = cache(
  getCatalogProductBySlug,
);

export function getCatalogProductVariant(
  product: CatalogProduct,
  sku?: string,
) {
  return (
    product.variants.find((variant) => variant.sku === sku) ??
    product.variants[0]
  );
}

const getCatalogFacetsCached = unstable_cache(
  async (): Promise<CatalogFacets> => {
    const products = await listCatalogProducts();

    return getCatalogFacetsFromProducts(products);
  },
  ["catalog:facets:v6", getCatalogDataSourceCacheKey()],
  {
    revalidate: CATALOG_REVALIDATE_SECONDS,
    tags: [CATALOG_CACHE_TAGS.facets, CATALOG_CACHE_TAGS.products],
  },
);

export const getCatalogFacets = cache(
  async (): Promise<CatalogFacets> => getCatalogFacetsCached(),
);

export function getCatalogFacetsFromProducts(
  products: CatalogProduct[],
): CatalogFacets {
  const prices = products.map((product) => product.price);

  return {
    materials: getUniqueValues(products.map((product) => product.material)),
    stones: getUniqueValues(
      products
        .map((product) => product.stone)
        .filter((value): value is string => Boolean(value)),
    ),
    collections: getUniqueValues(products.map((product) => product.collection)),
    styles: getUniqueValues(
      products.flatMap((product) => getCatalogProductStyles(product)),
    ),
    giftTags: getCatalogGiftFacetOptions(products),
    colors: getUniqueValues(
      products.flatMap((product) => getCatalogProductColors(product)),
    ),
    priceRange: {
      min: prices.length > 0 ? Math.min(...prices) : 0,
      max: prices.length > 0 ? Math.max(...prices) : 0,
    },
  };
}

export async function searchCatalogProducts(input: CatalogSearchInput = {}) {
  const products = await listCatalogProductsCachedRequest({
    category: input.category,
  });

  return filterCatalogProducts(products, input);
}

export function filterCatalogProducts(
  products: CatalogProduct[],
  input: CatalogSearchInput = {},
) {
  const normalizedQuery = input.query?.trim().toLowerCase();

  return products
    .filter((product) =>
      input.category ? product.categorySlug === input.category : true,
    )
    .filter((product) => matchesCatalogSearch(product, normalizedQuery))
    .filter((product) =>
      input.material ? product.material === input.material : true,
    )
    .filter((product) => (input.stone ? product.stone === input.stone : true))
    .filter((product) =>
      input.collection ? product.collections.includes(input.collection) : true,
    )
    .filter((product) =>
      input.style
        ? getCatalogProductStyles(product).includes(input.style)
        : true,
    )
    .filter((product) =>
      input.gift ? matchesCatalogGiftFacet(product, input.gift) : true,
    )
    .filter((product) =>
      input.color
        ? getCatalogProductColors(product).includes(input.color)
        : true,
    )
    .filter((product) =>
      input.branch ? (product.inventory[input.branch] ?? 0) > 0 : true,
    )
    .filter((product) =>
      input.maxPrice ? product.price <= input.maxPrice : true,
    )
    .filter((product) =>
      input.availableOnly
        ? Object.values(product.inventory).some((quantity) => quantity > 0)
        : true,
    );
}

const catalogGiftFacetLabels = {
  gift: "מתאים למתנה",
  under200: "עד 200 ₪",
  pearl: "פנינים למתנה",
} as const;

function getCatalogProductStyles(product: CatalogProduct): string[] {
  return product.collections.length > 0
    ? product.collections
    : [product.collection];
}

function getCatalogProductColors(product: CatalogProduct): string[] {
  return getUniqueValues([
    ...product.metalColors,
    ...product.variants
      .flatMap((variant) => [variant.metalColor, variant.stoneColor])
      .filter((value): value is string => Boolean(value)),
  ]);
}

function getCatalogGiftFacetOptions(products: CatalogProduct[]): string[] {
  const options: string[] = [];

  if (
    products.some((product) =>
      matchesCatalogGiftFacet(product, catalogGiftFacetLabels.gift),
    )
  ) {
    options.push(catalogGiftFacetLabels.gift);
  }

  if (
    products.some((product) =>
      matchesCatalogGiftFacet(product, catalogGiftFacetLabels.under200),
    )
  ) {
    options.push(catalogGiftFacetLabels.under200);
  }

  if (
    products.some((product) =>
      matchesCatalogGiftFacet(product, catalogGiftFacetLabels.pearl),
    )
  ) {
    options.push(catalogGiftFacetLabels.pearl);
  }

  return options;
}

function matchesCatalogGiftFacet(
  product: CatalogProduct,
  giftFacet: string,
): boolean {
  if (giftFacet === catalogGiftFacetLabels.under200) {
    return product.price <= 200;
  }

  if (giftFacet === catalogGiftFacetLabels.pearl) {
    const normalizedStone = normalizeCatalogFacetText(product.stone);

    return (
      matchesCatalogGiftFacet(product, catalogGiftFacetLabels.gift) &&
      (normalizedStone.includes("פנינ") || normalizedStone.includes("pearl"))
    );
  }

  if (giftFacet !== catalogGiftFacetLabels.gift) return false;

  const searchable = [
    product.description,
    product.shortDescription,
    ...product.tags,
    ...product.collections,
  ]
    .map((value) => normalizeCatalogFacetText(value))
    .join(" ");

  return searchable.includes("מתנה") || searchable.includes("gift");
}

function normalizeCatalogFacetText(value?: string): string {
  return value?.trim().toLowerCase() ?? "";
}

export function getCatalogAvailability(product: CatalogProduct) {
  return Object.entries(product.inventory).map(([branchSlug, quantity]) => ({
    branchSlug,
    quantity,
    available: quantity > 0,
  }));
}

export function getCatalogBranchAvailability(input: {
  product: CatalogProduct;
  branches: CatalogBranch[];
}) {
  return input.branches.map((branch) => {
    const quantity = input.product.inventory[branch.slug] ?? 0;

    return {
      branch,
      quantity,
      available: quantity > 0,
    };
  });
}

function createCatalogProductInclude() {
  const now = new Date();

  return {
    category: true,
    material: true,
    stone: true,
    collections: true,
    media: {
      orderBy: { sortOrder: "asc" },
    },
    variants: {
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
      include: {
        prices: {
          where: {
            currency: "ILS",
            validFrom: { lte: now },
            OR: [{ validTo: null }, { validTo: { gt: now } }],
          },
          orderBy: { validFrom: "desc" },
          take: 1,
        },
        inventoryItems: {
          include: { branch: true },
        },
      },
    },
    _count: {
      select: {
        clickEvents: true,
        viewEvents: true,
      },
    },
  } satisfies Prisma.ProductInclude;
}

function mapCatalogProduct(record: CatalogProductRecord): CatalogProduct {
  const defaultVariant = record.variants[0];
  const defaultPrice = getVariantPrice(
    defaultVariant,
    Number(record.basePrice),
  );
  const images = record.media
    .filter((media) => media.kind === "IMAGE")
    .map((media) => media.url);
  const displayImages = getDisplayCatalogImages({
    categorySlug: record.category.slug,
    images,
    slug: record.slug,
  });
  const inventory: Record<string, number> = {};

  const variantInventories = new Map<
    string,
    {
      availableBranchCount: number;
      availableQuantity: number;
      inventory: Record<string, number>;
    }
  >();

  for (const variant of record.variants) {
    const variantInventory = getVariantInventory(variant);

    variantInventories.set(variant.sku, variantInventory);

    for (const [branchSlug, quantity] of Object.entries(
      variantInventory.inventory,
    )) {
      inventory[branchSlug] = (inventory[branchSlug] ?? 0) + quantity;
    }
  }

  const displayName = getDisplayProductName(record.name);
  const displayMaterial = getPublicMaterialName(
    record.material.name,
    displayName,
  );
  const displayStone = getPublicStoneName(record.stone?.name);
  const displayCollections = getUniqueValues(
    record.collections
      .map((collection) => getPublicCollectionName(collection.name))
      .filter((collection): collection is string => Boolean(collection)),
  );
  const displayCollection = displayCollections[0] ?? "Signature edit";
  const displayDescription = getDisplayProductDescription({
    description: record.description,
    material: displayMaterial,
    name: displayName,
    source: record.source,
    stone: displayStone,
  });
  const displayTags = getDisplayProductTags(record.tags);

  return {
    slug: record.slug,
    sku: getPublicCatalogSku(record.sku),
    requiresSeparateCheckout: record.source !== "OWN",
    name: displayName,
    categorySlug: record.category.slug,
    categoryName: getPublicCategoryName(
      record.category.slug,
      record.category.name,
    ),
    shortDescription: getDisplayProductShortDescription({
      material: displayMaterial,
      name: displayName,
      shortDescription: record.shortDescription,
      source: record.source,
      stone: displayStone,
    }),
    description: displayDescription,
    availabilityMode: record.availabilityMode,
    commerceHighlights: getDisplayCommerceHighlights(record),
    deliveryPromise: normalizePublicCatalogCopy(
      record.deliveryPromise ?? "מסירה עד הבית לאחר השלמת התשלום.",
    ),
    returnPolicy: normalizePublicCatalogCopy(
      record.returnPolicy ?? "החלפה או החזרה בתיאום שירות לפי מדיניות Elysia.",
    ),
    careInstructions: record.careInstructions
      ? normalizePublicCatalogCopy(record.careInstructions)
      : undefined,
    warranty: record.warranty
      ? normalizePublicCatalogCopy(record.warranty)
      : undefined,
    price: defaultPrice,
    compareAt: getCompareAt(defaultVariant),
    createdAt: record.createdAt,
    popularityScore: record._count.viewEvents + record._count.clickEvents * 2,
    material: displayMaterial,
    stone: displayStone,
    collection: displayCollection,
    collections:
      displayCollections.length > 0 ? displayCollections : [displayCollection],
    image: displayImages[0] ?? DEFAULT_CATALOG_IMAGE,
    images: displayImages.length > 0 ? displayImages : [DEFAULT_CATALOG_IMAGE],
    variants: record.variants.map((variant) => ({
      sku: getPublicCatalogSku(variant.sku),
      name: getPublicVariantOptionName(variant.name),
      separateCheckoutAvailable:
        record.source !== "OWN" && Boolean(variant.externalVariantId?.trim()),
      size: variant.size ?? undefined,
      metalColor: variant.metalColor
        ? getPublicVariantOptionName(variant.metalColor)
        : undefined,
      stoneColor: variant.stoneColor
        ? getPublicVariantOptionName(variant.stoneColor)
        : undefined,
      price: getVariantPrice(variant, Number(record.basePrice)),
      inventory: variantInventories.get(variant.sku)?.inventory ?? {},
      availableQuantity:
        variantInventories.get(variant.sku)?.availableQuantity ?? 0,
      availableBranchCount:
        variantInventories.get(variant.sku)?.availableBranchCount ?? 0,
    })),
    metalColors: getUniqueValues(
      record.variants
        .map((variant) => variant.metalColor)
        .filter((value): value is string => Boolean(value))
        .map(getPublicVariantOptionName),
    ),
    sizes: getUniqueValues(
      record.variants
        .map((variant) => variant.size)
        .filter((value): value is string => Boolean(value)),
    ),
    tags: displayTags,
    inventory,
  };
}

function getVariantInventory(
  variant: CatalogProductRecord["variants"][number],
) {
  const inventory: Record<string, number> = {};

  for (const item of variant.inventoryItems) {
    const available = Math.max(
      item.quantity - item.reserved - item.safetyStock,
      0,
    );

    inventory[item.branch.slug] =
      (inventory[item.branch.slug] ?? 0) + available;
  }

  return {
    availableBranchCount: Object.values(inventory).filter(
      (quantity) => quantity > 0,
    ).length,
    availableQuantity: Object.values(inventory).reduce(
      (sum, quantity) => sum + quantity,
      0,
    ),
    inventory,
  };
}

function getDisplayProductName(name: string) {
  const cleanedName = name
    .replace(/\bElysia\s+Supplier\b/giu, "Elysia")
    .replace(/\bSupplier\b|\bShopify\b|\bDropship(?:ping)?\b/giu, "")
    .replace(/\s+מהספק$/u, "")
    .replace(/\s+\d{3}$/u, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  return cleanedName && !hasPrivateCatalogCopy(cleanedName)
    ? cleanedName
    : "תכשיט Elysia";
}

function normalizePublicCatalogCopy(value: string) {
  return publicCatalogCopyReplacements.reduce(
    (text, [from, to]) => text.split(from).join(to),
    value,
  );
}

function getDisplayProductDescription(input: {
  description: string;
  material: string;
  name: string;
  source: CatalogProductRecord["source"];
  stone?: string;
}) {
  if (
    input.source === "OWN" &&
    !hasPrivateCatalogCopy(input.description) &&
    !isGeneratedCatalogDescription(input.description)
  ) {
    return normalizePublicCatalogCopy(input.description);
  }

  const stoneText = input.stone ? ` עם ${input.stone}` : "";

  return `${input.name} משלב ${input.material}${stoneText} בקו יומיומי ונוח לענידה, עם מידה, חומר ומחיר לפני הזמנה.`;
}

function getDisplayProductShortDescription(input: {
  material: string;
  name: string;
  shortDescription: string;
  source: CatalogProductRecord["source"];
  stone?: string;
}) {
  if (
    input.source === "OWN" &&
    !hasPrivateCatalogCopy(input.shortDescription) &&
    !isGeneratedCatalogDescription(input.shortDescription)
  ) {
    return normalizePublicCatalogCopy(input.shortDescription);
  }

  return `${input.name} מוצג עם חומר, מידה ומחיר לפני הזמנה.`;
}

function getDisplayCommerceHighlights(record: CatalogProductRecord) {
  if (record.commerceHighlights.length > 0) {
    const highlights = record.commerceHighlights
      .filter((highlight) => !hasPrivateCatalogCopy(highlight))
      .map(normalizePublicCatalogCopy);

    if (highlights.length > 0) return highlights;
  }

  return [
    normalizePublicCatalogCopy(record.warranty ?? "מענה לפני הזמנה"),
    normalizePublicCatalogCopy(
      record.deliveryPromise ?? "מסירה מתואמת עד הבית",
    ),
    normalizePublicCatalogCopy(
      record.careInstructions ?? "הנחיות טיפול מצורפות לכל תכשיט",
    ),
  ];
}

function isGeneratedCatalogDescription(description: string) {
  return (
    description.includes("בדיקות מבחר") ||
    description.includes("תצוגת עמוד מוצר")
  );
}

function getDisplayProductTags(tags: string[]) {
  return tags.filter(
    (tag) => tag !== "בדיקות מבחר" && !hasPrivateCatalogCopy(tag),
  );
}

function hasPrivateCatalogCopy(value: string) {
  return privateCatalogCopyPattern.test(value);
}

function mapCatalogBranch(record: {
  slug: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  whatsapp: string | null;
  services: string[];
  openingHours: Prisma.JsonValue;
}): CatalogBranch {
  const openingHours = parseOpeningHours(record.openingHours);

  return {
    slug: record.slug,
    name: record.name,
    city: record.city,
    address: record.address,
    phone: record.phone,
    whatsapp: record.whatsapp ?? "",
    services: record.services,
    openingHours,
  };
}

function createCategoryImageInclude() {
  return {
    products: {
      where: ACTIVE_PRODUCT_WHERE,
      orderBy: { createdAt: "desc" },
      take: 1,
      include: {
        media: {
          where: { kind: "IMAGE" },
          orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
          take: 1,
        },
      },
    },
  } satisfies Prisma.CategoryInclude;
}

function mapCatalogCategory(category: {
  slug: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  products: Array<{
    media: Array<{
      url: string;
    }>;
  }>;
}): CatalogCategory {
  const image = getCatalogCategoryImage({
    categorySlug: category.slug,
    imageUrl: category.imageUrl,
    productImage: category.products[0]?.media[0]?.url,
  });

  return {
    slug: category.slug,
    name: getPublicCategoryName(category.slug, category.name),
    description: getDisplayCategoryDescription({
      description: category.description,
      name: category.name,
      slug: category.slug,
    }),
    image,
    imageUrl: image,
  };
}

function getDisplayCategoryDescription(input: {
  description: string | null;
  name: string;
  slug: string;
}) {
  if (input.description && !hasPrivateCatalogCopy(input.description)) {
    return normalizePublicCatalogCopy(input.description);
  }

  const publicName = getPublicCategoryName(input.slug, input.name);

  return `${publicName} מתוך קולקציית Elysia, עם חומר, מידה ומחיר לפני הזמנה.`;
}

function getVariantPrice(
  variant: CatalogProductRecord["variants"][number] | undefined,
  fallback: number,
) {
  if (!variant) return fallback;

  const price = variant.prices[0]?.amount ?? fallback;

  return Number(price) + Number(variant.priceDelta);
}

function getCompareAt(
  variant: CatalogProductRecord["variants"][number] | undefined,
) {
  const compareAt = variant?.prices[0]?.compareAt;

  return compareAt ? Number(compareAt) : undefined;
}

function matchesCatalogSearch(
  product: CatalogProduct,
  normalizedQuery?: string,
) {
  if (!normalizedQuery) return true;

  return [
    product.name,
    product.shortDescription,
    product.description,
    product.material,
    product.stone,
    product.collection,
    product.categoryName,
    ...product.tags,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes(normalizedQuery);
}

function parseOpeningHours(value: Prisma.JsonValue) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {
      sundayThursday: "",
      friday: "",
      saturday: "",
    };
  }

  const record = value as Record<string, unknown>;

  return {
    sundayThursday: getStringValue(record.sundayThursday),
    friday: getStringValue(record.friday),
    saturday: getStringValue(record.saturday),
  };
}

function getStringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function getUniqueValues(values: string[]) {
  return Array.from(new Set(values));
}
