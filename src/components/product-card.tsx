import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ShoppingBag, Sparkles } from "lucide-react";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { ProductCardFavoriteButton } from "~/components/product-card-favorite-button";
import { getPublicProductCommerceStatus } from "~/lib/commerce-labels";
import { formatPrice } from "~/lib/format";
import { cn } from "~/lib/utils";
import type { CatalogProduct } from "~/server/services/catalog";

type ProductCardProps = {
  imagePriority?: boolean;
  imageSizes?: string;
  matchReason?: string;
  product: CatalogProduct;
  searchContext?: {
    query?: string;
    position?: number;
  };
};

const PRODUCT_IMAGE_BLUR_DATA_URL =
  "data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='10'%20height='8'%20viewBox='0%200%2010%208'%3E%3Crect%20width='10'%20height='8'%20fill='%23eef6f7'/%3E%3C/svg%3E";
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
  matchReason,
  product,
  searchContext,
}: ProductCardProps) {
  const onlineStockQuantity = Object.values(product.inventory).reduce(
    (total, quantity) => total + quantity,
    0,
  );
  const commerceStatus = getPublicProductCommerceStatus({
    availableQuantity: onlineStockQuantity,
    availabilityMode: product.availabilityMode,
  });
  const isAvailable = commerceStatus.canAddToCart;
  const isUnavailable =
    product.availabilityMode === "READY_TO_ORDER" && onlineStockQuantity <= 0;
  const compareAt =
    typeof product.compareAt === "number" && product.compareAt > product.price
      ? product.compareAt
      : undefined;
  const discountPercent = compareAt
    ? Math.round(((compareAt - product.price) / compareAt) * 100)
    : undefined;
  const href = createProductHref(product.slug, searchContext);
  const actionHref = commerceStatus.canAddToCart
    ? href
    : createProductServiceHref(product, commerceStatus.serviceReason);
  const commerceHighlights = product.commerceHighlights ?? [];
  const imageObjectPosition = getProductCardImageObjectPosition(product);
  const productDetails = [product.material, product.stone].filter(
    (detail): detail is string => Boolean(detail),
  );

  return (
    <Card
      aria-label={product.name}
      className={cn(
        "product-card-shell group/card h-full min-w-0 overflow-hidden rounded-md border-0 py-0 shadow-none transition focus-within:ring-3 focus-within:ring-[var(--glass-focus)]",
        isUnavailable && "bg-muted/30",
      )}
      data-public-floating-avoid="true"
      data-testid="product-card"
    >
      <Link
        aria-label={`צפייה במוצר ${product.name}`}
        className="block focus-visible:ring-3 focus-visible:ring-[var(--glass-focus)] focus-visible:outline-none"
        href={href}
      >
        <div className="brand-product-media glass-inset bg-muted relative aspect-[5/4] overflow-hidden border-0 sm:aspect-[4/5]">
          <StaticKineticImageFrame>
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
          </StaticKineticImageFrame>
          {discountPercent || isUnavailable ? (
            <div className="absolute top-2.5 left-2.5 flex items-start gap-2">
              {discountPercent ? (
                <Badge className="font-semibold" dir="ltr" variant="default">
                  -{discountPercent}%
                </Badge>
              ) : isUnavailable ? (
                <Badge variant="destructive">לא זמין</Badge>
              ) : null}
            </div>
          ) : null}
        </div>
      </Link>
      <CardContent className="flex min-h-40 flex-1 flex-col gap-2.5 p-[var(--ui-card-padding)] sm:min-h-52 sm:gap-3">
        <div className="flex items-start justify-between gap-2.5 sm:gap-3">
          <div className="min-w-0">
            <Link
              className="line-clamp-2 min-h-10 text-base leading-[1.4] font-medium underline-offset-4 hover:underline focus-visible:ring-3 focus-visible:ring-[var(--glass-focus)] focus-visible:outline-none sm:min-h-11 sm:leading-[1.45]"
              dir="auto"
              href={href}
            >
              {product.name}
            </Link>
            <p className="text-muted-foreground mt-1 line-clamp-1 min-h-5 text-sm leading-5 sm:line-clamp-2 sm:min-h-9">
              {product.shortDescription}
            </p>
            <div
              className="text-muted-foreground mt-1.5 flex min-h-5 flex-wrap items-center gap-x-2 gap-y-1 text-xs leading-5 sm:mt-2"
              data-testid="product-card-attributes"
            >
              {productDetails.map((detail, index) => (
                <span
                  className="max-w-full min-w-0 truncate"
                  key={`${detail}-${index}`}
                >
                  {detail}
                </span>
              ))}
            </div>
            {matchReason ? (
              <p
                className="text-muted-foreground mt-2 inline-flex max-w-full items-center gap-1.5 rounded-md border border-[var(--glass-border)] bg-[var(--glass-inset-bg)] px-2 py-1 text-xs"
                data-testid="product-card-match-reason"
              >
                <Sparkles aria-hidden="true" className="size-3.5 shrink-0" />
                <span className="truncate">{matchReason}</span>
              </p>
            ) : null}
            {commerceHighlights.length > 0 ? (
              <div
                className="text-muted-foreground mt-2 grid gap-1 text-xs leading-5"
                data-testid="product-card-highlights"
              >
                {commerceHighlights.slice(0, 2).map((highlight) => (
                  <span className="line-clamp-1" key={highlight}>
                    {highlight}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
          <ProductCardFavoriteButton
            productName={product.name}
            productSlug={product.slug}
          />
        </div>

        <div className="mt-auto grid gap-2.5">
          <div className="grid min-h-12 grid-cols-[minmax(0,1fr)_auto] items-end gap-2.5 sm:min-h-16 sm:gap-3">
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
              <span className="truncate">{commerceStatus.label}</span>
            </span>
          </div>
          <Button
            asChild
            className="product-card-cta min-h-10 w-full gap-2 sm:min-h-11"
            variant="outline"
          >
            <Link
              aria-label={`${commerceStatus.cardCtaLabel}: ${product.name}`}
              href={actionHref}
            >
              <ShoppingBag className="size-4" aria-hidden="true" />
              {commerceStatus.cardCtaLabel}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function StaticKineticImageFrame({ children }: { children: ReactNode }) {
  return (
    <div
      className="kinetic-image-motion"
      data-kinetic-image
      data-motion-enabled="false"
      data-motion-reduced="false"
      data-motion-scope="static"
    >
      <div className="kinetic-image-layer">{children}</div>
    </div>
  );
}

function getProductCardImageObjectPosition(product: CatalogProduct) {
  const focusRule = PRODUCT_CARD_IMAGE_POSITION_BY_SOURCE.find((rule) =>
    product.image.includes(rule.source),
  );

  return focusRule?.position ?? DEFAULT_PRODUCT_CARD_IMAGE_POSITION;
}

function createProductServiceHref(product: CatalogProduct, reason: string) {
  const params = new URLSearchParams({
    productReference: `${product.name} (${product.sku})`,
    reason,
  });

  return `/service?${params.toString()}`;
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
