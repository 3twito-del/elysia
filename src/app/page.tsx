import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Gem, Ruler, ShieldCheck } from "lucide-react";

import { NewsletterForm } from "~/components/newsletter-form";
import { DeferredFixedBackgroundBand } from "~/components/deferred-fixed-background-band";
import { HomeHeroVideo } from "~/components/home-hero-video";
import { ProductCard } from "~/components/product-card";
import { RevealGrid, RevealSection } from "~/components/reveal";
import { SiteHeader } from "~/components/site-header";
import { Button } from "~/components/ui/button";
import {
  getCatalogCategories,
  getFeaturedCatalogProducts,
  type CatalogCategory,
} from "~/server/services/catalog";

const boutiqueHeroImage = "/brand/boutique/lifestyle-hero.avif";
const boutiqueHeroPoster = "/brand/boutique/lifestyle-hero-poster.avif";
const boutiqueHeroVideoMp4 = "/brand/boutique/lifestyle-hero.mp4";
const boutiqueHeroVideoWebm = "/brand/boutique/lifestyle-hero.webm";

const categoryOrder = ["rings", "necklaces", "earrings", "bracelets"];

const categoryEditorialCopy: Record<
  string,
  { description: string; kicker: string }
> = {
  bracelets: {
    description: "צמידים שמוסיפים ברק גם ללוק הכי יומיומי.",
    kicker: "צמידים",
  },
  earrings: {
    description: "עגילים קטנים לערב, ליום ולכל מה שביניהם.",
    kicker: "עגילים",
  },
  necklaces: {
    description: "שרשראות שמחזיקות הופעה בלי להתאמץ.",
    kicker: "שרשראות",
  },
  rings: {
    description: "טבעות עם נוכחות עדינה, לבד או בשכבות.",
    kicker: "טבעות",
  },
};

const materialTrust = [
  {
    icon: Gem,
    title: "מתכת",
    text: "זהב, כסף וגימורים חמימים שמכניסים אור ללוק.",
  },
  {
    icon: Ruler,
    title: "אבנים",
    text: "פנינים, יהלומים ואבני צבע לפי הדגם והמלאי.",
  },
  {
    icon: ShieldCheck,
    title: "על הגוף",
    text: "מידה, אורך ומשקל מופיעים כדי להבין איך התכשיט יושב.",
  },
] as const;

const editorialPrinciples = [
  {
    title: "מתנה שנראית אישית",
    text: "מתחילים מאירוע, תקציב או סגנון ומגיעים לפריטים שמתאימים לרגע.",
  },
  {
    title: "לוק שלם",
    text: "אפשר לסנן לפי חומר, צבע ומידה ולראות מה עובד יחד.",
  },
  {
    title: "אריזה ומשלוח",
    text: "כשהאפשרות זמינה, מוסיפים ברכה או אריזה לפני סיום ההזמנה.",
  },
] as const;

export const metadata: Metadata = {
  title: "Elysia | תכשיטים",
  description:
    "תכשיטי Elysia לקיץ, למתנה וליומיום: זהב, פנינים ואבני צבע עם פרטי חומר, מידה ומחיר לפני הזמנה.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Elysia | תכשיטים",
    description: "קולקציות תכשיטים לקיץ, למתנות וללוקים יומיומיים.",
    url: "/",
    images: [{ url: boutiqueHeroImage }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Elysia | תכשיטים",
    description: "קולקציות תכשיטים לקיץ, למתנות וללוקים יומיומיים.",
    images: [boutiqueHeroImage],
  },
};

