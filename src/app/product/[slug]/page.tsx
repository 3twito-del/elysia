import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  ChevronDown,
  Gift,
  MessageCircle,
  RotateCcw,
  ShieldCheck,
  Truck,
} from "lucide-react";

import { ProductAnalytics } from "./_components/product-analytics";
import { ProductGallery } from "./_components/product-gallery";
import { ProductPurchasePanel } from "./_components/product-purchase-panel";
import { createProductServiceHref } from "./_components/product-purchase-utils";
import { RecentlyViewedProducts } from "./_components/recently-viewed-products";
import {
  getProductRecommendationRails,
  type ProductRecommendationRail,
} from "./_lib/product-recommendation-rails";
import { CommerceSectionHeader } from "~/components/commerce-section-header";
import { ProductCard } from "~/components/product-card";
import { SiteHeader } from "~/components/site-header";
import { RevealSection } from "~/components/reveal";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { getPublicProductCommerceStatus } from "~/lib/commerce-labels";
import { formatPrice } from "~/lib/format";
import { stringifyJsonLd } from "~/lib/json-ld";
import {
  legalPlaceholder,
  productSensitivityDisclaimer,
  productVisualDisclaimer,
  vatIncludedNotice,
} from "~/lib/legal-content";
import {
  getPublicCollectionName,
  getPublicProductName,
} from "~/lib/product-display";
import {
  getCatalogProductBySlug,
  listCatalogProducts,
  type CatalogProduct,
} from "~/server/services/catalog";
import { TRPCReactProvider } from "~/trpc/react";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ q?: string; position?: string }>;
};

type ServiceRowProps = {
  description: string;
  icon: LucideIcon;
  title: string;
};

const boutiqueImageByCategorySlug: Record<string, string> = {
  bracelets: "/brand/boutique/category-bracelets.avif",
  earrings: "/brand/boutique/category-earrings.avif",
  necklaces: "/brand/boutique/category-necklaces.avif",
  rings: "/brand/boutique/category-rings.avif",
};
const boutiqueProductDetailImage = "/brand/boutique/product-detail.avif";

export async function generateStaticParams() {
  const products = await listCatalogProducts();

  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getCatalogProductBySlug(slug);
  const publicProductName = product
    ? getPublicProductName(product.name)
    : undefined;

  return {
    title: publicProductName
      ? `${publicProductName} | Elysia Jewellery`
      : "תכשיט | Elysia Jewellery",
    description: product
      ? `${product.shortDescription} חומר, מחיר, זמינות ושירות לפני הזמנה.`
      : undefined,
    alternates: {
      canonical: `/product/${slug}`,
    },
    openGraph: product
      ? {
          title: publicProductName ?? product.name,
          description: `${product.shortDescription} חומר, מחיר וזמינות לפני הזמנה.`,
          url: `/product/${slug}`,
          images: [{ url: product.image }],
        }
      : undefined,
    twitter: product
      ? {
          card: "summary_large_image",
          title: publicProductName ?? product.name,
          description: `${product.shortDescription} חומר, מחיר וזמינות לפני הזמנה.`,
          images: [product.image],
        }
      : undefined,
  };
}

