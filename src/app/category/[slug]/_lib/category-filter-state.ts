import {
  getCategoryFilterCounts,
  matchesCategoryFilterSelection,
  type CategoryFilterCounts,
} from "./category-filter-utils";
import { formatPrice } from "~/lib/format";
import {
  filterCatalogProducts,
  type CatalogCategory,
  type CatalogFacets,
  type CatalogProduct,
} from "~/server/services/catalog";

export type CategorySearchParams = {
  collection?: string | string[];
  material?: string | string[];
  maxPrice?: string | string[];
  occasion?: string | string[];
  page?: string | string[];
  sort?: string | string[];
  stone?: string | string[];
  style?: string | string[];
};

export type CategorySort = "popular" | "price-asc" | "price-desc" | "newest";

export type CategoryFilters = {
  collection?: string;
  material?: string;
  maxPrice?: number;
  occasion?: string;
  sort: CategorySort;
  stone?: string;
  style?: string;
};

export type ActiveFilter = {
  key: keyof CategoryFilters;
  label: string;
  href: string;
};

export type CategoryFilterOption = {
  active?: boolean;
  disabled?: boolean;
  href: string;
  icon?: "pin";
  label: string;
  meta?: string;
};

export type CategoryFilterSection = {
  description: string;
  options: CategoryFilterOption[];
  title: string;
};

export type CategoryFilterPayload = {
  activeFilterCount: number;
  activeFilters: ActiveFilter[];
  resetHref: string;
  sections: CategoryFilterSection[];
};

export type CategoryNoResultRecoveryAction = {
  description: string;
  href: string;
  label: string;
  total: number;
};

export type CategoryRouteState = {
  activeFilterCount: number;
  activeFilters: ActiveFilter[];
  baseProducts: CatalogProduct[];
  currentSortLabel: string;
  filterCounts: CategoryFilterCounts;
  filteredProducts: CatalogProduct[];
  filters: CategoryFilters;
  noResultRecoveryActions: CategoryNoResultRecoveryAction[];
  resetHref: string;
  searchRecoveryHref: string;
  sections: CategoryFilterSection[];
};

export const productsPerPage = 6;
export const priceOptions = [750, 1000, 1500] as const;
export const defaultCategorySort = "popular" satisfies CategorySort;
export const sortOptions = [
  { value: "popular", label: "מומלצים" },
  { value: "price-asc", label: "מחיר: נמוך לגבוה" },
  { value: "price-desc", label: "מחיר: גבוה לנמוך" },
  { value: "newest", label: "חדשים" },
] as const satisfies ReadonlyArray<{ value: CategorySort; label: string }>;

const styleOptions = [
  "עדין",
  "נקי",
  "קלאסי",
  "מודרני",
  "מינימלי",
  "אלגנטי",
  "מאופק",
  "רך",
  "קו נקי",
  "טבעי",
] as const;

const occasionOptions = [
  "יום יום",
  "יומיומי",
  "ערב",
  "אירוע",
  "מתנה",
  "אירוסין",
  "חגיגי",
] as const;

export function getCategoryRouteState({
  catalogProducts,
  categories,
  facets,
  query,
  slug,
}: {
  catalogProducts: CatalogProduct[];
  categories: CatalogCategory[];
  facets: CatalogFacets;
  query: CategorySearchParams;
  slug: string;
}): CategoryRouteState {
  const baseProducts = filterCatalogProducts(catalogProducts, {
    category: slug,
  });
  const collectionOptions = getCategoryCollectionOptions(baseProducts, facets);
  const filters = parseCategoryFilters(query, {
    collectionOptions,
    materialOptions: facets.materials,
    occasionOptions,
    stoneOptions: facets.stones,
    styleOptions,
  });
  const filteredProducts = baseProducts.filter((product) =>
    matchesCategoryFilterSelection(product, filters),
  );
  const categoryCounts = getCategoryCounts(
    categories,
    filters,
    catalogProducts,
  );
  const activeFilters = getActiveFilters(slug, filters);
  const activeFilterCount = activeFilters.length;
  const filterCounts = getCategoryFilterCounts(
    baseProducts,
    filters,
    priceOptions,
    {
      collectionOptions,
      occasionOptions,
      styleOptions,
    },
  );
  const resetHref = createCategoryHref(slug, {});
  const currentSortLabel = getCategorySortLabel(filters.sort);
  const sections = getCategoryFilterSections({
    categories,
    categoryCounts,
    collectionOptions,
    filterCounts,
    filters,
    materialOptions: facets.materials,
    slug,
    stoneOptions: facets.stones,
  });
  const noResultRecoveryActions = getCategoryNoResultRecoveryActions({
    categories,
    categoryCounts,
    filters,
    slug,
  });
  const searchRecoveryHref = createCategorySearchRecoveryHref(filters);

  return {
    activeFilterCount,
    activeFilters,
    baseProducts,
    currentSortLabel,
    filterCounts,
    filteredProducts,
    filters,
    noResultRecoveryActions,
    resetHref,
    searchRecoveryHref,
    sections,
  };
}

