import { resolveAiCatalogSearchIntent } from "~/lib/ai-catalog-intent";
import {
  DEFAULT_SEARCH_PER_PAGE,
  type ProductSearchInput,
} from "~/server/adapters/search";
import type { CatalogCategory, CatalogFacets } from "~/server/services/catalog";

export type SearchParams = {
  q?: string;
  category?: string;
  material?: string;
  stone?: string;
  collection?: string;
  maxPrice?: string;
  availableOnly?: string;
  mode?: string;
  page?: string;
  sort?: string;
  view?: string;
};

export type SearchViewMode = "grid" | "list";

export type SearchHrefInput = ProductSearchInput & {
  view?: SearchViewMode;
};

export function normalizeSearchInput(
  params: SearchParams,
  options: {
    categories: CatalogCategory[];
    facets: CatalogFacets;
  },
): ProductSearchInput {
  const rawQuery = normalizeTextParam(params.q);
  const intent = rawQuery
    ? resolveAiCatalogSearchIntent({ query: rawQuery })
    : undefined;
  const explicitMaxPrice = normalizeMaxPrice(params.maxPrice);
  const maxPrice = explicitMaxPrice ?? intent?.maxPrice;
  const query = normalizeBudgetAwareQuery(rawQuery, maxPrice);
  const category = normalizeCatalogValue(
    params.category,
    options.categories.map((item) => item.slug),
  );
  const material = normalizeCatalogValue(
    params.material,
    options.facets.materials,
  );
  const stone = normalizeCatalogValue(params.stone, options.facets.stones);
  const collection = normalizeCatalogValue(
    params.collection,
    options.facets.collections,
  );

  return {
    query,
    category,
    material,
    stone,
    collection,
    maxPrice,
    availableOnly: params.availableOnly === "1",
    mode: normalizeSearchMode(params.mode),
    page: normalizePage(params.page),
    perPage: DEFAULT_SEARCH_PER_PAGE,
    sort: normalizeSort(params.sort),
  };
}

export function normalizeBudgetAwareQuery(query?: string, maxPrice?: number) {
  if (!query) return undefined;
  if (!maxPrice) return query;

  const withoutBudget = query
    .replace(
      /(?:\u05e2\u05d3|\u05ea\u05e7\u05e6\u05d9\u05d1|\u05de\u05e7\u05e1\u05d9\u05de\u05d5\u05dd|max|under|below)\s*\d{2,5}/gi,
      " ",
    )
    .replace(/\d{2,5}\s*(?:\u05e9["'\u05f3\u05f4]?\u05d7|\u20aa|ils)/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (isGenericGiftSearch(withoutBudget)) return undefined;

  return withoutBudget || undefined;
}

export function isGenericGiftSearch(query: string) {
  return /^(?:\u05de\u05ea\u05e0\u05d4|\u05dc\u05de\u05ea\u05e0\u05d4|gift|present)$/i.test(
    query,
  );
}

export function getActiveSearchRefinementCount(input: ProductSearchInput) {
  return [
    input.category,
    input.material,
    input.stone,
    input.collection,
    input.maxPrice,
    input.availableOnly,
    input.sort && input.sort !== "relevance" ? input.sort : undefined,
    input.mode === "classic" ? input.mode : undefined,
  ].filter(Boolean).length;
}

export function dedupeRecoveryCandidates<Candidate extends { href: string }>(
  candidates: Candidate[],
) {
  const seen = new Set<string>();
  const unique: Candidate[] = [];

  for (const candidate of candidates) {
    if (seen.has(candidate.href)) continue;

    seen.add(candidate.href);
    unique.push(candidate);
  }

  return unique;
}

export function createSearchHref(input: SearchHrefInput) {
  const params = new URLSearchParams();

  if (input.query) params.set("q", input.query);
  if (input.category) params.set("category", input.category);
  if (input.material) params.set("material", input.material);
  if (input.stone) params.set("stone", input.stone);
  if (input.collection) params.set("collection", input.collection);
  if (input.maxPrice) params.set("maxPrice", String(input.maxPrice));
  if (input.availableOnly) params.set("availableOnly", "1");
  if (input.sort && input.sort !== "relevance") params.set("sort", input.sort);
  if (input.mode === "classic") params.set("mode", input.mode);
  if (input.view === "list") params.set("view", input.view);
  if (input.page && input.page > 1) params.set("page", String(input.page));

  const query = params.toString();

  return query ? `/search?${query}` : "/search";
}

export function createProductSearchHref(
  slug: string,
  searchContext?: {
    query?: string;
    position?: number;
  },
) {
  if (!searchContext?.query) return `/product/${slug}`;

  const params = new URLSearchParams({ q: searchContext.query });

  if (typeof searchContext.position === "number") {
    params.set("position", String(searchContext.position));
  }

  return `/product/${slug}?${params.toString()}`;
}

export function getPaginationPages(currentPage: number, totalPages: number) {
  const pages = new Set<number>([1, totalPages]);

  for (let page = currentPage - 1; page <= currentPage + 1; page += 1) {
    if (page > 1 && page < totalPages) {
      pages.add(page);
    }
  }

  const sortedPages = Array.from(pages).sort((first, second) => first - second);
  const result: Array<number | "ellipsis"> = [];

  for (const page of sortedPages) {
    const previous = result[result.length - 1];

    if (typeof previous === "number" && page - previous > 1) {
      result.push("ellipsis");
    }

    result.push(page);
  }

  return result;
}

export function normalizeSearchView(value?: string): SearchViewMode {
  return value === "list" ? "list" : "grid";
}

function normalizeTextParam(value?: string) {
  const normalized = value?.trim();

  if (!normalized) return undefined;

  return normalized;
}

function normalizeCatalogValue(value: string | undefined, allowed: string[]) {
  const normalized = normalizeTextParam(value);

  return normalized && allowed.includes(normalized) ? normalized : undefined;
}

function normalizeMaxPrice(value?: string) {
  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function normalizePage(value?: string) {
  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function normalizeSort(value?: string): ProductSearchInput["sort"] {
  if (
    value === "relevance" ||
    value === "price-asc" ||
    value === "price-desc" ||
    value === "newest" ||
    value === "popular"
  ) {
    return value;
  }

  return undefined;
}

function normalizeSearchMode(value?: string): ProductSearchInput["mode"] {
  return value === "classic" ? "classic" : "semantic";
}
