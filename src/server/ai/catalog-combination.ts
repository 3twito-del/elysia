import {
  PUBLIC_AI_JEWELRY_CATEGORY_VALUES,
  isPublicAiJewelryCategory,
} from "~/lib/ai-jewelry-categories";

type CatalogCandidate = {
  slug: string;
  categorySlug: string;
  price: number;
};

type CatalogCombinationInput = {
  maxPrice?: number;
  limit: number;
};

export function planCatalogSearches(input: {
  category?: string;
  categories?: readonly string[];
  mode?: "single" | "combination";
}) {
  const requested =
    input.categories ?? (input.category ? [input.category] : []);
  const publicCategories = uniquePublicCategories(requested);

  if (publicCategories.length > 0) return publicCategories;
  return input.mode === "combination"
    ? PUBLIC_AI_JEWELRY_CATEGORY_VALUES.slice(0, 3)
    : [];
}

export function selectCatalogCombination<T extends CatalogCandidate>(
  groupedProducts: readonly (readonly T[])[],
  input: CatalogCombinationInput,
) {
  const groups = groupedProducts.map((group) =>
    dedupePublicProducts(group).sort((left, right) => left.price - right.price),
  );
  const selected: T[] = [];
  const selectedSlugs = new Set<string>();
  let total = 0;

  for (const group of groups) {
    const candidate = group.find(
      (product) =>
        !selectedSlugs.has(product.slug) &&
        (!input.maxPrice || total + product.price <= input.maxPrice),
    );

    if (!candidate) continue;
    selected.push(candidate);
    selectedSlugs.add(candidate.slug);
    total += candidate.price;
    if (selected.length === input.limit) break;
  }

  if (selected.length >= 2 || groups.length < 2) return selected;

  return groups
    .map((group) =>
      group.find(
        (product) => !input.maxPrice || product.price <= input.maxPrice,
      ),
    )
    .filter((product): product is T => Boolean(product))
    .slice(0, input.limit);
}

export function selectDiverseCatalogProducts<T extends CatalogCandidate>(
  groupedProducts: readonly (readonly T[])[],
  limit: number,
) {
  const groups = groupedProducts.map(dedupePublicProducts);
  const selected = dedupePublicProducts(
    groups.flatMap((group) => group.slice(0, 1)),
  ).slice(0, limit);

  if (selected.length === limit) return selected;

  const selectedSlugs = new Set(selected.map((product) => product.slug));
  const remaining = dedupePublicProducts(groups.flat()).filter(
    (product) => !selectedSlugs.has(product.slug),
  );

  return [...selected, ...remaining].slice(0, limit);
}

export function dedupePublicProducts<T extends CatalogCandidate>(
  products: readonly T[],
) {
  const slugs = new Set<string>();

  return products.filter((product) => {
    if (
      product.categorySlug === "sets" ||
      slugs.has(product.slug) ||
      !isPublicAiJewelryCategory(product.categorySlug)
    ) {
      return false;
    }

    slugs.add(product.slug);
    return true;
  });
}

function uniquePublicCategories(categories: readonly string[]) {
  return Array.from(new Set(categories)).filter(isPublicAiJewelryCategory);
}
