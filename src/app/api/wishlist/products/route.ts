import type { CatalogProduct } from "~/server/services/catalog-types";
import {
  badRequestJson,
  okJson,
  serviceUnavailableJson,
} from "~/server/http/api-response";
import { listCatalogProductsCachedRequest } from "~/server/services/catalog";
import { mapWishlistProductSummary } from "~/app/wishlist/_lib/wishlist-products";

const MAX_WISHLIST_QUERY_SLUGS = 100;
const wishlistSlugPattern = /^[a-z0-9][a-z0-9-]{0,95}$/iu;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const parsed = parseWishlistSlugs(searchParams);

  if ("error" in parsed) {
    return badRequestJson(parsed.error);
  }

  const { slugs } = parsed;

  if (slugs.length === 0) {
    return okJson({ missingSlugs: [], ok: true, products: [] });
  }

  try {
    const products = await listCatalogProductsCachedRequest();
    const productsBySlug = new Map(
      products.map((product) => [product.slug, product] as const),
    );
    const orderedProducts = slugs
      .map((slug) => productsBySlug.get(slug))
      .filter((product): product is CatalogProduct => Boolean(product));
    const foundSlugs = new Set(orderedProducts.map((product) => product.slug));

    return okJson({
      missingSlugs: slugs.filter((slug) => !foundSlugs.has(slug)),
      ok: true,
      products: orderedProducts.map(mapWishlistProductSummary),
    });
  } catch {
    return serviceUnavailableJson(
      "Wishlist products are temporarily unavailable.",
    );
  }
}

function parseWishlistSlugs(
  searchParams: URLSearchParams,
): { error?: never; slugs: string[] } | { error: string; slugs?: never } {
  const rawSlugs = [
    ...searchParams.getAll("slug"),
    ...(searchParams.get("slugs") ?? "").split(","),
  ];
  const slugs = Array.from(
    new Set(
      rawSlugs
        .map((slug) => slug.trim().toLowerCase())
        .filter((slug) => slug.length > 0),
    ),
  );

  if (slugs.length > MAX_WISHLIST_QUERY_SLUGS) {
    return { error: "Too many wishlist products requested." };
  }

  if (!slugs.every((slug) => wishlistSlugPattern.test(slug))) {
    return { error: "Invalid wishlist product slug." };
  }

  return { slugs };
}
