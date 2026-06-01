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

export function getCatalogMutationRevalidationTags(input: {
  productSlugs?: string[];
  categorySlugs?: string[];
  branchSlugs?: string[];
}) {
  return [
    CATALOG_CACHE_TAGS.products,
    CATALOG_CACHE_TAGS.facets,
    ...(input.categorySlugs?.length ? [CATALOG_CACHE_TAGS.categories] : []),
    ...(input.branchSlugs?.length ? [CATALOG_CACHE_TAGS.branches] : []),
    ...(input.productSlugs ?? []).map(productCacheTag),
    ...(input.categorySlugs ?? []).map(categoryCacheTag),
    ...(input.branchSlugs ?? []).map(inventoryCacheTag),
  ];
}

export function revalidateCatalogMutation(input: {
  productSlugs?: string[];
  categorySlugs?: string[];
  branchSlugs?: string[];
}) {
  revalidateCatalogTags(getCatalogMutationRevalidationTags(input));
}
