import { revalidateTag } from "next/cache";

import {
  CATALOG_CACHE_TAGS,
  categoryCacheTag,
  inventoryCacheTag,
  productCacheTag,
} from "~/server/services/catalog-cache";

export function revalidateCatalogTags(tags: string[]) {
  for (const tag of new Set(tags)) {
    revalidateTag(tag, "max");
  }
}

export function revalidateCatalogMutation(input: {
  productSlugs?: string[];
  categorySlugs?: string[];
  branchSlugs?: string[];
}) {
  revalidateCatalogTags([
    CATALOG_CACHE_TAGS.products,
    CATALOG_CACHE_TAGS.facets,
    ...(input.productSlugs ?? []).map(productCacheTag),
    ...(input.categorySlugs ?? []).map(categoryCacheTag),
    ...(input.branchSlugs ?? []).map(inventoryCacheTag),
  ]);
}
