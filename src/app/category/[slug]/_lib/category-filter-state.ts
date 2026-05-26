import {
  getCategoryFilterCounts,
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
  material?: string | string[];
  stone?: string | string[];
  maxPrice?: string | string[];
  sort?: string | string[];
  page?: string | string[];
};

export type CategorySort = "popular" | "price-asc" | "price-desc" | "newest";

export type CategoryFilters = {
  material?: string;
  stone?: string;
  maxPrice?: number;
  sort: CategorySort;
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

export type CategoryRouteState = {
  activeFilterCount: number;
  activeFilters: ActiveFilter[];
  baseProducts: CatalogProduct[];
  currentSortLabel: string;
  filterCounts: CategoryFilterCounts;
  filteredProducts: CatalogProduct[];
  filters: CategoryFilters;
  resetHref: string;
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
  const filters = parseCategoryFilters(query, {
    materialOptions: facets.materials,
    stoneOptions: facets.stones,
  });
  const baseProducts = filterCatalogProducts(catalogProducts, {
    category: slug,
  });
  const filteredProducts = filterCatalogProducts(catalogProducts, {
    category: slug,
    material: filters.material,
    stone: filters.stone,
    maxPrice: filters.maxPrice,
  });
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
  );
  const resetHref = createCategoryHref(slug, {});
  const currentSortLabel = getCategorySortLabel(filters.sort);
  const sections = getCategoryFilterSections({
    categories,
    categoryCounts,
    filterCounts,
    filters,
    materialOptions: facets.materials,
    slug,
    stoneOptions: facets.stones,
  });

  return {
    activeFilterCount,
    activeFilters,
    baseProducts,
    currentSortLabel,
    filterCounts,
    filteredProducts,
    filters,
    resetHref,
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
  const params = new URLSearchParams();

  if (filters.material) params.set("material", filters.material);
  if (filters.stone) params.set("stone", filters.stone);
  if (filters.maxPrice) params.set("maxPrice", String(filters.maxPrice));
  if (filters.sort !== defaultCategorySort) params.set("sort", filters.sort);
  if (page > 1) params.set("page", String(page));

  const query = params.toString();

  return query ? `/category/${slug}?${query}` : `/category/${slug}`;
}

export function createCategoryFilterQueryString(query: CategorySearchParams) {
  const params = new URLSearchParams();

  for (const key of ["material", "stone", "maxPrice", "sort"] as const) {
    const value = getFirstParam(query[key]);
    if (value) params.set(key, value);
  }

  return params.toString();
}

function getCategoryFilterSections({
  categories,
  categoryCounts,
  filterCounts,
  filters,
  materialOptions,
  slug,
  stoneOptions,
}: {
  categories: CatalogCategory[];
  categoryCounts: Map<string, number>;
  filterCounts: CategoryFilterCounts;
  filters: CategoryFilters;
  materialOptions: string[];
  slug: string;
  stoneOptions: string[];
}): CategoryFilterSection[] {
  const sections = [
    {
      description: "מיון לפי התאמה, מחיר או בחירות חדשות.",
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
      description: "מחיר שמחזיק את הבחירה הנוכחית.",
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
    materialOptions: string[];
    stoneOptions: string[];
  },
): CategoryFilters {
  const material = getFirstParam(searchParams.material);
  const stone = getFirstParam(searchParams.stone);
  const maxPrice = getFirstParam(searchParams.maxPrice);
  const sort = getFirstParam(searchParams.sort);

  return {
    material:
      material && options.materialOptions.includes(material)
        ? material
        : undefined,
    stone: stone && options.stoneOptions.includes(stone) ? stone : undefined,
    maxPrice: getValidMaxPrice(maxPrice),
    sort: getValidCategorySort(sort),
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

function createCategoryHref(slug: string, filters: Partial<CategoryFilters>) {
  const params = new URLSearchParams();

  if (filters.material) params.set("material", filters.material);
  if (filters.stone) params.set("stone", filters.stone);
  if (filters.maxPrice) params.set("maxPrice", String(filters.maxPrice));
  if (filters.sort && filters.sort !== defaultCategorySort) {
    params.set("sort", filters.sort);
  }

  const query = params.toString();

  return query ? `/category/${slug}?${query}` : `/category/${slug}`;
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
    const categoryProducts = filterCatalogProducts(products, {
      category: category.slug,
      material: filters.material,
      maxPrice: filters.maxPrice,
      stone: filters.stone,
    });

    return [category.slug, categoryProducts.length] as const;
  });

  return new Map(entries);
}
