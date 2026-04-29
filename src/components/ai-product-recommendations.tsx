"use client";

import Image from "next/image";
import Link from "next/link";
import { ExternalLink, MapPin, Sparkles } from "lucide-react";

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
};

export function AiProductRecommendations({
  className,
  products,
  source,
  title,
}: AiProductRecommendationsProps) {
  const normalizedProducts = normalizeAiRecommendedProducts(products, source);

  if (normalizedProducts.length === 0) return null;

  return (
    <section className={cn("grid gap-3", className)}>
      {title ? <h3 className="text-sm font-semibold">{title}</h3> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        {normalizedProducts.map((product) => (
          <article
            className="glass-inset grid grid-cols-[88px_1fr] gap-3 rounded-md border p-3"
            key={product.slug}
          >
            <Link
              aria-label={`צפייה במוצר ${product.name}`}
              className="focus-visible:outline-ring relative aspect-square overflow-hidden rounded-md border focus-visible:ring-2"
              href={product.href}
            >
              {product.image ? (
                <Image
                  alt={product.name}
                  className="object-cover"
                  fill
                  sizes="88px"
                  src={product.image}
                />
              ) : (
                <span className="bg-muted flex size-full items-center justify-center">
                  <Sparkles className="text-muted-foreground size-5" />
                </span>
              )}
            </Link>

            <div className="grid min-w-0 gap-2">
              <div className="min-w-0">
                <Link
                  className="line-clamp-1 text-sm font-medium hover:underline"
                  href={product.href}
                >
                  {product.name}
                </Link>
                {product.description ? (
                  <p className="text-muted-foreground mt-1 line-clamp-2 text-xs leading-5">
                    {product.description}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {product.priceLabel ? (
                  <Badge variant="secondary">{product.priceLabel}</Badge>
                ) : null}
                {typeof product.availableBranchCount === "number" ? (
                  <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
                    <MapPin className="size-3.5" />
                    {product.availableBranchCount} סניפים
                  </span>
                ) : null}
              </div>

              <Button asChild className="h-9 w-fit gap-2 px-3" size="sm">
                <Link href={product.href}>
                  צפייה במוצר
                  <ExternalLink className="size-3.5" />
                </Link>
              </Button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
