import Link from "next/link";

import { CommercePageHero } from "~/components/commerce-page-hero";
import { ProductCard } from "~/components/product-card";
import { RevealGrid, RevealSection } from "~/components/reveal";
import { SiteHeader } from "~/components/site-header";
import {
  getFeaturedCatalogProducts,
  searchCatalogProducts,
} from "~/server/services/catalog";

const GIFT_RESULTS_LIMIT = 24;

const giftBudgetChips = [
  {
    href: "/search?q=%D7%9E%D7%AA%D7%A0%D7%94&maxPrice=250",
    label: "עד 250 ₪",
  },
  {
    href: "/search?q=%D7%9E%D7%AA%D7%A0%D7%94&maxPrice=500",
    label: "עד 500 ₪",
  },
  {
    href: "/search?q=%D7%9E%D7%AA%D7%A0%D7%94&maxPrice=900",
    label: "עד 900 ₪",
  },
] as const;

const giftRecipientChips = [
  {
    href: "/search?q=%D7%9E%D7%AA%D7%A0%D7%94%20%D7%9C%D7%90%D7%9E%D7%90",
    label: "לאמא",
  },
  {
    href: "/search?q=%D7%9E%D7%AA%D7%A0%D7%94%20%D7%9C%D7%91%D7%AA%20%D7%96%D7%95%D7%92",
    label: "לבת זוג",
  },
  {
    href: "/search?q=%D7%9E%D7%AA%D7%A0%D7%94%20%D7%9C%D7%97%D7%91%D7%A8%D7%94",
    label: "לחברה",
  },
] as const;

const giftOccasionChips = [
  {
    href: "/search?q=%D7%9E%D7%AA%D7%A0%D7%AA%20%D7%99%D7%95%D7%9D%20%D7%94%D7%95%D7%9C%D7%93%D7%AA",
    label: "יום הולדת",
  },
  {
    href: "/search?q=%D7%9E%D7%AA%D7%A0%D7%AA%20%D7%99%D7%95%D7%9D%20%D7%A0%D7%99%D7%A9%D7%95%D7%90%D7%99%D7%9F",
    label: "יום נישואין",
  },
  {
    href: "/search?q=%D7%9E%D7%AA%D7%A0%D7%94%20%D7%9C%D7%97%D7%92",
    label: "חג",
  },
] as const;

export const metadata = {
  title: "מתנות",
};

export default async function GiftsPage() {
  const giftProducts = await searchCatalogProducts({ query: "מתנה" });
  const sourceProducts =
    giftProducts.length > 0
      ? giftProducts
      : await getFeaturedCatalogProducts(8);
  const products = sourceProducts.slice(0, GIFT_RESULTS_LIMIT);
  const hiddenProductsCount = sourceProducts.length - products.length;

  return (
    <main>
      <SiteHeader />
      <CommercePageHero
        description="בחירות מתנה לפי מחיר, חומר, אירוע ואפשרות לאריזה או ברכה."
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
                {hiddenProductsCount > 0
                  ? `${products.length} מתוך ${sourceProducts.length} בחירות למתנה`
                  : `${products.length} בחירות שמתאימות למתנה`}
              </p>
            </div>
            <Link
              className="text-muted-foreground hover:text-foreground text-sm font-medium underline-offset-4 hover:underline"
              href="/search?q=%D7%9E%D7%AA%D7%A0%D7%94"
            >
              חיפוש מתנה
            </Link>
          </div>
        </section>
        <section
          aria-labelledby="gift-discovery-title"
          className="mt-5 grid gap-4 border-b border-[var(--glass-border)] pb-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)]"
          data-testid="gift-discovery-chips"
        >
          <div>
            <p className="text-muted-foreground text-xs font-medium uppercase">
              מדריך בחירה מהיר
            </p>
            <h2
              className="mt-2 text-lg font-medium text-balance"
              id="gift-discovery-title"
            >
              התחילו מתקציב, נמען או אירוע
            </h2>
            <p className="text-muted-foreground mt-2 text-sm leading-6">
              כל בחירה פותחת חיפוש מוכן ומצמצמת את המבחר בלי להסתיר את שאר
              אפשרויות הסינון.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <GiftChipGroup label="תקציב" links={giftBudgetChips} />
            <GiftChipGroup label="למי" links={giftRecipientChips} />
            <GiftChipGroup label="אירוע" links={giftOccasionChips} />
          </div>
        </section>
        <RevealGrid
          className="ui-equal-grid mt-5 grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4"
          data-layout-equal-group="gift-products"
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

function GiftChipGroup({
  label,
  links,
}: {
  label: string;
  links: ReadonlyArray<{ href: string; label: string }>;
}) {
  return (
    <div className="min-w-0">
      <h3 className="text-sm font-medium">{label}</h3>
      <div className="mt-2 flex flex-wrap gap-2">
        {links.map((link) => (
          <Link
            className="border-border hover:border-foreground/50 hover:bg-muted/60 rounded-full border px-3 py-1.5 text-sm transition"
            href={link.href}
            key={link.href}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