export function toCategoryFilterPayload(
  state: CategoryRouteState,
): CategoryFilterPayload {
  return {
    activeFilterCount: state.activeFilterCount,
    activeFilters: state.activeFilters,
    resetHref: state.resetHref,
    sections: state.sections,
  };
}

export function getFirstParam(value?: string | string[]) {
  if (Array.isArray(value)) return value[0];

  return value;
}

export function getValidPage(value?: string) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) return 1;

  return parsed;
}

export function sortCategoryProducts(
  products: CatalogProduct[],
  sort: CategorySort,
) {
  const sorted = [...products];

  if (sort === "price-asc") {
    return sorted.sort(
      (first, second) =>
        first.price - second.price ||
        getProductCreatedAtTime(second) - getProductCreatedAtTime(first),
    );
  }

  if (sort === "price-desc") {
    return sorted.sort(
      (first, second) =>
        second.price - first.price ||
        getProductCreatedAtTime(second) - getProductCreatedAtTime(first),
    );
  }

  if (sort === "newest") {
    return sorted.sort(
      (first, second) =>
        getProductCreatedAtTime(second) - getProductCreatedAtTime(first),
    );
  }

  return sorted.sort(
    (first, second) =>
      (second.popularityScore ?? 0) - (first.popularityScore ?? 0) ||
      getProductCreatedAtTime(second) - getProductCreatedAtTime(first),
  );
}

export function createCategoryPageHref(
  slug: string,
  filters: CategoryFilters,
  page: number,
) {
  const params = getCategoryUrlParams(filters);

  if (page > 1) params.set("page", String(page));

  const query = params.toString();

  return query ? `/category/${slug}?${query}` : `/category/${slug}`;
}

export function createCategoryFilterQueryString(query: CategorySearchParams) {
  const params = new URLSearchParams();

  for (const key of [
    "material",
    "stone",
    "maxPrice",
    "style",
    "occasion",
    "collection",
    "sort",
  ] as const) {
    const value = getFirstParam(query[key]);
    if (value) params.set(key, value);
  }

  return params.toString();
}

