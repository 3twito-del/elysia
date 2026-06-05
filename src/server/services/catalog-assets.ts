export const DEFAULT_CATALOG_IMAGE = "/brand/boutique/lifestyle-hero.avif";

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

  if (input.images.length > 0 && usesLegacyCatalogMedia) {
    const categoryImage = CATEGORY_CATALOG_IMAGES[input.categorySlug];

    if (categoryImage) return [categoryImage];
  }

  const variants = CATALOG_IMAGE_VARIANTS[input.categorySlug];

  if (!variants || variants.length === 0) {
    return input.images.length > 0 ? input.images : [DEFAULT_CATALOG_IMAGE];
  }

  const variant = variants[getStableIndex(input.slug, variants.length)];

  return variant ? [variant] : input.images;
}

function isLegacyCatalogImage(image: string) {
  return (
    image.startsWith("https://images.unsplash.com/") ||
    image.startsWith("/brand/cinematic/") ||
    image.startsWith("/brand/v2/") ||
    image.startsWith("/brand/elysia-aqua") ||
    isShopifyCategoryPlaceholderImage(image)
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
