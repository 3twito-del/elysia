type PublicCatalogItem = {
  categorySlug: string;
};

const hiddenPublicCategorySlugs = new Set(["sets"]);

export function isPublicCatalogCategory(slug: string) {
  return !hiddenPublicCategorySlugs.has(slug.trim().toLowerCase());
}

export function filterPublicCatalogItems<T extends PublicCatalogItem>(
  items: readonly T[],
) {
  return items.filter((item) => isPublicCatalogCategory(item.categorySlug));
}
