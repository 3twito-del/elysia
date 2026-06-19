"use client";

import { useMemo } from "react";

import { ProductCard } from "~/components/product-card";
import { RECENTLY_VIEWED_STORAGE_KEY } from "~/lib/cookie-consent";
import { useCookieConsentValue } from "~/lib/use-cookie-consent";
import type { CatalogProduct } from "~/server/services/catalog";

export function RecentlyViewedProducts({
  className = "border-border mx-auto mt-9 max-w-7xl border-t pt-7",
  currentSlug,
  gridClassName = "ui-equal-grid mt-5 grid gap-x-7 gap-y-10 sm:grid-cols-2 lg:grid-cols-3",
  heading = "נצפו לאחרונה",
  id,
  limit = 3,
  products,
}: {
  className?: string;
  currentSlug?: string;
  gridClassName?: string;
  heading?: string;
  id?: string;
  limit?: number;
  products: CatalogProduct[];
}) {
  const consentValue = useCookieConsentValue();
  const slugs = useMemo(
    () => (consentValue === "all" ? readRecentlyViewedSlugs() : []),
    [consentValue],
  );

  const productsBySlug = new Map(
    products.map((product) => [product.slug, product]),
  );
  const viewed = slugs
    .filter((slug) => slug !== currentSlug)
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
      <h2
        className="text-2xl font-semibold"
        id="recently-viewed-products-heading"
      >
        {heading}
      </h2>
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