export default async function ProductPage({
  params,
  searchParams,
}: ProductPageProps) {
  const { slug } = await params;
  const search = searchParams ? await searchParams : {};
  const [product, allProducts] = await Promise.all([
    getCatalogProductBySlug(slug),
    listCatalogProducts(),
  ]);

  if (!product) notFound();

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
  const uniqueImages = getProductBoutiqueGalleryImages(product);
  const productMediaCaptionParts = [
    product.material ? `חומר: ${product.material}` : undefined,
    product.stone ? `אבן: ${product.stone}` : undefined,
    publicCollectionName ? `קולקציה: ${publicCollectionName}` : undefined,
  ].filter((part): part is string => Boolean(part));
  const productMediaCaption =
    productMediaCaptionParts.length > 0
      ? `בתמונה: ${productMediaCaptionParts.join(" · ")}.`
      : undefined;
  const productSale = getProductPageSale(product);
  const productSupportHref = createProductServiceHref({
    productReference: `${publicProductName} (${product.sku})`,
    reason: "שאלת התאמה, מידה, חומר, מתנה או מסירה לפני הזמנה.",
  });
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: publicProductName,
    sku: product.sku,
    image: product.image,
    description: product.shortDescription,
    brand: { "@type": "Brand", name: "Elysia" },
    category: publicCollectionName ?? product.categorySlug,
    material: product.material,
    offers: {
      "@type": "Offer",
      priceCurrency: "ILS",
      price: product.price,
      availability: commerceStatus.canAddToCart
        ? "https://schema.org/InStock"
        : "https://schema.org/PreOrder",
    },
  };
  const recommendationRails = getProductRecommendationRails({
    product,
    products: allProducts,
  });
  const searchReturnHref = search.q
    ? createSearchReturnHref(search.q)
    : undefined;
  const productSpecRows = getProductSpecificationRows({
    product,
    publicCollectionName,
  });
  const productCommerceDetails = [
    { label: "מסירה", value: product.deliveryPromise },
    { label: "החזרה", value: product.returnPolicy },
    { label: "אחריות", value: product.warranty },
    { label: "טיפול", value: product.careInstructions },
  ].filter(
    (detail): detail is { label: string; value: string } =>
      typeof detail.value === "string" && detail.value.length > 0,
  );
  const productTrustNotes = [
    {
      icon: ShieldCheck,
      label: "אחריות 12 חודשים לפגמי ייצור",
    },
    {
      icon: RotateCcw,
      label: "החלפה או החזרה לפי מדיניות Elysia",
    },
    {
      icon: MessageCircle,
      label: "שירות אישי לפני ואחרי הזמנה",
    },
  ];
  const productFaqItems = getProductFaqItems({
    deliveryPromise: product.deliveryPromise,
    productName: publicProductName,
    returnPolicy: product.returnPolicy,
  });

  return (
    <main className="bg-background">
      <SiteHeader />
      <ProductAnalytics
        path={`/product/${product.slug}`}
        position={search.position ? Number(search.position) : undefined}
        productSlug={product.slug}
        query={search.q}
      />
      <script
        dangerouslySetInnerHTML={{ __html: stringifyJsonLd(structuredData) }}
        type="application/ld+json"
      />

      <RevealSection
        className="mx-auto grid w-full max-w-[96rem] gap-6 px-[var(--ui-page-x)] py-[var(--ui-section-y-tight)] lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.42fr)] lg:gap-10 lg:px-[var(--ui-page-x-wide)] lg:py-[var(--ui-section-y)]"
        dir="ltr"
        id="product-buy"
        initialVisible
      >
        <div className="order-1 min-w-0 lg:sticky lg:top-24 lg:order-none lg:self-start">
          <ProductGallery
            images={uniqueImages}
            productName={publicProductName}
          />
          {productMediaCaption ? (
            <p
              className="text-muted-foreground mt-3 hidden text-sm leading-6 sm:block"
              data-testid="product-media-caption"
            >
              {productMediaCaption}
            </p>
          ) : null}
        </div>

        <aside className="order-2 min-w-0 lg:order-none" dir="rtl">
          <div className="mx-auto max-w-xl lg:mx-0">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-muted-foreground text-xs font-medium tracking-normal uppercase">
                תכשיטי Elysia
              </p>
            </div>

            <h1
              className="product-title-mixed-script mt-4 max-w-[17ch] text-3xl leading-[1.08] font-semibold break-words sm:text-4xl"
              data-testid="product-title"
              dir="auto"
            >
              {publicProductName}
            </h1>
            <p className="text-muted-foreground mt-4 line-clamp-3 max-w-prose text-base leading-7 sm:line-clamp-none">
              {product.shortDescription}
            </p>

            <div
              className="mt-6 grid gap-3"
              data-testid="product-price-availability-row"
            >
              <div className="flex flex-wrap items-center gap-2">
                {productSale ? (
                  <span className="grid gap-1">
                    <span className="text-muted-foreground text-xs">
                      מחיר מבצע
                    </span>
                    <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span className="text-2xl font-semibold tracking-normal sm:text-3xl">
                        {formatPrice(product.price)}
                      </span>
                      <span className="text-muted-foreground text-sm line-through decoration-[var(--glass-border-strong)]">
                        מחיר קודם {formatPrice(productSale.compareAt)}
                      </span>
                    </span>
                    {productSale.stockLimited ? (
                      <span className="text-muted-foreground text-xs">
                        עד גמר המלאי
                      </span>
                    ) : null}
                  </span>
                ) : (
                  <span className="text-2xl font-semibold tracking-normal sm:text-3xl">
                    {formatPrice(product.price)}
                  </span>
                )}
                <Badge variant="secondary">{commerceStatus.label}</Badge>
              </div>
              <p className="text-muted-foreground text-xs leading-5">
                {vatIncludedNotice}
              </p>

              {product.deliveryPromise ? (
                <div
                  className="glass-inset flex items-start gap-2 rounded-md border border-[var(--glass-border)] p-3 text-sm leading-6"
                  data-testid="product-delivery-estimate-badge"
                >
                  <Truck
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0"
                  />
                  <span>{product.deliveryPromise}</span>
                </div>
              ) : null}
            </div>

            <ul
              className="text-muted-foreground mt-5 hidden gap-2 text-sm leading-6 sm:grid"
              data-testid="product-trust-block"
            >
              {productTrustNotes.map((note) => {
                const Icon = note.icon;

                return (
                  <li
                    className="product-detail-trust-item flex items-center gap-2"
                    key={note.label}
                  >
                    <Icon aria-hidden="true" className="size-4 shrink-0" />
                    <span>{note.label}</span>
                  </li>
                );
              })}
            </ul>

            <div className="mt-7">
              <TRPCReactProvider>
                <ProductPurchasePanel
                  availabilityMode={product.availabilityMode}
                  categorySlug={product.categorySlug}
                  careInstructions={product.careInstructions}
                  deliveryPromise={product.deliveryPromise}
                  metalColors={product.metalColors}
                  price={product.price}
                  productName={publicProductName}
                  productReference={`${publicProductName} (${product.sku})`}
                  productSlug={product.slug}
                  requiresSeparateCheckout={product.requiresSeparateCheckout}
                  returnPolicy={product.returnPolicy}
                  variants={product.variants}
                  warranty={product.warranty}
                />
              </TRPCReactProvider>
            </div>

            <div
              className="mt-4 hidden flex-col gap-3 rounded-md border border-[var(--glass-border)] p-3 text-sm leading-6 sm:flex sm:flex-row sm:items-center sm:justify-between"
              data-testid="product-support-context-link"
            >
              <div className="flex min-w-0 gap-2">
                <MessageCircle
                  aria-hidden="true"
                  className="mt-1 size-4 shrink-0"
                />
                <p className="text-muted-foreground">
                  לוודא מידה, חומר, מתנה או מסירה? נצרף את המוצר לפנייה.
                </p>
              </div>
              <Button asChild className="shrink-0" size="sm" variant="outline">
                <Link href={productSupportHref}>שאלה על המוצר</Link>
              </Button>
            </div>

            <div
              className="mt-4 hidden rounded-md border border-[var(--glass-border)] p-3 text-sm leading-6 sm:block"
              data-testid="product-gift-ready-note"
            >
              <div className="flex gap-2">
                <Gift aria-hidden="true" className="mt-1 size-4 shrink-0" />
                <div>
                  <p className="font-medium">מתאים גם כמתנה</p>
                  <p className="text-muted-foreground mt-1">
                    אפשר לבחור לפי אירוע, תקציב וסגנון, ולפנות לשירות אם צריך
                    לוודא מידה או גוון לפני ההזמנה.
                  </p>
                </div>
              </div>
            </div>

            <section
              aria-labelledby="product-specification-title"
              className="border-border mt-7 grid gap-4 border-y py-4"
              data-public-floating-avoid="true"
              data-testid="product-specification-block"
            >
              <h2
                className="text-lg font-semibold"
                id="product-specification-title"
              >
                מפרט המוצר
              </h2>
              <dl className="grid divide-y">
                {productSpecRows.map((fact) => (
                  <div
                    className="grid gap-1 py-3 text-sm sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-4"
                    key={fact.label}
                  >
                    <dt className="text-muted-foreground">{fact.label}</dt>
                    <dd className="leading-6 font-medium">{fact.value}</dd>
                  </div>
                ))}
              </dl>
              <div
                className="text-muted-foreground grid gap-2 text-xs leading-5"
                data-testid="product-legal-disclaimers"
              >
                <p>{productVisualDisclaimer}</p>
                <p>{productSensitivityDisclaimer}</p>
              </div>
            </section>

            {productCommerceDetails.length > 0 ? (
              <div
                className="mt-5 grid gap-2"
                data-exclusive-details-group
                data-testid="product-commerce-details"
              >
                {productCommerceDetails.map((detail) => (
                  <details
                    className="group rounded-md border border-[var(--glass-border)] p-3"
                    key={detail.label}
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium focus-visible:ring-3 focus-visible:ring-[var(--glass-focus)] focus-visible:outline-none [&::-webkit-details-marker]:hidden">
                      <span>{detail.label}</span>
                      <ChevronDown
                        aria-hidden="true"
                        className="size-4 shrink-0 transition-transform group-open:rotate-180"
                      />
                    </summary>
                    <p className="text-muted-foreground mt-2 text-sm leading-6">
                      {detail.value}
                    </p>
                  </details>
                ))}
              </div>
            ) : null}
          </div>
        </aside>
      </RevealSection>

      <RevealSection
        className="brand-page-band border-y px-[var(--ui-page-x)] py-[var(--ui-section-y)] lg:px-[var(--ui-page-x-wide)]"
        id="product-details"
      >
        <div
          className="mx-auto grid max-w-[76rem] gap-8 lg:gap-10"
          data-testid="product-service-details-layout"
        >
          <CommerceSectionHeader
            className="mb-0"
            eyebrow="Elysia"
            title="מה חשוב לדעת לפני שמזמינים"
          />

          <div className="grid gap-8">
            <p className="text-muted-foreground hidden text-base leading-8 sm:block">
              {product.description}
            </p>

            <div
              className="brand-surface divide-border hidden divide-y overflow-hidden rounded-md sm:block"
              data-testid="product-service-summary"
            >
              <ServiceRow
                description="אחריות 12 חודשים לפגמי ייצור, עם אפשרות לפתוח בקשה מסודרת אם משהו לא תקין."
                icon={ShieldCheck}
                title="אחריות 12 חודשים"
              />
              <ServiceRow
                description="החלפה או החזרה לפי מדיניות Elysia, בשפה ברורה לפני הטקסט המשפטי."
                icon={RotateCcw}
                title="החלפה והחזרה"
              />
              <ServiceRow
                description="אפשר לקבל ייעוץ מידה, התאמה ומתנה לפני הזמנה, עם שם התכשיט מצורף לפנייה."
                icon={MessageCircle}
                title="שירות אישי"
              />
            </div>

            <ProductFaq items={productFaqItems} />
          </div>
        </div>

        <ProductRecommendationRails
          rails={recommendationRails}
          searchReturnHref={searchReturnHref}
          searchReturnLabel={
            search.q ? `חזרה לתוצאות עבור "${search.q}"` : undefined
          }
        />
        <RecentlyViewedProducts
          currentSlug={product.slug}
          products={allProducts}
        />
      </RevealSection>
    </main>
  );
}