function getCategoryFilterSections({
  categories,
  categoryCounts,
  collectionOptions,
  filterCounts,
  filters,
  materialOptions,
  slug,
  stoneOptions,
}: {
  categories: CatalogCategory[];
  categoryCounts: Map<string, number>;
  collectionOptions: string[];
  filterCounts: CategoryFilterCounts;
  filters: CategoryFilters;
  materialOptions: string[];
  slug: string;
  stoneOptions: string[];
}): CategoryFilterSection[] {
  const sections = [
    {
      description: "מיון לפי המלצה, מחיר או פריטים חדשים.",
      title: "מיון",
      options: sortOptions.map((option) => {
        const active = filters.sort === option.value;

        return {
          active,
          href: active
            ? createCategoryHref(slug, filters)
            : createCategoryHref(slug, {
                ...filters,
                sort: option.value,
              }),
          label: option.label,
        };
      }),
    },
    {
      description: "בחירה לפי קטגוריית תכשיט.",
      title: "קטגוריה",
      options: categories.map((item) => {
        const active = item.slug === slug;
        const count = categoryCounts.get(item.slug) ?? 0;

        return {
          active,
          disabled: !active && count === 0,
          href: createCategoryHref(item.slug, filters),
          label: item.name,
        };
      }),
    },
    {
      description: "בחירה לפי מתכת וגוון.",
      title: "חומר",
      options: materialOptions.map((material) => {
        const active = filters.material === material;
        const count = filterCounts.materials.get(material) ?? 0;

        return {
          active,
          disabled: !active && count === 0,
          href: createCategoryHref(slug, {
            ...filters,
            material: active ? undefined : material,
          }),
          label: material,
        };
      }),
    },
    {
      description: "בחירה לפי אבן.",
      title: "אבן",
      options: stoneOptions.map((stone) => {
        const active = filters.stone === stone;
        const count = filterCounts.stones.get(stone) ?? 0;

        return {
          active,
          disabled: !active && count === 0,
          href: createCategoryHref(slug, {
            ...filters,
            stone: active ? undefined : stone,
          }),
          label: stone,
        };
      }),
    },
    {
      description: "בחירה לפי טווח מחיר.",
      title: "מחיר",
      options: priceOptions.map((price) => {
        const active = filters.maxPrice === price;
        const count = filterCounts.maxPrices.get(price) ?? 0;

        return {
          active,
          disabled: !active && count === 0,
          href: createCategoryHref(slug, {
            ...filters,
            maxPrice: active ? undefined : price,
          }),
          label: `עד ${formatPrice(price)}`,
        };
      }),
    },
    {
      description: "קו עיצובי שמכוון את הבחירה.",
      title: "סגנון",
      options: styleOptions.map((style) => {
        const active = filters.style === style;
        const count = filterCounts.styles.get(style) ?? 0;

        return {
          active,
          disabled: !active && count === 0,
          href: createCategoryHref(slug, {
            ...filters,
            style: active ? undefined : style,
          }),
          label: style,
        };
      }),
    },
    {
      description: "בחירה לפי רגע, מתנה או שימוש.",
      title: "אירוע",
      options: occasionOptions.map((occasion) => {
        const active = filters.occasion === occasion;
        const count = filterCounts.occasions.get(occasion) ?? 0;

        return {
          active,
          disabled: !active && count === 0,
          href: createCategoryHref(slug, {
            ...filters,
            occasion: active ? undefined : occasion,
          }),
          label: occasion,
        };
      }),
    },
    {
      description: "בחירה מתוך עריכה קיימת של הקולקציה.",
      title: "קולקציה",
      options: collectionOptions.map((collection) => {
        const active = filters.collection === collection;
        const count = filterCounts.collections.get(collection) ?? 0;

        return {
          active,
          disabled: !active && count === 0,
          href: createCategoryHref(slug, {
            ...filters,
            collection: active ? undefined : collection,
          }),
          label: collection,
        };
      }),
    },
  ] satisfies CategoryFilterSection[];

  return sections
    .map((section) => ({
      ...section,
      options: section.options.filter(isVisibleFilterOption),
    }))
    .filter((section) => section.options.length > 0);
}

function isVisibleFilterOption(option: CategoryFilterOption) {
  if (option.active) return true;

  return option.disabled !== true;
}

function parseCategoryFilters(
  searchParams: CategorySearchParams,
  options: {
    collectionOptions: readonly string[];
    materialOptions: readonly string[];
    occasionOptions: readonly string[];
    stoneOptions: readonly string[];
    styleOptions: readonly string[];
  },
): CategoryFilters {
  const collection = getFirstParam(searchParams.collection);
  const material = getFirstParam(searchParams.material);
  const maxPrice = getFirstParam(searchParams.maxPrice);
  const occasion = getFirstParam(searchParams.occasion);
  const sort = getFirstParam(searchParams.sort);
  const stone = getFirstParam(searchParams.stone);
  const style = getFirstParam(searchParams.style);

  return {
    collection:
      collection && options.collectionOptions.includes(collection)
        ? collection
        : undefined,
    material:
      material && options.materialOptions.includes(material)
        ? material
        : undefined,
    maxPrice: getValidMaxPrice(maxPrice),
    occasion:
      occasion && options.occasionOptions.includes(occasion)
        ? occasion
        : undefined,
    sort: getValidCategorySort(sort),
    stone: stone && options.stoneOptions.includes(stone) ? stone : undefined,
    style: style && options.styleOptions.includes(style) ? style : undefined,
  };
}

function getActiveFilters(slug: string, filters: CategoryFilters) {
  const activeFilters: ActiveFilter[] = [];

  if (filters.material) {
    activeFilters.push({
      key: "material",
      label: `חומר: ${filters.material}`,
      href: createCategoryHref(slug, { ...filters, material: undefined }),
    });
  }

  if (filters.stone) {
    activeFilters.push({
      key: "stone",
      label: `אבן: ${filters.stone}`,
      href: createCategoryHref(slug, { ...filters, stone: undefined }),
    });
  }

  if (filters.maxPrice) {
    activeFilters.push({
      key: "maxPrice",
      label: `עד ${formatPrice(filters.maxPrice)}`,
      href: createCategoryHref(slug, { ...filters, maxPrice: undefined }),
    });
  }

  if (filters.style) {
    activeFilters.push({
      key: "style",
      label: `סגנון: ${filters.style}`,
      href: createCategoryHref(slug, { ...filters, style: undefined }),
    });
  }

  if (filters.occasion) {
    activeFilters.push({
      key: "occasion",
      label: `אירוע: ${filters.occasion}`,
      href: createCategoryHref(slug, { ...filters, occasion: undefined }),
    });
  }

  if (filters.collection) {
    activeFilters.push({
      key: "collection",
      label: `קולקציה: ${filters.collection}`,
      href: createCategoryHref(slug, { ...filters, collection: undefined }),
    });
  }

  if (filters.sort !== defaultCategorySort) {
    activeFilters.push({
      key: "sort",
      label: `מיון: ${getCategorySortLabel(filters.sort)}`,
      href: createCategoryHref(slug, {
        ...filters,
        sort: defaultCategorySort,
      }),
    });
  }

  return activeFilters;
}

