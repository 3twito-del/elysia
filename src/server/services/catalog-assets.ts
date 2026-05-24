export const DEFAULT_CATALOG_IMAGE = "/brand/v2/commerce-catalog.avif";

const CATALOG_IMAGE_VARIANTS: Record<string, readonly string[]> = {
  rings: [
    "/brand/v2/category-rings.avif",
    "/brand/v2/product-focus.avif",
    "/brand/v2/hero-rings.avif",
  ],
  necklaces: [
    "/brand/v2/category-necklaces.avif",
    "/brand/v2/hero-pearls.avif",
    "/brand/v2/commerce-catalog.avif",
  ],
  earrings: [
    "/brand/v2/category-earrings.avif",
    "/brand/v2/hero-pearls.avif",
    "/brand/v2/service-task.avif",
  ],
  bracelets: [
    "/brand/v2/category-bracelets.avif",
    "/brand/v2/hero-glass.avif",
    "/brand/v2/commerce-gifts.avif",
  ],
};

const CATEGORY_CATALOG_IMAGES: Record<string, string> = {
  bracelets: "/brand/v2/category-bracelets.avif",
  earrings: "/brand/v2/category-earrings.avif",
  necklaces: "/brand/v2/category-necklaces.avif",
  rings: "/brand/v2/category-rings.avif",
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

  const variants = CATALOG_IMAGE_VARIANTS[input.categorySlug];

  if (!variants || variants.length === 0) {
    return input.images.length > 0 ? input.images : [DEFAULT_CATALOG_IMAGE];
  }

  const variant = variants[getStableIndex(input.slug, variants.length)];

  return variant ? [variant] : input.images;
}

function isLegacyCatalogImage(image: string) {
  return image.startsWith("https://images.unsplash.com/");
}

function getStableIndex(value: string, length: number) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash % length;
}
