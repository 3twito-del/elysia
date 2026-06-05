import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Gem,
  PackageCheck,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Truck,
} from "lucide-react";

import { CommerceSectionHeader } from "~/components/commerce-section-header";
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

const collectionImageBySlug: Record<string, string> = {
  bracelets: "/brand/boutique/category-bracelets.avif",
  earrings: "/brand/boutique/category-earrings.avif",
  necklaces: "/brand/boutique/category-necklaces.avif",
  rings: "/brand/boutique/category-rings.avif",
};

const collectionCopy: Record<string, string> = {
  bracelets: "צמידים דקים לענידה יומיומית ולשכבות.",
  earrings: "עגילים רכים ליום, ערב ומתנה.",
  necklaces: "שרשראות עדינות עם נוכחות קרובה לגוף.",
  rings: "טבעות נקיות עם פרופורציה נשית.",
};

const preferredCollectionOrder = [
  "rings",
  "necklaces",
  "earrings",
  "bracelets",
] as const;

const homeTrustNotes = [
  { icon: Gem, label: "חומרים וגימור מאומתים" },
  { icon: ShieldCheck, label: "אחריות ושירות אחרי קנייה" },
  { icon: Truck, label: "משלוח ותיאום מסירה" },
  { icon: RotateCcw, label: "החלפות לפי מדיניות" },
] as const;

const storyPrinciples = [
  {
    title: "בחירה מדויקת",
    text: "מבחר מצומצם שמדגיש פרופורציה, חומר ונוחות ענידה.",
  },
  {
    title: "צילום שמראה קנה מידה",
    text: "תכשיט צריך להרגיש מוחשי לפני שמוסיפים אותו לסל.",
  },
  {
    title: "שירות שקט וברור",
    text: "מידע על חומר, מידה, אחריות ומסירה מוצג קרוב לרכישה.",
  },
] as const;

export const metadata: Metadata = {
  title: "תכשיטים",
  description:
    "Elysia Jewellery: חנות תכשיטי בוטיק אונליין עם קולקציות נשיות, נקיות ומודרניות.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Elysia | תכשיטי בוטיק",
    description:
      "קולקציות תכשיטים נשיות, נקיות ומודרניות עם חוויית קנייה שקטה וברורה.",
    url: "/",
    images: [{ url: boutiqueHeroImage }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Elysia | תכשיטי בוטיק",
    description:
      "קולקציות תכשיטים נשיות, נקיות ומודרניות עם חוויית קנייה שקטה וברורה.",
    images: [boutiqueHeroImage],
  },
};