function getCategoryNoResultRecoveryActions({
  categories,
  categoryCounts,
  filters,
  slug,
}: {
  categories: CatalogCategory[];
  categoryCounts: Map<string, number>;
  filters: CategoryFilters;
  slug: string;
}) {
  return categories
    .filter((category) => category.slug !== slug)
    .map((category) => ({
      category,
      total: categoryCounts.get(category.slug) ?? 0,
    }))
    .filter(({ total }) => total > 0)
    .slice(0, 2)
    .map(({ category, total }) => ({
      description: formatCategoryRecoveryDescription(total),
      href: createCategoryHref(category.slug, filters),
      label: category.name,
      total,
    }));
}

function formatCategoryRecoveryDescription(total: number) {
  return total === 1
    ? "פריט אחד מתאים לבחירה הפעילה בקטגוריה הזו"
    : `${total} פריטים מתאימים לבחירה הפעילה בקטגוריה הזו`;
}

function createCategoryHref(slug: string, filters: Partial<CategoryFilters>) {
  const params = getCategoryUrlParams(filters);
  const query = params.toString();

  return query ? `/category/${slug}?${query}` : `/category/${slug}`;
}

function createCategorySearchRecoveryHref(filters: CategoryFilters) {
  const params = new URLSearchParams();

  if (filters.material) params.set("material", filters.material);
  if (filters.stone) params.set("stone", filters.stone);
  if (filters.maxPrice) params.set("maxPrice", String(filters.maxPrice));
  if (filters.collection) params.set("collection", filters.collection);
  if (filters.sort !== defaultCategorySort) params.set("sort", filters.sort);

  const query = params.toString();

  return query ? `/search?${query}` : "/search";
}

function getCategoryUrlParams(filters: Partial<CategoryFilters>) {
  const params = new URLSearchParams();

  if (filters.material) params.set("material", filters.material);
  if (filters.stone) params.set("stone", filters.stone);
  if (filters.maxPrice) params.set("maxPrice", String(filters.maxPrice));
  if (filters.style) params.set("style", filters.style);
  if (filters.occasion) params.set("occasion", filters.occasion);
  if (filters.collection) params.set("collection", filters.collection);
  if (filters.sort && filters.sort !== defaultCategorySort) {
    params.set("sort", filters.sort);
  }

  return params;
}

function getValidMaxPrice(value?: string) {
  const parsed = Number(value);

  return priceOptions.find((price) => price === parsed);
}

function getValidCategorySort(value?: string): CategorySort {
  return sortOptions.some((option) => option.value === value)
    ? (value as CategorySort)
    : defaultCategorySort;
}

function getCategorySortLabel(sort: CategorySort) {
  return (
    sortOptions.find((option) => option.value === sort)?.label ??
    sortOptions[0].label
  );
}

function getProductCreatedAtTime(product: CatalogProduct) {
  if (product.createdAt instanceof Date) return product.createdAt.getTime();
  if (typeof product.createdAt === "string") {
    const parsed = Date.parse(product.createdAt);

    return Number.isNaN(parsed) ? 0 : parsed;
  }

  return 0;
}

function getCategoryCounts(
  categories: CatalogCategory[],
  filters: CategoryFilters,
  products: CatalogProduct[],
) {
  const entries = categories.map((category) => {
    const categoryProducts = products
      .filter((product) => product.categorySlug === category.slug)
      .filter((product) => matchesCategoryFilterSelection(product, filters));

    return [category.slug, categoryProducts.length] as const;
  });

  return new Map(entries);
}

function getCategoryCollectionOptions(
  products: CatalogProduct[],
  facets: CatalogFacets,
) {
  const values = new Set<string>();

  for (const product of products) {
    for (const collection of product.collections) {
      values.add(collection);
    }
  }

  for (const collection of facets.collections) {
    if (values.has(collection)) continue;
    if (products.some((product) => product.collections.includes(collection))) {
      values.add(collection);
    }
  }

  return Array.from(values);
}
