"use client";

import { useMemo } from "react";

import { ProductCard } from "~/components/product-card";
import { RECENTLY_VIEWED_STORAGE_KEY } from "~/lib/cookie-consent";
import { useCookieConsentValue } from "~/lib/use-cookie-consent";
import type { CatalogProduct } from "~/server/services/catalog";

export function RecentlyViewedProducts({
  currentSlug,
  products,
}: {
  currentSlug: string;
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
    .slice(0, 3);

  if (viewed.length === 0) return null;

  return (
    <section
      aria-labelledby="recently-viewed-products-heading"
      className="border-border mx-auto mt-9 max-w-[96rem] border-t pt-7"
      data-testid="recently-viewed-products"
    >
      <h2
        className="text-2xl font-semibold"
        id="recently-viewed-products-heading"
      >
        נצפו לאחרונה
      </h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
