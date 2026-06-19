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
const homeHeroTitle = "The Elysia Experience";
const homeHeroDirection = getHeroTextDirection(homeHeroTitle);

type HeroTextDirection = "ltr" | "rtl";

const categoryOrder = ["rings", "necklaces", "earrings", "bracelets"];

const categoryEditorialCopy: Record<
  string,
  { description: string; kicker: string }
> = {
  bracelets: {
    description: "צמידים מדויקים שנועדו לענידה יחידה או בשכבות.",
    kicker: "The Edit",
  },
  earrings: {
    description: "עגילים שנעים בטבעיות בין היומיום לרגעים של ערב.",
    kicker: "The Edit",
  },
  necklaces: {
    description: "קווים עדינים ותליונים שמעניקים לכל מראה נקודת אור.",
    kicker: "The Edit",
  },
  rings: {
    description: "טבעות בעלות נוכחות שקטה, לענידה לבד או בשילובים אישיים.",
    kicker: "The Edit",
  },
};

const materialTrust = [
  {
    icon: Gem,
    title: "חומרים נבחרים",
    text: "זהב, כסף, פנינים ואבני צבע, עם פירוט ברור לכל תכשיט.",
  },
  {
    icon: Ruler,
    title: "התאמה מדויקת",
    text: "מדריך מידות וליווי אישי לבחירה שנכונה לך.",
  },
  {
    icon: ShieldCheck,
    title: "שירות מתמשך",
    text: "מענה אנושי לפני ההזמנה וגם לאחריה.",
  },
] as const;

const editorialPrinciples = [
  {
    title: "עיצוב",
    text: "צללית ברורה שנשארת רלוונטית מעבר לעונה.",
  },
  {
    title: "מלאכת מחשבת",
    text: "חומר, גימור ופרופורציה שנבחנים עד הפרט האחרון.",
  },
  {
    title: "בחירה אישית",
    text: "תכשיט שמתאים לסגנון, לרגע ולדרך שבה תרצי לענוד אותו.",
  },
] as const;

const storySignatureNote = {
  eyebrow: "Elysia Standard",
  title: "נוכחות עדינה, שימוש יומיומי",
  text: "בחירה שמתחילה בחומר וממשיכה בפרופורציה, כדי שהתכשיט ירגיש טבעי מהרגע הראשון.",
} as const;

const homeTrustSignals = [
  {
    icon: ShieldCheck,
    title: "קנייה בטוחה",
    text: "תשלום מאובטח ומחיר ברור, עד לאישור ההזמנה.",
  },
  {
    icon: Truck,
    title: "משלוח והחזרה",
    text: "כל המידע לבחירה רגועה, לפני ואחרי הרכישה.",
  },
  {
    icon: Gift,
    title: "אריזה מוקפדת",
    text: "כל תכשיט מגיע מוכן לרגע שבו מעניקים אותו.",
  },
  {
    icon: Headphones,
    title: "ליווי אישי",
    text: "עזרה אנושית בבחירת תכשיט, מידה ומתנה.",
  },
] as const;

