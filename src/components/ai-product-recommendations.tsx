"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ExternalLink, MapPin, Sparkles } from "lucide-react";

import {
  normalizeAiRecommendedProducts,
  type AiRecommendedProductInput,
} from "~/lib/ai-product-recommendations";
import { cn } from "~/lib/utils";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";

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
      aria-label={title ?? "המלצות מוצרי AI"}
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
            className="glass-card interactive-lift group/card grid gap-4 rounded-md border p-3.5 sm:grid-cols-[112px_1fr] sm:p-4"
            key={product.slug}
          >
            <Link
              aria-label={`צפייה בפריט ${product.name}`}
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
                    <Badge className="shrink-0" variant="secondary">
                      {product.priceLabel}
                    </Badge>
                  ) : null}
                </div>

                {product.description ? (
                  <p className="text-muted-foreground line-clamp-2 text-sm leading-6">
                    {product.description}
                  </p>
                ) : null}

                {product.matchReason ? (
                  <p className="glass-inset rounded-md border px-3 py-2 text-xs leading-5">
                    {product.matchReason}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-muted-foreground flex min-w-0 flex-wrap items-center gap-2 text-xs">
                  {product.category ? (
                    <span className="bg-muted rounded-full border border-[var(--glass-border)] px-2 py-1">
                      {product.category}
                    </span>
                  ) : null}
                  {product.material ? (
                    <span className="bg-muted rounded-full border border-[var(--glass-border)] px-2 py-1">
                      {product.material.replace(" 14K", "")}
                    </span>
                  ) : null}
                  {typeof product.availableBranchCount === "number" ? (
                    <span className="inline-flex items-center gap-1">
                      <MapPin aria-hidden="true" className="size-3.5" />
                      {product.availableBranchCount} סניפים
                    </span>
                  ) : null}
                </div>

                <Button
                  asChild
                  className="h-9 shrink-0 gap-2 px-3"
                  size="sm"
                  variant="secondary"
                >
                  <Link href={product.href}>
                    צפייה בפריט
                    {resolvedLayout === "grid" ? (
                      <ExternalLink aria-hidden="true" className="size-3.5" />
                    ) : (
                      <ArrowLeft aria-hidden="true" className="size-3.5" />
                    )}
                  </Link>
                </Button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
