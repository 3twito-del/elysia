import Link from "next/link";

import { BrandMediaPanel } from "~/components/brand-media-panel";
import { CinematicPageHero } from "~/components/cinematic-page-hero";
import { ProductCard } from "~/components/product-card";
import { RevealGrid, RevealSection } from "~/components/reveal";
import { SiteHeader } from "~/components/site-header";
import { Button } from "~/components/ui/button";
import { brandMedia, cinematicRouteMedia } from "~/lib/brand-media";
import {
  getFeaturedCatalogProducts,
  searchCatalogProducts,
} from "~/server/services/catalog";

export const metadata = {
  title: "מתנות",
};

export default async function GiftsPage() {
  const giftProducts = await searchCatalogProducts({ query: "מתנה" });
  const products =
    giftProducts.length > 0
      ? giftProducts
      : await getFeaturedCatalogProducts(8);

  return (
    <main>
      <SiteHeader />
      <CinematicPageHero
        actions={
          <>
            <Button asChild size="lg">
              <Link href="#gift-products">למתנות</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/ai?tool=gifts">שאלון מתנה</Link>
            </Button>
          </>
        }
        description="בחירות קלות לקנייה עם אריזת מתנה, ברכה אישית והתאמה לפי תקציב."
        eyebrow="Aphrodite Gifts"
        scrollCue={{ href: "#gift-products", label: "למתנות" }}
        slides={cinematicRouteMedia.gifts}
        stats={[
          { label: "בחירות", value: String(products.length) },
          { label: "ייעוץ", value: "AI" },
          { label: "אריזה", value: "מתנה" },
        ]}
        title="מתנות תכשיטים"
        variant="commerce"
      />
      <RevealSection
        className="mx-auto max-w-7xl px-4 py-12 sm:px-6"
        id="gift-products"
      >
        <div
          className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-end"
          id="gift-advisor"
        >
          <div>
            <h2 className="text-4xl font-semibold">מתנות תכשיטים</h2>
            <p className="text-muted-foreground mt-3 max-w-2xl leading-7">
              בחירות קלות לקנייה עם אריזת מתנה, ברכה אישית והתאמה לפי תקציב.
            </p>
          </div>
          <div className="grid gap-3">
            <BrandMediaPanel
              alt="מגש תכשיטים למתנה בגוון אקווה"
              className="hidden h-32 lg:block"
              priority
              sizes="280px"
              slides={brandMedia.gifts}
              variant="compact"
            />
            <Button asChild variant="secondary">
              <Link href="/ai?tool=gifts">שאלון מתנה חכם</Link>
            </Button>
          </div>
        </div>
        <RevealGrid
          className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
          variant="cards"
        >
          {products.map((product, index) => (
            <ProductCard
              imagePriority={index === 0}
              key={product.slug}
              product={product}
            />
          ))}
        </RevealGrid>
      </RevealSection>
    </main>
  );
}
