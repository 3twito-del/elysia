import { env } from "~/env";

export const DEFAULT_SEARCH_PER_PAGE = 24;

const maxSearchPerPage = 48;

export type SearchPagination = ReturnType<typeof normalizeSearchPagination>;

type TypesenseSearchEnv = {
  NODE_ENV: string;
  TYPESENSE_API_KEY?: string;
  TYPESENSE_HOST?: string;
};

type ConfiguredTypesenseSearchEnv = TypesenseSearchEnv & {
  TYPESENSE_API_KEY: string;
  TYPESENSE_HOST: string;
};

export function normalizeSearchPagination(input: {
  page?: number;
  perPage?: number;
}) {
  const page =
    Number.isInteger(input.page) && Number(input.page) > 0
      ? Number(input.page)
      : 1;
  const perPage =
    Number.isInteger(input.perPage) && Number(input.perPage) > 0
      ? Math.min(Number(input.perPage), maxSearchPerPage)
      : DEFAULT_SEARCH_PER_PAGE;

  return { page, perPage };
}

export function paginateSearchHits<T>(hits: T[], pagination: SearchPagination) {
  const totalPages = getSearchTotalPages(hits.length, pagination.perPage);
  const page = Math.min(pagination.page, totalPages);
  const start = (page - 1) * pagination.perPage;

  return hits.slice(start, start + pagination.perPage);
}

export function createSearchResultMeta(
  total: number,
  pagination: SearchPagination,
) {
  const totalPages = getSearchTotalPages(total, pagination.perPage);

  return {
    page: Math.min(pagination.page, totalPages),
    perPage: pagination.perPage,
    total,
    totalPages,
  };
}

export function shouldFallbackToLocalSearchPage(input: {
  indexedHits: number;
  found: number;
  page: number;
  perPage: number;
  resolvedHits: number;
}) {
  const found = Math.max(0, input.found);
  const indexedHits = Math.max(0, input.indexedHits);
  const resolvedHits = Math.max(0, input.resolvedHits);
  const expectedHits = getExpectedSearchPageHitCount({
    found,
    page: input.page,
    perPage: input.perPage,
  });

  return (
    found > 0 && (indexedHits < expectedHits || resolvedHits < indexedHits)
  );
}

export function shouldUseLocalSearchFallback(config: TypesenseSearchEnv = env) {
  return !hasTypesenseConfig(config);
}

export function getProductsCollectionName(model: string, dimension: number) {
  const modelSlug =
    model
      .toLowerCase()
      .replace(/^cloudflare:@cf\//u, "cf/")
      .replace(/^cloudflare:/u, "cf:")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 36) || "lexical";

  return `products_semantic_${modelSlug}_${dimension}_v1`;
}

function getSearchTotalPages(total: number, perPage: number) {
  return Math.max(1, Math.ceil(total / perPage));
}

function getExpectedSearchPageHitCount(input: {
  found: number;
  page: number;
  perPage: number;
}) {
  const found = Math.max(0, input.found);
  const perPage = Math.max(1, input.perPage);
  const totalPages = getSearchTotalPages(found, perPage);
  const page = Math.min(Math.max(1, input.page), totalPages);
  const start = (page - 1) * perPage;

  return Math.min(perPage, Math.max(0, found - start));
}

export function hasTypesenseConfig(
  config: TypesenseSearchEnv,
): config is ConfiguredTypesenseSearchEnv {
  return Boolean(config.TYPESENSE_HOST && config.TYPESENSE_API_KEY);
}
