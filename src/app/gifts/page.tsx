import Link from "next/link";

import { CommercePageHero } from "~/components/commerce-page-hero";
import { ProductCard } from "~/components/product-card";
import { RevealGrid, RevealSection } from "~/components/reveal";
import { SiteHeader } from "~/components/site-header";
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
        description="בחירות מתנה מדודות עם אריזה, ברכה אישית והתאמה לפי רגע, חומר ומחיר."
        eyebrow="מתנות Elysia"
        id="page-hero"
        title="למתנות"
        variant="catalog"
      />
      <RevealSection className="mx-auto max-w-7xl px-[var(--ui-page-x)] py-[var(--ui-section-y-tight)] lg:px-[var(--ui-page-x-wide)] lg:py-[var(--ui-section-y)]">
        <section
          aria-labelledby="gift-results"
          className="border-b border-[var(--glass-border)] pb-4"
          data-testid="gift-results-summary"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-medium" id="gift-results">
                בחירות פתוחות עכשיו
              </h2>
              <p className="text-muted-foreground text-sm">
                {products.length} בחירות שמתאימות למתנה
              </p>
            </div>
            <Link
              className="text-muted-foreground hover:text-foreground text-sm font-medium underline-offset-4 hover:underline"
              href="/search?q=%D7%9E%D7%AA%D7%A0%D7%94"
            >
              חיפוש מתנה מדויק
            </Link>
          </div>
        </section>
        <RevealGrid
          className="mt-5 grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4"
          data-testid="gift-results-grid"
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
