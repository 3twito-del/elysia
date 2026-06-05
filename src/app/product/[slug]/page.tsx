import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  ChevronDown,
  Gem,
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
  icon: typeof Gem;
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
    title: publicProductName ?? "תכשיט",
    description: product?.shortDescription,
    alternates: {
      canonical: `/product/${slug}`,
    },
    openGraph: product
      ? {
          title: publicProductName ?? product.name,
          description: product.shortDescription,
          url: `/product/${slug}`,
          images: [{ url: product.image }],
        }
      : undefined,
    twitter: product
      ? {
          card: "summary_large_image",
          title: publicProductName ?? product.name,
          description: product.shortDescription,
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
  const productSupportHref = createProductServiceHref({
    productReference: `${publicProductName} (${product.sku})`,
    reason: "שאלת התאמה, מידה, חומר או מסירה לפני הזמנה.",
  });
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: publicProductName,
    sku: product.sku,
    image: product.image,
    description: product.shortDescription,
    brand: { "@type": "Brand", name: "Elysia" },
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
  const productFacts = [
    { label: "חומר", value: product.material },
    { label: "אבן", value: product.stone },
    { label: "קולקציה", value: publicCollectionName },
  ].filter(
    (fact): fact is { label: string; value: string } =>
      typeof fact.value === "string" && fact.value.length > 0,
  );
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
      label: "פרטים מאומתים לפני הזמנה",
    },
    {
      icon: Gem,
      label: "נבדק בקפידה לפני מסירה",
    },
    {
      icon: Truck,
      label: "ייעוץ ומסירה בתיאום אישי",
    },
  ];

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
        <div className="order-1 min-w-0 lg:order-none">
          <ProductGallery
            images={uniqueImages}
            productName={publicProductName}
          />
          {productMediaCaption ? (
            <p
              className="text-muted-foreground mt-3 text-sm leading-6"
              data-testid="product-media-caption"
            >
              {productMediaCaption}
            </p>
          ) : null}
        </div>

        <aside
          className="order-2 min-w-0 lg:sticky lg:top-24 lg:order-none lg:self-start"
          dir="rtl"
        >
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
                <span className="text-2xl font-semibold tracking-normal sm:text-3xl">
                  {formatPrice(product.price)}
                </span>
                <Badge variant="secondary">{commerceStatus.label}</Badge>
              </div>

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
              className="text-muted-foreground mt-5 grid gap-2 text-sm leading-6"
              data-testid="product-commerce-highlights"
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
                  productSource={product.source}
                  returnPolicy={product.returnPolicy}
                  variants={product.variants}
                  warranty={product.warranty}
                />
              </TRPCReactProvider>
            </div>

            <div
              className="mt-4 flex flex-col gap-3 rounded-md border border-[var(--glass-border)] p-3 text-sm leading-6 sm:flex-row sm:items-center sm:justify-between"
              data-testid="product-support-context-link"
            >
              <div className="flex min-w-0 gap-2">
                <MessageCircle
                  aria-hidden="true"
                  className="mt-1 size-4 shrink-0"
                />
                <p className="text-muted-foreground">
                  צריכים לוודא מידה, חומר או מסירה? נצרף את המוצר לפנייה.
                </p>
              </div>
              <Button asChild className="shrink-0" size="sm" variant="outline">
                <Link href={productSupportHref}>שאלה על המוצר</Link>
              </Button>
            </div>

            <dl
              className="border-border mt-7 grid divide-y border-y"
              data-public-floating-avoid="true"
            >
              {productFacts.map((fact) => (
                <div
                  className="grid grid-cols-[7rem_minmax(0,1fr)] gap-4 py-3 text-sm"
                  key={fact.label}
                >
                  <dt className="text-muted-foreground">{fact.label}</dt>
                  <dd className="font-medium">{fact.value}</dd>
                </div>
              ))}
            </dl>

            {productCommerceDetails.length > 0 ? (
              <div
                className="mt-5 grid gap-2"
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
        <div className="mx-auto grid max-w-[96rem] gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-10">
          <CommerceSectionHeader
            className="mb-0"
            eyebrow="הבית של Elysia"
            title="פרטי מוצר, שירות והזמנה במקום אחד."
          />

          <div className="grid gap-8">
            <p className="text-muted-foreground text-base leading-8">
              {product.description}
            </p>

            <div className="brand-surface divide-border divide-y overflow-hidden rounded-md">
              <ServiceRow
                description="אחריות לשנה על פגמי ייצור ושירות ניקוי ראשוני ללא עלות."
                icon={ShieldCheck}
                title="אחריות ושירות"
              />
              <ServiceRow
                description="החזרה או החלפה לפי מדיניות Elysia, באמצעות מסירה מתואמת."
                icon={RotateCcw}
                title="החלפות והחזרות"
              />
              <ServiceRow
                description="אפשר לקבל ייעוץ לבחירת מידה, התאמה ומתנה לפני השלמת ההזמנה."
                icon={Gem}
                title="ייעוץ"
              />
            </div>
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

function ServiceRow({ description, icon: Icon, title }: ServiceRowProps) {
  return (
    <div className="grid gap-3 py-5 sm:grid-cols-[auto_minmax(0,1fr)] sm:gap-4">
      <span className="border-border bg-background flex size-10 items-center justify-center rounded-full border">
        <Icon aria-hidden="true" className="size-4" />
      </span>
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="text-muted-foreground mt-2 leading-7">{description}</p>
      </div>
    </div>
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
            הגעתם ממסלול חיפוש. אפשר לחזור לתוצאות בלי לאבד את ההקשר.
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
              eyebrow="בחירה משלימה"
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
