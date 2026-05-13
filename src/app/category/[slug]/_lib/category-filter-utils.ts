import type { CatalogProduct } from "~/server/services/catalog";

export type CategoryFilterSelection = {
  branch?: string;
  material?: string;
  maxPrice?: number;
  stone?: string;
};

export type CategoryFilterDimension = keyof CategoryFilterSelection;

export type CategoryFilterCounts = {
  branches: Map<string, number>;
  materials: Map<string, number>;
  maxPrices: Map<number, number>;
  stones: Map<string, number>;
};

export function getCategoryFilterCounts(
  products: CatalogProduct[],
  filters: CategoryFilterSelection,
  priceOptions: readonly number[],
): CategoryFilterCounts {
  const branches = new Map<string, number>();
  const materials = new Map<string, number>();
  const maxPrices = new Map<number, number>();
  const stones = new Map<string, number>();

  for (const price of priceOptions) {
    maxPrices.set(price, 0);
  }

  for (const product of products) {
    if (matchesCategoryFilterSelection(product, filters, "material")) {
      incrementCount(materials, product.material);
    }

    if (
      product.stone &&
      matchesCategoryFilterSelection(product, filters, "stone")
    ) {
      incrementCount(stones, product.stone);
    }

    if (matchesCategoryFilterSelection(product, filters, "branch")) {
      for (const [branchSlug, quantity] of Object.entries(product.inventory)) {
        if (quantity > 0) {
          incrementCount(branches, branchSlug);
        }
      }
    }

    if (matchesCategoryFilterSelection(product, filters, "maxPrice")) {
      for (const price of priceOptions) {
        if (product.price <= price) {
          incrementCount(maxPrices, price);
        }
      }
    }
  }

  return {
    branches,
    materials,
    maxPrices,
    stones,
  };
}

export function matchesCategoryFilterSelection(
  product: CatalogProduct,
  filters: CategoryFilterSelection,
  omittedDimension?: CategoryFilterDimension,
) {
  if (
    omittedDimension !== "branch" &&
    filters.branch &&
    (product.inventory[filters.branch] ?? 0) <= 0
  ) {
    return false;
  }

  if (
    omittedDimension !== "material" &&
    filters.material &&
    product.material !== filters.material
  ) {
    return false;
  }

  if (
    omittedDimension !== "stone" &&
    filters.stone &&
    product.stone !== filters.stone
  ) {
    return false;
  }

  if (
    omittedDimension !== "maxPrice" &&
    filters.maxPrice &&
    product.price > filters.maxPrice
  ) {
    return false;
  }

  return true;
}

function incrementCount<Key>(counts: Map<Key, number>, key: Key) {
  counts.set(key, (counts.get(key) ?? 0) + 1);
}
