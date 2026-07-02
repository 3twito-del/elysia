import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { env } from "~/env";
import { stringifyJsonLd } from "~/lib/json-ld";
import { getTextDirection } from "~/lib/text-direction";
import { NewsletterForm } from "~/components/newsletter-form";
import { CommerceSectionHeader } from "~/components/commerce-section-header";
import { DeferredFixedBackgroundBand } from "~/components/deferred-fixed-background-band";
import { HomeHeroVideo } from "~/components/home-hero-video";
import { ProductCard } from "~/components/product-card";
import { RevealGrid, RevealSection } from "~/components/reveal";
import { SiteHeader } from "~/components/site-header";
import { Button } from "~/components/ui/button";
import { RecentlyViewedProducts } from "~/app/product/[slug]/_components/recently-viewed-products";
import {
  getCatalogCategories,
  getFeaturedCatalogProducts,
  type CatalogCategory,
} from "~/server/services/catalog";
import { TRPCReactProvider } from "~/trpc/react";

const boutiqueHeroImage = "/brand/boutique/lifestyle-hero.avif";
const boutiqueHeroPoster = "/brand/boutique/lifestyle-hero-poster.avif";
const boutiqueHeroVideoMp4 = "/brand/boutique/lifestyle-hero.mp4";
const boutiqueHeroVideoWebm = "/brand/boutique/lifestyle-hero.webm";
const homeHeroTitle = "Timeless Elegance";
const homeHeroDirection = getHeroTextDirection(homeHeroTitle);
const homeSameAs = [
  "https://www.instagram.com/elysia.one/",
  "https://www.tiktok.com/@elysia_jewellery",
] as const;

type HeroTextDirection = "ltr" | "rtl";

const categoryOrder = ["rings", "necklaces", "earrings", "bracelets"];

const categoryImagePosition: Record<string, string> = {
  bracelets: "50% 52%",
  earrings: "50% 48%",
  necklaces: "50% 44%",
  rings: "50% 46%",
};

const editorialPrinciples = [
  {
    title: "עיצוב",
    text: "קווים נקיים וקלאסיים שמתאימים לכל סגנון ולכל גיל.",
  },
  {
    title: "איכות",
    text: "כסף 925 וציפויי זהב באיכות גבוהה, בגימור מוקפד.",
  },
  {
    title: "שירות",
    text: "מדריך מידות, החלפות והחזרות ושירות אישי לכל הזמנה.",
  },
] as const;

const storySignatureNote = {
  eyebrow: "הסטנדרט שלנו",
  title: "תכשיטים לשימוש יומיומי",
  text: "אנחנו מקפידים על חומרים איכותיים ועל גימור נוח, כדי שהתכשיט ילווה אותך בכל יום.",
} as const;

export const metadata: Metadata = {
  title: "Elysia Jewellery | תכשיטי כסף וזהב אונליין",
  description:
    "חנות תכשיטים אונליין: טבעות, שרשראות, עגילים וצמידים בכסף 925 ובציפוי זהב, עם פנינים ואבני צבע. מדריך מידות, החלפות והחזרות ושירות אישי.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Elysia Jewellery | תכשיטי כסף וזהב אונליין",
    description:
      "טבעות, שרשראות, עגילים וצמידים בכסף 925 ובציפוי זהב. מדריך מידות, החלפות והחזרות ושירות אישי.",
    url: "/",
    images: [{ url: boutiqueHeroImage }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Elysia Jewellery | תכשיטי כסף וזהב אונליין",
    description:
      "טבעות, שרשראות, עגילים וצמידים בכסף 925 ובציפוי זהב. מדריך מידות, החלפות והחזרות ושירות אישי.",
    images: [boutiqueHeroImage],
  },
};

const siteUrl = env.SITE_URL ?? "https://elysia-jewellery.com";

const homeStructuredData = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Elysia Jewellery",
    url: siteUrl,
    logo: new URL("/apple-touch-icon.png", siteUrl).toString(),
    image: new URL(boutiqueHeroImage, siteUrl).toString(),
    sameAs: homeSameAs,
    description:
      "חנות תכשיטים אונליין: טבעות, שרשראות, עגילים וצמידים בכסף 925 ובציפוי זהב, עם פנינים ואבני צבע.",
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Elysia Jewellery",
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  },
] as const;

