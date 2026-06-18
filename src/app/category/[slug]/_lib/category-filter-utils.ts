import type { CatalogProduct } from "~/server/services/catalog";

export type CategoryFilterSelection = {
  collection?: string;
  material?: string;
  maxPrice?: number;
  occasion?: string;
  stone?: string;
  style?: string;
};

export type CategoryFilterDimension = keyof CategoryFilterSelection;

export type CategoryFilterCounts = {
  collections: Map<string, number>;
  materials: Map<string, number>;
  maxPrices: Map<number, number>;
  occasions: Map<string, number>;
  stones: Map<string, number>;
  styles: Map<string, number>;
};

export function getCategoryFilterCounts(
  products: CatalogProduct[],
  filters: CategoryFilterSelection,
  priceOptions: readonly number[],
  options: {
    collectionOptions: readonly string[];
    occasionOptions: readonly string[];
    styleOptions: readonly string[];
  },
): CategoryFilterCounts {
  const collections = new Map<string, number>();
  const materials = new Map<string, number>();
  const maxPrices = new Map<number, number>();
  const occasions = new Map<string, number>();
  const stones = new Map<string, number>();
  const styles = new Map<string, number>();

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

    if (matchesCategoryFilterSelection(product, filters, "maxPrice")) {
      for (const price of priceOptions) {
        if (product.price <= price) {
          incrementCount(maxPrices, price);
        }
      }
    }

    if (matchesCategoryFilterSelection(product, filters, "style")) {
      for (const style of options.styleOptions) {
        if (product.tags.includes(style)) {
          incrementCount(styles, style);
        }
      }
    }

    if (matchesCategoryFilterSelection(product, filters, "occasion")) {
      for (const occasion of options.occasionOptions) {
        if (product.tags.includes(occasion)) {
          incrementCount(occasions, occasion);
        }
      }
    }

    if (matchesCategoryFilterSelection(product, filters, "collection")) {
      for (const collection of options.collectionOptions) {
        if (product.collections.includes(collection)) {
          incrementCount(collections, collection);
        }
      }
    }
  }

  return {
    collections,
    materials,
    maxPrices,
    occasions,
    stones,
    styles,
  };
}

export function matchesCategoryFilterSelection(
  product: CatalogProduct,
  filters: CategoryFilterSelection,
  omittedDimension?: CategoryFilterDimension,
) {
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

  if (
    omittedDimension !== "style" &&
    filters.style &&
    !product.tags.includes(filters.style)
  ) {
    return false;
  }

  if (
    omittedDimension !== "occasion" &&
    filters.occasion &&
    !product.tags.includes(filters.occasion)
  ) {
    return false;
  }

  if (
    omittedDimension !== "collection" &&
    filters.collection &&
    !product.collections.includes(filters.collection)
  ) {
    return false;
  }

  return true;
}

function incrementCount<Key>(counts: Map<Key, number>, key: Key) {
  counts.set(key, (counts.get(key) ?? 0) + 1);
}
