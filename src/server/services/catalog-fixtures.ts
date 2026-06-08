import {
  getSeedProducts,
  seedCategories,
  seedCollections,
  seedMaterials,
  seedStones,
  type SeedProduct,
} from "../../../prisma/seed-catalog";

import { siteContact, siteWhatsapp } from "~/config/site-contact";
import { getPublicCategoryName } from "~/lib/product-display";
import {
  DEFAULT_CATALOG_IMAGE,
  getProductCatalogImages,
} from "~/server/services/catalog-assets";
import type {
  CatalogBranch,
  CatalogCategory,
  CatalogProduct,
  CatalogProductVariant,
} from "~/server/services/catalog-types";

const fixtureCreatedAt = new Date("2026-01-01T00:00:00.000Z");

const categoryImages = {
  bracelets: "/brand/boutique/category-bracelets.avif",
  earrings: "/brand/boutique/category-earrings.avif",
  necklaces: "/brand/boutique/category-necklaces.avif",
  rings: "/brand/boutique/category-rings.avif",
} satisfies Record<string, string>;

const categoryGalleryImages: Record<string, string[]> = {
  bracelets: [
    "/brand/boutique/category-bracelets.avif",
    "/brand/boutique/lifestyle-hero.avif",
    "/brand/boutique/product-detail.avif",
    "/brand/boutique/category-rings.avif",
    "/brand/boutique/category-necklaces.avif",
    "/brand/boutique/category-earrings.avif",
  ],
  earrings: [
    "/brand/boutique/category-earrings.avif",
    "/brand/boutique/lifestyle-hero.avif",
    "/brand/boutique/product-detail.avif",
    "/brand/boutique/category-necklaces.avif",
    "/brand/boutique/category-rings.avif",
    "/brand/boutique/category-bracelets.avif",
  ],
  necklaces: [
    "/brand/boutique/category-necklaces.avif",
    "/brand/boutique/lifestyle-hero.avif",
    "/brand/boutique/product-detail.avif",
    "/brand/boutique/category-earrings.avif",
    "/brand/boutique/category-rings.avif",
    "/brand/boutique/category-bracelets.avif",
  ],
  rings: [
    "/brand/boutique/category-rings.avif",
    "/brand/boutique/lifestyle-hero.avif",
    "/brand/boutique/product-detail.avif",
    "/brand/boutique/category-necklaces.avif",
    "/brand/boutique/category-earrings.avif",
    "/brand/boutique/category-bracelets.avif",
  ],
};

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
    name: "שירות מרחוק",
    city: "Online",
    address: "Online",
    phone: siteContact.phoneDisplay,
    whatsapp: siteWhatsapp,
    services: ["שירות מרחוק", "מענה טלפוני", "תיאום תיקונים"],
    openingHours: {
      sundayThursday: "10:00-18:00",
      friday: "09:30-13:00",
      saturday: "סגור",
    },
  },
];

const fixtureCategories: CatalogCategory[] = seedCategories.map((category) => ({
  slug: category.slug,
  name: getPublicCategoryName(category.slug, category.name),
  description: category.description,
  image: categoryImages[category.slug] ?? DEFAULT_CATALOG_IMAGE,
  imageUrl: categoryImages[category.slug] ?? DEFAULT_CATALOG_IMAGE,
}));

const fixtureProducts: CatalogProduct[] = [
  ...getSeedProducts().map(mapSeedProduct),
  createFixtureDropshipProduct(),
];

export function shouldUseCatalogFixtures() {
  return (
    process.env.E2E_CATALOG_FIXTURES === "1" ||
    process.env.CATALOG_FIXTURE_FALLBACK === "1" ||
    (isVercelPreview() && !hasDatabaseUrl())
  );
}

export function shouldFallbackToCatalogFixturesOnDatabaseError() {
  return process.env.CATALOG_DB_ERROR_FALLBACK === "1" || isVercelPreview();
}

function isVercelPreview() {
  return process.env.VERCEL === "1" && process.env.VERCEL_ENV === "preview";
}

