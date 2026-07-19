import Link from "next/link";
import { Gift } from "lucide-react";

import { CompactPageIntro } from "~/components/compact-page-intro";
import { ProductCard } from "~/components/product-card";
import { RevealGrid, RevealSection } from "~/components/reveal";
import { SiteHeader } from "~/components/site-header";
import { Button } from "~/components/ui/button";
import { EmptyState } from "~/components/ui/empty-state";
import { formatInlinePrice, formatPlpResultCount } from "~/lib/format";
import {
  getFeaturedCatalogProducts,
  searchCatalogProducts,
  type CatalogProduct,
} from "~/server/services/catalog";

const GIFT_RESULTS_LIMIT = 24;
const giftBudgetThresholds = [250, 500, 900] as const;

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

const giftDecisionGroups = [
  { label: "תקציב", links: giftBudgetChips, step: "01" },
  { label: "למי", links: giftRecipientChips, step: "02" },
  { label: "אירוע", links: giftOccasionChips, step: "03" },
] as const;

export const metadata = {
  title: "מתנות",
  description: "רעיונות למתנות תכשיטים מ-Elysia לפי אירוע, מקבל/ת ותקציב.",
};

export default async function GiftsPage() {
  const giftProducts = await searchCatalogProducts({ query: "מתנה" });
  const sourceProducts =
    giftProducts.length > 0
      ? giftProducts
      : await getFeaturedCatalogProducts(8);
  const products = sourceProducts.slice(0, GIFT_RESULTS_LIMIT);
  const hiddenProductsCount = sourceProducts.length - products.length;
  const bundlePairs = getGiftBundlePairs(products);

  return (
    <main className="elysia-page">
      <SiteHeader />
      <CompactPageIntro
        description="בחרי מתנה לפי תקציב, נמענת או אירוע."
        eyebrow="מתנות"
        id="page-hero"
        title="מתנות"
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
              <div className="flex flex-wrap items-baseline gap-2">
                <h2 className="text-base font-medium" id="gift-results">
                  מתנות זמינות עכשיו
                </h2>
                {products.length > 0 ? (
                  <span
                    className="plp-result-count-badge text-muted-foreground text-sm font-normal"
                    data-testid="gift-result-count-badge"
                  >
                    {formatPlpResultCount(products.length)}
                  </span>
                ) : null}
              </div>
              <p className="text-muted-foreground text-sm">
                {hiddenProductsCount > 0
                  ? `${products.length} מתוך ${sourceProducts.length} רעיונות למתנה`
                  : `${products.length} רעיונות למתנה`}
              </p>
            </div>
            <Link
              className="text-muted-foreground hover:text-foreground text-sm font-medium underline-offset-4 hover:underline"
              href="/search?q=%D7%9E%D7%AA%D7%A0%D7%94"
            >
              חיפוש מתנות
            </Link>
          </div>
        </section>
        {products.length > 0 ? (
          <RevealGrid
            className="ui-equal-grid mt-5 grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4"
            data-layout-equal-group="gift-products"
            data-testid="gift-results-grid"
            variant="cards"
          >
            {products.map((product, index) => (
              <ProductCard
                contextLabel={getGiftBudgetContextLabel(product)}
                density="compact"
                imagePriority={index === 0}
                key={product.slug}
                product={product}
              />
            ))}
          </RevealGrid>
        ) : (
          <EmptyState
            actions={
              <>
                <Button asChild>
                  <Link
                    data-testid="gifts-empty-state-reset"
                    href="/gifts"
                    scroll={false}
                  >
                    כל רעיונות המתנה
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/search?q=%D7%9E%D7%AA%D7%A0%D7%94">
                    חיפוש מתנות
                  </Link>
                </Button>
              </>
            }
            className="mt-5"
            description="נסי חיפוש רחב יותר או חזרי לכל רעיונות המתנה."
            icon={Gift}
            testId="gifts-empty-state"
            title="לא נמצאה מתנה מתאימה"
          />
        )}
        <section
          aria-labelledby="gift-discovery-title"
          className="mt-5 grid gap-4 border-b border-[var(--glass-border)] pb-5 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.55fr)_auto] lg:items-end"
          data-testid="gift-discovery-chips"
        >
          <div>
            <p className="text-muted-foreground text-xs font-medium uppercase">
              איך בוחרים
            </p>
            <h2
              className="mt-2 text-lg font-medium text-balance"
              id="gift-discovery-title"
            >
              בחירה לפי תקציב, נמענת או אירוע
            </h2>
            <p className="text-muted-foreground mt-2 text-sm leading-6">
              בחרי נקודת התחלה אחת וצמצמי את החיפוש.
            </p>
          </div>
          <div
            className="grid gap-2 sm:grid-cols-3"
            data-testid="gift-finder-decision-bar"
          >
            {giftDecisionGroups.map((group) => (
              <GiftChipGroup
                key={group.label}
                label={group.label}
                links={group.links}
                step={group.step}
              />
            ))}
          </div>
          <div className="flex lg:justify-end">
            <Button asChild size="sm" variant="outline">
              <Link href="/search?q=%D7%9E%D7%AA%D7%A0%D7%94">
                לכל המתנות בחיפוש
              </Link>
            </Button>
          </div>
        </section>
        {bundlePairs.length > 0 ? (
          <section
            aria-labelledby="gift-bundles-title"
            className="mt-5 border-b border-[var(--glass-border)] pb-5"
            data-testid="gift-bundle-recommendations"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-muted-foreground text-xs font-medium uppercase">
                  שילובים
                </p>
                <h2
                  className="mt-2 text-lg font-medium"
                  id="gift-bundles-title"
                >
                  שילובים מומלצים למתנה
                </h2>
              </div>
              <p className="text-muted-foreground max-w-xl text-sm leading-6">
                שני פריטים מאותה קטגוריה שמשתלבים יפה יחד.
              </p>
            </div>
            <div className="mt-4 grid gap-5 lg:grid-cols-2">
              {bundlePairs.map((pair) => (
                <section
                  aria-label={pair.title}
                  className="border-y border-[var(--glass-border)] py-4"
                  data-testid="gift-bundle-pair"
                  key={pair.key}
                >
                  <div className="mb-3">
                    <h3 className="text-base font-medium">{pair.title}</h3>
                    <p className="text-muted-foreground mt-1 text-sm">
                      {pair.description}
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {pair.products.map((product) => (
                      <ProductCard
                        contextLabel="מתאים לשילוב במתנה"
                        key={product.slug}
                        product={product}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </section>
        ) : null}
      </RevealSection>
    </main>
  );
}

type GiftBundlePair = {
  description: string;
  key: string;
  products: [CatalogProduct, CatalogProduct];
  title: string;
};

function getGiftBundlePairs(products: CatalogProduct[]): GiftBundlePair[] {
  const productsByCategory = new Map<string, CatalogProduct[]>();

  for (const product of products) {
    const categoryProducts = productsByCategory.get(product.categorySlug) ?? [];

    categoryProducts.push(product);
    productsByCategory.set(product.categorySlug, categoryProducts);
  }

  return Array.from(productsByCategory.entries())
    .flatMap(([categorySlug, categoryProducts]) => {
      if (categoryProducts.length < 2) return [];

      const [firstProduct, secondProduct] = categoryProducts;

      if (!firstProduct || !secondProduct) return [];

      return [
        {
          description: `${firstProduct.name} לצד ${secondProduct.name}`,
          key: categorySlug,
          products: [firstProduct, secondProduct] as [
            CatalogProduct,
            CatalogProduct,
          ],
          title: `${firstProduct.categoryName} כמתנה`,
        },
      ];
    })
    .slice(0, 2);
}

function getGiftBudgetContextLabel(product: CatalogProduct) {
  const threshold = giftBudgetThresholds.find(
    (budget) => product.price <= budget,
  );

  return threshold ? `מתנה עד ${formatInlinePrice(threshold)}` : undefined;
}

function GiftChipGroup({
  label,
  links,
  step,
}: {
  label: string;
  links: ReadonlyArray<{ href: string; label: string }>;
  step: string;
}) {
  return (
    <div className="min-w-0 rounded-md border border-[var(--glass-border)] p-3">
      <p className="text-muted-foreground text-[0.7rem] font-medium tracking-normal uppercase">
        {step}
      </p>
      <h3 className="mt-1 text-sm font-medium">{label}</h3>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {links.map((link) => (
          <Link
            className="border-border hover:border-[var(--glass-border-hover)] hover:bg-[var(--glass-hover-overlay)] rounded-full border px-2.5 py-1 text-xs transition sm:text-sm"
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
