import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Gem,
  MessageCircle,
  PackageCheck,
  Search,
} from "lucide-react";

import {
  StaticCinematicHeroSequence,
  StaticKineticImageFrame,
} from "~/components/brand-media-panel";
import { CommerceSectionHeader } from "~/components/commerce-section-header";
import { ProductCard } from "~/components/product-card";
import { RevealGrid, RevealSection } from "~/components/reveal";
import { SiteHeader } from "~/components/site-header";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { cinematicRouteMedia, getCategoryBrandSlides } from "~/lib/brand-media";
import {
  getCatalogCategories,
  getFeaturedCatalogProducts,
  listCatalogProducts,
} from "~/server/services/catalog";

const homeSlides = cinematicRouteMedia.home.slice(0, 1);
const hasMultipleHomeHeroSlides = homeSlides.length > 1;

const homeHeroMediaCaption = "בתמונה: טבעות ופנינים בגימור עדין";

const homeTrustNotes = [
  { icon: Gem, label: "חומר ומידה גלויים" },
  { icon: PackageCheck, label: "הזמנה ומשלוח אונליין" },
  { icon: MessageCircle, label: "שירות לפני ואחרי בחירה" },
] as const;

const quickSearchSuggestions = [
  { href: "/search?q=טבעת%20זהב", label: "טבעת זהב" },
  { href: "/search?q=עגילי%20פנינה", label: "עגילי פנינה" },
  { href: "/search?maxPrice=700", label: "מתנה עד 700 ₪" },
  { href: "/search?category=rings", label: "טבעות" },
] as const;

const homeCommerceShortcuts = [
  { href: "/search", label: "חיפוש במבחר" },
  { href: "/gifts", label: "מתנות" },
  { href: "/size-guide", label: "מידות" },
  { href: "/service", label: "שירות אישי" },
] as const;

const homeProductRailTabs = [
  {
    href: "#featured",
    label: "נבחרים",
    meta: "מוצג עכשיו",
    current: true,
  },
  {
    href: "/search?sort=newest",
    label: "חדשים",
    meta: "לפי תאריך",
    current: false,
  },
  {
    href: "/gifts",
    label: "מתנות",
    meta: "לפי אירוע",
    current: false,
  },
  {
    href: "/search?sort=popular",
    label: "פופולריים",
    meta: "בחירות חוזרות",
    current: false,
  },
] as const;

const collectionCopy: Record<string, string> = {
  bracelets: "צמידים לענידה יומיומית.",
  earrings: "עגילים ליום ולערב.",
  necklaces: "שרשראות ליום ולערב.",
  rings: "טבעות ליום ולערב.",
};

const materialPrinciples = [
  {
    title: "מתכת",
    text: "זהב, כסף וגימורים בהירים במבחר עדכני.",
  },
  {
    title: "אבנים",
    text: "יהלומים, פנינים ואבני צבע לפי דגם.",
  },
  {
    title: "מבנה וגימור",
    text: "מידות, אורך ומשקל מופיעים בפרטי המוצר.",
  },
] as const;

const giftRitual = [
  {
    title: "בחירת מתנה",
    text: "בחירה לפי אירוע, סגנון וטווח מחיר.",
  },
  {
    title: "התאמה",
    text: "ניתן לסנן לפי מידה, חומר וטווח מחיר.",
  },
  {
    title: "משלוח",
    text: "אפשרויות אריזה וברכה זמינות במהלך ההזמנה.",
  },
] as const;

