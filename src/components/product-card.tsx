import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent } from "~/components/ui/card";
import { formatPrice } from "~/lib/format";
import {
  getPublicCollectionName,
  getPublicProductName,
} from "~/lib/product-display";
import { cn } from "~/lib/utils";
import type { CatalogProduct } from "~/server/services/catalog";

type ProductCardProps = {
  contextLabel?: string;
  density?: "standard" | "compact";
  display?: "standard" | "editorial";
  imagePriority?: boolean;
  imageSizes?: string;
  product: CatalogProduct;
  searchContext?: {
    query?: string;
    position?: number;
  };
};

const PRODUCT_IMAGE_BLUR_DATA_URL =
  "data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='10'%20height='8'%20viewBox='0%200%2010%208'%3E%3Crect%20width='10'%20height='8'%20fill='%23f3eee8'/%3E%3C/svg%3E";
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
  density = "standard",
  display = "standard",
  imagePriority = false,
  imageSizes = DEFAULT_PRODUCT_CARD_IMAGE_SIZES,
  product,
  searchContext,
}: ProductCardProps) {
  const isEditorialDisplay = display === "editorial";
  const isCompactDensity = density === "compact" && !isEditorialDisplay;
  const publicProductName = getPublicProductName(product.name);
  const publicCollectionName = getPublicCollectionName(product.collection);
  const onlineStockQuantity = Object.values(product.inventory).reduce(
    (total, quantity) => total + quantity,
    0,
  );
  const isAvailable =
    product.availabilityMode === "READY_TO_ORDER" && onlineStockQuantity > 0;
  const isUnavailable =
    product.availabilityMode === "READY_TO_ORDER" && onlineStockQuantity <= 0;
  const href = createProductHref(product.slug, searchContext);
  const imageObjectPosition = getProductCardImageObjectPosition(product);
  const secondaryImage = getProductCardSecondaryImage(product);
  const sale = getProductCardSale(product);
  const productCardBadge = getProductCardBadge({
    product,
  });
  const { productMeta } = getProductCardMeta(product, publicCollectionName);
  const productDescriptor = getProductCardDescriptor(product);

  return (
    <Card
      aria-label={publicProductName}
      className={cn(
        "ui-equal-item product-card-shell group/card relative h-full min-w-0 gap-0 overflow-hidden rounded-md border-0 bg-transparent py-0 shadow-none transition focus-within:ring-3 focus-within:ring-[var(--glass-focus)]",
        isUnavailable && "opacity-90",
      )}
      data-public-floating-avoid="true"
      data-product-card-availability={
        isAvailable ? "available" : "consultation"
      }
      data-product-card-density={isCompactDensity ? "compact" : "standard"}
      data-product-card-display={display}
      data-product-card-sale={sale ? "true" : "false"}
      data-testid="product-card"
      dir="rtl"
    >
      <Link
        aria-label={`צפייה בתכשיט ${publicProductName}`}
        className="group/product-link block min-w-0 focus-visible:ring-3 focus-visible:ring-[var(--glass-focus)] focus-visible:outline-none"
        href={href}
        prefetch={false}
      >
        <div
          className={cn(
            "brand-product-media product-card-media bg-muted relative aspect-[5/4] overflow-hidden rounded-md border-0 sm:aspect-[4/5]",
            isCompactDensity && "product-card-media-compact",
          )}
        >
          <span
            aria-hidden="true"
            className="product-card-image-skeleton absolute inset-0"
            data-testid="product-card-image-skeleton"
          />
          <StaticKineticImageFrame>
            <Image
              alt={publicProductName}
              blurDataURL={PRODUCT_IMAGE_BLUR_DATA_URL}
              className="media-color product-card-image object-cover transition duration-[900ms] ease-[var(--ease-motion-standard)] group-focus-within/card:scale-[1.045] group-hover/card:scale-[1.045]"
              fill
              placeholder="blur"
              priority={imagePriority}
              sizes={imageSizes}
              src={product.image}
              style={{ objectPosition: imageObjectPosition }}
            />
            {secondaryImage ? (
              <Image
                alt=""
                aria-hidden="true"
                className="media-color product-card-hover-image object-cover opacity-0 transition duration-[680ms] ease-[var(--ease-motion-standard)] group-focus-within/card:scale-[1.055] group-focus-within/card:opacity-100 group-hover/card:scale-[1.055] group-hover/card:opacity-100"
                fill
                sizes={imageSizes}
                src={secondaryImage}
                style={{ objectPosition: imageObjectPosition }}
              />
            ) : null}
          </StaticKineticImageFrame>
          {!isEditorialDisplay && productCardBadge ? (
            <div
              className="product-card-badge-stack absolute top-2.5 left-2.5 z-10 max-w-[calc(100%-4.75rem)]"
              data-testid="product-card-badge"
            >
              <ProductCardBadge badge={productCardBadge} />
            </div>
          ) : null}
        </div>
        <CardContent
          className={cn(
            "flex min-h-28 flex-1 flex-col px-0 pt-4 pb-0 sm:min-h-32",
            isCompactDensity && "product-card-content-compact",
          )}
        >
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
                className="ui-text-slot product-card-title text-base font-medium [--ui-text-slot-line-height:1.45rem]"
                data-lines="2"
                dir="auto"
              >
                {publicProductName}
              </h3>
              {!isEditorialDisplay && productMeta ? (
                <div
                  className="ui-text-slot product-card-attributes text-muted-foreground truncate text-xs [--ui-text-slot-line-height:1.25rem]"
                  data-lines="1"
                  data-testid="product-card-attributes"
                  title={productMeta}
                >
                  {productMeta}
                </div>
              ) : null}
              {!isEditorialDisplay ? (
                <p
                  className={cn(
                    "ui-text-slot text-muted-foreground/90 text-xs leading-5 [--ui-text-slot-line-height:1.25rem]",
                    isCompactDensity && "product-card-descriptor-compact",
                  )}
                  data-lines="2"
                  data-testid="product-card-descriptor"
                >
                  {productDescriptor}
                </p>
              ) : null}
            </div>
          </div>

          <div className="mt-auto pt-4">
            <span
              data-sale={sale ? "true" : "false"}
              data-testid="product-card-price"
              className="product-card-commerce text-foreground block text-[1.08rem] leading-8 font-medium sm:text-[1.18rem]"
            >
              <span className="flex min-w-0 flex-wrap items-baseline gap-x-2.5 gap-y-1">
                <span className="product-card-price-main truncate">
                  {sale ? <span className="sr-only">מחיר מבצע </span> : null}
                  {formatPrice(product.price)}
                </span>
                {sale ? (
                  <span
                    aria-label={`מחיר קודם ${formatPrice(sale.compareAt)}`}
                    className="text-muted-foreground text-xs leading-5 font-normal line-through decoration-[var(--glass-border-strong)]"
                  >
                    {formatPrice(sale.compareAt)}
                  </span>
                ) : null}
              </span>
            </span>
            <span className="product-card-cta group-hover/product-link:border-foreground group-hover/product-link:text-foreground text-foreground mt-3 inline-flex min-h-11 w-fit items-center rounded-md border border-[var(--glass-border)] px-4 text-xs font-medium transition-colors">
              לפרטי התכשיט
            </span>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}

type ProductCardBadgeModel = {
  key: "gift" | "gold-plated" | "new" | "silver-925";
  label: string;
};

function ProductCardBadge({ badge }: { badge: ProductCardBadgeModel }) {
  return (
    <Badge
      className="product-card-status-badge max-w-full truncate"
      data-product-card-badge={badge.key}
      variant="outline"
    >
      {badge.label}
    </Badge>
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

function getProductCardSecondaryImage(product: CatalogProduct) {
  return product.images.find((image) => image !== product.image);
}

// A sale is shown only when the data carries a real compare-at price that is
// strictly higher than the current price. No inferred or fabricated discounts.
export function getProductCardSale(
  product: Pick<CatalogProduct, "compareAt" | "price">,
) {
  if (!product.compareAt || product.compareAt <= product.price) return null;

  return { compareAt: product.compareAt };
}

function getProductCardBadge(input: {
  product: CatalogProduct;
}): ProductCardBadgeModel | null {
  const productLabel = getProductCardLabel(input.product);

  if (productLabel) return productLabel;

  return null;
}

function getProductCardLabel(
  product: CatalogProduct,
): ProductCardBadgeModel | null {
  const normalizedMaterial = normalizeProductCardText(product.material);
  const normalizedTags = product.tags.map(normalizeProductCardText);
  const normalizedCollections = product.collections.map(
    normalizeProductCardText,
  );

  if (
    normalizedMaterial.includes("ציפוי") ||
    normalizedMaterial.includes("gold plated") ||
    normalizedMaterial.includes("plated")
  ) {
    return { key: "gold-plated", label: "ציפוי זהב" };
  }

  if (
    normalizedMaterial.includes("כסף") ||
    normalizedMaterial.includes("silver") ||
    normalizedMaterial.includes("925")
  ) {
    return { key: "silver-925", label: "כסף 925" };
  }

  if (
    normalizedTags.some(
      (tag) => tag.includes("מתנה") || tag.includes("gift"),
    ) ||
    normalizedCollections.some(
      (collection) =>
        collection.includes("מתנה") || collection.includes("gift"),
    )
  ) {
    return { key: "gift", label: "מתנה" };
  }

  if (isProductCardNew(product)) {
    return { key: "new", label: "חדש" };
  }

  return null;
}

function isProductCardNew(product: CatalogProduct) {
  const createdAt =
    product.createdAt instanceof Date
      ? product.createdAt.getTime()
      : Date.parse(product.createdAt);

  if (Number.isNaN(createdAt)) return false;

  const daysSinceCreated = (Date.now() - createdAt) / (1000 * 60 * 60 * 24);

  return daysSinceCreated <= 60;
}

function getProductCardDescriptor(product: CatalogProduct) {
  if (product.categorySlug === "rings") {
    return "נוכחות עדינה ליד, לבד או בשכבות.";
  }

  if (product.categorySlug === "necklaces") {
    return "קו עדין שמאיר מחשוף ושכבות.";
  }

  if (product.categorySlug === "earrings") {
    return "ברק קטן ליום, ערב ומתנה.";
  }

  if (product.categorySlug === "bracelets") {
    return "שכבה נקייה לפרק היד.";
  }

  if (product.stone) {
    return `${product.stone} שמוסיף נקודת אור עדינה.`;
  }

  if (product.material) {
    return `${product.material} בקו נקי לענידה.`;
  }

  return "קו נקי לענידה יומיומית.";
}

function normalizeProductCardText(value: string) {
  return value.trim().toLowerCase();
}

// Never surface internal/legal placeholder values (bracketed CMS fallbacks) as
// public product metadata — show only verified, bracket-free facts.
export function isDisplayableProductDetail(
  detail: string | null | undefined,
): detail is string {
  if (!detail) return false;

  const trimmed = detail.trim();

  return trimmed.length > 0 && !trimmed.includes("[") && !trimmed.includes("]");
}

// Build the quiet product-card metadata line. Placeholder/empty values are
// dropped so the card never renders brackets or a dangling "·" separator.
export function getProductCardMeta(
  product: Pick<CatalogProduct, "material">,
  publicCollectionName?: string,
) {
  const productDetails = [product.material, publicCollectionName].filter(
    (detail): detail is string => isDisplayableProductDetail(detail),
  );
  const productMeta = productDetails.join(" · ");

  return { productDetails, productMeta };
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
