import Link from "next/link";

import { ProductCard } from "~/components/product-card";
import { RevealGrid, RevealSection } from "~/components/reveal";
import { SiteHeader } from "~/components/site-header";
import { Button } from "~/components/ui/button";
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
      <RevealSection className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-4xl font-semibold">מתנות תכשיטים</h1>
            <p className="text-muted-foreground mt-3 max-w-2xl leading-7">
              בחירות קלות לקנייה עם אריזת מתנה, ברכה אישית והתאמה לפי תקציב.
            </p>
          </div>
          <Button asChild variant="secondary">
            <Link href="/stylist">שאלון מתנה חכם</Link>
          </Button>
        </div>
        <RevealGrid className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </RevealGrid>
      </RevealSection>
    </main>
  );
}