function ProductFaq({
  items,
}: {
  items: Array<{ answer: string; question: string }>;
}) {
  return (
    <section
      aria-labelledby="product-faq-title"
      className="grid gap-3"
      data-exclusive-details-group
      data-testid="product-faq"
    >
      <h2 className="text-xl font-semibold" id="product-faq-title">
        שאלות לפני הזמנה
      </h2>
      <div className="grid gap-2">
        {items.map((item) => (
          <details
            className="group rounded-md border border-[var(--glass-border)] p-3"
            key={item.question}
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium focus-visible:ring-3 focus-visible:ring-[var(--glass-focus)] focus-visible:outline-none [&::-webkit-details-marker]:hidden">
              <span>{item.question}</span>
              <ChevronDown
                aria-hidden="true"
                className="size-4 shrink-0 transition-transform group-open:rotate-180"
              />
            </summary>
            <p className="text-muted-foreground mt-2 text-sm leading-6">
              {item.answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}

function ServiceRow({ description, icon: Icon, title }: ServiceRowProps) {
  return (
    <div
      className="grid gap-3 px-5 py-5 sm:grid-cols-[2.75rem_minmax(0,1fr)] sm:gap-5 sm:px-6 lg:px-7"
      data-testid="product-service-row"
    >
      <span
        className="border-border bg-background flex size-10 items-center justify-center rounded-full border"
        data-testid="product-service-row-icon"
      >
        <Icon aria-hidden="true" className="size-4" />
      </span>
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="text-muted-foreground mt-2 leading-7">{description}</p>
      </div>
    </div>
  );
}

function getProductFaqItems(input: {
  deliveryPromise?: string;
  productName: string;
  returnPolicy?: string;
}) {
  return [
    {
      question: "איך יודעים אם המידה מתאימה?",
      answer:
        "בדקו את מדריך המידות ואת המידות בעמוד. אם יש התלבטות, שלחו שאלה עם שם התכשיט.",
    },
    {
      question: `${input.productName} מתאים למתנה?`,
      answer:
        "כן. מומלץ לבחור לפי סגנון, גוון ותקציב. אם המידה לא בטוחה, נוכל לעזור לפני הקנייה.",
    },
    {
      question: "מה חשוב לדעת על משלוח והחזרה?",
      answer: [
        input.deliveryPromise ?? "מסירה מתבצעת לפי אפשרויות המשלוח באתר.",
        input.returnPolicy ?? "החלפה או החזרה מתבצעות לפי מדיניות Elysia.",
      ].join(" "),
    },
  ];
}

function getProductPageSale(product: CatalogProduct) {
  if (!product.compareAt || product.compareAt <= product.price) return null;

  const availableQuantity = Object.values(product.inventory).reduce(
    (total, quantity) => total + quantity,
    0,
  );

  return {
    compareAt: product.compareAt,
    stockLimited:
      product.availabilityMode === "READY_TO_ORDER" && availableQuantity > 0,
  };
}

function getProductSpecificationRows(input: {
  product: CatalogProduct;
  publicCollectionName?: string;
}) {
  const { product } = input;
  const stoneColors = getUniqueProductVariantValues(
    product.variants.map((variant) => variant.stoneColor),
  );
  const colorValues = [
    ...product.metalColors,
    ...stoneColors.map((color) => `אבן: ${color}`),
  ];

  return [
    {
      label: "חומר בסיס",
      value: getProductBaseMaterialValue(product.material),
    },
    { label: "ציפוי", value: getProductCoatingValue(product.material) },
    {
      label: "סוג אבן / פנינה / קריסטל",
      value: product.stone ?? legalPlaceholder,
    },
    {
      label: "מידה / אורך / קוטר / משקל",
      value: getProductMeasurementValue(product),
    },
    {
      label: "צבע",
      value: colorValues.length > 0 ? colorValues.join(", ") : legalPlaceholder,
    },
    // TODO: Replace with verified country of manufacture before production.
    { label: "ארץ ייצור", value: legalPlaceholder },
    // TODO: Replace with verified manufacturer/importer before production.
    { label: "יצרן / יבואן", value: legalPlaceholder },
    {
      label: "אחריות",
      value:
        product.warranty ??
        "12 חודשים לפגמי ייצור בלבד, בכפוף למדיניות האחריות.",
    },
    {
      label: "הוראות טיפול",
      value:
        product.careInstructions ??
        "להסיר לפני מקלחת, ים, בריכה, שינה וספורט; להימנע מבושם, כלור וחומרי ניקוי.",
    },
    { label: "הערת רגישות למתכות", value: productSensitivityDisclaimer },
  ];
}

function getProductBaseMaterialValue(material: string) {
  if (!material || material === legalPlaceholder) {
    // TODO: Replace with verified product material before production.
    return `חומר: ${legalPlaceholder}`;
  }

  return material;
}

function getProductCoatingValue(material: string) {
  if (/ציפוי|מצופה|plated|coating|gold fill/i.test(material)) {
    return material;
  }

  return legalPlaceholder;
}

function getProductMeasurementValue(product: CatalogProduct) {
  if (product.sizes.length > 0) {
    return `מידות זמינות: ${product.sizes.join(", ")}`;
  }

  const variantSizes = getUniqueProductVariantValues(
    product.variants.map((variant) => variant.size),
  );

  if (variantSizes.length > 0) {
    return `מידות זמינות: ${variantSizes.join(", ")}`;
  }

  return legalPlaceholder;
}

function getUniqueProductVariantValues(values: Array<string | undefined>) {
  return Array.from(
    new Set(values.filter((value): value is string => Boolean(value?.trim()))),
  );
}

function ProductRecommendationRails({
  rails,
  searchReturnHref,
  searchReturnLabel,
}: {
  rails: ProductRecommendationRail[];
  searchReturnHref?: string;
  searchReturnLabel?: string;
}) {
  if (rails.length === 0) return null;

  return (
    <div
      className="mx-auto mt-10 grid max-w-7xl gap-9"
      data-testid="product-recommendation-rails"
      id="similar-products"
    >
      {searchReturnHref && searchReturnLabel ? (
        <div
          className="flex flex-wrap items-center justify-between gap-3"
          data-testid="product-discovery-return-context"
        >
          <p className="text-muted-foreground text-sm leading-6">
            הגעתם מחיפוש. אפשר לחזור לתוצאות בלי לאבד את ההקשר.
          </p>
          <Button asChild size="sm" variant="outline">
            <Link href={searchReturnHref}>{searchReturnLabel}</Link>
          </Button>
        </div>
      ) : null}
      {rails.map((rail) => {
        const headingId = `product-recommendation-${rail.id}`;

        return (
          <section
            aria-labelledby={headingId}
            className="border-border border-t pt-7"
            data-testid={`product-recommendation-rail-${rail.id}`}
            key={rail.id}
          >
            <CommerceSectionHeader
              eyebrow="עוד כיוון"
              id={headingId}
              title={rail.title}
            />
            <div
              className="text-muted-foreground mt-2 flex flex-wrap items-center justify-between gap-3 text-sm leading-6"
              data-testid="product-recommendation-rail-context"
            >
              <p>{rail.reason}</p>
              <Button asChild size="sm" variant="ghost">
                <Link href={rail.continuationHref}>
                  {rail.continuationLabel}
                </Link>
              </Button>
            </div>
            <div
              className="ui-equal-grid mt-5 grid gap-x-7 gap-y-10 sm:grid-cols-2 lg:grid-cols-3"
              data-layout-equal-group={`product-recommendation-${rail.id}`}
            >
              {rail.products.slice(0, 3).map((recommended) => (
                <ProductCard
                  contextLabel={rail.cardContextLabel}
                  key={recommended.slug}
                  product={recommended}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function createSearchReturnHref(query: string) {
  const params = new URLSearchParams({ q: query });

  return `/search?${params.toString()}`;
}

function getProductBoutiqueGalleryImages(product: CatalogProduct) {
  const categoryLifestyleImage =
    boutiqueImageByCategorySlug[product.categorySlug];

  return Array.from(
    new Set(
      [
        product.image,
        ...product.images,
        categoryLifestyleImage,
        boutiqueProductDetailImage,
        "/brand/boutique/lifestyle-hero.avif",
      ].filter((image): image is string => Boolean(image)),
    ),
  ).slice(0, 6);
}
