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

const PRODUCT_IMAGE_BLUR_DATA_URL =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMCIgaGVpZ2h0PSI4Ij48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImciIHgxPSIwIiB4Mj0iMSIgeTE9IjAiIHkyPSIxIj48c3RvcCBzdG9wLWNvbG9yPSIjZjRmMGVhIi8+PHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjZGRkNmNjIi8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHJlY3QgZmlsbD0idXJsKCNnKSIgd2lkdGg9IjEwIiBoZWlnaHQ9IjgiLz48L3N2Zz4=";

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
        "brand-accent-card group/card interactive-lift h-full min-w-0 overflow-hidden rounded-md py-0",
        !isAvailable && "bg-muted/30",
      )}
      data-testid="product-card"
    >
      <Link
        aria-label={`צפייה במוצר ${product.name}`}
        className="block focus-visible:ring-3 focus-visible:ring-[var(--glass-focus)] focus-visible:outline-none"
        href={href}
      >
        <div className="brand-product-media glass-inset bg-muted relative aspect-[4/3] overflow-hidden border-0 sm:aspect-[5/4] sm:min-h-44">
          <Image
            alt={product.name}
            blurDataURL={PRODUCT_IMAGE_BLUR_DATA_URL}
            className="media-color object-cover transition duration-[700ms] ease-[var(--ease-motion-standard)] group-hover/card:scale-[1.015]"
            fill
            placeholder="blur"
            priority={imagePriority}
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            src={product.image}
          />
          <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
            <Badge className="max-w-[62%] font-normal" variant="secondary">
              <span className="truncate">{product.collection}</span>
            </Badge>
            <Badge
              className="max-w-[42%] font-normal"
              variant={isAvailable ? "secondary" : "outline"}
            >
              <span className="truncate">
                {getProductAvailabilityLabel(availableBranches)}
              </span>
            </Badge>
          </div>
        </div>
      </Link>
      <CardContent className="flex min-h-52 flex-1 flex-col gap-4 p-4 sm:min-h-64">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              className="line-clamp-2 text-base font-medium underline-offset-4 hover:underline focus-visible:ring-3 focus-visible:ring-[var(--glass-focus)] focus-visible:outline-none"
              dir="auto"
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
          <div className="flex min-h-12 items-end justify-between gap-3">
            <div className="grid gap-0.5">
              {compareAt ? (
                <span className="text-muted-foreground text-xs line-through">
                  {formatPrice(compareAt)}
                </span>
              ) : null}
              <span className="text-xl font-semibold">
                {formatPrice(product.price)}
              </span>
            </div>
            <span
              className={cn(
                "brand-icon-well glass-inset flex max-w-[48%] shrink-0 items-center gap-1 rounded-md border px-2 py-1 text-xs",
                isAvailable ? "text-muted-foreground" : "text-foreground",
              )}
            >
              <MapPin className="size-3.5" />
              <span className="truncate">
                {getProductAvailabilityLabel(availableBranches)}
              </span>
            </span>
          </div>
          <Button
            asChild
            className="min-h-11 w-full gap-2"
            variant={isAvailable ? "default" : "outline"}
          >
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
