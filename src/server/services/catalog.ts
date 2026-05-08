import type { Prisma } from "@prisma/client";
import { unstable_cache } from "next/cache";
import { cache } from "react";

import {
  DEFAULT_BRAND_MEDIA,
  getBrandCategoryHero,
  getBrandProductMediaUrls,
} from "~/lib/brand-media";
import { formatPrice } from "~/lib/format";
import { db } from "~/server/db";
import {
  CATALOG_CACHE_TAGS,
  categoryCacheTag,
  productCacheTag,
} from "~/server/services/catalog-cache";

const ACTIVE_PRODUCT_WHERE = {
  status: "ACTIVE",
} satisfies Prisma.ProductWhereInput;
const CATALOG_REVALIDATE_SECONDS = 60 * 60;
export const DEFAULT_CATALOG_IMAGE = DEFAULT_BRAND_MEDIA;

type CatalogProductRecord = Prisma.ProductGetPayload<{
  include: ReturnType<typeof createCatalogProductInclude>;
}>;

export type CatalogCategory = {
  slug: string;
  name: string;
  description: string;
  image: string;
  imageUrl: string;
};

export type CatalogBranch = {
  slug: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  whatsapp: string;
  services: string[];
  openingHours: {
    sundayThursday: string;
    friday: string;
    saturday: string;
  };
};

export type CatalogProductVariant = {
  sku: string;
  name: string;
  size?: string;
  metalColor?: string;
  stoneColor?: string;
  price: number;
};

export type CatalogProduct = {
  slug: string;
  sku: string;
  name: string;
  categorySlug: string;
  categoryName: string;
  shortDescription: string;
  description: string;
  price: number;
  compareAt?: number;
  createdAt: Date | string;
  popularityScore: number;
  material: string;
  stone?: string;
  collection: string;
  collections: string[];
  image: string;
  images: string[];
  variants: CatalogProductVariant[];
  metalColors: string[];
  sizes: string[];
  tags: string[];
  inventory: Record<string, number>;
};

export type CatalogSearchInput = {
  query?: string;
  category?: string;
  branch?: string;
  material?: string;
  stone?: string;
  maxPrice?: number;
  collection?: string;
  availableOnly?: boolean;
};

export type CatalogFacets = {
  materials: string[];
  stones: string[];
  collections: string[];
  priceRange: {
    min: number;
    max: number;
  };
};

export { formatPrice };

const getCatalogCategoriesCached = unstable_cache(
  async (): Promise<CatalogCategory[]> => {
    const categories = await db.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: createCategoryImageInclude(),
    });

    return categories.map(mapCatalogCategory);
  },
  ["catalog:v2:categories"],
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
    [`catalog:v2:category:${slug}`],
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
    const branches = await db.branch.findMany({
      orderBy: [{ city: "asc" }, { name: "asc" }],
    });

    return branches.map(mapCatalogBranch);
  },
  ["catalog:v2:branches"],
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
  ["catalog:v2:featured-products"],
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
    [`catalog:v2:products:${input.category ?? "all"}`],
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
    [`catalog:v2:product:${slug}`],
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
    const prices = products.map((product) => product.price);

    return {
      materials: getUniqueValues(products.map((product) => product.material)),
      stones: getUniqueValues(
        products
          .map((product) => product.stone)
          .filter((value): value is string => Boolean(value)),
      ),
      collections: getUniqueValues(
        products.map((product) => product.collection),
      ),
      priceRange: {
        min: prices.length > 0 ? Math.min(...prices) : 0,
        max: prices.length > 0 ? Math.max(...prices) : 0,
      },
    };
  },
  ["catalog:v2:facets"],
  {
    revalidate: CATALOG_REVALIDATE_SECONDS,
    tags: [CATALOG_CACHE_TAGS.facets, CATALOG_CACHE_TAGS.products],
  },
);

export const getCatalogFacets = cache(
  async (): Promise<CatalogFacets> => getCatalogFacetsCached(),
);

export async function searchCatalogProducts(input: CatalogSearchInput = {}) {
  const products = await listCatalogProductsCachedRequest({
    category: input.category,
  });
  const normalizedQuery = input.query?.trim().toLowerCase();

  return products
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
  const displayImages = getDisplayImages({
    categorySlug: record.category.slug,
    images,
    slug: record.slug,
  });
  const inventory: Record<string, number> = {};

  for (const variant of record.variants) {
    for (const item of variant.inventoryItems) {
      const available = Math.max(
        item.quantity - item.reserved - item.safetyStock,
        0,
      );
      inventory[item.branch.slug] =
        (inventory[item.branch.slug] ?? 0) + available;
    }
  }

  return {
    slug: record.slug,
    sku: record.sku,
    name: record.name,
    categorySlug: record.category.slug,
    categoryName: record.category.name,
    shortDescription: record.shortDescription,
    description: record.description,
    price: defaultPrice,
    compareAt: getCompareAt(defaultVariant),
    createdAt: record.createdAt,
    popularityScore: record._count.viewEvents + record._count.clickEvents * 2,
    material: record.material.name,
    stone: record.stone?.name,
    collection: record.collections[0]?.name ?? "Aphrodite",
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
    tags: record.tags,
    inventory,
  };
}

function getDisplayImages(input: {
  categorySlug: string;
  images: string[];
  slug: string;
}) {
  return getBrandProductMediaUrls({
    categorySlug: input.categorySlug,
    currentImages: input.images,
    slug: input.slug,
  });
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
  const brandHero = getBrandCategoryHero(category.slug);
  const image =
    category.imageUrl ??
    brandHero.url ??
    category.products[0]?.media[0]?.url ??
    DEFAULT_CATALOG_IMAGE;

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
