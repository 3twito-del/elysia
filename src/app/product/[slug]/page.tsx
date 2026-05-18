import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Gem, RotateCcw, ShieldCheck, Sparkles } from "lucide-react";

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
import { Button } from "~/components/ui/button";
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
    brand: { "@type": "Brand", name: "Aphrodite" },
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
    <main className="bg-background pb-24 md:pb-0">
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
        className="mx-auto grid max-w-[92rem] gap-10 px-4 py-6 sm:px-6 sm:py-10 lg:grid-cols-[minmax(0,1.18fr)_minmax(22rem,0.82fr)] lg:gap-14"
        dir="ltr"
        id="product-buy"
        initialVisible
      >
        <div className="min-w-0">
          <ProductGallery images={uniqueImages} productName={product.name} />
        </div>

        <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start" dir="rtl">
          <div className="mx-auto max-w-xl lg:mx-0">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-muted-foreground text-xs font-medium tracking-[0.18em] uppercase">
                Aphrodite Fine Jewelry
              </p>
              <Badge className="rounded-full px-3" variant="secondary">
                {product.collection}
              </Badge>
            </div>

            <h1
              className="mt-6 max-w-[14ch] text-4xl leading-[1.08] font-semibold break-words sm:text-5xl"
              dir="auto"
            >
              {product.name}
            </h1>
            <p className="text-muted-foreground mt-5 max-w-prose text-lg leading-8">
              {product.shortDescription}
            </p>

            <div className="mt-7 flex flex-wrap items-end gap-3">
              <span className="text-3xl font-semibold tracking-normal">
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

            <div className="mt-8">
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

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Button
                asChild
                className="h-12 justify-between"
                variant="secondary"
              >
                <Link href={`/ai?product=${product.slug}`}>
                  מדידה חכמה
                  <Sparkles aria-hidden="true" className="size-4" />
                </Link>
              </Button>
            </div>

            <dl className="border-border mt-8 grid divide-y border-y">
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
        className="brand-page-band border-y px-4 py-14 sm:px-6 lg:py-20"
        id="product-details"
      >
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <CommerceSectionHeader
            className="mb-0"
            eyebrow="Aphrodite Atelier"
            title="תכשיט שנבחר כמו פריט אייקוני, לא כמו עוד מוצר בקטלוג."
          />

          <div className="grid gap-8">
            <p className="text-muted-foreground text-lg leading-9">
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
      className="mx-auto mt-14 grid max-w-7xl gap-12"
      data-testid="product-recommendation-rails"
      id="similar-products"
    >
      {rails.map((rail) => {
        const headingId = `product-recommendation-${rail.id}`;

        return (
          <section
            aria-labelledby={headingId}
            className="border-border border-t pt-10"
            data-testid={`product-recommendation-rail-${rail.id}`}
            key={rail.id}
          >
            <CommerceSectionHeader
              action={
                <Badge className="rounded-full" variant="outline">
                  מתוך הקטלוג
                </Badge>
              }
              eyebrow="Curated Selection"
              id={headingId}
              title={rail.title}
            />
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
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
