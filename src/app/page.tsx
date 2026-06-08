import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Gem,
  Gift,
  Headphones,
  Ruler,
  ShieldCheck,
  Truck,
} from "lucide-react";

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
    description: "צמידים דקים לשכבות, למתנה ולרגע שבו היד צריכה אור.",
    kicker: "צמידים",
  },
  earrings: {
    description: "עגילים שמחזיקים בוקר, ערב וכל מעבר ביניהם.",
    kicker: "עגילים",
  },
  necklaces: {
    description: "שרשראות ותליונים שמרימים חולצה פשוטה או שמלת ערב.",
    kicker: "שרשראות",
  },
  rings: {
    description: "טבעות עם נוכחות עדינה, לבד, בזוג או בשכבות.",
    kicker: "טבעות",
  },
};

const materialTrust = [
  {
    icon: Gem,
    title: "חומר ברור",
    text: "זהב, כסף, פנינים ואבני צבע מוצגים לפי הדגם והמלאי.",
  },
  {
    icon: Ruler,
    title: "מידה בלי ניחוש",
    text: "אורך, מידה ומשקל מופיעים כשיש נתון אמין, לצד מדריך מידות.",
  },
  {
    icon: ShieldCheck,
    title: "שירות לפני הזמנה",
    text: "אפשר לפתוח פנייה על מידה, חומר, מתנה או מסירה לפני שמחליטים.",
  },
] as const;

const editorialPrinciples = [
  {
    title: "נבחרו בקפידה",
    text: "לא עוד מדף עמוס. כל פריט צריך להצדיק מקום בלוק, במתנה או ביומיום.",
  },
  {
    title: "נוגעים בפרטים",
    text: "חומר, גימור, אבן ומידה מופיעים קרוב להחלטה, לא רק בסוף העמוד.",
  },
  {
    title: "מתנה שנראית אישית",
    text: "רעיונות לפי תקציב, אירוע וסגנון, עם אפשרות לשאול לפני הזמנה.",
  },
] as const;

const homeTrustSignals = [
  {
    icon: ShieldCheck,
    title: "תשלום מאובטח",
    text: "הפרטים מוצגים לפני אישור ההזמנה.",
  },
  {
    icon: Truck,
    title: "משלוח והחלפה",
    text: "מסירה, החלפה והחזרה לפי מדיניות Elysia.",
  },
  {
    icon: Gift,
    title: "מתנה מוכנה",
    text: "אפשר לבחור לפי תקציב, אירוע וסגנון.",
  },
  {
    icon: Headphones,
    title: "שירות אנושי",
    text: "שאלה על מידה, חומר או התאמה לפני שמזמינים.",
  },
] as const;

const homeHeroCampaignLinks = [
  {
    href: "/gifts",
    label: "מתנות לפי רגע",
    text: "כניסה מהירה לרעיונות עם תקציב וסגנון.",
  },
  {
    href: "/category/necklaces",
    label: "שרשראות לקיץ",
    text: "קו עדין שמרים חולצה לבנה או שמלת ערב.",
  },
] as const;