export const metadata: Metadata = {
  title: "Elysia Jewellery | תכשיטים בעיצוב מדויק",
  description:
    "קולקציה ערוכה של טבעות, שרשראות, עגילים וצמידים בכסף, ציפוי זהב, פנינים ואבני צבע, עם מדריך מידות ושירות אישי.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Elysia Jewellery | תכשיטים בעיצוב מדויק",
    description:
      "קולקציה ערוכה של תכשיטים בעיצוב מדויק, עם חומרים נבחרים, מדריך מידות ושירות אישי.",
    url: "/",
    images: [{ url: boutiqueHeroImage }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Elysia Jewellery | תכשיטים בעיצוב מדויק",
    description:
      "קולקציה ערוכה של תכשיטים בעיצוב מדויק, עם חומרים נבחרים, מדריך מידות ושירות אישי.",
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
          className="home-hero-copy motion-hero-copy storefront-hero-copy absolute z-10 flex max-w-[min(38rem,calc(100vw-2.5rem))] flex-col items-start sm:max-w-[min(42rem,45vw)]"
          data-hero-copy-direction={homeHeroDirection}
          data-testid="home-hero-copy"
          dir={homeHeroDirection}
        >
          <p className="storefront-eyebrow motion-copy-item [--motion-copy-delay:70ms]">
            Elysia Jewellery
          </p>
          <h1 className="storefront-hero-title motion-copy-item [--motion-copy-delay:90ms]">
            {homeHeroTitle}
          </h1>
          <p
            className="home-hero-statement motion-copy-item storefront-hero-statement [--motion-copy-delay:90ms]"
            data-testid="home-hero-statement"
            dir="auto"
          >
            תכשיטים שנבחרו לחיים, לא רק לרגע.
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
                  לגלות את הקולקציה
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
          actionLabel="לגלות את כל התכשיטים"
          eyebrow="Shop by Category"
          text="טבעות, שרשראות, עגילים וצמידים שנועדו להפוך לחלק מהסגנון שלך."
          title="Find Your Signature"
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
            actionLabel="לגלות מה חדש"
            eyebrow="New Arrivals"
            text="עיצובים חדשים, קלים לענידה ובעלי נוכחות שנשארת."
            title="Icons of Summer"
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
        className="boutique-section home-materials-section mx-auto w-full max-w-[92rem] px-[var(--ui-page-x)] py-[var(--ui-section-y-wide)] lg:px-[var(--ui-page-x-wide)]"
        id="materials"
      >
        <SectionHeader
          eyebrow="Craft & Care"
          text="חומרים נבחרים, פרופורציות מדויקות ושירות שממשיך אחרי הבחירה."
          title="The Details Matter"
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
            <SectionHeader
              actionHref="/about"
              actionLabel="להכיר את Elysia"
              eyebrow="The Elysia Point of View"
              text="אוסף ערוך בקפידה, שבו כל תכשיט נבחר בזכות העיצוב, החומר והאופן שבו הוא מרגיש כשעונדים אותו."
              title="A Distinct Point of View"
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
              <p className="storefront-eyebrow" dir="ltr">
                {storySignatureNote.eyebrow}
              </p>
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
            data-title-direction="ltr"
          >
            <p className="storefront-eyebrow" dir="ltr">
              Your Next Signature
            </p>
            <h2 className="storefront-final-title" dir="ltr">
              Find the One That Feels Like You
            </h2>
            <p className="storefront-final-text">
              בחרי לפי סגנון, חומר או רגע. אנחנו כאן כדי לעזור לך לדייק את
              הבחירה.
            </p>
            <div className="storefront-final-actions">
              <Button asChild>
                <Link dir="auto" href="/search">
                  לגלות את הקולקציה
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link dir="auto" href="/service">
                  לקבל ייעוץ אישי
                </Link>
              </Button>
            </div>
          </section>

          <section
            className="storefront-final-updates"
            data-title-direction="ltr"
            id="collection-updates"
          >
            <div>
              <p className="storefront-eyebrow" dir="ltr">
                Elysia Notes
              </p>
              <h2 className="storefront-final-subtitle" dir="ltr">
                A Little Something New
              </h2>
              <p className="storefront-final-text">
                השקות חדשות, בחירות עונתיות וסיפורים מאחורי התכשיטים.
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
  const titleDirection = getHeroTextDirection(title);

  return (
    <div
      className="commerce-section-header"
      data-title-direction={titleDirection}
    >
      <div className="commerce-section-header-copy">
        <p
          className="commerce-section-header-eyebrow"
          dir={getHeroTextDirection(eyebrow)}
        >
          {eyebrow}
        </p>
        <h2 className="commerce-section-header-title" dir={titleDirection}>
          {title}
        </h2>
        <p
          className="commerce-section-header-description"
          dir={getHeroTextDirection(text)}
        >
          {text}
        </p>
      </div>
      {actionHref && actionLabel ? (
        <div className="commerce-section-header-action">
          <Button asChild variant="outline">
            <Link
              dir={getHeroTextDirection(actionLabel)}
              href={actionHref}
              prefetch={false}
            >
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
      aria-label={`לגלות את קטגוריית ${category.name}`}
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
        />
      </span>
      <span className="boutique-collection-copy">
        <span className="min-w-0">
          <span className="storefront-eyebrow">
            {copy?.kicker ?? "The Edit"}
          </span>
          <span className="boutique-collection-title">{category.name}</span>
          <span className="boutique-collection-description">
            {copy?.description ?? category.description}
          </span>
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
  for (const character of title) {
    if (/[\u0590-\u05ff]/u.test(character)) return "rtl";
    if (/[A-Za-z]/u.test(character)) return "ltr";
  }

  return "rtl";
}
