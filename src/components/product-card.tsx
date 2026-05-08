import Image from "next/image";
import Link from "next/link";
import { Heart, MapPin, ShoppingBag } from "lucide-react";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { getProductAvailabilityLabel } from "~/lib/commerce-labels";
import { formatPrice } from "~/lib/format";
import { removeGoldLanguage } from "~/lib/gold-free-copy";
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
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='8'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' x2='1' y1='0' y2='1'%3E%3Cstop stop-color='%23f1f3f6'/%3E%3Cstop offset='1' stop-color='%23d6dce5'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill='url(%23g)' width='10' height='8'/%3E%3C/svg%3E";

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
  const productName = removeGoldLanguage(product.name);
  const productShortDescription = removeGoldLanguage(product.shortDescription);
  const productMaterial = removeGoldLanguage(product.material);
  const productStone = removeGoldLanguage(product.stone);
  const previewImages = product.images.filter(Boolean).slice(0, 3);

  return (
    <Card
      aria-label={productName}
      className={cn(
        "luxury-product-card group/card interactive-lift h-full min-w-0 overflow-hidden rounded-none border-0 bg-transparent py-0 shadow-none ring-0 focus-within:ring-1 focus-within:ring-[var(--luxury-accent-border)]",
        !isAvailable && "opacity-70",
      )}
      data-testid="product-card"
    >
      <div className="relative">
        <Link
          aria-label={`צפייה במוצר ${productName}`}
          className="block focus-visible:ring-3 focus-visible:ring-[var(--glass-focus)] focus-visible:outline-none"
          href={href}
        >
          <div className="product-tile-image bg-secondary relative aspect-[4/5] overflow-hidden">
            <Image
              alt={productName}
              blurDataURL={PRODUCT_IMAGE_BLUR_DATA_URL}
              className="media-color object-cover transition duration-500 ease-[var(--ease-liquid)] group-hover/card:scale-[1.045]"
              fill
              placeholder="blur"
              priority={imagePriority}
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
              src={product.image}
            />
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-[linear-gradient(to_top,rgba(0,0,0,0.26),rgba(0,0,0,0))] opacity-0 transition-opacity duration-300 group-hover/card:opacity-100" />
          </div>
        </Link>
        <div className="pointer-events-none absolute inset-x-3 top-3 flex items-start justify-between gap-2">
          <Badge
            className="product-tile-kicker max-w-[68%] rounded-none border-0 font-normal"
            variant="secondary"
          >
            <span className="truncate">{product.collection}</span>
          </Badge>
          {compareAt ? (
            <Badge
              className="[border-color:var(--luxury-accent-border)] bg-[var(--luxury-accent-soft)] font-normal"
              variant="outline"
            >
              מחיר מיוחד
            </Badge>
          ) : null}
        </div>
        <Button
          aria-label={`שמירה ל-Wishlist: ${productName}`}
          className="bg-background/95 hover:bg-background absolute bottom-3 left-3 size-9 shadow-none transition-transform group-hover/card:-translate-y-0.5"
          size="icon-sm"
          type="button"
          variant="outline"
        >
          <Heart className="size-4" />
        </Button>
        {previewImages.length > 1 ? (
          <div
            aria-hidden="true"
            className="absolute right-3 bottom-3 hidden gap-1 sm:flex"
          >
            {previewImages.map((image) => (
              <span
                className="relative size-7 overflow-hidden border border-white/70 bg-white shadow-sm"
                key={image}
              >
                <Image
                  alt=""
                  className="object-cover"
                  fill
                  sizes="28px"
                  src={image}
                />
              </span>
            ))}
          </div>
        ) : null}
      </div>
      <CardContent className="flex min-h-44 flex-1 flex-col gap-3 px-0 py-4 sm:min-h-48">
        <div className="grid gap-2">
          <div className="min-w-0">
            <Link
              className="line-clamp-2 text-base font-medium underline-offset-4 hover:underline focus-visible:ring-3 focus-visible:ring-[var(--glass-focus)] focus-visible:outline-none"
              dir="auto"
              href={href}
            >
              {productName}
            </Link>
            <p className="text-muted-foreground mt-1 line-clamp-1 text-sm leading-6">
              {productShortDescription}
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Badge
              className="max-w-full rounded-none [border-color:oklch(0.58_0.05_152_/_25%)] bg-transparent font-normal"
              variant="outline"
            >
              <span className="truncate">{productMaterial}</span>
            </Badge>
            {productStone ? (
              <Badge
                className="max-w-full rounded-none [border-color:var(--jewel-rose)] bg-transparent font-normal"
                variant="outline"
              >
                <span className="truncate">{productStone}</span>
              </Badge>
            ) : null}
          </div>
        </div>

        <div className="mt-auto grid gap-3">
          <div className="flex min-h-12 items-end justify-between gap-3 border-t border-[var(--glass-border)] pt-3">
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
                "flex max-w-[52%] shrink-0 items-center gap-1 border border-[var(--glass-border)] px-2 py-1 text-xs",
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
            <Link aria-label={`צפייה וקנייה: ${productName}`} href={href}>
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