export default async function Home() {
  const [categories, featuredProducts] = await Promise.all([
    getCatalogCategories(),
    getFeaturedCatalogProducts(4),
  ]);
  const orderedCategories = getOrderedHomeCategories(categories);

  return (
    <main
      className="home-luxury-page storefront-home-page"
      data-testid="storefront-homepage"
    >
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
          className="home-hero-copy motion-hero-copy storefront-hero-copy absolute z-10 flex max-w-[min(38rem,calc(100vw-2.5rem))] flex-col items-start text-right sm:max-w-[min(42rem,45vw)]"
          data-testid="home-hero-copy"
          dir="rtl"
        >
          <h1 className="sr-only">Elysia</h1>
          <p
            className="home-hero-statement motion-copy-item storefront-hero-statement [--motion-copy-delay:90ms]"
            data-testid="home-hero-statement"
          >
            קיץ חדש. תכשיטים שנכנסים ללוק.
          </p>
          <div
            className="home-hero-actions motion-copy-item storefront-hero-actions [--motion-copy-delay:130ms]"
            data-testid="home-hero-actions"
          >
            <div className="home-hero-cta-row" data-testid="home-hero-cta-row">
              <Button asChild className="home-hero-cta-primary" size="lg">
                <Link
                  data-testid="home-hero-primary-cta"
                  dir="rtl"
                  href="/search"
                  prefetch={false}
                >
                  לכל התכשיטים
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
        <SectionHeader
          actionHref="/search"
          actionLabel="לכל התכשיטים"
          eyebrow="קולקציות"
          text="טבעות, שרשראות, עגילים וצמידים למשרד, לחופשה ולערב."
          title="מה נכנס ללוק שלך?"
        />
        <RevealGrid
          className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
          data-layout-equal-group="home-category-tiles"
          data-testid="home-category-tiles"
          variant="media"
        >
          {orderedCategories.map((category) => (
            <HomeCategoryCard category={category} key={category.slug} />
          ))}
        </RevealGrid>
      </RevealSection>

      <RevealSection
        className="boutique-featured-band px-[var(--ui-page-x)] py-[var(--ui-section-y-wide)] lg:px-[var(--ui-page-x-wide)]"
        id="featured"
      >
        <div className="mx-auto max-w-[92rem]">
          <SectionHeader
            actionHref="/search?sort=newest"
            actionLabel="לכל מה שחדש"
            eyebrow="נבחר עכשיו"
            text="כמה נקודות פתיחה טובות מתוך המלאי הפעיל."
            title="פריטים שמתחילים מהם"
          />
          {featuredProducts.length > 0 ? (
            <RevealGrid
              className="ui-equal-grid grid gap-x-7 gap-y-10 sm:grid-cols-2 lg:grid-cols-4"
              data-layout-equal-group="home-featured-products"
              data-testid="home-featured-products"
              variant="cards"
            >
              {featuredProducts.map((product) => (
                <ProductCard
                  imageSizes="(min-width: 1280px) 18rem, (min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                  key={product.slug}
                  product={product}
                />
              ))}
            </RevealGrid>
          ) : null}
        </div>
      </RevealSection>

      <RevealSection
        className="boutique-section mx-auto w-full max-w-[92rem] px-[var(--ui-page-x)] py-[var(--ui-section-y-wide)] lg:px-[var(--ui-page-x-wide)]"
        id="materials"
      >
        <SectionHeader
          eyebrow="חומר וצבע"
          text="כל פריט מוצג לפי חומר, גימור, מידה ושימוש."
          title="זהב, פנינים ואור של קיץ"
        />
        <div
          className="grid gap-5 border-y border-[var(--glass-border)] py-6 md:grid-cols-3"
          data-testid="home-material-trust"
        >
          {materialTrust.map((item) => {
            const Icon = item.icon;

            return (
              <section className="boutique-trust-item" key={item.title}>
                <Icon aria-hidden="true" className="size-5" />
                <h2>{item.title}</h2>
                <p>{item.text}</p>
              </section>
            );
          })}
        </div>
      </RevealSection>

      <RevealSection
        className="boutique-story-band px-[var(--ui-page-x)] py-[var(--ui-section-y-wide)] lg:px-0"
        id="about-elysia"
      >
        <div className="boutique-story-layout mx-auto grid max-w-[92rem] gap-8 lg:items-center">
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
            <SectionHeader
              actionHref="/about"
              actionLabel="אודות"
              eyebrow="Elysia"
              text="Elysia מציגה תכשיטים לקיץ, למתנה וליומיום, עם הפרטים החשובים לפני ההזמנה."
              title="לא רק יפה בתמונה."
            />
          </div>
          <div className="boutique-story-secondary-copy">
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
          </div>
          <figure className="boutique-story-media boutique-story-media-right relative">
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
          <section className="storefront-final-primary">
            <p className="storefront-eyebrow">המבחר מתעדכן</p>
            <h2 className="storefront-final-title">
              מצאו תכשיט לעכשיו, או שלחו שאלה לפני ההזמנה.
            </h2>
            <p className="storefront-final-text">
              המגוון נכנס לאתר בהדרגה. אפשר לשמור מועדפים, לבדוק מידות ולפנות
              לשירות כשצריך עוד רגע של ודאות.
            </p>
            <div className="storefront-final-actions">
              <Button asChild>
                <Link href="/search">פתיחת המבחר</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/service">שאלה לפני הזמנה</Link>
              </Button>
            </div>
          </section>

          <section className="storefront-final-updates" id="collection-updates">
            <div>
              <p className="storefront-eyebrow">עדכוני קולקציה</p>
              <h2 className="storefront-final-subtitle">
                רוצים לדעת מה חדש?
              </h2>
              <p className="storefront-final-text">
                נשלח עדכון קצר כשפריטים חדשים נכנסים למבחר.
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

function SectionHeader({
  actionHref,
  actionLabel,
  eyebrow,
  text,
  title,
}: {
  actionHref?: string;
  actionLabel?: string;
  eyebrow: string;
  text: string;
  title: string;
}) {
  return (
    <div className="commerce-section-header">
      <div className="commerce-section-header-copy">
        <p className="commerce-section-header-eyebrow">{eyebrow}</p>
        <h2 className="commerce-section-header-title">{title}</h2>
        <p className="commerce-section-header-description">{text}</p>
      </div>
      {actionHref && actionLabel ? (
        <div className="commerce-section-header-action">
          <Button asChild variant="outline">
            <Link href={actionHref} prefetch={false}>
              {actionLabel}
              <ArrowLeft aria-hidden="true" className="size-4" />
            </Link>
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function HomeCategoryCard({ category }: { category: CatalogCategory }) {
  const copy = categoryEditorialCopy[category.slug];

  return (
    <Link
      className="boutique-collection-card"
      data-testid="home-category-card"
      href={`/category/${category.slug}`}
      prefetch={false}
    >
      <span className="boutique-collection-media">
        <Image
          alt={`${category.name} מתוך קולקציות Elysia`}
          className="media-color object-cover"
          fill
          sizes="(min-width: 1024px) 22vw, (min-width: 640px) 50vw, 100vw"
          src={category.image}
        />
      </span>
      <span className="boutique-collection-copy">
        <span className="min-w-0">
          <span className="storefront-eyebrow">
            {copy?.kicker ?? "לפי לוק"}
          </span>
          <span className="boutique-collection-title">{category.name}</span>
          <span className="boutique-collection-description">
            {copy?.description ?? category.description}
          </span>
        </span>
        <ArrowLeft aria-hidden="true" className="mt-1 size-4 shrink-0" />
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
