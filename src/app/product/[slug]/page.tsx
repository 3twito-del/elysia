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
import { buildProductStructuredData } from "~/lib/product-structured-data";
import {
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
  const structuredData = buildProductStructuredData({
    brandName: "Elysia",
    category: publicCollectionName ?? product.categorySlug,
    description: product.shortDescription,
    image: product.image,
    inStock: commerceStatus.canAddToCart,
    material: product.verifiedSpecifications?.materialDetails,
    name: publicProductName,
    price: product.price,
    priceCurrency: "ILS",
    sku: product.sku,
  });
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
  const productTrustNotes = [
    product.warranty
      ? {
          icon: ShieldCheck,
          label: product.warranty,
        }
      : null,
    product.returnPolicy
      ? {
          icon: RotateCcw,
          label: product.returnPolicy,
        }
      : null,
    {
      icon: MessageCircle,
      label: "שירות אישי לפני ואחרי הזמנה",
    },
  ].filter(
    (note): note is { icon: LucideIcon; label: string } => note !== null,
  );
  const productFaqItems = getProductFaqItems({
    deliveryPromise: product.deliveryPromise,
    productName: publicProductName,
    returnPolicy: product.returnPolicy,
  });

  return (
    <main className="elysia-page bg-background">
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
              className="product-title-mixed-script mt-2 max-w-[17ch] text-3xl leading-[1.08] font-semibold break-words sm:text-4xl"
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
                    <span className="line-clamp-1">{note.label}</span>
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

            <p
              className="text-muted-foreground mt-4 hidden items-center gap-1.5 text-sm sm:flex"
              data-testid="product-support-context-link"
            >
              <MessageCircle aria-hidden="true" className="size-3.5 shrink-0" />
              <span>יש לך שאלה על מידה, חומר או משלוח?</span>
              <Link
                className="text-foreground font-medium underline-offset-4 hover:underline"
                href={productSupportHref}
              >
                שאלה על המוצר
              </Link>
            </p>

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
          excludeSlugs={recommendationRails.flatMap((rail) =>
            rail.products.map((railProduct) => railProduct.slug),
          )}
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
        שאלות נפוצות על המוצר
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
                className="size-4 shrink-0 transition-transform duration-[var(--motion-fast)] ease-[var(--ease-standard)] group-open:rotate-180"
              />
            </summary>
            <p className="faq-answer-reveal text-muted-foreground mt-2 text-sm leading-6">
              {item.answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}

function getProductFaqItems(input: {
  deliveryPromise?: string;
  productName: string;
  returnPolicy?: string;
}) {
  const items = [
    {
      question: "איך יודעים אם המידה מתאימה?",
      answer:
        "בדקי את מדריך המידות ואת פרטי המידה בעמוד. אם יש התלבטות, שלחי לנו שאלה עם שם המוצר.",
    },
    {
      question: `${input.productName} מתאים למתנה?`,
      answer:
        "כן. מומלץ לבחור לפי סגנון, גוון ותקציב. אם המידה לא בטוחה, נוכל לעזור לפני הקנייה.",
    },
  ];

  const policyAnswer = [input.deliveryPromise, input.returnPolicy]
    .filter((value): value is string => Boolean(value?.trim()))
    .join(" ");

  if (policyAnswer) {
    items.push({
      question: "מה חשוב לדעת על משלוח והחזרה?",
      answer: policyAnswer,
    });
  }

  return items;
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
  const specifications = product.verifiedSpecifications;
  const stoneColors = getUniqueProductVariantValues(
    product.variants.map((variant) => variant.stoneColor),
  );
  const colorValues = [
    ...product.metalColors,
    ...stoneColors.map((color) => `אבן: ${color}`),
  ];

  const rows = [
    {
      label: "חומר",
      value: specifications?.materialDetails,
    },
    {
      label: "סוג אבן / פנינה / קריסטל",
      value: specifications?.stoneDetails,
    },
    {
      label: "מידה / אורך / קוטר / משקל",
      value: specifications?.measurements,
    },
    {
      label: "צבע",
      value:
        specifications && colorValues.length > 0
          ? colorValues.join(", ")
          : undefined,
    },
    { label: "ארץ ייצור", value: specifications?.countryOfManufacture },
    { label: "יצרן / יבואן", value: specifications?.manufacturerOrImporter },
    {
      label: "אחריות",
      value: product.warranty,
    },
    {
      label: "הוראות טיפול",
      value: product.careInstructions,
    },
    { label: "הערת רגישות למתכות", value: productSensitivityDisclaimer },
  ];

  return rows.filter((row): row is { label: string; value: string } =>
    Boolean(row.value?.trim()),
  );
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
            הגעת לכאן מחיפוש. אפשר לחזור לתוצאות בכל שלב.
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
              eyebrow="אולי יעניין אותך גם"
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
              className="ui-equal-grid mt-5 grid gap-x-7 gap-y-10 sm:grid-cols-2 lg:grid-cols-4"
              data-layout-equal-group={`product-recommendation-${rail.id}`}
            >
              {rail.products.slice(0, 4).map((recommended) => (
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
  return Array.from(
    new Set([product.image, ...product.images].filter(Boolean)),
  ).slice(0, 6);
}
