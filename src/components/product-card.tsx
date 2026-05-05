import Image from "next/image";
import Link from "next/link";
import { Heart, MapPin, ShoppingBag } from "lucide-react";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { getProductAvailabilityLabel } from "~/lib/commerce-labels";
import { formatPrice } from "~/lib/format";
import { cn } from "~/lib/utils";
import type { CatalogProduct } from "~/server/services/catalog";

type ProductCardProps = {
  imagePriority?: boolean;
  product: CatalogProduct;
  searchContext?: {
    query?: string;
    position?: number;
  };
};

export function ProductCard({
  imagePriority = false,
  product,
  searchContext,
}: ProductCardProps) {
  const availableBranches = Object.values(product.inventory).filter(
    (quantity) => quantity > 0,
  ).length;
  const isAvailable = availableBranches > 0;
  const compareAt =
    typeof product.compareAt === "number" && product.compareAt > product.price
      ? product.compareAt
      : undefined;
  const href = createProductHref(product.slug, searchContext);

  return (
    <Card
      aria-label={product.name}
      className={cn(
        "group/card interactive-lift h-full overflow-hidden rounded-md py-0",
        !isAvailable && "bg-muted/30",
      )}
      data-testid="product-card"
    >
      <Link
        aria-label={`צפייה במוצר ${product.name}`}
        className="block focus-visible:ring-3 focus-visible:ring-[var(--glass-focus)] focus-visible:outline-none"
        href={href}
      >
        <div className="glass-inset bg-muted relative aspect-[4/3] min-h-40 overflow-hidden border-0">
          <Image
            alt={product.name}
            className="media-color object-cover transition duration-500 ease-[var(--ease-liquid)] group-hover/card:scale-[1.035]"
            fill
            loading={imagePriority ? "eager" : undefined}
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            src={product.image}
          />
          <Badge
            className="absolute top-3 right-3 font-normal"
            variant="secondary"
          >
            {product.collection}
          </Badge>
          <Badge
            className="absolute top-3 left-3 font-normal"
            variant={isAvailable ? "secondary" : "outline"}
          >
            {getProductAvailabilityLabel(availableBranches)}
          </Badge>
        </div>
      </Link>
      <CardContent className="flex min-h-64 flex-1 flex-col gap-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              className="line-clamp-2 font-medium underline-offset-4 hover:underline focus-visible:ring-3 focus-visible:ring-[var(--glass-focus)] focus-visible:outline-none"
              href={href}
            >
              {product.name}
            </Link>
            <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
              {product.shortDescription}
            </p>
          </div>
          <Button
            aria-label={`שמירה ל-Wishlist: ${product.name}`}
            className="shrink-0"
            size="icon"
            type="button"
            variant="ghost"
          >
            <Heart className="size-4" />
          </Button>
        </div>

        <div className="mt-auto grid gap-4">
          <div className="flex items-end justify-between gap-3">
            <div className="grid gap-0.5">
              {compareAt ? (
                <span className="text-muted-foreground text-xs line-through">
                  {formatPrice(compareAt)}
                </span>
              ) : null}
              <span className="text-lg font-semibold">
                {formatPrice(product.price)}
              </span>
            </div>
            <span
              className={cn(
                "flex shrink-0 items-center gap-1 text-xs",
                isAvailable ? "text-muted-foreground" : "text-foreground",
              )}
            >
              <MapPin className="size-3.5" />
              {getProductAvailabilityLabel(availableBranches)}
            </span>
          </div>
          <Button asChild className="w-full gap-2" variant="outline">
            <Link aria-label={`צפייה וקנייה: ${product.name}`} href={href}>
              <ShoppingBag className="size-4" />
              {isAvailable ? "צפייה וקנייה" : "בדיקת זמינות"}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function createProductHref(
  slug: string,
  searchContext?: ProductCardProps["searchContext"],
) {
  if (!searchContext?.query) return `/product/${slug}`;

  const params = new URLSearchParams({ q: searchContext.query });

  if (typeof searchContext.position === "number") {
    params.set("position", String(searchContext.position));
  }

  return `/product/${slug}?${params.toString()}`;
}
