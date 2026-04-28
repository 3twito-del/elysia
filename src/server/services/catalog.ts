import type { Prisma } from "@prisma/client";

import { db } from "~/server/db";

const ACTIVE_PRODUCT_WHERE = {
  status: "ACTIVE",
} satisfies Prisma.ProductWhereInput;
const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1400&q=80";

type CatalogProductRecord = Prisma.ProductGetPayload<{
  include: ReturnType<typeof createCatalogProductInclude>;
}>;

export type CatalogCategory = {
  slug: string;
  name: string;
  description: string;
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
  material: string;
  stone?: string;
  collection: string;
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

export function formatPrice(amount: number) {
  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
    maximumFractionDigits: 0,
  }).format(amount);
}

export async function getCatalogCategories(): Promise<CatalogCategory[]> {
  const categories = await db.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return categories.map((category) => ({
    slug: category.slug,
    name: category.name,
    description: category.description ?? "",
  }));
}

export async function getCatalogCategoryBySlug(slug: string) {
  const category = await db.category.findUnique({ where: { slug } });

  if (!category) return null;

  return {
    slug: category.slug,
    name: category.name,
    description: category.description ?? "",
  } satisfies CatalogCategory;
}

export async function getCatalogBranches(): Promise<CatalogBranch[]> {
  const branches = await db.branch.findMany({
    orderBy: [{ city: "asc" }, { name: "asc" }],
  });

  return branches.map(mapCatalogBranch);
}

export async function getFeaturedCatalogProducts(take = 4) {
  const records = await db.product.findMany({
    where: ACTIVE_PRODUCT_WHERE,
    include: createCatalogProductInclude(),
    orderBy: [{ createdAt: "desc" }],
    take,
  });

  return records.map(mapCatalogProduct);
}

export async function listCatalogProducts(input: { category?: string } = {}) {
  const records = await db.product.findMany({
    where: {
      ...ACTIVE_PRODUCT_WHERE,
      ...(input.category ? { category: { slug: input.category } } : {}),
    },
    include: createCatalogProductInclude(),
    orderBy: [{ createdAt: "desc" }],
  });

  return records.map(mapCatalogProduct);
}

export async function getCatalogProductBySlug(slug: string) {
  const record = await db.product.findFirst({
    where: { ...ACTIVE_PRODUCT_WHERE, slug },
    include: createCatalogProductInclude(),
  });

  return record ? mapCatalogProduct(record) : null;
}

export function getCatalogProductVariant(
  product: CatalogProduct,
  sku?: string,
) {
  return (
    product.variants.find((variant) => variant.sku === sku) ??
    product.variants[0]
  );
}

export async function getCatalogFacets(): Promise<CatalogFacets> {
  const products = await listCatalogProducts();
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
  const records = await db.product.findMany({
    where: {
      ...ACTIVE_PRODUCT_WHERE,
      ...(input.category ? { category: { slug: input.category } } : {}),
      ...(input.material ? { material: { name: input.material } } : {}),
      ...(input.stone ? { stone: { name: input.stone } } : {}),
      ...(input.collection
        ? { collections: { some: { name: input.collection } } }
        : {}),
    },
    include: createCatalogProductInclude(),
    orderBy: [{ createdAt: "desc" }],
  });
  const normalizedQuery = input.query?.trim().toLowerCase();

  return records
    .map(mapCatalogProduct)
    .filter((product) => matchesCatalogSearch(product, normalizedQuery))
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
    material: record.material.name,
    stone: record.stone?.name,
    collection: record.collections[0]?.name ?? "Aphrodite",
    image: images[0] ?? DEFAULT_IMAGE,
    images: images.length > 0 ? images : [DEFAULT_IMAGE],
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
