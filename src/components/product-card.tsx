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
  contextLabel?: string;
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
  contextLabel,
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
  const productMeta = productDetails.join(" · ");
  const sourceFact = product.source === "DROPSHIP_SHOPIFY" ? "ספק מאומת" : null;
  const productQuickFacts = [
    productMeta,
    commerceStatus.label,
    sourceFact,
  ].filter((fact): fact is string => Boolean(fact));
  const productQuickFactsLabel = productQuickFacts.join(" · ");
  const primaryCommerceLabel = isAvailable
    ? formatPrice(product.price)
    : "לייעוץ אישי";

  return (
    <Card
      aria-label={product.name}
      className={cn(
        "ui-equal-item product-card-shell group/card relative h-full min-w-0 gap-0 overflow-hidden rounded-md border-0 bg-transparent py-0 shadow-none transition focus-within:ring-3 focus-within:ring-[var(--glass-focus)]",
        isUnavailable && "opacity-90",
      )}
      data-public-floating-avoid="true"
      data-testid="product-card"
      dir="rtl"
    >
      <Link
        aria-label={`צפייה בתכשיט ${product.name}`}
        className="group/product-link block h-full min-w-0 focus-visible:ring-3 focus-visible:ring-[var(--glass-focus)] focus-visible:outline-none"
        href={href}
        prefetch={false}
      >
        <div className="brand-product-media product-card-media bg-muted/60 relative aspect-[5/4] overflow-hidden rounded-md border-0 sm:aspect-[4/5]">
          <StaticKineticImageFrame>
            <Image
              alt={product.name}
              blurDataURL={PRODUCT_IMAGE_BLUR_DATA_URL}
              className="media-color product-card-image object-cover transition duration-[900ms] ease-[var(--ease-motion-standard)] group-hover/card:scale-[1.018]"
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
              <Badge className="product-card-status-badge" variant="outline">
                לייעוץ אישי
              </Badge>
            </div>
          ) : null}
        </div>
        <CardContent className="flex min-h-28 flex-1 flex-col px-0 pt-4 pb-0 sm:min-h-32">
          <div className="min-w-0">
            <div className="grid min-w-0 gap-1.5">
              {contextLabel ? (
                <p
                  className="text-muted-foreground truncate text-xs font-medium"
                  data-testid="product-card-context-label"
                >
                  {contextLabel}
                </p>
              ) : null}
              <h3
                className="ui-text-slot product-card-title group-hover/product-link:text-muted-foreground group-focus-visible/product-link:text-muted-foreground text-base font-medium transition-colors duration-[var(--motion-fast)] ease-[var(--ease-motion-standard)] [--ui-text-slot-line-height:1.45rem]"
                data-lines="2"
                dir="rtl"
              >
                {product.name}
              </h3>
              <div
                className="ui-text-slot product-card-attributes text-muted-foreground truncate text-xs [--ui-text-slot-line-height:1.25rem]"
                data-lines="1"
                data-testid="product-card-attributes"
                title={productQuickFactsLabel}
              >
                {productQuickFactsLabel}
              </div>
            </div>
          </div>

          <div className="mt-auto pt-4">
            <span
              className={cn(
                "product-card-commerce block truncate text-[0.94rem] leading-6 font-medium sm:text-base",
                isAvailable ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {primaryCommerceLabel}
            </span>
            <span className="text-muted-foreground product-card-cta group-hover/product-link:border-foreground group-hover/product-link:text-foreground mt-2 inline-flex w-fit border-b border-[var(--glass-border)] pb-0.5 text-xs font-medium transition-colors">
              לפרטי התכשיט
            </span>
          </div>
        </CardContent>
      </Link>
      <div className="product-card-favorite absolute top-2.5 right-2.5 z-10 rounded-md">
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
