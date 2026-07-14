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
  sets: "/brand/boutique/product-detail.avif",
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
  sets: [
    "/brand/boutique/product-detail.avif",
    "/brand/boutique/category-necklaces.avif",
    "/brand/boutique/category-earrings.avif",
    "/brand/boutique/category-bracelets.avif",
    "/brand/boutique/category-rings.avif",
    "/brand/boutique/lifestyle-hero.avif",
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
  createFixtureHeraBraceletProduct(),
  createFixtureVenusLineRingProduct(),
  createFixtureMusePearlEarringsProduct(),
];

export function shouldUseCatalogFixtures() {
  return (
    process.env.E2E_CATALOG_FIXTURES === "1" ||
    process.env.CATALOG_FIXTURE_FALLBACK === "1" ||
    (isVercelPreview() && !hasDatabaseUrl())
  );
}

export function shouldFallbackToCatalogFixturesOnDatabaseError() {
  return (
    process.env.CATALOG_DB_ERROR_FALLBACK === "1" ||
    isVercelPreview() ||
    isProductionBuildPhase()
  );
}

function isVercelPreview() {
  return process.env.VERCEL === "1" && process.env.VERCEL_ENV === "preview";
}

// During `next build` prerendering, a transient database outage (e.g. P1002
// connection timeout) should degrade to seed fixtures instead of failing the
// whole build. Runtime request handling stays strict. ISR revalidation
// refreshes pages from the live database once it is reachable again.
function isProductionBuildPhase() {
  return process.env.NEXT_PHASE === "phase-production-build";
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
  const images =
    product.images.length > 0
      ? product.images
      : getFixtureProductImages({
          categorySlug: product.categorySlug,
          primaryImage: product.image,
          slug: product.slug,
        });

  return {
    slug: product.slug,
    sku: product.sku,
    requiresSeparateCheckout: false,
    name: product.name,
    categorySlug: product.categorySlug,
    categoryName: category
      ? getPublicCategoryName(category.slug, category.name)
      : product.categorySlug,
    shortDescription: product.shortDescription,
    description: product.description,
    availabilityMode: getSeedAvailabilityMode(product.slug),
    commerceHighlights: getSeedCommerceHighlights(product.slug),
    deliveryPromise: "משלוח עד הבית לאחר השלמת התשלום.",
    returnPolicy: "החלפה או החזרה בתיאום אישי לפי מדיניות Elysia.",
    careInstructions: "מומלץ להימנע ממגע עם בושם, כלור וחומרי ניקוי.",
    warranty: "אחריות 12 חודשים על פגמי ייצור ושירות ניקוי ראשוני ללא עלות.",
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
      "פרטי התשלום והמשלוח יוצגו בקופה מאובטחת",
    ],
    deliveryPromise: "משלוח עד הבית לאחר השלמת פרטי ההזמנה.",
    returnPolicy: "החלפה או החזרה בתיאום אישי לפי מדיניות Elysia.",
    careInstructions: "מומלץ להימנע ממגע עם בושם וחומרי ניקוי.",
    warranty: "אחריות 12 חודשים על פגמי ייצור ושירות ניקוי ראשוני ללא עלות.",
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

// These three friendly-slugged products (hera-bracelet, venus-line-ring,
// muse-pearl-earrings) are referenced by slug/name throughout the app —
// the static "recommended" fallback in checkout
// (`cart-checkout-form.tsx`), the customer-auth e2e fixture, and the
// availability-mode special cases below (`getSeedAvailabilityMode` /
// `getSeedCommerceHighlights`) — but are not part of the generated
// `getSeedProducts()` supplier catalog, so they 404 under
// `E2E_CATALOG_FIXTURES=1` (docs/QA_EVIDENCE.md → l-02, l-04). Defining them
// here, alongside the dropship fixture product, keeps every existing
// reference resolvable without touching call sites. `popularityScore` is
// kept below the generated products' fixed `1` so they never displace the
// first card in a default-sorted category grid (relied on by
// `resolveOwnCatalogProductSlug` in the e2e suite).
function createFixtureHeraBraceletProduct(): CatalogProduct {
  const slug = "hera-bracelet";
  const category = categoryBySlug.get("bracelets");
  const images = getProductCatalogImages({ categorySlug: "bracelets", slug });
  const variants: CatalogProductVariant[] = [
    {
      sku: `${slug}-s`,
      name: "מידה S",
      size: "S",
      metalColor: "זהב",
      separateCheckoutAvailable: false,
      price: 840,
      inventory: { "online-service": 4 },
      availableQuantity: 4,
      availableBranchCount: 1,
    },
    {
      sku: `${slug}-m`,
      name: "מידה M",
      size: "M",
      metalColor: "זהב",
      separateCheckoutAvailable: false,
      price: 840,
      inventory: { "online-service": 5 },
      availableQuantity: 5,
      availableBranchCount: 1,
    },
  ];

  return {
    slug,
    sku: slug,
    requiresSeparateCheckout: false,
    name: "צמיד Hera",
    categorySlug: "bracelets",
    categoryName: category
      ? getPublicCategoryName(category.slug, category.name)
      : "צמידים",
    shortDescription: "צמיד עדין בציפוי זהב, מתאים לענידה יומיומית.",
    description:
      "צמיד Hera משלב שרשרת עדינה בציפוי זהב על כסף 925 עם סגירה בטוחה, ומתאים לענידה יומיומית או לשילוב עם צמידים נוספים.",
    availabilityMode: getSeedAvailabilityMode(slug),
    commerceHighlights: getSeedCommerceHighlights(slug),
    deliveryPromise: "משלוח עד הבית לאחר השלמת התשלום.",
    returnPolicy: "החלפה או החזרה בתיאום אישי לפי מדיניות Elysia.",
    careInstructions: "מומלץ להימנע ממגע עם בושם, כלור וחומרי ניקוי.",
    warranty: "אחריות 12 חודשים על פגמי ייצור ושירות ניקוי ראשוני ללא עלות.",
    price: variants[0]?.price ?? 840,
    createdAt: fixtureCreatedAt,
    popularityScore: 0.5,
    material: "ציפוי זהב על כסף 925",
    collection: "Everyday Luxury",
    collections: ["Everyday Luxury"],
    image: images[0] ?? DEFAULT_CATALOG_IMAGE,
    images,
    variants,
    metalColors: ["זהב"],
    sizes: ["S", "M"],
    tags: ["ציפוי זהב", "נמכר ביותר"],
    inventory: { "online-service": 9 },
  };
}

function createFixtureVenusLineRingProduct(): CatalogProduct {
  const slug = "venus-line-ring";
  const category = categoryBySlug.get("rings");
  const images = getProductCatalogImages({ categorySlug: "rings", slug });
  const sizes = ["52", "54", "56"];
  const variants: CatalogProductVariant[] = sizes.map((size, index) => ({
    sku: `${slug}-${size}`,
    name: `מידה ${size}`,
    size,
    metalColor: "זהב",
    stoneColor: "יהלום",
    separateCheckoutAvailable: false,
    price: 1290,
    inventory: { "online-service": 2 + index },
    availableQuantity: 2 + index,
    availableBranchCount: 1,
  }));

  return {
    slug,
    sku: slug,
    requiresSeparateCheckout: false,
    name: "טבעת Venus Line",
    categorySlug: "rings",
    categoryName: category
      ? getPublicCategoryName(category.slug, category.name)
      : "טבעות",
    shortDescription: "טבעת זהב עם יהלום מרכזי, לאירוסין ולאירועים מיוחדים.",
    description:
      "טבעת Venus Line משלבת קו זהב נקי עם יהלום שנבחר בקפידה, ומחייבת שיחת התאמה אישית לפני ההזמנה.",
    availabilityMode: getSeedAvailabilityMode(slug),
    commerceHighlights: getSeedCommerceHighlights(slug),
    deliveryPromise: "משלוח עד הבית לאחר אישור ההתאמה.",
    returnPolicy: "החלפה או החזרה בתיאום אישי לפי מדיניות Elysia.",
    careInstructions: "מומלץ להימנע ממגע עם בושם וחומרי ניקוי.",
    warranty: "אחריות 12 חודשים על פגמי ייצור ושירות ניקוי ראשוני ללא עלות.",
    price: variants[0]?.price ?? 1290,
    createdAt: fixtureCreatedAt,
    popularityScore: 0.5,
    material: "זהב ויהלום",
    stone: "יהלום",
    collection: "Timeless",
    collections: ["Timeless"],
    image: images[0] ?? DEFAULT_CATALOG_IMAGE,
    images,
    variants,
    metalColors: ["זהב"],
    sizes,
    tags: ["זהב", "יהלום", "חדש"],
    inventory: { "online-service": 9 },
  };
}

function createFixtureMusePearlEarringsProduct(): CatalogProduct {
  const slug = "muse-pearl-earrings";
  const category = categoryBySlug.get("earrings");
  const images = getProductCatalogImages({ categorySlug: "earrings", slug });
  const variants: CatalogProductVariant[] = [
    {
      sku: `${slug}-pair`,
      name: "זוג",
      metalColor: "זהב",
      stoneColor: "פנינה",
      separateCheckoutAvailable: false,
      price: 690,
      inventory: { "online-service": 0 },
      availableQuantity: 0,
      availableBranchCount: 0,
    },
  ];

  return {
    slug,
    sku: slug,
    requiresSeparateCheckout: false,
    name: "עגילי Muse Pearl",
    categorySlug: "earrings",
    categoryName: category
      ? getPublicCategoryName(category.slug, category.name)
      : "עגילים",
    shortDescription: "עגילי פנינה בציפוי זהב, מוכנים בהתאמה אישית.",
    description:
      "עגילי Muse Pearl משלבים פנינה טבעית עם ציפוי זהב על כסף 925, ומוכנים בהזמנה אישית לפי מידה וגוון.",
    availabilityMode: getSeedAvailabilityMode(slug),
    commerceHighlights: getSeedCommerceHighlights(slug),
    deliveryPromise: "משלוח עד הבית לאחר אישור ההכנה האישית.",
    returnPolicy: "החלפה או החזרה בתיאום אישי לפי מדיניות Elysia.",
    careInstructions: "מומלץ להימנע ממגע עם בושם, כלור וחומרי ניקוי.",
    warranty: "אחריות 12 חודשים על פגמי ייצור ושירות ניקוי ראשוני ללא עלות.",
    price: variants[0]?.price ?? 690,
    createdAt: fixtureCreatedAt,
    popularityScore: 0.5,
    material: "ציפוי זהב על כסף 925",
    stone: "פנינה",
    collection: "Pearls",
    collections: ["Pearls"],
    image: images[0] ?? DEFAULT_CATALOG_IMAGE,
    images,
    variants,
    metalColors: ["זהב"],
    sizes: [],
    tags: ["פנינה", "מתנה", "הזמנה אישית"],
    inventory: { "online-service": 0 },
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
