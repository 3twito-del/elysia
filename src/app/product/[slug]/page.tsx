import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarCheck, RotateCcw, ShieldCheck } from "lucide-react";

import { ProductAnalytics } from "./_components/product-analytics";
import { ProductGallery } from "./_components/product-gallery";
import { ProductPurchasePanel } from "./_components/product-purchase-panel";
import { RecentlyViewedProducts } from "./_components/recently-viewed-products";
import {
  getProductRecommendationRails,
  type ProductRecommendationRail,
} from "./_lib/product-recommendation-rails";
import { CinematicPageHero } from "~/components/cinematic-page-hero";
import { ProductCard } from "~/components/product-card";
import { SiteHeader } from "~/components/site-header";
import { RevealGrid, RevealSection } from "~/components/reveal";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import {
  getProductAvailabilityLabel,
  getStockQuantityLabel,
} from "~/lib/commerce-labels";
import { cinematicRouteMedia } from "~/lib/brand-media";
import { formatPrice } from "~/lib/format";
import { stringifyJsonLd } from "~/lib/json-ld";
import {
  getCatalogBranches,
  getCatalogBranchAvailability,
  getCatalogProductBySlug,
  listCatalogProducts,
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
  const [product, branches, allProducts] = await Promise.all([
    getCatalogProductBySlug(slug),
    getCatalogBranches(),
    listCatalogProducts(),
  ]);

  if (!product) notFound();

  const availability = getCatalogBranchAvailability({ product, branches });
  const availableBranchCount = availability.filter(
    ({ available }) => available,
  ).length;
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
  const productHeroSlides =
    uniqueImages.length > 0
      ? [
          ...uniqueImages.map((src) => ({
            alt: product.name,
            src,
          })),
          ...cinematicRouteMedia.product,
        ]
      : cinematicRouteMedia.product;
  return (
    <main className="pb-24 md:pb-0">
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
      <CinematicPageHero
        actions={
          <>
            <Button asChild size="lg">
              <Link href="#product-buy">בחירת מידה ורכישה</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="#product-availability">זמינות בסניפים</Link>
            </Button>
          </>
        }
        description={product.shortDescription}
        eyebrow={product.collection}
        scrollCue={{ href: "#product-buy", label: "לרכישה" }}
        slides={productHeroSlides}
        stats={[
          { label: "מחיר", value: formatPrice(product.price) },
          { label: "חומר", value: product.material },
          {
            label: "זמינות",
            value: getProductAvailabilityLabel(availableBranchCount),
          },
        ]}
        title={product.name}
        variant="product"
      />

      <RevealSection
        className="mx-auto grid max-w-7xl gap-8 px-4 py-6 sm:px-6 sm:py-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10"
        id="product-buy"
      >
        <div className="contents lg:grid lg:gap-4">
          <div className="brand-gallery-frame order-1 lg:order-none">
            <ProductGallery images={uniqueImages} productName={product.name} />
          </div>
          <div className="brand-commerce-panel glass-panel order-3 grid gap-3 rounded-md border p-3 sm:grid-cols-3 lg:order-none">
            {[
              { label: "חומר", value: product.material },
              { label: "קולקציה", value: product.collection },
              {
                label: "זמינות",
                value: getProductAvailabilityLabel(availableBranchCount),
              },
            ].map((fact) => (
              <div
                className="glass-inset rounded-md border p-3"
                key={fact.label}
              >
                <p className="text-muted-foreground text-xs">{fact.label}</p>
                <p className="mt-1 text-sm font-medium">{fact.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="brand-commerce-panel order-2 min-w-0 rounded-md border border-[var(--glass-border)] p-4 lg:order-none lg:p-5 lg:pt-4">
          <Badge className="mb-4" variant="secondary">
            {product.collection}
          </Badge>
          <h2
            className="text-3xl font-semibold break-words sm:text-4xl"
            dir="auto"
          >
            {product.name}
          </h2>
          <p className="text-muted-foreground mt-4 text-lg leading-8">
            {product.shortDescription}
          </p>
          <div className="mt-6 flex flex-wrap items-end gap-3">
            <span className="text-3xl font-semibold">
              {formatPrice(product.price)}
            </span>
            {product.compareAt ? (
              <span className="text-muted-foreground pb-1 text-sm line-through">
                {formatPrice(product.compareAt)}
              </span>
            ) : null}
            <Badge className="mb-1" variant="secondary">
              {getProductAvailabilityLabel(availableBranchCount)}
            </Badge>
          </div>

          <Separator className="my-7" />

          <div className="mt-7 grid gap-3">
            <TRPCReactProvider>
              <ProductPurchasePanel
                metalColors={product.metalColors}
                price={product.price}
                productName={product.name}
                productSlug={product.slug}
                variants={product.variants}
              />
            </TRPCReactProvider>
            <Button asChild variant="secondary">
              <Link href="/branches">
                תיאום בסניף
                <CalendarCheck className="size-4" />
              </Link>
            </Button>
          </div>

          <Card className="mt-8 rounded-md" id="product-availability">
            <CardHeader>
              <CardTitle className="text-lg">זמינות לפי סניף</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {availability.map(({ branch, quantity, available }) => (
                <div
                  className="glass-inset flex items-center justify-between rounded-md border p-3"
                  key={branch.slug}
                >
                  <div>
                    <p className="font-medium">{branch.name}</p>
                    <p className="text-muted-foreground text-sm">
                      {branch.address}
                    </p>
                  </div>
                  <Badge variant={available ? "outline" : "secondary"}>
                    {getStockQuantityLabel(quantity)}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </RevealSection>

      <RevealSection
        className="mx-auto max-w-7xl px-4 pb-14 sm:px-6"
        id="product-details"
      >
        <RevealGrid className="grid gap-5 lg:grid-cols-3" variant="compact">
          <Card className="rounded-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShieldCheck className="size-5" />
                אחריות
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground text-sm leading-7">
              אחריות לשנה על פגמי ייצור ושירות ניקוי ראשוני ללא עלות.
            </CardContent>
          </Card>
          <Card className="rounded-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <RotateCcw className="size-5" />
                החזרות
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground text-sm leading-7">
              החזרה או החלפה לפי מדיניות החנות, בסניף או במשלוח מתואם.
            </CardContent>
          </Card>
          <Card className="rounded-md">
            <CardHeader>
              <CardTitle className="text-lg">תיאור מלא</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground text-sm leading-7">
              {product.description}
            </CardContent>
          </Card>
        </RevealGrid>
        <ProductRecommendationRails rails={recommendationRails} />
        <RecentlyViewedProducts
          currentSlug={product.slug}
          products={allProducts}
        />
      </RevealSection>
    </main>
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
      className="mt-12 grid gap-8"
      data-testid="product-recommendation-rails"
      id="similar-products"
    >
      {rails.map((rail) => {
        const headingId = `product-recommendation-${rail.id}`;

        return (
          <section
            aria-labelledby={headingId}
            className="brand-similar-section rounded-md border p-4 sm:p-5"
            data-testid={`product-recommendation-rail-${rail.id}`}
            key={rail.id}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-2xl font-semibold" id={headingId}>
                {rail.title}
              </h2>
              <Badge variant="outline">מתוך הקטלוג</Badge>
            </div>
            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
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