export const metadata: Metadata = {
  title: "תכשיטים",
  description:
    "עמוד הבית של Elysia: תכשיטים, מתנות, מידע מוצר ברור והזמנה מקוונת.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Elysia | תכשיטים",
    description: "קולקציות תכשיטים עם מידע ברור על חומר, מידה, מחיר והזמנה.",
    url: "/",
    images: [{ url: "/brand/v2/editorial-home.avif" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Elysia | תכשיטים",
    description: "קולקציות תכשיטים עם מידע ברור על חומר, מידה, מחיר והזמנה.",
    images: ["/brand/v2/editorial-home.avif"],
  },
};

export default async function Home() {
  const [categories, featuredProducts, allProducts] = await Promise.all([
    getCatalogCategories(),
    getFeaturedCatalogProducts(8),
    listCatalogProducts(),
  ]);
  const signatureCollections = categories.slice(0, 4);
  const curatedProducts = featuredProducts.slice(0, 4);
  const heroCategoryLinks = categories.slice(0, 3);
  const categoryProductCounts = allProducts.reduce((counts, product) => {
    counts.set(
      product.categorySlug,
      (counts.get(product.categorySlug) ?? 0) + 1,
    );

    return counts;
  }, new Map<string, number>());
  const homeCategoryChips = signatureCollections.map((category) => ({
    ...category,
    productCount: categoryProductCounts.get(category.slug) ?? 0,
  }));

  return (
    <main>
      <SiteHeader />

      <RevealSection
        className="relative isolate min-h-[var(--home-hero-height)] w-screen max-w-none overflow-hidden [--hero-edge:clamp(1.15rem,4vw,5rem)] [--home-hero-height:clamp(30rem,78svh,39rem)] sm:[--home-hero-height:clamp(40rem,78svh,52rem)] lg:[--hero-edge:clamp(3rem,4vw,5rem)]"
        data-testid="cinematic-page-hero"
        id="page-hero"
        initialVisible
        variant="hero"
      >
        <div
          className="motion-media-frame absolute inset-0 h-full min-h-[var(--home-hero-height)] w-full"
          data-motion-intensity="cinematic"
          data-motion-media="true"
          data-motion-parallax="false"
          data-motion-reduced="true"
          data-motion-scope="home-hero"
        >
          <div className="motion-media-content absolute inset-0 min-h-[var(--home-hero-height)]">
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-cover bg-center"
              data-testid="home-hero-media-fallback"
              style={{
                backgroundImage: "url('/brand/v2/editorial-home.avif')",
              }}
            />
            <StaticKineticImageFrame scrollMotion={false}>
              <StaticCinematicHeroSequence
                priority
                motionScope="home-hero"
                slides={homeSlides}
                testId="cinematic-page-hero-sequence"
              />
            </StaticKineticImageFrame>
          </div>
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.02),rgba(0,0,0,0.18)_42%,rgba(0,0,0,0.62))]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.70),rgba(0,0,0,0.10)_58%,rgba(0,0,0,0.24))]" />
        <div className="absolute inset-x-0 top-0 h-px bg-white opacity-30" />
        {hasMultipleHomeHeroSlides ? (
          <>
            <div
              className="absolute right-[var(--hero-edge)] bottom-[calc(var(--hero-edge)+4.25rem)] z-10 hidden max-w-[16rem] text-right text-xs text-white/78 sm:block"
              data-testid="home-hero-media-caption"
              dir="rtl"
            >
              <span className="rounded-full border border-white/25 bg-[var(--brand-ink)] px-3 py-1.5">
                {homeHeroMediaCaption}
              </span>
            </div>
            <div
              className="absolute right-[var(--hero-edge)] bottom-[calc(var(--hero-edge)+1rem)] z-10 hidden w-28 text-white/75 sm:block"
              data-testid="home-hero-slide-progress"
              dir="ltr"
            >
              <div className="flex items-center gap-2 text-[0.7rem] tabular-nums">
                <span>01</span>
                <span className="h-px flex-1 bg-white" />
                <span>{String(homeSlides.length).padStart(2, "0")}</span>
              </div>
            </div>
          </>
        ) : null}
        <div className="relative min-h-[var(--home-hero-height)]">
          <div
            className="motion-hero-copy absolute top-[calc(var(--hero-edge)+1.65rem)] right-[var(--hero-edge)] w-[min(calc(100%_-_var(--hero-edge)_-_var(--hero-edge)),50rem)] text-right text-white sm:top-[var(--hero-edge)] lg:w-[min(50rem,calc(52vw_-_var(--hero-edge)_-_2rem))]"
            data-testid="home-hero-copy"
            dir="rtl"
          >
            <p className="motion-copy-item text-xs font-medium tracking-normal text-white/78">
              תכשיטים
            </p>
            <h1
              className="home-hero-wordmark motion-copy-item mt-3 text-right text-4xl leading-[0.98] font-medium tracking-normal sm:mt-4 sm:text-7xl lg:text-[6rem]"
              dir="ltr"
            >
              Elysia
            </h1>
            <p className="motion-copy-item mt-4 max-w-2xl text-lg leading-7 text-white/94 [--motion-copy-delay:90ms] sm:mt-5 sm:text-3xl sm:leading-10">
              תכשיטים ליום, לערב ולמתנות.
            </p>
            <p className="motion-copy-item mt-3 max-w-[19rem] text-sm leading-6 text-white/78 [--motion-copy-delay:130ms] sm:mt-4 sm:max-w-xl sm:leading-8">
              קולקציות תכשיטים, מידע ברור והזמנה מקוונת.
            </p>
          </div>
        </div>

        <div
          className="home-hero-actions motion-hero-copy absolute inset-x-4 bottom-[calc(2rem+env(safe-area-inset-bottom))] w-auto text-white sm:inset-x-auto sm:bottom-[var(--hero-edge)] sm:left-[var(--hero-edge)] sm:w-[min(calc(100%_-_var(--hero-edge)_-_var(--hero-edge)),36rem)] lg:w-[min(36rem,calc(50vw_-_var(--hero-edge)_-_2rem))]"
          data-testid="home-hero-actions"
          dir="rtl"
        >
          <div className="motion-copy-item grid items-stretch gap-3 [--motion-copy-delay:170ms] sm:justify-items-end">
            <div
              className="grid gap-2 sm:grid-cols-2 sm:justify-end"
              data-testid="home-hero-cta-row"
            >
              <Button
                asChild
                className="home-hero-cta-primary text-foreground hover:text-foreground border-white bg-white shadow-none hover:border-white hover:bg-white"
                size="lg"
              >
                <Link href="/category/rings">
                  לקולקציות
                  <ArrowLeft
                    aria-hidden="true"
                    className="home-hero-cta-icon size-4"
                  />
                </Link>
              </Button>
              <Button
                asChild
                className="home-hero-help-cta border-white bg-[var(--brand-ink)] text-white hover:border-white hover:bg-[var(--brand-ink)] hover:text-white"
                size="lg"
                variant="outline"
              >
                <Link href="/stylist">
                  ייעוץ סטיילינג
                  <MessageCircle aria-hidden="true" className="size-4" />
                </Link>
              </Button>
            </div>
            {heroCategoryLinks.length > 0 ? (
              <nav
                aria-label="קישורי קולקציות מהירים"
                className="hidden flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-white/82 sm:flex sm:justify-end"
              >
                {heroCategoryLinks.map((category) => (
                  <Link
                    className="border-b border-white/35 pb-1 transition-colors hover:border-white hover:text-white focus-visible:border-white focus-visible:text-white focus-visible:outline-none"
                    href={`/category/${category.slug}`}
                    key={category.slug}
                  >
                    {category.name}
                  </Link>
                ))}
              </nav>
            ) : null}
            <ul
              className="motion-copy-item hidden flex-wrap justify-center gap-2 text-[0.7rem] text-white/76 [--motion-copy-delay:210ms] sm:flex sm:justify-end"
              data-testid="home-hero-trust-notes"
            >
              {homeTrustNotes.map(({ icon: Icon, label }) => (
                <li
                  className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-[var(--brand-ink)] px-2.5 py-1"
                  key={label}
                >
                  <Icon aria-hidden="true" className="size-3" />
                  <span>{label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </RevealSection>

      <RevealSection
        className="mx-auto max-w-7xl px-[var(--ui-page-x)] py-5 sm:px-6 sm:py-10"
        id="categories"
      >
        <CommerceSectionHeader
          action={
            <Button asChild size="sm" variant="outline">
              <Link href="/search">לכל הקולקציות</Link>
            </Button>
          }
          description="טבעות, שרשראות, עגילים וצמידים במבחר אחד."
          eyebrow="קולקציות"
          title="מבחר לפי קטגוריה"
        />
        <RevealGrid
          className="ui-equal-grid grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-x-4 sm:gap-y-6 lg:grid-cols-4"
          data-layout-equal-group="home-category-tiles"
          variant="media"
        >
          {signatureCollections.map((category) => (
            <Link
              aria-label={`${category.name}: ${
                collectionCopy[category.slug] ?? category.description
              }`}
              className="ui-equal-item group/card w-full min-w-0 outline-none focus-visible:ring-3 focus-visible:ring-[var(--glass-focus)] focus-visible:outline-none"
              data-testid="home-category-tile"
              href={`/category/${category.slug}`}
              key={category.slug}
            >
              <div className="bg-muted relative aspect-[4/3] overflow-hidden rounded-md sm:aspect-[4/5] sm:min-h-[220px]">
                <Image
                  alt={`${category.name} מתוך קולקציות Elysia: ${
                    collectionCopy[category.slug] ?? category.description
                  }`}
                  className="media-color object-cover object-center transition duration-[700ms] ease-[var(--ease-motion-standard)] group-hover/card:scale-[1.015]"
                  fill
                  sizes="(min-width: 1280px) 18rem, (min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                  src={
                    getCategoryBrandSlides(category.slug)[0]?.src ??
                    category.image
                  }
                />
                <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(16,19,20,0.54),rgba(16,19,20,0.12)_56%,rgba(255,255,255,0.04))] sm:bg-[linear-gradient(to_top,rgba(16,19,20,0.24),rgba(16,19,20,0.03)_44%,rgba(255,255,255,0.04))]" />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3 text-white sm:hidden">
                  <div className="min-w-0">
                    <h3
                      className="ui-text-slot min-w-0 text-base font-medium"
                      data-lines="1"
                    >
                      {category.name}
                    </h3>
                    <p
                      className="ui-text-slot mt-1 text-xs text-white/78 [--ui-text-slot-line-height:1.25rem]"
                      data-lines="2"
                    >
                      {collectionCopy[category.slug] ?? category.description}
                    </p>
                  </div>
                  <ArrowLeft aria-hidden="true" className="size-4 shrink-0" />
                </div>
              </div>
              <div className="mt-3 hidden border-b border-[var(--glass-border)] pb-3 text-center sm:block">
                <h3
                  className="ui-text-slot group-hover/card:text-muted-foreground group-focus-visible/card:text-muted-foreground min-w-0 text-base font-medium transition-colors duration-[var(--motion-fast)] ease-[var(--ease-motion-standard)] sm:text-lg"
                  data-lines="1"
                >
                  {category.name}
                </h3>
                <p
                  className="ui-text-slot text-muted-foreground mx-auto mt-1 max-w-48 text-sm"
                  data-lines="2"
                >
                  {collectionCopy[category.slug] ?? category.description}
                </p>
              </div>
            </Link>
          ))}
        </RevealGrid>
        <nav
          aria-label="נתיבי בחירה מהירים"
          className="text-muted-foreground mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-[var(--glass-border)] pt-4 text-xs sm:justify-start"
          data-testid="home-commerce-shortcuts"
        >
          {homeCommerceShortcuts.map((shortcut) => (
            <Link
              className="hover:border-foreground hover:text-foreground focus-visible:border-foreground focus-visible:text-foreground border-b border-[var(--glass-border)] pb-1 transition-colors focus-visible:outline-none"
              href={shortcut.href}
              key={shortcut.href}
            >
              {shortcut.label}
            </Link>
          ))}
        </nav>
      </RevealSection>

      <RevealSection
        className="mx-auto max-w-7xl px-[var(--ui-page-x)] pb-5 sm:px-[var(--ui-page-x-wide)]"
        id="home-service-strip"
        variant="none"
      >
        <section
          className="grid gap-3 border-y border-[var(--glass-border)] py-4 text-sm sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
          data-testid="home-service-strip"
        >
          <div>
            <p className="font-medium">צריכים התאמה לפני בחירה?</p>
            <p className="text-muted-foreground mt-1 leading-6">
              עזרה במידה, חומר או מתנה נשארת זמינה בלי להוציא אתכם מהמבחר.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 sm:justify-end">
            <Button asChild size="sm" variant="outline">
              <Link href="/service?topic=general">שאלת שירות</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/size-guide">מדריך מידות</Link>
            </Button>
          </div>
        </section>
      </RevealSection>

      <RevealSection
        className="brand-page-band border-y border-[var(--glass-border)]"
        id="materials"
      >
        <div className="mx-auto grid max-w-7xl gap-8 px-[var(--ui-page-x)] py-[var(--ui-section-y)] sm:px-[var(--ui-page-x-wide)] lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-center">
          <div className="bg-muted relative min-h-[22rem] overflow-hidden rounded-md sm:min-h-[28rem]">
            <Image
              alt="תכשיטי זהב ופנינים על זכוכית אקווה בתאורה רכה"
              className="media-color-rich object-cover"
              fill
              sizes="(min-width: 1024px) 48vw, 100vw"
              src="/brand/v2/content-editorial.avif"
            />
          </div>
          <div className="grid gap-6">
            <CommerceSectionHeader
              description="כל פריט מוצג לפי חומר, גימור, מידה ושימוש."
              eyebrow="חומרים"
              title="חומרים, גימור ונוכחות"
            />
            <div className="grid gap-4">
              {materialPrinciples.map((item) => (
                <section
                  className="border-t border-[var(--glass-border)] pt-4"
                  key={item.title}
                >
                  <h3 className="text-lg font-medium">{item.title}</h3>
                  <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-7">
                    {item.text}
                  </p>
                </section>
              ))}
            </div>
          </div>
        </div>
      </RevealSection>

      <RevealSection className="brand-page-band" id="gift-ritual">
        <div className="mx-auto grid max-w-7xl gap-8 px-[var(--ui-page-x)] py-[var(--ui-section-y)] sm:px-[var(--ui-page-x-wide)] lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-start">
          <div>
            <CommerceSectionHeader
              description="מבחר מתנות לפי קטגוריה, חומר וטווח מחיר."
              eyebrow="מתנות"
              title="מתנות תכשיטים"
            />
            <Button asChild className="mt-6" variant="outline">
              <Link href="/gifts">
                למתנות
                <PackageCheck aria-hidden="true" className="size-4" />
              </Link>
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {giftRitual.map((item, index) => (
              <section
                className="border-t border-[var(--glass-border)] pt-4"
                key={item.title}
              >
                <p className="text-muted-foreground text-right text-sm tabular-nums">
                  0{index + 1}
                </p>
                <h3 className="mt-4 text-xl font-medium">{item.title}</h3>
                <p className="text-muted-foreground mt-3 text-sm leading-7">
                  {item.text}
                </p>
              </section>
            ))}
          </div>
        </div>
      </RevealSection>

      <RevealSection
        className="brand-page-band border-y border-[var(--glass-border)]"
        id="personal-advice"
      >
        <div className="mx-auto grid max-w-7xl gap-8 px-[var(--ui-page-x)] py-[var(--ui-section-y)] sm:px-[var(--ui-page-x-wide)] lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center">
          <div className="grid gap-6">
            <CommerceSectionHeader
              description="אפשר לקבל עזרה בשאלות על מידה, חומר, מתנה או התאמה."
              eyebrow="ייעוץ"
              title="עזרה בבחירה"
            />
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button asChild>
                <Link href="/stylist">
                  לייעוץ
                  <MessageCircle aria-hidden="true" className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/size-guide">מדריך מידות</Link>
              </Button>
            </div>
          </div>
          <div className="bg-muted relative min-h-[22rem] overflow-hidden rounded-md sm:min-h-[28rem]">
            <Image
              alt="מגש שירות עם אריזת תכשיטים ופנינים"
              className="media-color-rich object-cover"
              fill
              sizes="(min-width: 1024px) 42vw, 100vw"
              src="/brand/v2/service-task.avif"
            />
          </div>
        </div>
      </RevealSection>

      <RevealSection
        className="brand-page-band border-y border-[var(--glass-border)]"
        id="quick-search"
      >
        <div className="mx-auto grid max-w-7xl gap-4 px-[var(--ui-page-x)] py-5 sm:px-[var(--ui-page-x-wide)] sm:py-6 lg:grid-cols-[minmax(15rem,0.7fr)_minmax(0,1.9fr)] lg:items-center">
          <div className="min-w-0">
            <p className="text-muted-foreground text-sm">חיפוש</p>
            <h2 className="text-2xl font-medium">חיפוש במבחר</h2>
          </div>
          <div className="grid min-w-0 gap-3">
            <form
              action="/search"
              aria-label="חיפוש במבחר"
              className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]"
              data-testid="home-quick-search-form"
              role="search"
            >
              <div className="relative">
                <Search
                  aria-hidden="true"
                  className="text-muted-foreground pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2"
                />
                <Input
                  aria-label="חיפוש תכשיט במבחר"
                  className="bg-background h-[3.25rem] rounded-md border-[var(--glass-border)] pr-11 pl-3 text-sm shadow-none focus-visible:border-[var(--glass-border-strong)]"
                  name="q"
                  placeholder="טבעת זהב, עגילי פנינה, מתנה עד 700 ₪..."
                />
              </div>
              <Button className="h-[3.25rem] gap-2 px-5" type="submit">
                חיפוש
                <Search aria-hidden="true" className="size-4" />
              </Button>
            </form>
            <div
              aria-label="חיפושים מהירים"
              className="flex flex-wrap items-center gap-2"
              data-testid="home-quick-search-suggestions"
            >
              {quickSearchSuggestions.map((suggestion) => (
                <Link
                  className="hover:bg-muted hover:text-foreground inline-flex min-h-8 items-center rounded-md border border-[var(--glass-border)] bg-transparent px-3 text-xs font-medium transition-[background-color,border-color,color,outline-color,opacity] duration-[var(--motion-fast)] ease-[var(--ease-motion-standard)] outline-none hover:border-[var(--glass-border-strong)] focus-visible:border-[var(--glass-border-strong)] focus-visible:ring-3 focus-visible:ring-[var(--glass-focus)]"
                  href={suggestion.href}
                  key={suggestion.href}
                >
                  {suggestion.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </RevealSection>

      <RevealSection className="brand-page-band" id="featured">
        <div className="mx-auto max-w-7xl px-[var(--ui-page-x)] py-[var(--ui-section-y)] sm:px-[var(--ui-page-x-wide)]">
          <CommerceSectionHeader
            action={
              <Button asChild size="sm" variant="outline">
                <Link href="/search">
                  למבחר המלא
                  <Gem aria-hidden="true" className="size-4" />
                </Link>
              </Button>
            }
            description="מבחר ראשוני מתוך הקולקציה."
            eyebrow="מבחר נבחר"
            title="פריטים נבחרים"
          />
          <nav
            aria-label="מסילות מוצרים בבית"
            className="mt-4 flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0"
            data-testid="home-product-rail-tabs"
          >
            {homeProductRailTabs.map((tab) => (
              <Link
                aria-current={tab.current ? "page" : undefined}
                className={
                  tab.current
                    ? "text-foreground inline-flex min-h-11 shrink-0 items-center gap-2 rounded-md border border-[var(--foreground)] px-3 text-sm font-medium"
                    : "text-muted-foreground hover:border-foreground hover:text-foreground focus-visible:border-foreground focus-visible:text-foreground inline-flex min-h-11 shrink-0 items-center gap-2 rounded-md border border-[var(--glass-border)] px-3 text-sm transition-colors focus-visible:outline-none"
                }
                data-home-rail-active={tab.current ? "true" : undefined}
                data-testid="home-product-rail-tab"
                href={tab.href}
                key={tab.href}
              >
                <span>{tab.label}</span>
                <span className="text-xs">{tab.meta}</span>
              </Link>
            ))}
          </nav>
          <nav
            aria-label="קטגוריות מהירות לפי כמות פריטים"
            className="mt-4 flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0"
            data-testid="home-category-count-chips"
          >
            {homeCategoryChips.map((category) => (
              <Link
                className="hover:border-foreground hover:text-foreground focus-visible:border-foreground focus-visible:text-foreground inline-flex min-h-10 shrink-0 items-center gap-2 rounded-md border border-[var(--glass-border)] px-3 text-sm transition-colors focus-visible:outline-none"
                data-testid="home-category-count-chip"
                href={`/category/${category.slug}`}
                key={category.slug}
              >
                <span>{category.name}</span>
                <span className="text-muted-foreground text-xs">
                  {formatHomeCategoryCount(category.productCount)}
                </span>
              </Link>
            ))}
          </nav>
          <RevealGrid
            className="ui-equal-grid mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
            data-layout-equal-group="home-featured-products"
            variant="cards"
          >
            {curatedProducts.map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </RevealGrid>
        </div>
      </RevealSection>
    </main>
  );
}

function formatHomeCategoryCount(count: number) {
  if (count === 1) {
    return "פריט אחד";
  }

  return `${count} פריטים`;
}