export default async function Home() {
  const [categories, featuredProducts] = await Promise.all([
    getCatalogCategories(),
    getFeaturedCatalogProducts(8),
  ]);
  const signatureCollections = getSignatureCollections(categories);
  const curatedProducts = featuredProducts.slice(0, 4);

  return (
    <main className="home-luxury-page">
      <SiteHeader />

      <RevealSection
        className="home-cinematic-hero boutique-home-hero relative isolate min-h-[var(--home-hero-height)] w-screen max-w-none overflow-hidden"
        data-testid="cinematic-page-hero"
        id="page-hero"
        initialVisible
        variant="hero"
      >
        <Image
          alt="תכשיט זהב עדין על גוף בתאורת חלון רכה"
          className="boutique-hero-image object-cover"
          fill
          priority
          sizes="100vw"
          src={boutiqueHeroImage}
        />
        <div className="boutique-hero-scrim absolute inset-0" />
        <div className="boutique-hero-wash absolute inset-0" />

        <div
          className="home-hero-copy motion-hero-copy absolute inset-x-5 bottom-[calc(2.5rem+env(safe-area-inset-bottom))] z-10 flex max-w-[min(38rem,calc(100vw-2.5rem))] flex-col items-start text-right text-white sm:inset-x-auto sm:right-[clamp(4rem,8vw,9rem)] sm:bottom-[clamp(3rem,8vw,7rem)] sm:max-w-[min(38rem,46vw)]"
          data-testid="home-hero-copy"
          dir="rtl"
        >
          <p className="motion-copy-item text-xs font-medium tracking-normal text-white/78">
            Elysia Jewellery
          </p>
          <h1
            className="home-hero-wordmark motion-copy-item mt-4 text-5xl leading-[0.96] font-medium tracking-normal text-white sm:text-7xl lg:text-[6.5rem]"
            dir="ltr"
          >
            Elysia
          </h1>
          <p
            className="home-hero-statement motion-copy-item mt-7 max-w-xl text-2xl leading-[1.18] font-light text-white/94 [--motion-copy-delay:90ms] sm:text-4xl sm:leading-[1.15] lg:text-5xl lg:leading-[1.1]"
            data-testid="home-hero-statement"
          >
            תכשיטים עדינים שנענדים כמו אור קרוב לגוף.
          </p>

          <div
            className="home-hero-actions motion-copy-item mt-8 [--motion-copy-delay:130ms]"
            data-testid="home-hero-actions"
          >
            <div className="home-hero-cta-row" data-testid="home-hero-cta-row">
              <Button asChild className="home-hero-cta-primary" size="lg">
                <Link data-testid="home-hero-primary-cta" href="#collections">
                  לקולקציות
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
        className="home-luxury-section boutique-section mx-auto max-w-[92rem] px-[var(--ui-page-x)] py-16 sm:px-[var(--ui-page-x-wide)] sm:py-24 lg:py-32"
        id="collections"
      >
        <CommerceSectionHeader
          action={
            <Button asChild size="sm" variant="outline">
              <Link href="/search">לכל הקולקציות</Link>
            </Button>
          }
          description="כניסה לפי סוג תכשיט, עם צילום שמראה איך הוא מרגיש על גוף ולא רק כמוצר מבודד."
          eyebrow="קולקציות"
          title="בחירה לפי רגע, גוף ותנועה"
        />
        <RevealGrid
          className="boutique-collection-grid grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
          data-layout-equal-group="home-category-tiles"
          variant="media"
        >
          {signatureCollections.map((category) => (
            <CollectionCard category={category} key={category.slug} />
          ))}
        </RevealGrid>
      </RevealSection>

      <RevealSection
        className="home-luxury-section boutique-section boutique-featured-band"
        id="featured"
      >
        <div className="mx-auto max-w-[92rem] px-[var(--ui-page-x)] py-16 sm:px-[var(--ui-page-x-wide)] sm:py-24 lg:py-32">
          <CommerceSectionHeader
            action={
              <Button asChild size="sm" variant="outline">
                <Link href="/search">
                  למבחר המלא
                  <Gem aria-hidden="true" className="size-4" />
                </Link>
              </Button>
            }
            description="עריכה מצומצמת של פריטים שנבחרו להציג את השפה של Elysia."
            eyebrow="בחירה נבחרת"
            title="פריטים נבחרים בלבד"
          />
          <RevealGrid
            className="boutique-featured-grid grid gap-7 sm:grid-cols-2 lg:grid-cols-4"
            data-layout-equal-group="home-featured-products"
            variant="cards"
          >
            {curatedProducts.map((product, index) => (
              <ProductCard
                display={index < 2 ? "editorial" : "standard"}
                imagePriority={index === 0}
                imageSizes="(min-width: 1280px) 21rem, (min-width: 640px) 50vw, 100vw"
                key={product.slug}
                product={product}
              />
            ))}
          </RevealGrid>
        </div>
      </RevealSection>

      <RevealSection
        className="home-luxury-section boutique-section mx-auto max-w-[92rem] px-[var(--ui-page-x)] py-14 sm:px-[var(--ui-page-x-wide)] sm:py-20"
        id="trust"
      >
        <div
          className="boutique-trust-strip grid gap-5 border-y border-[var(--glass-border)] py-8 sm:grid-cols-2 lg:grid-cols-4"
          data-testid="home-service-strip"
        >
          {homeTrustNotes.map(({ icon: Icon, label }) => (
            <section className="boutique-trust-item" key={label}>
              <Icon aria-hidden="true" className="size-4" />
              <h2>{label}</h2>
              <p>מידע קצר וברור לפני רכישה, בלי עומס ובלי הבטחות רועשות.</p>
            </section>
          ))}
        </div>
      </RevealSection>

      <RevealSection
        className="home-luxury-section boutique-section boutique-story-band"
        id="story"
      >
        <div className="boutique-story-block mx-auto grid max-w-[92rem] gap-10 px-[var(--ui-page-x)] py-16 sm:px-[var(--ui-page-x-wide)] sm:py-24 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:items-center lg:gap-16 lg:py-32">
          <div className="boutique-story-media relative min-h-[28rem] overflow-hidden rounded-md">
            <Image
              alt="שרשראות זהב עדינות על גוף בתאורה רכה"
              className="object-cover"
              fill
              sizes="(min-width: 1024px) 45vw, 100vw"
              src="/brand/boutique/category-necklaces.avif"
            />
          </div>
          <div className="boutique-story-copy">
            <CommerceSectionHeader
              description="התכשיט לא נמדד רק במחיר או בשם הדגם, אלא בתחושה שלו על גוף, ביחס שלו לאור ובשקט שהוא מוסיף למראה."
              eyebrow="הבית של Elysia"
              title="בוטיק תכשיטים עם קצב עדין"
            />
            <div className="grid gap-6">
              {storyPrinciples.map((item, index) => (
                <section className="boutique-story-principle" key={item.title}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.text}</p>
                  </div>
                </section>
              ))}
            </div>
          </div>
        </div>
      </RevealSection>

      <RevealSection
        className="home-luxury-section boutique-section boutique-gift-band mx-auto grid max-w-[92rem] gap-10 px-[var(--ui-page-x)] py-16 sm:px-[var(--ui-page-x-wide)] sm:py-24 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-center lg:py-32"
        id="gift-ritual"
      >
        <div className="boutique-gift-copy">
          <CommerceSectionHeader
            description="מתנה טובה צריכה להרגיש אישית, מדויקת וארוזה נכון מהרגע הראשון."
            eyebrow="מתנות"
            title="רגע קטן שמרגיש אישי"
          />
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button asChild>
              <Link href="/gifts">
                למתנות
                <PackageCheck aria-hidden="true" className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/service?topic=general">
                עזרה בבחירה
                <Sparkles aria-hidden="true" className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
        <div className="boutique-gift-media relative min-h-[24rem] overflow-hidden rounded-md sm:min-h-[32rem]">
          <Image
            alt="צמידי זהב עדינים על משי ואבן בהירה"
            className="object-cover"
            fill
            sizes="(min-width: 1024px) 45vw, 100vw"
            src="/brand/boutique/category-bracelets.avif"
          />
        </div>
      </RevealSection>

      <RevealSection
        className="home-luxury-section boutique-final-cta border-y border-[var(--glass-border)]"
        id="boutique-cta"
      >
        <div className="mx-auto flex max-w-[76rem] flex-col items-center gap-6 px-[var(--ui-page-x)] py-16 text-center sm:px-[var(--ui-page-x-wide)] sm:py-24">
          <p className="text-muted-foreground text-sm">Elysia Jewellery</p>
          <h2 className="max-w-3xl text-3xl leading-tight font-medium sm:text-5xl">
            התחילי מתכשיט אחד שמרגיש שלך.
          </h2>
          <Button asChild size="lg">
            <Link href="/search">
              צפייה במבחר
              <ArrowLeft aria-hidden="true" className="size-4" />
            </Link>
          </Button>
        </div>
      </RevealSection>
    </main>
  );
}

