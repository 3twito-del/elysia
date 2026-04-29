export const CATALOG_CACHE_TAGS = {
  products: "products",
  categories: "categories",
  branches: "branches",
  facets: "catalog:facets",
} as const;

export function productCacheTag(slug: string) {
  return `product:${slug}`;
}

export function categoryCacheTag(slug: string) {
  return `category:${slug}`;
}

export function inventoryCacheTag(branchSlug: string) {
  return `inventory:${branchSlug}`;
}