export default async function Home() {
  const [categories, featuredProducts] = await Promise.all([
    getCatalogCategories(),
    getFeaturedCatalogProducts(8),
  ]);
  const orderedCategories = getOrderedHomeCategories(categories);

  return (
    <main
      className="elysia-page home-luxury-page storefront-home-page"
      data-testid="storefront-homepage"
    >
      <script
        dangerouslySetInnerHTML={{
          __html: stringifyJsonLd(homeStructuredData),
        }}
        type="application/ld+json"
      />
      <link
        as="image"
        fetchPriority="high"
        href={boutiqueHeroPoster}
        rel="preload"
        type="image/avif"
      />
      <SiteHeader />

      <RevealSection
        className="home-cinematic-hero storefront-hero relative isolate min-h-[var(--home-hero-height)] w-screen max-w-none overflow-hidden"
        data-hero-title-direction={homeHeroDirection}
        data-testid="cinematic-page-hero"
        id="page-hero"
        initialVisible
        variant="hero"
      >
        <HomeHeroVideo
          className="storefront-hero-image object-cover"
          mp4Src={boutiqueHeroVideoMp4}
          posterSrc={boutiqueHeroPoster}
          webmSrc={boutiqueHeroVideoWebm}
        />
        <div className="storefront-hero-scrim absolute inset-0" />
        <div className="storefront-hero-wash absolute inset-0" />

        <div
          className="home-hero-copy motion-hero-copy storefront-hero-copy absolute z-10 flex max-w-[min(38rem,calc(100vw-2.5rem))] flex-col items-start sm:max-w-[min(42rem,72vw)]"
          data-hero-copy-direction={homeHeroDirection}
          data-testid="home-hero-copy"
          dir={homeHeroDirection}
        >
          <h1 className="storefront-hero-title motion-copy-item [--motion-copy-delay:90ms]">
            {homeHeroTitle}
          </h1>
          <p
            className="home-hero-statement motion-copy-item storefront-hero-statement [--motion-copy-delay:90ms]"
            data-testid="home-hero-statement"
            dir="auto"
          >
            תכשיטי כסף 925 וציפוי זהב בעיצוב קלאסי, לכל יום ולאירועים
            מיוחדים.
          </p>
          <div
            className="home-hero-actions motion-copy-item storefront-hero-actions [--motion-copy-delay:130ms]"
            data-testid="home-hero-actions"
          >
            <div className="home-hero-cta-row" data-testid="home-hero-cta-row">
              <Button asChild className="home-hero-cta-primary" size="lg">
                <Link
                  data-testid="home-hero-primary-cta"
                  dir="auto"
                  href="/search"
                  prefetch={false}
                >
                  גלי את הקולקציה
                  <ArrowLeft
                    aria-hidden="true"
                    className="home-hero-cta-icon size-4"
                  />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </RevealSection>

      <RevealSection
        className="boutique-section mx-auto w-full max-w-[92rem] px-[var(--ui-page-x)] py-[var(--ui-section-y-wide)] lg:px-[var(--ui-page-x-wide)]"
        id="collections"
      >
        {orderedCategories.length > 0 ? (
          <RevealGrid
            className="grid gap-x-7 gap-y-7 sm:grid-cols-2 lg:grid-cols-4"
            data-layout-equal-group="home-category-tiles"
            data-testid="home-category-tiles"
            variant="media"
          >
            {orderedCategories.map((category) => (
              <HomeCategoryCard category={category} key={category.slug} />
            ))}
          </RevealGrid>
        ) : (
          <HomeEditorialFallback
            actionHref="/search"
            actionLabel="לכל התכשיטים"
            text="הקטגוריות מתעדכנות כרגע. בינתיים אפשר לצפות בכל התכשיטים ולסנן לפי קטגוריה, חומר ומחיר."
            title="הקטגוריות מתעדכנות"
          />
        )}
      </RevealSection>

      {featuredProducts.length > 0 ? (
        <RevealSection
          className="boutique-featured-band px-[var(--ui-page-x)] py-[var(--ui-section-y-wide)] lg:px-[var(--ui-page-x-wide)]"
          id="featured"
        >
          <div className="mx-auto max-w-[92rem]">
            <CommerceSectionHeader eyebrow="הקולקציה שלנו" title="חדש באתר" />
            <RevealGrid
              className="ui-equal-grid grid gap-x-7 gap-y-10 sm:grid-cols-2 lg:grid-cols-4"
              data-layout-equal-group="home-featured-products"
              data-testid="home-featured-products"
              variant="cards"
            >
              {featuredProducts.map((product) => (
                <ProductCard
                  imageSizes="(min-width: 1280px) 17rem, (min-width: 1024px) 22vw, (min-width: 640px) 50vw, 100vw"
                  key={product.slug}
                  product={product}
                />
              ))}
            </RevealGrid>
          </div>
        </RevealSection>
      ) : (
        <RevealSection
          className="boutique-featured-band px-[var(--ui-page-x)] py-[var(--ui-section-y-wide)] lg:px-[var(--ui-page-x-wide)]"
          id="featured"
        >
          <HomeEditorialFallback
            actionHref="/search"
            actionLabel="לכל התכשיטים"
            text="הקולקציה מתעדכנת כרגע. בינתיים אפשר לצפות בכל התכשיטים הזמינים באתר."
            title="פריטים חדשים בדרך"
          />
        </RevealSection>
      )}

      <TRPCReactProvider>
        <RecentlyViewedProducts
          className="boutique-section mx-auto w-full max-w-[92rem] border-y border-[var(--glass-border)] px-[var(--ui-page-x)] py-7 lg:px-[var(--ui-page-x-wide)]"
          gridClassName="ui-equal-grid mt-5 grid gap-x-7 gap-y-10 sm:grid-cols-2 lg:grid-cols-4"
          heading="נצפו לאחרונה"
          id="recently-viewed"
          limit={4}
        />
      </TRPCReactProvider>

      <RevealSection
        className="boutique-story-band px-[var(--ui-page-x)] py-[var(--ui-section-y-wide)] lg:px-0"
        id="about-elysia"
      >
        <div className="boutique-story-layout home-story-layout mx-auto grid max-w-[92rem] gap-8 lg:items-center">
          <figure className="boutique-story-media boutique-story-media-left relative">
            <Image
              alt=""
              className="object-cover"
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              src="/brand/boutique/product-detail.avif"
            />
          </figure>
          <div className="boutique-story-copy">
            <CommerceSectionHeader
              action={
                <Button asChild variant="outline">
                  <Link dir="auto" href="/about" prefetch={false}>
                    קראי עוד עלינו
                    <ArrowLeft aria-hidden="true" className="size-4" />
                  </Link>
                </Button>
              }
              description="אנחנו בוחרים כל תכשיט בקפידה לפי העיצוב, החומר ואיכות הגימור, כדי שתמצאי פריטים שמתאימים לך."
              eyebrow="אודות"
              title="הסיפור של Elysia"
            />
          </div>
          <div className="boutique-story-secondary-copy home-story-secondary-copy">
            <div className="grid gap-4">
              {editorialPrinciples.map((principle, index) => (
                <section
                  className="boutique-story-principle"
                  key={principle.title}
                >
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <h3>{principle.title}</h3>
                    <p>{principle.text}</p>
                  </div>
                </section>
              ))}
            </div>
            <section
              aria-label={storySignatureNote.eyebrow}
              className="home-story-secondary-note"
            >
              <p className="storefront-eyebrow">{storySignatureNote.eyebrow}</p>
              <h3>{storySignatureNote.title}</h3>
              <p>{storySignatureNote.text}</p>
            </section>
          </div>
          <figure className="boutique-story-media boutique-story-media-right home-story-media-right relative">
            <Image
              alt=""
              className="object-cover"
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              src="/brand/boutique/lifestyle-hero-poster.avif"
            />
          </figure>
        </div>
      </RevealSection>

      <DeferredFixedBackgroundBand
        className="boutique-fixed-image-band"
        id="fixed-editorial-image"
      />

      <RevealSection
        className="boutique-final-cta px-[var(--ui-page-x)] py-[var(--ui-section-y-wide)] lg:px-[var(--ui-page-x-wide)]"
        id="first-collection"
      >
        <div className="storefront-final-panel mx-auto max-w-[92rem]">
          <section
            className="storefront-final-primary"
            data-title-direction="rtl"
          >
            <p className="storefront-eyebrow">התכשיט הבא שלך</p>
            <h2 className="storefront-final-title">
              מצאי את התכשיט המושלם בשבילך
            </h2>
            <p className="storefront-final-text">
              בחרי לפי קטגוריה, חומר או תקציב. צוות השירות שלנו ישמח לעזור בכל
              שאלה.
            </p>
            <div className="storefront-final-actions">
              <Button asChild>
                <Link dir="auto" href="/search">
                  לכל התכשיטים
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link dir="auto" href="/service">
                  צרי קשר
                </Link>
              </Button>
            </div>
          </section>

          <section
            className="storefront-final-updates"
            data-title-direction="rtl"
            id="collection-updates"
          >
            <div>
              <p className="storefront-eyebrow">ניוזלטר</p>
              <h2 className="storefront-final-subtitle">הישארי מעודכנת</h2>
              <p className="storefront-final-text">
                הירשמי לניוזלטר וקבלי עדכונים על קולקציות חדשות ופריטים נבחרים.
              </p>
            </div>
            <div className="storefront-final-newsletter">
              <NewsletterForm />
            </div>
          </section>
        </div>
      </RevealSection>
    </main>
  );
}

