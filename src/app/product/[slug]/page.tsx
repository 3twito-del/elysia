import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarCheck, RotateCcw, ShieldCheck } from "lucide-react";

import { ProductAnalytics } from "./_components/product-analytics";
import { ProductPurchasePanel } from "./_components/product-purchase-panel";
import { RecentlyViewedProducts } from "./_components/recently-viewed-products";
import { ProductCard } from "~/components/product-card";
import { SiteHeader } from "~/components/site-header";
import { RevealGrid, RevealSection } from "~/components/reveal";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import {
  formatPrice,
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
  const [product, branches] = await Promise.all([
    getCatalogProductBySlug(slug),
    getCatalogBranches(),
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
  const allProducts = await listCatalogProducts();
  const similarProducts = allProducts
    .filter(
      (candidate) =>
        candidate.slug !== product.slug &&
        (candidate.categorySlug === product.categorySlug ||
          candidate.material === product.material ||
          candidate.collection === product.collection),
    )
    .slice(0, 4);

  return (
    <main>
      <SiteHeader />
      <ProductAnalytics
        path={`/product/${product.slug}`}
        position={search.position ? Number(search.position) : undefined}
        productSlug={product.slug}
        query={search.q}
      />
      <script
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        type="application/ld+json"
      />
      <RevealSection className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="grid gap-4">
          <div className="glass-inset relative aspect-square overflow-hidden rounded-md border">
            <Image
              alt={product.name}
              className="media-mono object-cover"
              fill
              priority
              sizes="(min-width: 1024px) 50vw, 100vw"
              src={product.image}
            />
          </div>
          <div className="glass-panel grid gap-3 rounded-md border p-3 sm:grid-cols-3">
            {[
              { label: "חומר", value: product.material },
              { label: "קולקציה", value: product.collection },
              {
                label: "זמינות",
                value: `${availableBranchCount} סניפים`,
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
          {uniqueImages.length > 1 ? (
            <div className="grid grid-cols-3 gap-3">
              {uniqueImages.map((image, index) => (
                <div
                  className="glass-inset relative aspect-square overflow-hidden rounded-md border"
                  key={image}
                >
                  <Image
                    alt={`${product.name} ${index + 1}`}
                    className="media-mono object-cover"
                    fill
                    sizes="(min-width: 1024px) 16vw, 33vw"
                    src={image}
                  />
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="lg:pt-4">
          <Badge className="mb-4" variant="secondary">
            {product.collection}
          </Badge>
          <h1 className="text-4xl font-semibold">{product.name}</h1>
          <p className="text-muted-foreground mt-4 text-lg leading-8">
            {product.shortDescription}
          </p>
          <div className="mt-6 flex items-end gap-3">
            <span className="text-3xl font-semibold">
              {formatPrice(product.price)}
            </span>
            {product.compareAt ? (
              <span className="text-muted-foreground pb-1 text-sm line-through">
                {formatPrice(product.compareAt)}
              </span>
            ) : null}
            <Badge className="mb-1" variant="secondary">
              {availableBranchCount} סניפים זמינים
            </Badge>
          </div>

          <Separator className="my-7" />

          <div className="mt-7 grid gap-3">
            <TRPCReactProvider>
              <ProductPurchasePanel
                metalColors={product.metalColors}
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

          <Card className="mt-8 rounded-md">
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
                    {available ? `${quantity} במלאי` : "לא זמין"}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </RevealSection>

      <RevealSection className="mx-auto max-w-7xl px-4 pb-14 sm:px-6">
        <RevealGrid className="grid gap-5 lg:grid-cols-3">
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
        {similarProducts.length > 0 ? (
          <div className="mt-12">
            <h2 className="text-2xl font-semibold">מוצרים דומים</h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {similarProducts.map((similar) => (
                <ProductCard key={similar.slug} product={similar} />
              ))}
            </div>
          </div>
        ) : null}
        <RecentlyViewedProducts
          currentSlug={product.slug}
          products={allProducts}
        />
      </RevealSection>
    </main>
  );
}