function CollectionCard({ category }: { category: CatalogCategory }) {
  const image =
    collectionImageBySlug[category.slug] ??
    "/brand/boutique/lifestyle-hero.avif";
  const description = collectionCopy[category.slug] ?? category.description;

  return (
    <Link
      aria-label={`${category.name}: ${description}`}
      className="boutique-collection-card group/card"
      data-testid="home-category-tile"
      href={`/category/${category.slug}`}
    >
      <span className="boutique-collection-media">
        <Image
          alt={`${category.name} מתוך קולקציות Elysia`}
          className="object-cover transition duration-[700ms] ease-[var(--ease-motion-standard)] group-hover/card:scale-[1.02]"
          fill
          sizes="(min-width: 1280px) 21rem, (min-width: 640px) 50vw, 100vw"
          src={image}
        />
      </span>
      <span className="boutique-collection-copy">
        <span>
          <span className="boutique-collection-title">{category.name}</span>
          <span className="boutique-collection-description">{description}</span>
        </span>
        <ArrowLeft aria-hidden="true" className="size-4" />
      </span>
    </Link>
  );
}

function getSignatureCollections(categories: CatalogCategory[]) {
  return preferredCollectionOrder
    .map((slug) => categories.find((category) => category.slug === slug))
    .filter((category): category is CatalogCategory => Boolean(category));
}