function HomeEditorialFallback({
  actionHref,
  actionLabel,
  text,
  title,
}: {
  actionHref: string;
  actionLabel: string;
  text: string;
  title: string;
}) {
  return (
    <section
      className="home-editorial-fallback mx-auto max-w-[92rem] border-y border-[var(--glass-border)] py-7"
      data-testid="home-editorial-fallback"
    >
      <h2 className="text-xl font-medium">{title}</h2>
      <p className="text-muted-foreground mt-3 max-w-2xl text-sm leading-7">
        {text}
      </p>
      <Button asChild className="mt-5" variant="outline">
        <Link href={actionHref} prefetch={false}>
          {actionLabel}
          <ArrowLeft aria-hidden="true" className="size-4" />
        </Link>
      </Button>
    </section>
  );
}

function HomeCategoryCard({ category }: { category: CatalogCategory }) {
  return (
    <Link
      aria-label={`למעבר לקטגוריית ${category.name}`}
      className="boutique-collection-card"
      data-category-slug={category.slug}
      data-testid="home-category-card"
      href={`/category/${category.slug}`}
      prefetch={false}
    >
      <span className="boutique-collection-media">
        <Image
          alt=""
          aria-hidden="true"
          className="media-color object-cover"
          fill
          sizes="(min-width: 1024px) 22vw, (min-width: 640px) 50vw, 100vw"
          src={category.image}
          style={{
            objectPosition: categoryImagePosition[category.slug] ?? "50% 50%",
          }}
        />
      </span>
      <span className="boutique-collection-copy">
        <span className="min-w-0">
          <span className="boutique-collection-title">{category.name}</span>
        </span>
        <span className="boutique-collection-action" aria-hidden="true">
          <ArrowLeft className="size-4" />
        </span>
      </span>
    </Link>
  );
}

function getOrderedHomeCategories(categories: CatalogCategory[]) {
  const bySlug = new Map(
    categories.map((category) => [category.slug, category]),
  );
  const ordered = categoryOrder
    .map((slug) => bySlug.get(slug))
    .filter((category): category is CatalogCategory => Boolean(category));
  const remaining = categories.filter(
    (category) => !categoryOrder.includes(category.slug),
  );

  return [...ordered, ...remaining].slice(0, 4);
}

function getHeroTextDirection(title: string): HeroTextDirection {
  return getTextDirection(title);
}
