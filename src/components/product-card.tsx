import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent } from "~/components/ui/card";
import { ProductCardFavoriteButton } from "~/components/product-card-favorite-button";
import { getPublicProductCommerceStatus } from "~/lib/commerce-labels";
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
  const href = createProductHref(product.slug, searchContext);
  const imageObjectPosition = getProductCardImageObjectPosition(product);
  const productDetails = [product.material, product.stone].filter(
    (detail): detail is string => Boolean(detail),
  );
  const shouldShowAvailability =
    isUnavailable || product.availabilityMode !== "READY_TO_ORDER";

  return (
    <Card
      aria-label={product.name}
      className={cn(
        "product-card-shell group/card relative h-full min-w-0 gap-0 overflow-hidden rounded-md border-0 bg-transparent py-0 shadow-none transition focus-within:ring-3 focus-within:ring-[var(--glass-focus)]",
        isUnavailable && "bg-muted/30",
      )}
      data-public-floating-avoid="true"
      data-testid="product-card"
    >
      <Link
        aria-label={`צפייה בתכשיט ${product.name}`}
        className="group/product-link block h-full min-w-0 focus-visible:ring-3 focus-visible:ring-[var(--glass-focus)] focus-visible:outline-none"
        href={href}
        prefetch={false}
      >
        <div className="brand-product-media bg-muted/60 relative aspect-[5/4] overflow-hidden rounded-md border-0 sm:aspect-[4/5]">
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
          {isUnavailable ? (
            <div className="absolute top-2.5 left-2.5 flex items-start gap-2">
              <Badge variant="destructive">לא פנוי כרגע</Badge>
            </div>
          ) : null}
        </div>
        <CardContent className="flex min-h-28 flex-1 flex-col gap-2.5 px-0 pt-3 pb-0 sm:min-h-32 sm:gap-3">
          <div className="flex items-start justify-between gap-2.5 sm:gap-3">
            <div className="min-w-0">
              <h3
                className="group-hover/product-link:text-muted-foreground group-focus-visible/product-link:text-muted-foreground line-clamp-2 min-h-10 text-base leading-[1.4] font-medium transition-colors duration-[var(--motion-fast)] ease-[var(--ease-motion-standard)] sm:min-h-11 sm:leading-[1.45]"
                dir="auto"
              >
                {product.name}
              </h3>
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
            </div>
          </div>

          <div className="mt-auto grid gap-2.5">
            <div className="grid min-h-10 grid-cols-[minmax(0,1fr)_auto] items-end gap-2.5 sm:min-h-12 sm:gap-3">
              <div className="min-w-0">
                <span className="block text-lg leading-6 font-semibold sm:text-xl sm:leading-7">
                  {formatPrice(product.price)}
                </span>
              </div>
              {shouldShowAvailability ? (
                <span
                  className={cn(
                    "brand-icon-well flex max-w-32 shrink-0 items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs",
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
              ) : null}
            </div>
          </div>
        </CardContent>
      </Link>
      <div className="bg-background absolute top-2.5 right-2.5 z-10 rounded-md">
        <ProductCardFavoriteButton
          productName={product.name}
          productSlug={product.slug}
        />
      </div>
    </Card>
  );
}

function StaticKineticImageFrame({ children }: { children: ReactNode }) {
  return (
    <div
      className="kinetic-image-motion"
      data-kinetic-image
      data-motion-enabled="false"
      data-motion-reduced="true"
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