function hasDatabaseUrl() {
  return Boolean(process.env.DATABASE_URL?.trim());
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
  const images = getFixtureProductImages({
    categorySlug: product.categorySlug,
    primaryImage: product.image,
    slug: product.slug,
  });

  return {
    slug: product.slug,
    sku: product.sku,
    requiresSeparateCheckout: false,
    name: product.name.replace(/\s+\d{3}$/u, ""),
    categorySlug: product.categorySlug,
    categoryName: category
      ? getPublicCategoryName(category.slug, category.name)
      : product.categorySlug,
    shortDescription: product.shortDescription,
    description: product.description,
    availabilityMode: getSeedAvailabilityMode(product.slug),
    commerceHighlights: getSeedCommerceHighlights(product.slug),
    deliveryPromise: "מסירה עד הבית לאחר אישור הפרטים.",
    returnPolicy: "החלפה או החזרה בתיאום אישי לפי מדיניות Elysia.",
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
    tags: product.tags.filter((tag) => tag !== "בדיקות מבחר"),
    inventory,
  };
}

function createFixtureDropshipProduct(): CatalogProduct {
  const category = categoryBySlug.get("rings");
  const images = getProductCatalogImages({
    categorySlug: "rings",
    slug: "elysia-supplier-silver-halo-ring",
  });
  const image = images[0] ?? DEFAULT_CATALOG_IMAGE;
  const variants: CatalogProductVariant[] = [
    {
      sku: "elysia-supplier-silver-halo-ring-6",
      name: "מידה 6",
      size: "6",
      separateCheckoutAvailable: true,
      price: 420,
      inventory: { "online-service": 1 },
      availableQuantity: 1,
      availableBranchCount: 1,
    },
  ];

  return {
    slug: "elysia-supplier-silver-halo-ring",
    sku: "elysia-supplier-silver-halo-ring",
    requiresSeparateCheckout: true,
    name: "טבעת Silver Halo",
    categorySlug: "rings",
    categoryName: category
      ? getPublicCategoryName(category.slug, category.name)
      : "טבעות",
    shortDescription: "טבעת כסף עדינה עם שיבוץ זירקון במראה נקי ורך.",
    description:
      "טבעת Silver Halo משלבת קו כסף דק עם שיבוץ זירקון נקי, ומתאימה לענידה יומיומית או לשילוב עם טבעות נוספות.",
    availabilityMode: "READY_TO_ORDER",
    commerceHighlights: [
      "זמין להזמנה אונליין",
      "פרטי התשלום והמסירה יאושרו בקופה מאובטחת",
    ],
    deliveryPromise: "מסירה עד הבית לאחר אישור פרטי ההזמנה.",
    returnPolicy: "החלפה או החזרה בתיאום אישי לפי מדיניות Elysia.",
    careInstructions: "מומלץ להימנע ממגע עם בושם וחומרי ניקוי.",
    warranty: "אחריות לשנה על פגמי ייצור ושירות ניקוי ראשוני ללא עלות.",
    price: variants[0]?.price ?? 420,
    createdAt: fixtureCreatedAt,
    popularityScore: 0.4,
    material: "כסף 925",
    stone: "זירקון",
    collection: "Signature edit",
    collections: ["Signature edit"],
    image,
    images,
    variants,
    metalColors: ["כסף"],
    sizes: ["6"],
    tags: ["כסף", "זירקון", "פריט נבחר"],
    inventory: { "online-service": 1 },
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

function getFixtureProductImages(input: {
  categorySlug: string;
  primaryImage: string;
  slug: string;
}) {
  const fallbackImages = categoryGalleryImages[input.categorySlug] ?? [
    DEFAULT_CATALOG_IMAGE,
  ];
  const productImages = getProductCatalogImages({
    categorySlug: input.categorySlug,
    slug: input.slug,
  });
  const primaryImage = input.primaryImage.trim()
    ? input.primaryImage
    : (fallbackImages[0] ?? DEFAULT_CATALOG_IMAGE);
  const startIndex = getStableIndex(input.slug, fallbackImages.length);
  const rotatedImages = [
    ...fallbackImages.slice(startIndex),
    ...fallbackImages.slice(0, startIndex),
  ];

  return Array.from(
    new Set([...productImages, primaryImage, ...rotatedImages]),
  ).slice(0, 6);
}

function getSeedCommerceHighlights(slug: string) {
  if (slug === "muse-pearl-earrings") {
    return ["פרטי ההתאמה יאושרו מראש", "הכנה אישית במידה ובגוון"];
  }

  if (slug === "venus-line-ring") {
    return ["שיחת התאמה לפני הזמנה", "אבן שנבחנה בקפידה"];
  }

  return ["פרטים מאומתים לפני הזמנה", "נבדק בקפידה לפני מסירה"];
}

function getUniqueValues(values: string[]) {
  return Array.from(new Set(values));
}

function getStableIndex(value: string, length: number) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return length > 0 ? hash % length : 0;
}
