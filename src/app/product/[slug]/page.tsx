import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Gem, RotateCcw, ShieldCheck } from "lucide-react";

import { ProductAnalytics } from "./_components/product-analytics";
import { ProductGallery } from "./_components/product-gallery";
import { ProductPurchasePanel } from "./_components/product-purchase-panel";
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
import { getProductAvailabilityLabel } from "~/lib/commerce-labels";
import { formatPrice } from "~/lib/format";
import { stringifyJsonLd } from "~/lib/json-ld";
import {
  getCatalogProductBySlug,
  listCatalogProducts,
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

export async function generateStaticParams() {
  const products = await listCatalogProducts();

  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getCatalogProductBySlug(slug);

  return {
    title: product?.name ?? "מוצר",
    description: product?.shortDescription,
    openGraph: product
      ? {
          title: product.name,
          description: product.shortDescription,
          images: [{ url: product.image }],
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

  const onlineStockQuantity = Object.values(product.inventory).reduce(
    (total, quantity) => total + quantity,
    0,
  );
  const uniqueImages = Array.from(new Set(product.images));
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.sku,
    image: product.image,
    description: product.shortDescription,
    brand: { "@type": "Brand", name: "Elysia" },
    offers: {
      "@type": "Offer",
      priceCurrency: "ILS",
      price: product.price,
      availability: "https://schema.org/InStock",
    },
  };
  const recommendationRails = getProductRecommendationRails({
    product,
    products: allProducts,
  });
  const productFacts = [
    { label: "חומר", value: product.material },
    { label: "קולקציה", value: product.collection },
    {
      label: "זמינות",
      value: getProductAvailabilityLabel(onlineStockQuantity),
    },
    { label: "מק״ט", value: product.sku },
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
        className="mx-auto grid max-w-[86rem] gap-7 px-[var(--ui-page-x)] py-[var(--ui-section-y-tight)] lg:grid-cols-[minmax(0,1.08fr)_minmax(21rem,0.72fr)] lg:gap-10 lg:px-[var(--ui-page-x-wide)] lg:py-[var(--ui-section-y)]"
        dir="ltr"
        id="product-buy"
        initialVisible
      >
        <div className="order-2 min-w-0 lg:order-none">
          <ProductGallery images={uniqueImages} productName={product.name} />
        </div>

        <aside
          className="order-1 min-w-0 lg:sticky lg:top-24 lg:order-none lg:self-start"
          dir="rtl"
        >
          <div className="mx-auto max-w-xl lg:mx-0">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-muted-foreground text-xs font-medium tracking-normal uppercase">
                תכשיטי Elysia
              </p>
            </div>

            <h1
              className="mt-4 max-w-[17ch] text-3xl leading-[1.08] font-semibold break-words sm:text-4xl"
              dir="auto"
            >
              {product.name}
            </h1>
            <p className="text-muted-foreground mt-4 max-w-prose text-base leading-7">
              {product.shortDescription}
            </p>

            <div className="mt-6 flex flex-wrap items-end gap-3">
              <span className="text-2xl font-semibold tracking-normal sm:text-3xl">
                {formatPrice(product.price)}
              </span>
              {product.compareAt ? (
                <span className="text-muted-foreground pb-1 text-sm line-through">
                  {formatPrice(product.compareAt)}
                </span>
              ) : null}
              <span className="border-border text-muted-foreground mb-1 rounded-full border px-3 py-1 text-xs">
                {getProductAvailabilityLabel(onlineStockQuantity)}
              </span>
            </div>

            <div className="mt-7">
              <TRPCReactProvider>
                <ProductPurchasePanel
                  metalColors={product.metalColors}
                  price={product.price}
                  productName={product.name}
                  productSlug={product.slug}
                  variants={product.variants}
                />
              </TRPCReactProvider>
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
          </div>
        </aside>
      </RevealSection>

      <RevealSection
        className="brand-page-band border-y px-[var(--ui-page-x)] py-[var(--ui-section-y-wide)] lg:px-[var(--ui-page-x-wide)]"
        id="product-details"
      >
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.88fr_1.12fr] lg:gap-12">
          <CommerceSectionHeader
            className="mb-0"
            eyebrow="הסטודיו של Elysia"
            title="תכשיט שנבחר כמו פריט אייקוני, לא כמו עוד מוצר בקטלוג."
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
                description="החזרה או החלפה לפי מדיניות האתר, באמצעות משלוח מתואם."
                icon={RotateCcw}
                title="החלפות והחזרות"
              />
              <ServiceRow
                description="אפשר לקבל ייעוץ אישי לבחירת מידה, התאמה ומתנה לפני השלמת ההזמנה."
                icon={Gem}
                title="ייעוץ אונליין"
              />
            </div>
          </div>
        </div>

        <ProductRecommendationRails rails={recommendationRails} />
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
}: {
  rails: ProductRecommendationRail[];
}) {
  if (rails.length === 0) return null;

  return (
    <div
      className="mx-auto mt-10 grid max-w-7xl gap-9"
      data-testid="product-recommendation-rails"
      id="similar-products"
    >
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
              action={
                <Badge className="rounded-full" variant="outline">
                  מתוך הקטלוג
                </Badge>
              }
              eyebrow="בחירה משלימה"
              id={headingId}
              title={rail.title}
            />
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {rail.products.map((recommended) => (
                <ProductCard key={recommended.slug} product={recommended} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
