import Link from "next/link";

import { CommercePageHero } from "~/components/commerce-page-hero";
import { CommerceSectionHeader } from "~/components/commerce-section-header";
import { ProductCard } from "~/components/product-card";
import { RevealGrid, RevealSection } from "~/components/reveal";
import { SiteHeader } from "~/components/site-header";
import { Button } from "~/components/ui/button";
import { cinematicRouteMedia } from "~/lib/brand-media";
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
      <CommercePageHero
        actions={
          <>
            <Button asChild>
              <Link href="#gift-products">למתנות</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/ai?tool=gifts">שאלון מתנה</Link>
            </Button>
          </>
        }
        description="בחירות קלות לקנייה עם אריזת מתנה, ברכה אישית והתאמה לפי תקציב."
        eyebrow="Aphrodite Gifts"
        id="page-hero"
        media={{
          alt: "Aphrodite gifts",
          priority: true,
          slides: cinematicRouteMedia.gifts,
        }}
        metrics={[
          { label: "בחירות", value: String(products.length) },
          { label: "ייעוץ", value: "AI" },
          { label: "אריזה", value: "מתנה" },
        ]}
        title="מתנות תכשיטים"
        variant="content"
      />
      <RevealSection
        className="mx-auto max-w-7xl px-4 py-12 sm:px-6"
        id="gift-products"
      >
        <CommerceSectionHeader
          action={
            <Button asChild variant="secondary">
              <Link href="/ai?tool=gifts">שאלון מתנה חכם</Link>
            </Button>
          }
          description="פריטים שמתאימים למתנה, עם מסלול קצר לשאלון AI כשצריך דיוק נוסף."
          id="gift-advisor"
          title="בחירות זמינות עכשיו"
        />
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
