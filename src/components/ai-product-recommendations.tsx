"use client";

import Image from "next/image";
import Link from "next/link";
import { Sparkles } from "lucide-react";

import {
  normalizeAiRecommendedProducts,
  type AiRecommendedProductInput,
} from "~/lib/ai-product-recommendations";
import { cn } from "~/lib/utils";

type AiProductRecommendationsProps = {
  products: readonly AiRecommendedProductInput[];
  source: string;
  className?: string;
  title?: string;
  queryText?: string;
  layout?: "inline" | "grid";
};

export function AiProductRecommendations({
  className,
  layout,
  products,
  queryText,
  source,
  title,
}: AiProductRecommendationsProps) {
  const normalizedProducts = normalizeAiRecommendedProducts(products, source);
  const resolvedLayout = layout ?? (source === "stylist" ? "inline" : "grid");

  if (normalizedProducts.length === 0) return null;

  return (
    <section
      aria-label={title ?? "המלצות תכשיטים חכמות"}
      className={cn("grid gap-3", className)}
    >
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="grid gap-1">
          {title ? <h3 className="text-sm font-semibold">{title}</h3> : null}
          {queryText ? (
            <p className="text-muted-foreground line-clamp-1 text-xs">
              לפי הבקשה: {queryText}
            </p>
          ) : null}
        </div>
      </div>

      <div
        className={cn(
          "grid gap-3",
          resolvedLayout === "grid" && "lg:grid-cols-2",
        )}
      >
        {normalizedProducts.map((product) => (
          <article
            className="ai-recommendation-card glass-card group/card grid gap-4 rounded-md border p-3.5 sm:grid-cols-[112px_1fr] sm:p-4"
            key={product.slug}
          >
            <Link
              aria-label={`צפייה בתכשיט ${product.name}`}
              className="focus-visible:outline-ring bg-muted relative aspect-square min-h-28 overflow-hidden rounded-md border border-[var(--glass-border)] focus-visible:ring-2"
              href={product.href}
            >
              {product.image ? (
                <Image
                  alt={product.name}
                  className="media-color object-cover transition-transform duration-[700ms] ease-[var(--ease-motion-standard)] group-hover/card:scale-[1.015]"
                  fill
                  sizes={
                    resolvedLayout === "grid"
                      ? "(min-width: 1024px) 112px, 40vw"
                      : "112px"
                  }
                  src={product.image}
                />
              ) : (
                <span className="bg-muted flex size-full items-center justify-center">
                  <Sparkles
                    aria-hidden="true"
                    className="text-muted-foreground size-5"
                  />
                </span>
              )}
            </Link>

            <div className="grid min-w-0 content-between gap-3">
              <div className="grid gap-2">
                <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
                  <Link
                    className="line-clamp-1 text-base font-semibold hover:underline"
                    href={product.href}
                  >
                    {product.name}
                  </Link>
                  {product.priceLabel ? (
                    <span className="shrink-0 text-sm font-semibold">
                      {product.priceLabel}
                    </span>
                  ) : null}
                </div>

                <div className="text-muted-foreground flex min-w-0 flex-wrap items-center gap-2 text-xs">
                  {product.material ? (
                    <span className="bg-muted rounded-full border border-[var(--glass-border)] px-2 py-1">
                      {product.material.replace(" 14K", "")}
                    </span>
                  ) : null}
                  {product.stone ? (
                    <span className="bg-muted rounded-full border border-[var(--glass-border)] px-2 py-1">
                      {product.stone}
                    </span>
                  ) : null}
                  {product.availableOnline === false ? (
                    <span className="inline-flex items-center gap-1">
                      לא פנוי כרגע
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
