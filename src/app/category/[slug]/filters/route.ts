import {
  getCategoryRouteState,
  toCategoryFilterPayload,
  type CategorySearchParams,
} from "../_lib/category-filter-state";
import { notFoundJson, okJson } from "~/server/http/api-response";
import {
  getCatalogCategories,
  getCatalogFacetsFromProducts,
  listCatalogProductsCachedRequest,
} from "~/server/services/catalog";

type CategoryFilterRouteProps = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 3600;

export async function GET(
  request: Request,
  { params }: CategoryFilterRouteProps,
) {
  const { slug } = await params;
  const url = new URL(request.url);
  const query: CategorySearchParams = {
    material: url.searchParams.get("material") ?? undefined,
    maxPrice: url.searchParams.get("maxPrice") ?? undefined,
    sort: url.searchParams.get("sort") ?? undefined,
    stone: url.searchParams.get("stone") ?? undefined,
  };
  const [categories, catalogProducts] = await Promise.all([
    getCatalogCategories(),
    listCatalogProductsCachedRequest(),
  ]);

  if (!categories.some((category) => category.slug === slug)) {
    return notFoundJson("Category not found");
  }

  const facets = getCatalogFacetsFromProducts(catalogProducts);
  const state = getCategoryRouteState({
    catalogProducts,
    categories,
    facets,
    query,
    slug,
  });

  return okJson(toCategoryFilterPayload(state), {
    headers: {
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
