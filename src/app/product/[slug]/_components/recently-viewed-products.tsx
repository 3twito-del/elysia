"use client";

import { useMemo } from "react";

import { CommerceSectionHeader } from "~/components/commerce-section-header";
import { ProductCard } from "~/components/product-card";
import { RECENTLY_VIEWED_STORAGE_KEY } from "~/lib/cookie-consent";
import { useCookieConsentValue } from "~/lib/use-cookie-consent";
import type { CatalogProduct } from "~/server/services/catalog";
import { api, TRPCReactProvider } from "~/trpc/react";

import { selectRecentlyViewedSlugs } from "../_lib/recently-viewed";

type RecentlyViewedProductsProps = {
  className?: string;
  currentSlug?: string;
  /**
   * Slugs already shown elsewhere on the page (e.g. the recommendation rails),
   * excluded so the same product never appears twice on one route.
   */
  excludeSlugs?: readonly string[];
  gridClassName?: string;
  heading?: string;
  id?: string;
  limit?: number;
  /**
   * Pre-loaded catalog to resolve recently-viewed slugs against. When omitted,
   * only the slugs the visitor actually has are fetched on the client via tRPC,
   * so the host page does not have to ship the entire catalog in its payload.
   */
  products?: CatalogProduct[];
};

export function RecentlyViewedProducts(props: RecentlyViewedProductsProps) {
  return (
    <TRPCReactProvider>
      <RecentlyViewedProductsContent {...props} />
    </TRPCReactProvider>
  );
}

function RecentlyViewedProductsContent({
  className = "border-border mx-auto mt-9 max-w-7xl border-t pt-7",
  currentSlug,
  excludeSlugs,
  gridClassName = "ui-equal-grid mt-5 grid gap-x-7 gap-y-10 sm:grid-cols-2 lg:grid-cols-3",
  heading = "נצפו לאחרונה",
  id,
  limit = 3,
  products,
}: RecentlyViewedProductsProps) {
  const consentValue = useCookieConsentValue();
  const slugs = useMemo(
    () => (consentValue === "all" ? readRecentlyViewedSlugs() : []),
    [consentValue],
  );
  const candidateSlugs = useMemo(
    () =>
      selectRecentlyViewedSlugs({
        excludeSlugs: currentSlug
          ? [currentSlug, ...(excludeSlugs ?? [])]
          : (excludeSlugs ?? []),
        limit,
        slugs,
      }),
    [slugs, currentSlug, excludeSlugs, limit],
  );

  const shouldFetch = products === undefined && candidateSlugs.length > 0;
  const fetched = api.catalog.bySlugs.useQuery(
    { slugs: candidateSlugs },
    { enabled: shouldFetch, staleTime: 5 * 60 * 1000 },
  );

  const resolved = products ?? fetched.data ?? [];
  const productsBySlug = new Map(
    resolved.map((product) => [product.slug, product]),
  );
  const viewed = candidateSlugs
    .map((slug) => productsBySlug.get(slug))
    .filter((product): product is CatalogProduct => Boolean(product))
    .slice(0, limit);

  if (viewed.length === 0) return null;

  return (
    <section
      aria-labelledby="recently-viewed-products-heading"
      className={className}
      data-testid="recently-viewed-products"
      id={id}
    >
      <CommerceSectionHeader
        id="recently-viewed-products-heading"
        title={heading}
      />
      <div
        className={gridClassName}
        data-layout-equal-group="recently-viewed-products"
      >
        {viewed.map((product) => (
          <ProductCard key={product.slug} product={product} />
        ))}
      </div>
    </section>
  );
}

function readRecentlyViewedSlugs() {
  try {
    const parsed: unknown = JSON.parse(
      window.localStorage.getItem(RECENTLY_VIEWED_STORAGE_KEY) ?? "[]",
    );

    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === "string")
      : [];
  } catch {
    return [];
  }
}
