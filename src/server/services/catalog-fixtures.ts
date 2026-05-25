import {
  getSeedProducts,
  seedCategories,
  seedCollections,
  seedMaterials,
  seedStones,
  type SeedProduct,
} from "../../../prisma/seed-catalog";

import { DEFAULT_CATALOG_IMAGE } from "~/server/services/catalog-assets";
import type {
  CatalogBranch,
  CatalogCategory,
  CatalogProduct,
  CatalogProductVariant,
} from "~/server/services/catalog-types";

const fixtureCreatedAt = new Date("2026-01-01T00:00:00.000Z");

const categoryImages = {
  bracelets: "/brand/v2/category-bracelets.avif",
  earrings: "/brand/v2/category-earrings.avif",
  necklaces: "/brand/v2/category-necklaces.avif",
  rings: "/brand/v2/category-rings.avif",
} satisfies Record<string, string>;

const materialBySlug = new Map(
  seedMaterials.map((material) => [material.slug, material.name] as const),
);
const stoneBySlug = new Map(
  seedStones.map((stone) => [stone.slug, stone.name] as const),
);
const collectionBySlug = new Map(
  seedCollections.map(
    (collection) => [collection.slug, collection.name] as const,
  ),
);
const categoryBySlug = new Map(
  seedCategories.map((category) => [category.slug, category] as const),
);

const fixtureBranches: CatalogBranch[] = [
  {
    slug: "online-service",
    name: "שירות אונליין",
    city: "Online",
    address: "Online",
    phone: "054-727-7455",
    whatsapp: "972547277455",
    services: ["שירות אונליין", "מענה טלפוני", "תיאום תיקונים"],
    openingHours: {
      sundayThursday: "10:00-18:00",
      friday: "09:30-13:00",
      saturday: "סגור",
    },
  },
];

const fixtureCategories: CatalogCategory[] = seedCategories.map((category) => ({
  slug: category.slug,
  name: category.name,
  description: category.description,
  image: categoryImages[category.slug] ?? DEFAULT_CATALOG_IMAGE,
  imageUrl: categoryImages[category.slug] ?? DEFAULT_CATALOG_IMAGE,
}));

const fixtureProducts: CatalogProduct[] = getSeedProducts().map(mapSeedProduct);

export function shouldUseCatalogFixtures() {
  return (
    process.env.E2E_CATALOG_FIXTURES === "1" ||
    process.env.CATALOG_FIXTURE_FALLBACK === "1"
  );
}

export function getFixtureCatalogCategories() {
  return fixtureCategories;
}

export function getFixtureCatalogCategoryBySlug(slug: string) {
  return fixtureCategories.find((category) => category.slug === slug) ?? null;
}

export function getFixtureCatalogBranches() {
  return fixtureBranches;
}

export function getFixtureFeaturedCatalogProducts(take: number) {
  return fixtureProducts.slice(0, take);
}

export function listFixtureCatalogProducts(input: { category?: string } = {}) {
  return fixtureProducts.filter((product) =>
    input.category ? product.categorySlug === input.category : true,
  );
}

export function getFixtureCatalogProductBySlug(slug: string) {
  return fixtureProducts.find((product) => product.slug === slug) ?? null;
}

function mapSeedProduct(product: SeedProduct): CatalogProduct {
  const category = categoryBySlug.get(product.categorySlug);
  const material =
    materialBySlug.get(product.materialSlug) ?? product.materialSlug;
  const stone = product.stoneSlug
    ? (stoneBySlug.get(product.stoneSlug) ?? product.stoneSlug)
    : undefined;
  const collections = product.collectionSlugs.map(
    (slug) => collectionBySlug.get(slug) ?? slug,
  );
  const variants = product.variants.map((variant) =>
    mapSeedVariant(product, variant),
  );
  const inventory = variants.reduce<Record<string, number>>((acc, variant) => {
    for (const [branchSlug, quantity] of Object.entries(variant.inventory)) {
      acc[branchSlug] = (acc[branchSlug] ?? 0) + quantity;
    }

    return acc;
  }, {});
  const images = [product.image || DEFAULT_CATALOG_IMAGE];

  return {
    slug: product.slug,
    sku: product.sku,
    name: product.name.replace(/\s+\d{3}$/u, ""),
    categorySlug: product.categorySlug,
    categoryName: category?.name ?? product.categorySlug,
    shortDescription: product.shortDescription,
    description: product.description,
    availabilityMode: getSeedAvailabilityMode(product.slug),
    commerceHighlights: getSeedCommerceHighlights(product.slug),
    deliveryPromise: "משלוח עד הבית לאחר אימות פרטי ההזמנה.",
    returnPolicy: "החלפה או החזרה מתואמת לפי מדיניות האתר.",
    careInstructions: "מומלץ להימנע ממגע עם בושם, כלור וחומרי ניקוי.",
    warranty: "אחריות לשנה על פגמי ייצור ושירות ניקוי ראשוני ללא עלות.",
    price: variants[0]?.price ?? Number(product.basePrice),
    createdAt: fixtureCreatedAt,
    popularityScore: 1,
    material,
    stone,
    collection: collections[0] ?? "Elysia",
    collections,
    image: images[0] ?? DEFAULT_CATALOG_IMAGE,
    images,
    variants,
    metalColors: getUniqueValues(
      variants
        .map((variant) => variant.metalColor)
        .filter((value): value is string => Boolean(value)),
    ),
    sizes: getUniqueValues(
      variants
        .map((variant) => variant.size)
        .filter((value): value is string => Boolean(value)),
    ),
    tags: product.tags.filter((tag) => tag !== "בדיקות קטלוג"),
    inventory,
  };
}

function mapSeedVariant(
  product: SeedProduct,
  variant: SeedProduct["variants"][number],
): CatalogProductVariant {
  const availableQuantity = Math.max(
    variant.quantityTlv + variant.quantityJerusalem - variant.safetyStock,
    0,
  );

  return {
    sku: variant.sku,
    name: variant.name,
    size: variant.size ?? undefined,
    metalColor: variant.metalColor ?? undefined,
    stoneColor: variant.stoneColor ?? undefined,
    price: Number(product.basePrice) + Number(variant.priceDelta),
    inventory: { "online-service": availableQuantity },
    availableQuantity,
    availableBranchCount: availableQuantity > 0 ? 1 : 0,
  };
}

function getSeedAvailabilityMode(slug: string) {
  if (slug === "muse-pearl-earrings") return "MADE_TO_ORDER";
  if (slug === "venus-line-ring") return "CONSULTATION";

  return "READY_TO_ORDER";
}

function getSeedCommerceHighlights(slug: string) {
  if (slug === "muse-pearl-earrings") {
    return ["מחיר גלוי לפני התאמה", "ייצור לפי מידה וגוון"];
  }

  if (slug === "venus-line-ring") {
    return ["ייעוץ התאמה לפני שמירה", "בחירת אבן מאומתת"];
  }

  return ["מחיר גלוי לפני שמירה", "בדיקת איכות לפני מסירה"];
}

function getUniqueValues(values: string[]) {
  return Array.from(new Set(values));
}
