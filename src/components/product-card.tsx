import Image from "next/image";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent } from "~/components/ui/card";
import { ProductCardFavoriteButton } from "~/components/product-card-favorite-button";
import { ProductCardQuickAddButton } from "~/components/product-card-quick-add-button";
import { getPublicProductCommerceStatus } from "~/lib/commerce-labels";
import { formatPrice } from "~/lib/format";
import {
  getPublicCollectionName,
  getPublicProductName,
} from "~/lib/product-display";
import { cn } from "~/lib/utils";
import { isPublicSellableQuantityLowStock } from "~/server/services/inventory";
import type {
  CatalogProduct,
  CatalogProductVariant,
} from "~/server/services/catalog";

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
  const commerceStatus = getPublicProductCommerceStatus({
    availableQuantity: onlineStockQuantity,
    availabilityMode: product.availabilityMode,
  });
  const isAvailable = commerceStatus.canAddToCart;
  const isUnavailable =
    product.availabilityMode === "READY_TO_ORDER" && onlineStockQuantity <= 0;
  const href = createProductHref(product.slug, searchContext);
  const imageObjectPosition = getProductCardImageObjectPosition(product);
  const secondaryImage = getProductCardSecondaryImage(product);
  const sale = getProductCardSale(product);
  const lowStock = isProductCardLowStock({
    availableQuantity: onlineStockQuantity,
    product,
  });
  const productCardBadge = getProductCardBadge({
    lowStock,
    sale,
  });
  const productDetails = [
    product.material,
    product.stone,
    publicCollectionName,
  ].filter((detail): detail is string => Boolean(detail));
  const productMeta = productDetails.join(" · ");
  const productQuickFacts = [productMeta, commerceStatus.label].filter(
    (fact): fact is string => Boolean(fact),
  );
  const productQuickFactsLabel = productQuickFacts.join(" · ");
  const primaryCommerceLabel = isAvailable
    ? formatPrice(product.price)
    : "לייעוץ";
  const productDescriptor = getProductCardDescriptor(product);
  const materialBadgeLabel = getProductCardMaterialBadgeLabel(product);
  const swatches = getProductCardSwatches(product);
  const quickAddVariant = getProductCardQuickAddVariant({
    availableQuantity: onlineStockQuantity,
    product,
  });

  return (
    <Card
      aria-label={publicProductName}
      className={cn(
        "ui-equal-item product-card-shell group/card relative h-full min-w-0 gap-0 overflow-hidden rounded-md border-0 bg-transparent py-0 shadow-none transition focus-within:ring-3 focus-within:ring-[var(--glass-focus)]",
        isUnavailable && "opacity-90",
      )}
      data-public-floating-avoid="true"
      data-product-card-density={isCompactDensity ? "compact" : "standard"}
      data-product-card-display={display}
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
                className="ui-text-slot product-card-title group-hover/product-link:text-muted-foreground group-focus-visible/product-link:text-muted-foreground text-base font-medium transition-colors duration-[var(--motion-fast)] ease-[var(--ease-motion-standard)] [--ui-text-slot-line-height:1.45rem]"
                data-lines="2"
                dir="auto"
              >
                {publicProductName}
              </h3>
              {!isEditorialDisplay ? (
                <div
                  className="ui-text-slot product-card-attributes text-muted-foreground truncate text-xs [--ui-text-slot-line-height:1.25rem]"
                  data-lines="1"
                  data-testid="product-card-attributes"
                  title={productQuickFactsLabel}
                >
                  {productQuickFactsLabel}
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
              {!isEditorialDisplay &&
              (materialBadgeLabel || swatches.length > 0) ? (
                <div
                  className="product-card-material-cues flex min-h-5 min-w-0 flex-wrap items-center gap-1.5"
                  data-testid="product-card-material-cues"
                >
                  {materialBadgeLabel ? (
                    <span
                      className="product-card-material-badge max-w-full truncate rounded-full border border-[var(--glass-border)] px-2 py-0.5 text-[0.68rem] leading-4 font-medium"
                      data-testid="product-card-material-badge"
                    >
                      {materialBadgeLabel}
                    </span>
                  ) : null}
                  {swatches.length > 0 ? (
                    <span
                      aria-label="גווני חומר זמינים"
                      className="inline-flex items-center gap-1"
                      data-testid="product-card-swatches"
                    >
                      {swatches.map((swatch) => (
                        <span
                          aria-label={swatch.label}
                          className="product-card-swatch size-3 rounded-full border border-black/10"
                          data-material-swatch="true"
                          key={swatch.key}
                          role="img"
                          style={swatch.style}
                          title={swatch.label}
                        />
                      ))}
                    </span>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-auto pt-4">
            <span
              data-sale={sale ? "true" : "false"}
              data-testid="product-card-price"
              className={cn(
                "product-card-commerce block text-[0.94rem] leading-6 font-medium sm:text-base",
                isAvailable ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {isAvailable ? (
                <span className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span className="truncate">
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
              ) : (
                primaryCommerceLabel
              )}
            </span>
            <span className="text-muted-foreground product-card-cta group-hover/product-link:border-foreground group-hover/product-link:text-foreground mt-2 inline-flex w-fit border-b border-[var(--glass-border)] pb-0.5 text-xs font-medium transition-colors">
              לפרטי התכשיט
            </span>
          </div>
        </CardContent>
      </Link>
      {!isEditorialDisplay && quickAddVariant ? (
        <div
          className={cn("mt-3", isCompactDensity && "mt-2")}
          data-public-floating-avoid="true"
        >
          <ProductCardQuickAddButton
            productName={publicProductName}
            variantSku={quickAddVariant.sku}
          />
        </div>
      ) : null}
      {!isEditorialDisplay ? (
        <div className="product-card-favorite absolute top-2.5 right-2.5 z-10 rounded-md">
          <ProductCardFavoriteButton
            productName={publicProductName}
            productSlug={product.slug}
          />
        </div>
      ) : null}
    </Card>
  );
}

type ProductCardBadgeModel = {
  key: "low-stock" | "sale";
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

function getProductCardSale(product: CatalogProduct) {
  if (!product.compareAt || product.compareAt <= product.price) return null;

  return { compareAt: product.compareAt };
}

function isProductCardLowStock(input: {
  availableQuantity: number;
  product: CatalogProduct;
}) {
  return (
    input.product.availabilityMode === "READY_TO_ORDER" &&
    isPublicSellableQuantityLowStock(input.availableQuantity)
  );
}

function getProductCardBadge(input: {
  lowStock: boolean;
  sale: ReturnType<typeof getProductCardSale>;
}): ProductCardBadgeModel | null {
  if (input.sale) {
    return { key: "sale", label: "מבצע" };
  }

  if (input.lowStock) {
    return { key: "low-stock", label: "מלאי מוגבל" };
  }

  return null;
}

function getProductCardDescriptor(product: CatalogProduct) {
  if (product.categorySlug === "rings") {
    return "נוכחות עדינה ליד, לבד או בשילוב.";
  }

  if (product.categorySlug === "necklaces") {
    return "קו רך שמאיר חולצה, שמלה או מחשוף.";
  }

  if (product.categorySlug === "earrings") {
    return "ברק קטן שמחזיק יום, ערב וכל מעבר ביניהם.";
  }

  if (product.categorySlug === "bracelets") {
    return "שכבה דקה של אור על פרק היד.";
  }

  if (product.stone) {
    return `${product.stone} שנותנת לתכשיט רגע ברור משלו.`;
  }

  if (product.material) {
    return `${product.material} ללוק נקי, חם וקל לענידה.`;
  }

  return "פריט קטן עם נוכחות שמתחברת ללוק בלי מאמץ.";
}

function getProductCardMaterialBadgeLabel(product: CatalogProduct) {
  const normalizedStone = product.stone?.toLowerCase() ?? "";

  if (normalizedStone.includes("פנינ") || normalizedStone.includes("pearl")) {
    return product.stone;
  }

  return product.material || product.stone;
}

function getProductCardSwatches(product: CatalogProduct) {
  const materialSwatches = product.metalColors.map((color) => ({
    key: `metal-${color}`,
    label: `גוון מתכת: ${color}`,
    style: getProductCardSwatchStyle(color),
  }));

  if (materialSwatches.length > 0) return materialSwatches.slice(0, 3);

  return product.stone
    ? [
        {
          key: `stone-${product.stone}`,
          label: `אבן: ${product.stone}`,
          style: getProductCardSwatchStyle(product.stone),
        },
      ]
    : [];
}

function getProductCardSwatchStyle(value: string): CSSProperties {
  const normalized = value.toLowerCase();

  if (
    normalized.includes("ורוד") ||
    normalized.includes("rose") ||
    normalized.includes("pink")
  ) {
    return {
      background:
        "linear-gradient(135deg, #f7d7c7 0%, #c98e79 48%, #fff2eb 100%)",
    };
  }

  if (
    normalized.includes("לבן") ||
    normalized.includes("כסף") ||
    normalized.includes("silver") ||
    normalized.includes("white")
  ) {
    return {
      background:
        "linear-gradient(135deg, #ffffff 0%, #d7d9dd 48%, #f7f7f4 100%)",
    };
  }

  if (
    normalized.includes("פנינ") ||
    normalized.includes("pearl") ||
    normalized.includes("diamond") ||
    normalized.includes("יהלום")
  ) {
    return {
      background:
        "linear-gradient(135deg, #ffffff 0%, #e7e4df 52%, #f5efe8 100%)",
    };
  }

  return {
    background:
      "linear-gradient(135deg, #fff0b8 0%, #d4a63d 48%, #fff7d9 100%)",
  };
}

function getProductCardQuickAddVariant(input: {
  availableQuantity: number;
  product: CatalogProduct;
}): CatalogProductVariant | null {
  const [variant] = input.product.variants;

  if (!variant) return null;
  if (input.product.requiresSeparateCheckout) return null;
  if (input.product.availabilityMode !== "READY_TO_ORDER") return null;
  if (input.availableQuantity <= 0 || variant.availableQuantity <= 0) {
    return null;
  }
  if (input.product.variants.length !== 1) return null;
  if (input.product.sizes.length > 1) return null;
  if (input.product.metalColors.length > 1) return null;

  return variant;
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
