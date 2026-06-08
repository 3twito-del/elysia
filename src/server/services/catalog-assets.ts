export const DEFAULT_CATALOG_IMAGE = "/brand/boutique/lifestyle-hero.avif";

const PRODUCT_CATALOG_IMAGE_COUNT = 16;
const PRODUCT_CATALOG_IMAGE_ORDER = [
  10, 1, 6, 7, 4, 15, 2, 11, 3, 0, 9, 12, 14, 13, 8, 5,
];

const PRODUCT_CATALOG_IMAGE_CATEGORIES = new Set([
  "bracelets",
  "earrings",
  "necklaces",
  "rings",
]);

const CATALOG_IMAGE_VARIANTS: Record<string, readonly string[]> = {
  rings: [
    "/brand/boutique/category-rings.avif",
    "/brand/boutique/lifestyle-hero.avif",
    "/brand/boutique/product-detail.avif",
    "/brand/boutique/category-necklaces.avif",
  ],
  necklaces: [
    "/brand/boutique/category-necklaces.avif",
    "/brand/boutique/lifestyle-hero.avif",
    "/brand/boutique/product-detail.avif",
    "/brand/boutique/category-earrings.avif",
  ],
  earrings: [
    "/brand/boutique/category-earrings.avif",
    "/brand/boutique/lifestyle-hero.avif",
    "/brand/boutique/product-detail.avif",
    "/brand/boutique/category-rings.avif",
  ],
  bracelets: [
    "/brand/boutique/category-bracelets.avif",
    "/brand/boutique/lifestyle-hero.avif",
    "/brand/boutique/product-detail.avif",
    "/brand/boutique/category-rings.avif",
  ],
};

const CATEGORY_CATALOG_IMAGES: Record<string, string> = {
  bracelets: "/brand/boutique/category-bracelets.avif",
  earrings: "/brand/boutique/category-earrings.avif",
  necklaces: "/brand/boutique/category-necklaces.avif",
  rings: "/brand/boutique/category-rings.avif",
};

export function getCatalogCategoryImage(input: {
  categorySlug: string;
  imageUrl?: string | null;
  productImage?: string;
}) {
  return (
    CATEGORY_CATALOG_IMAGES[input.categorySlug] ??
    input.imageUrl ??
    input.productImage ??
    DEFAULT_CATALOG_IMAGE
  );
}

export function getDisplayCatalogImages(input: {
  categorySlug: string;
  images: string[];
  slug: string;
}) {
  const usesLegacyCatalogMedia =
    input.images.length === 0 || input.images.every(isLegacyCatalogImage);

  if (!input.slug.startsWith("test-") && !usesLegacyCatalogMedia) {
    return input.images;
  }

  if (usesLegacyCatalogMedia && hasProductCatalogImages(input.categorySlug)) {
    return getProductCatalogImages({
      categorySlug: input.categorySlug,
      slug: input.slug,
    });
  }

  const variants = CATALOG_IMAGE_VARIANTS[input.categorySlug];

  if (!variants || variants.length === 0) {
    return input.images.length > 0 ? input.images : [DEFAULT_CATALOG_IMAGE];
  }

  const variant = variants[getStableIndex(input.slug, variants.length)];

  return variant ? [variant] : input.images;
}

export function getProductCatalogImages(input: {
  categorySlug: string;
  slug: string;
}) {
  const primaryImageIndex = getStableIndex(
    input.slug,
    PRODUCT_CATALOG_IMAGE_COUNT,
  );
  const productImages = [0, 1].map((offset) =>
    getProductCatalogImageByIndex({
      categorySlug: input.categorySlug,
      imageIndex: getProductCatalogOrderedImageIndex(
        (primaryImageIndex + offset) % PRODUCT_CATALOG_IMAGE_COUNT,
      ),
    }),
  );
  const fallbackImages = CATALOG_IMAGE_VARIANTS[input.categorySlug] ?? [
    DEFAULT_CATALOG_IMAGE,
  ];
  const startIndex = getStableIndex(input.slug, fallbackImages.length);
  const rotatedImages = [
    ...fallbackImages.slice(startIndex),
    ...fallbackImages.slice(0, startIndex),
  ];

  return Array.from(new Set([...productImages, ...rotatedImages])).slice(0, 6);
}

export function getProductCatalogImage(input: {
  categorySlug: string;
  slug: string;
}) {
  if (!hasProductCatalogImages(input.categorySlug))
    return DEFAULT_CATALOG_IMAGE;

  return getProductCatalogImageByIndex({
    categorySlug: input.categorySlug,
    imageIndex: getProductCatalogOrderedImageIndex(
      getStableIndex(input.slug, PRODUCT_CATALOG_IMAGE_COUNT),
    ),
  });
}

function getProductCatalogOrderedImageIndex(imageIndex: number) {
  return PRODUCT_CATALOG_IMAGE_ORDER[imageIndex] ?? imageIndex;
}

function getProductCatalogImageByIndex(input: {
  categorySlug: string;
  imageIndex: number;
}) {
  if (!hasProductCatalogImages(input.categorySlug))
    return DEFAULT_CATALOG_IMAGE;

  const imageNumber = input.imageIndex + 1;
  const paddedImageNumber = imageNumber.toString().padStart(2, "0");

  return `/brand/product-catalog/${input.categorySlug}-${paddedImageNumber}.avif`;
}

function isLegacyCatalogImage(image: string) {
  return (
    image.startsWith("https://images.unsplash.com/") ||
    image.startsWith("/brand/cinematic/") ||
    image.startsWith("/brand/v2/") ||
    image.startsWith("/brand/elysia-aqua") ||
    isBoutiqueCategoryPlaceholderImage(image) ||
    isShopifyCategoryPlaceholderImage(image)
  );
}

function hasProductCatalogImages(categorySlug: string) {
  return PRODUCT_CATALOG_IMAGE_CATEGORIES.has(categorySlug);
}

function isBoutiqueCategoryPlaceholderImage(image: string) {
  return /^\/brand\/boutique\/category-(?:bracelets|earrings|necklaces|rings)\.avif$/i.test(
    image,
  );
}

function isShopifyCategoryPlaceholderImage(image: string) {
  if (!image.startsWith("https://cdn.shopify.com/")) return false;

  return /\/category-(?:bracelets|earrings|necklaces|rings)\.avif(?:\?|$)/i.test(
    image,
  );
}

function getStableIndex(value: string, length: number) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash % length;
}
