import type { Prisma } from "@prisma/client";
import { unstable_cache } from "next/cache";
import { cache } from "react";

import { formatPrice } from "~/lib/format";
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
const CATALOG_REVALIDATE_SECONDS = 60 * 60;
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

const getCatalogCategoriesCached = unstable_cache(
  async (): Promise<CatalogCategory[]> => {
    const categories = await db.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: createCategoryImageInclude(),
    });

    return categories.map(mapCatalogCategory);
  },
  ["catalog:categories"],
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
      const category = await db.category.findUnique({
        where: { slug },
        include: createCategoryImageInclude(),
      });

      if (!category) return null;

      return mapCatalogCategory(category);
    },
    [`catalog:category:${slug}`],
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
  ["catalog:branches"],
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
    const records = await db.product.findMany({
      where: ACTIVE_PRODUCT_WHERE,
      include: createCatalogProductInclude(),
      orderBy: [{ createdAt: "desc" }],
    });

    return selectFeaturedCatalogProducts(records.map(mapCatalogProduct), take);
  },
  ["catalog:featured-products:v5"],
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
    [`catalog:products:v5:${input.category ?? "all"}`],
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
      const record = await db.product.findFirst({
        where: { ...ACTIVE_PRODUCT_WHERE, slug },
        include: createCatalogProductInclude(),
      });

      return record ? mapCatalogProduct(record) : null;
    },
    [`catalog:product:v5:${slug}`],
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
  ["catalog:facets:v5"],
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
  const displayDescription = getDisplayProductDescription({
    description: record.description,
    material: record.material.name,
    name: displayName,
    stone: record.stone?.name,
  });
  const displayTags = getDisplayProductTags(record.tags);

  return {
    slug: record.slug,
    sku: record.sku,
    name: displayName,
    categorySlug: record.category.slug,
    categoryName: record.category.name,
    shortDescription: record.shortDescription,
    description: displayDescription,
    availabilityMode: record.availabilityMode,
    commerceHighlights: getDisplayCommerceHighlights(record),
    deliveryPromise:
      record.deliveryPromise ?? "משלוח עד הבית לאחר אימות פרטי ההזמנה.",
    returnPolicy:
      record.returnPolicy ?? "החלפה או החזרה מתואמת לפי מדיניות האתר.",
    careInstructions: record.careInstructions ?? undefined,
    warranty: record.warranty ?? undefined,
    price: defaultPrice,
    compareAt: getCompareAt(defaultVariant),
    createdAt: record.createdAt,
    popularityScore: record._count.viewEvents + record._count.clickEvents * 2,
    material: record.material.name,
    stone: record.stone?.name,
    collection: record.collections[0]?.name ?? "Elysia",
    collections: record.collections.map((collection) => collection.name),
    image: displayImages[0] ?? DEFAULT_CATALOG_IMAGE,
    images: displayImages.length > 0 ? displayImages : [DEFAULT_CATALOG_IMAGE],
    variants: record.variants.map((variant) => ({
      sku: variant.sku,
      name: variant.name,
      size: variant.size ?? undefined,
      metalColor: variant.metalColor ?? undefined,
      stoneColor: variant.stoneColor ?? undefined,
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
        .filter((value): value is string => Boolean(value)),
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
  return name.replace(/\s+\d{3}$/u, "");
}

function getDisplayProductDescription(input: {
  description: string;
  material: string;
  name: string;
  stone?: string;
}) {
  if (!isGeneratedCatalogDescription(input.description)) {
    return input.description;
  }

  const stoneText = input.stone ? ` עם ${input.stone}` : "";

  return `${input.name} משלב ${input.material}${stoneText} בקו נקי ונוח לענידה. מתאים לשילוב יומיומי, מתנה או אירוע, עם פירוט מלא של מידה, חומר וזמינות לפני רכישה.`;
}

function getDisplayCommerceHighlights(record: CatalogProductRecord) {
  if (record.commerceHighlights.length > 0) {
    return record.commerceHighlights;
  }

  return [
    record.warranty ?? "אחריות ושירות לאחר רכישה",
    record.deliveryPromise ?? "משלוח מתואם עד הבית",
    record.careInstructions ?? "הנחיות טיפול מצורפות לכל פריט",
  ];
}

function isGeneratedCatalogDescription(description: string) {
  return (
    description.includes("בדיקות קטלוג") ||
    description.includes("תצוגת עמוד מוצר")
  );
}

function getDisplayProductTags(tags: string[]) {
  return tags.filter((tag) => tag !== "בדיקות קטלוג");
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
    name: category.name,
    description: category.description ?? "",
    image,
    imageUrl: image,
  };
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
