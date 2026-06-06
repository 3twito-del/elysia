import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Gem, Ruler, ShieldCheck } from "lucide-react";

import { NewsletterForm } from "~/components/newsletter-form";
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
    description: "צמידים דקים ושכבות רכות לענידה יומיומית או למתנה.",
    kicker: "תנועה רכה על היד",
  },
  earrings: {
    description: "עגילים קרובים לעור, קלים לענידה ונקיים בפרופורציה.",
    kicker: "ברק עדין לפנים",
  },
  necklaces: {
    description: "שרשראות ותליונים לשכבות, לאורכים נקיים ולנקודת אור יומיומית.",
    kicker: "קו עדין לצוואר",
  },
  rings: {
    description: "טבעות בזהב, כסף ואבנים בגזרה שקטה ופרטי מידה ברורים.",
    kicker: "צורה, מידה וגימור",
  },
};

const materialTrust = [
  {
    icon: Gem,
    title: "חומרים ברורים",
    text: "כל תכשיט מציג חומר, אבן, גוון וגימור בשפה פשוטה לפני בחירה.",
  },
  {
    icon: Ruler,
    title: "מידות לפני הזמנה",
    text: "מידה, אורך או היקף מוצגים במקום אחד, עם מסלול שירות לשאלה פתוחה.",
  },
  {
    icon: ShieldCheck,
    title: "שירות לאחר מסירה",
    text: "אחריות, טיפול, החלפות והחזרות נשארים חלק גלוי ממסע הרכישה.",
  },
] as const;

const editorialPrinciples = [
  {
    title: "צילום קרוב וברור",
    text: "תמונות התכשיט נבחרות כדי להציג חומר, קנה מידה וגימור בלי עומס.",
  },
  {
    title: "מבחר מצומצם ומכוון",
    text: "הקטלוג נשאר פתוח, אך הממשק נותן לכל פריט מרחב, מחיר ברור והקשר חומרי.",
  },
  {
    title: "בחירה שקטה",
    text: "חיפוש, סינון, סל, אזור אישי ושירות נשארים פשוטים וברורים.",
  },
] as const;

export const metadata: Metadata = {
  title: "Elysia | בית תכשיטים בוטיק",
  description:
    "Elysia הוא בית תכשיטים בוטיק עם קטלוג טבעות, שרשראות, עגילים, צמידים ומתנות, מידע חומרי ברור ושירות לקראת הזמנה.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Elysia | בית תכשיטים בוטיק",
    description:
      "תכשיטים בגישה בוטיקית, עם קטלוג פעיל, סינון שקט, עמודי מוצר מלאים ושירות לקראת הזמנה.",
    url: "/",
    images: [{ url: boutiqueHeroImage }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Elysia | בית תכשיטים בוטיק",
    description:
      "תכשיטים בגישה בוטיקית, עם קטלוג פעיל, סינון שקט, עמודי מוצר מלאים ושירות לקראת הזמנה.",
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
      <link
        as="video"
        fetchPriority="high"
        href={boutiqueHeroVideoWebm}
        rel="preload"
        type="video/webm"
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
          className="home-hero-copy motion-hero-copy storefront-hero-copy absolute z-10 flex max-w-[min(38rem,calc(100vw-2.5rem))] flex-col items-start text-left sm:max-w-[min(42rem,45vw)]"
          data-testid="home-hero-copy"
          dir="ltr"
        >
          <h1 className="sr-only">Elysia</h1>
          <p
            className="home-hero-statement motion-copy-item storefront-hero-statement [--motion-copy-delay:90ms]"
            data-testid="home-hero-statement"
          >
            Jewellery selected for material, proportion, and everyday light.
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
                >
                  כל התכשיטים
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
          actionLabel="פתיחת כל המבחר"
          eyebrow="כניסה לקולקציה"
          text="מבחר תכשיטים ערוך לפי חומר, מידה וסגנון."
          title="מבחר תכשיטים שקט, ערוך לפי משפחות."
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
            actionLabel="עוד מהקטלוג"
            eyebrow="תצוגת קטלוג"
            text="פרטים ברורים, בחירה שקטה ושירות לפני ההזמנה."
            title="תצוגה ראשונה של פריטים, בלי צפיפות ובלי רעש."
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
          eyebrow="חומר, מידה, שירות"
          text="חומר, מידה, מחיר ושירות מוצגים בשפה קצרה וברורה לפני בחירה."
          title="יוקרה רכה נשענת על מידע ברור."
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
        className="boutique-story-band px-[var(--ui-page-x)] py-[var(--ui-section-y-wide)] lg:px-[var(--ui-page-x-wide)]"
        id="about-elysia"
      >
        <div className="mx-auto grid max-w-[92rem] gap-8 lg:grid-cols-[minmax(18rem,0.85fr)_minmax(0,1.15fr)] lg:items-center">
          <figure className="boutique-story-media relative min-h-[22rem] overflow-hidden rounded-md lg:min-h-[34rem]">
            <Image
              alt="Gold necklace detail photographed in soft light"
              className="object-cover"
              fill
              sizes="(min-width: 1024px) 40vw, 100vw"
              src="/brand/boutique/product-detail.avif"
            />
          </figure>
          <div>
            <SectionHeader
              actionHref="/about"
              actionLabel="על Elysia"
              eyebrow="About Elysia"
              text="Elysia היא בית תכשיטים בוטיק עם בחירה שקטה, פרטים ברורים ושירות לפני ההזמנה ולאחריה."
              title="תכשיטים עדינים לשימוש יומי, מתנה ואירוע."
            />
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
        </div>
      </RevealSection>

      <RevealSection
        className="boutique-final-cta px-[var(--ui-page-x)] py-[var(--ui-section-y-wide)] lg:px-[var(--ui-page-x-wide)]"
        id="first-collection"
      >
        <div className="storefront-final-panel mx-auto max-w-[92rem]">
          <section className="storefront-final-primary">
            <p className="storefront-eyebrow">הקולקציה הראשונה</p>
            <h2 className="storefront-final-title">
              התחילו מהמבחר, או בקשו עזרה לפני בחירה.
            </h2>
            <p className="storefront-final-text">
              המגוון יעודכן בהדרגה. אפשר לעיין בתכשיטים, לשמור מועדפים
              ולפנות לשירות לפני בחירה.
            </p>
            <div className="storefront-final-actions">
              <Button asChild>
                <Link href="/search">פתיחת הקטלוג</Link>
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
                קבלו הודעה כשפריטים חדשים נכנסים למבחר.
              </h2>
              <p className="storefront-final-text">
                נשלח עדכון קצר כאשר פריטים חדשים נכנסים למבחר.
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
            <Link href={actionHref}>
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
          alt={`${category.name} מתוך קולקציית Elysia`}
          className="media-color object-cover"
          fill
          sizes="(min-width: 1024px) 22vw, (min-width: 640px) 50vw, 100vw"
          src={category.image}
        />
      </span>
      <span className="boutique-collection-copy">
        <span className="min-w-0">
          <span className="storefront-eyebrow">
            {copy?.kicker ?? "בחירה מתוך הקטלוג"}
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
