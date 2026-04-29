"use client";

import { useState } from "react";

import { ProductCard } from "~/components/product-card";
import type { CatalogProduct } from "~/server/services/catalog";

export function RecentlyViewedProducts({
  currentSlug,
  products,
}: {
  currentSlug: string;
  products: CatalogProduct[];
}) {
  const [slugs] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];

    try {
      const parsed: unknown = JSON.parse(
        window.localStorage.getItem("aphrodite_recently_viewed") ?? "[]",
      );

      return Array.isArray(parsed)
        ? parsed.filter((value): value is string => typeof value === "string")
        : [];
    } catch {
      return [];
    }
  });

  const productsBySlug = new Map(
    products.map((product) => [product.slug, product]),
  );
  const viewed = slugs
    .filter((slug) => slug !== currentSlug)
    .map((slug) => productsBySlug.get(slug))
    .filter((product): product is CatalogProduct => Boolean(product))
    .slice(0, 4);

  if (viewed.length === 0) return null;

  return (
    <div className="mt-10">
      <h2 className="text-2xl font-semibold">נצפו לאחרונה</h2>
      <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {viewed.map((product) => (
          <ProductCard key={product.slug} product={product} />
        ))}
      </div>
    </div>
  );
}
