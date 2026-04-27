import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AphroditeIcon } from "~/components/icon";

import { SiteHeader } from "~/components/site-header";
import { RevealGrid, RevealSection } from "~/components/reveal";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import {
  getAvailability,
  getProductBySlug,
  products,
  formatPrice,
} from "~/lib/catalog";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);

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

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) notFound();

  const availability = getAvailability(product);
  const availableBranchCount = availability.filter(
    ({ available }) => available,
  ).length;
  const uniqueImages = Array.from(new Set([product.image]));
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

  return (
    <main>
      <SiteHeader />
      <script
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        type="application/ld+json"
      />
      <RevealSection className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="grid gap-4">
          <div className="relative aspect-square overflow-hidden rounded-md bg-black/[0.04]">
            <Image
              alt={product.name}
              className="object-cover"
              fill
              priority
              sizes="(min-width: 1024px) 50vw, 100vw"
              src={product.image}
            />
          </div>
          <div className="grid gap-3 rounded-md border border-black/10 bg-white/65 p-3 shadow-none backdrop-blur sm:grid-cols-3">
            {[
              { label: "חומר", value: product.material },
              { label: "קולקציה", value: product.collection },
              {
                label: "זמינות",
                value: `${availableBranchCount} סניפים`,
              },
            ].map((fact) => (
              <div
                className="rounded-md border border-black/10 bg-white/55 p-3"
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
                  className="relative aspect-square overflow-hidden rounded-md bg-black/[0.04]"
                  key={image}
                >
                  <Image
                    alt={`${product.name} ${index + 1}`}
                    className="object-cover"
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
          <Badge className="mb-4 shadow-none" variant="secondary">
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
            <Badge className="mb-1 shadow-none" variant="secondary">
              {availableBranchCount} סניפים זמינים
            </Badge>
          </div>

          <Separator className="my-7" />

          <div className="grid gap-5">
            <div>
              <p className="mb-2 text-sm font-medium">מידה</p>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size) => (
                  <Button
                    className="min-h-11 min-w-11 px-4"
                    key={size}
                    variant="outline"
                  >
                    {size}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">צבע מתכת</p>
              <div className="flex flex-wrap gap-2">
                {product.metalColors.map((color) => (
                  <Badge key={color} variant="secondary">
                    {color}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <Button asChild size="lg">
              <Link href={`/checkout?product=${product.slug}`}>
                הוספה לסל
                <AphroditeIcon name="package" className="size-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline">
              שמירה
              <AphroditeIcon name="heart" className="size-4" />
            </Button>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Button asChild variant="secondary">
              <Link href={`/stylist?product=${product.slug}`}>
                מדידה/AI
                <AphroditeIcon name="sparkle" className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/branches">
                תיאום בסניף
                <AphroditeIcon name="calendarCheck" className="size-4" />
              </Link>
            </Button>
          </div>

          <Card className="mt-8 rounded-md border-black/10 bg-white/65 shadow-none backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg">זמינות לפי סניף</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {availability.map(({ branch, quantity, available }) => (
                <div
                  className="flex items-center justify-between rounded-md border border-black/10 bg-white/45 p-3 backdrop-blur"
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
          <Card className="rounded-md border-black/10 bg-white/65 shadow-none backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <AphroditeIcon name="shieldCheck" className="size-5" />
                אחריות
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground text-sm leading-7">
              אחריות לשנה על פגמי ייצור ושירות ניקוי ראשוני ללא עלות.
            </CardContent>
          </Card>
          <Card className="rounded-md border-black/10 bg-white/65 shadow-none backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <AphroditeIcon name="return" className="size-5" />
                החזרות
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground text-sm leading-7">
              החזרה או החלפה לפי מדיניות החנות, בסניף או במשלוח מתואם.
            </CardContent>
          </Card>
          <Card className="rounded-md border-black/10 bg-white/65 shadow-none backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg">תיאור מלא</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground text-sm leading-7">
              {product.description}
            </CardContent>
          </Card>
        </RevealGrid>
      </RevealSection>
    </main>
  );
}