export const metadata: Metadata = {
  title: "Elysia Jewellery | תכשיטים בוטיקיים",
  description:
    "Elysia Jewellery היא בית תכשיטים בוטיקי לתכשיטי כסף, ציפוי זהב, פנינים ואבני צבע: טבעות, שרשראות, עגילים וצמידים למתנה, ליומיום ולערב.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Elysia Jewellery | תכשיטים בוטיקיים",
    description:
      "תכשיטים עדינים לקיץ, למתנות וללוקים יומיומיים, עם חומר, מידה ושירות לפני הזמנה.",
    url: "/",
    images: [{ url: boutiqueHeroImage }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Elysia Jewellery | תכשיטים בוטיקיים",
    description:
      "תכשיטים עדינים לקיץ, למתנות וללוקים יומיומיים, עם חומר, מידה ושירות לפני הזמנה.",
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
          <p className="storefront-eyebrow motion-copy-item [--motion-copy-delay:70ms]">
            Elysia Jewellery
          </p>
          <h1 className="storefront-hero-title motion-copy-item [--motion-copy-delay:90ms]">
            קיץ חדש. זוהר נקי.
          </h1>
          <p
            className="home-hero-statement motion-copy-item storefront-hero-statement [--motion-copy-delay:90ms]"
            data-testid="home-hero-statement"
          >
            פריטים חדשים שמכניסים אור לקיץ.
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
              <Button
                asChild
                className="home-hero-cta-secondary"
                size="lg"
                variant="outline"
              >
                <Link
                  data-testid="home-hero-secondary-cta"
                  dir="rtl"
                  href="/gifts"
                  prefetch={false}
                >
                  מתנות
                </Link>
              </Button>
            </div>
          </div>
          <div
            className="home-hero-campaign-links motion-copy-item [--motion-copy-delay:160ms]"
            data-testid="home-hero-campaign-links"
          >
            {homeHeroCampaignLinks.map((item) => (
              <Link
                className="home-hero-campaign-link"
                href={item.href}
                key={item.href}
                prefetch={false}
              >
                <span className="home-hero-campaign-label">{item.label}</span>
                <span className="home-hero-campaign-text">{item.text}</span>
              </Link>
            ))}
          </div>
        </div>
      </RevealSection>

      <RevealSection
        className="home-trust-strip mx-auto w-full max-w-[92rem] px-[var(--ui-page-x)] py-5 lg:px-[var(--ui-page-x-wide)]"
        data-testid="home-commerce-shortcuts"
        id="why-trust-elysia"
        variant="none"
      >
        <div
          className="grid gap-4 border-y border-[var(--glass-border)] py-5 sm:grid-cols-2 lg:grid-cols-4"
          data-testid="home-commerce-trust-strip"
        >
          {homeTrustSignals.map((item) => {
            const Icon = item.icon;

            return (
              <section
                className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-3"
                key={item.title}
              >
                <span className="glass-inset grid size-9 place-items-center rounded-md border">
                  <Icon aria-hidden="true" className="size-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">
                    {item.title}
                  </span>
                  <span className="text-muted-foreground mt-1 block text-xs leading-5">
                    {item.text}
                  </span>
                </span>
              </section>
            );
          })}
        </div>
      </RevealSection>

      <RevealSection
        className="boutique-section mx-auto w-full max-w-[92rem] px-[var(--ui-page-x)] py-[var(--ui-section-y-wide)] lg:px-[var(--ui-page-x-wide)]"
        id="collections"
      >
        <SectionHeader
          actionHref="/search"
          actionLabel="כל התכשיטים"
          eyebrow="Shop by piece"
          text="טבעות, שרשראות, עגילים וצמידים שנועדו לעבוד עם בגדים אמיתיים: חולצה לבנה, שמלת ערב, תיק חוף או מתנה שנפתחת מיד."
          title="התחילי מהתכשיט שנוגע בלוק."
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
            actionLabel="חדש בקולקציה"
            eyebrow="New in"
            text="פריטים שנכנסו עכשיו למבחר: קלים לענידה, ברורים בחומר, ומספיק מיוחדים כדי לשנות את כל הלוק."
            title="הזוהר החדש של העונה."
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
          eyebrow="Materials & service"
          text="היופי מתחיל בתמונה, אבל ההחלטה מגיעה מהפרטים: חומר, גימור, מידה, משלוח ושירות לפני הזמנה."
          title="חומרים ברורים. שירות אנושי."
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
              text="Elysia נבנית כמו בוטיק קטן: פחות רעש, יותר בחירה מדויקת, צילום שמראה חומר, ושירות שנכנס כשצריך ביטחון."
              title="בית תכשיטים קטן עם עין מאוד מדויקת."
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
              תכשיט קטן יכול לשנות את כל היום.
            </h2>
            <p className="storefront-final-text">
              בחרי לפי לוק, תקציב או חומר. ואם זו מתנה, מידה לא בטוחה או התלבטות
              בין שני גוונים, אפשר לשאול לפני שמזמינים.
            </p>
            <div className="storefront-final-actions">
              <Button asChild>
                <Link href="/search">לכל התכשיטים</Link>
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
                מכתב קצר כשהקולקציה מתרעננת.
              </h2>
              <p className="storefront-final-text">
                בלי עומס. רק פריטים חדשים, רעיונות למתנה, והשראה קטנה לעונה.
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
            {copy?.kicker ?? "לפי תכשיט"}
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
