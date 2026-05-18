import Image from "next/image";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { KineticImageMotion } from "~/components/kinetic-image-motion";
import { ProductCardFavoriteButton } from "~/components/product-card-favorite-button";
import { getProductAvailabilityLabel } from "~/lib/commerce-labels";
import { formatPrice } from "~/lib/format";
import { cn } from "~/lib/utils";
import type { CatalogProduct } from "~/server/services/catalog";

type ProductCardProps = {
  imagePriority?: boolean;
  imageSizes?: string;
  product: CatalogProduct;
  searchContext?: {
    query?: string;
    position?: number;
  };
};

const PRODUCT_IMAGE_BLUR_DATA_URL =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMCIgaGVpZ2h0PSI4Ij48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImciIHgxPSIwIiB4Mj0iMSIgeTE9IjAiIHkyPSIxIj48c3RvcCBzdG9wLWNvbG9yPSIjZjRmMGVhIi8+PHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjZGRkNmNjIi8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHJlY3QgZmlsbD0idXJsKCNnKSIgd2lkdGg9IjEwIiBoZWlnaHQ9IjgiLz48L3N2Zz4=";
const DEFAULT_PRODUCT_CARD_IMAGE_SIZES =
  "(min-width: 1280px) 18rem, (min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw";
const DEFAULT_PRODUCT_CARD_IMAGE_POSITION = "50% 50%";
const PRODUCT_CARD_IMAGE_POSITION_BY_SOURCE = [
  {
    source: "photo-1611652022419-a9419f74343d",
    position: "50% 42%",
  },
  {
    source: "photo-1535632066927-ab7c9ab60908",
    position: "50% 56%",
  },
] as const;

export function ProductCard({
  imagePriority = false,
  imageSizes = DEFAULT_PRODUCT_CARD_IMAGE_SIZES,
  product,
  searchContext,
}: ProductCardProps) {
  const onlineStockQuantity = Object.values(product.inventory).reduce(
    (total, quantity) => total + quantity,
    0,
  );
  const isAvailable = onlineStockQuantity > 0;
  const compareAt =
    typeof product.compareAt === "number" && product.compareAt > product.price
      ? product.compareAt
      : undefined;
  const discountPercent = compareAt
    ? Math.round(((compareAt - product.price) / compareAt) * 100)
    : undefined;
  const href = createProductHref(product.slug, searchContext);
  const imageObjectPosition = getProductCardImageObjectPosition(product);

  return (
    <Card
      aria-label={product.name}
      className={cn(
        "brand-accent-card interactive-lift group/card h-full min-w-0 overflow-hidden rounded-md py-0 transition focus-within:ring-3 focus-within:ring-[var(--glass-focus)]",
        !isAvailable && "bg-muted/30",
      )}
      data-public-floating-avoid="true"
      data-testid="product-card"
    >
      <Link
        aria-label={`צפייה במוצר ${product.name}`}
        className="block focus-visible:ring-3 focus-visible:ring-[var(--glass-focus)] focus-visible:outline-none"
        href={href}
      >
        <div className="brand-product-media glass-inset bg-muted relative aspect-[10/11] overflow-hidden border-0 sm:aspect-[4/5]">
          <KineticImageMotion intensity="card">
            <Image
              alt={product.name}
              blurDataURL={PRODUCT_IMAGE_BLUR_DATA_URL}
              className="media-color object-cover transition duration-[700ms] ease-[var(--ease-motion-standard)] group-hover/card:scale-[1.015]"
              fill
              placeholder="blur"
              priority={imagePriority}
              sizes={imageSizes}
              src={product.image}
              style={{ objectPosition: imageObjectPosition }}
            />
          </KineticImageMotion>
          <div className="absolute inset-x-2.5 top-2.5 flex items-start justify-between gap-2">
            <Badge
              className="max-w-[68%] font-normal shadow-sm"
              variant="secondary"
            >
              <span className="truncate">{product.collection}</span>
            </Badge>
            {discountPercent ? (
              <Badge className="font-semibold" dir="ltr" variant="default">
                -{discountPercent}%
              </Badge>
            ) : !isAvailable ? (
              <Badge variant="destructive">לא זמין</Badge>
            ) : null}
          </div>
          <div className="absolute inset-x-2.5 bottom-2.5 flex min-w-0 flex-wrap gap-1.5">
            <Badge className="max-w-full font-normal" variant="outline">
              <span className="truncate">{product.material}</span>
            </Badge>
            {product.stone ? (
              <Badge className="max-w-full font-normal" variant="outline">
                <span className="truncate">{product.stone}</span>
              </Badge>
            ) : null}
          </div>
        </div>
      </Link>
      <CardContent className="flex min-h-52 flex-1 flex-col gap-3 p-3.5 sm:p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              className="line-clamp-2 min-h-11 text-base leading-[1.45] font-medium underline-offset-4 hover:underline focus-visible:ring-3 focus-visible:ring-[var(--glass-focus)] focus-visible:outline-none"
              dir="auto"
              href={href}
            >
              {product.name}
            </Link>
            <p className="text-muted-foreground mt-1 line-clamp-2 min-h-9 text-sm leading-5">
              {product.shortDescription}
            </p>
          </div>
          <ProductCardFavoriteButton
            productName={product.name}
            productSlug={product.slug}
          />
        </div>

        <div className="mt-auto grid gap-2.5">
          <div className="grid min-h-16 grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
            <div className="min-w-0">
              <p className="text-muted-foreground text-xs">מחיר</p>
              {compareAt ? (
                <span className="text-muted-foreground mt-1 block text-xs line-through">
                  {formatPrice(compareAt)}
                </span>
              ) : null}
              <span className="block text-lg leading-6 font-semibold sm:text-xl sm:leading-7">
                {formatPrice(product.price)}
              </span>
            </div>
            <span
              className={cn(
                "brand-icon-well glass-inset flex max-w-32 shrink-0 items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs",
                isAvailable ? "text-muted-foreground" : "text-foreground",
              )}
            >
              <span
                className={cn(
                  "size-2 shrink-0 rounded-full",
                  isAvailable ? "bg-emerald-500" : "bg-muted-foreground",
                )}
                aria-hidden="true"
              />
              <span className="truncate">
                {getProductAvailabilityLabel(onlineStockQuantity)}
              </span>
            </span>
          </div>
          <Button
            asChild
            className="product-card-cta min-h-11 w-full gap-2"
            variant="outline"
          >
            <Link aria-label={`צפייה וקנייה: ${product.name}`} href={href}>
              <ShoppingBag className="size-4" aria-hidden="true" />
              {isAvailable ? "צפייה וקנייה" : "בדיקת זמינות"}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function getProductCardImageObjectPosition(product: CatalogProduct) {
  const focusRule = PRODUCT_CARD_IMAGE_POSITION_BY_SOURCE.find((rule) =>
    product.image.includes(rule.source),
  );

  return focusRule?.position ?? DEFAULT_PRODUCT_CARD_IMAGE_POSITION;
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
