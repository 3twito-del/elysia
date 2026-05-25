import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";

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
  searchCatalogProducts,
} from "~/server/services/catalog";

const homeSlides = cinematicRouteMedia.home.slice(0, 1);

const quickSearchSuggestions = [
  { href: "/search?q=טבעת%20זהב", label: "טבעת זהב" },
  { href: "/search?q=עגילי%20פנינה", label: "עגילי פנינה" },
  { href: "/search?maxPrice=700", label: "מתנה עד 700" },
  { href: "/search?category=rings", label: "טבעות" },
] as const;

export default async function Home() {
  const [categories, ringProducts] = await Promise.all([
    getCatalogCategories(),
    searchCatalogProducts({ category: "rings" }),
  ]);
  const featuredProducts = ringProducts.slice(0, 4);
  const heroCategoryLinks = categories.slice(0, 3);

  return (
    <main>
      <SiteHeader />

      <RevealSection
        className="relative isolate min-h-[var(--home-hero-height)] w-screen max-w-none overflow-hidden [--hero-edge:clamp(1.15rem,4vw,5rem)] [--home-hero-height:clamp(35rem,86svh,44rem)] sm:[--home-hero-height:clamp(40rem,78svh,52rem)] lg:[--hero-edge:clamp(3rem,4vw,5rem)]"
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
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.02),rgba(0,0,0,0.16)_44%,rgba(0,0,0,0.58))]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.68),rgba(0,0,0,0.12)_58%,rgba(0,0,0,0.22))]" />
        <div className="absolute inset-x-0 top-0 h-px bg-white opacity-30" />
        <div className="relative min-h-[var(--home-hero-height)]">
          <div
            className="motion-hero-copy absolute top-[var(--hero-edge)] right-[var(--hero-edge)] w-[min(calc(100%_-_var(--hero-edge)_-_var(--hero-edge)),48rem)] text-right text-white lg:w-[min(48rem,calc(50vw_-_var(--hero-edge)_-_2rem))]"
            data-testid="home-hero-copy"
            dir="rtl"
          >
            <h1
              className="home-hero-wordmark motion-copy-item text-right text-5xl leading-[0.96] font-medium tracking-normal sm:text-7xl lg:text-[6rem]"
              dir="ltr"
            >
              Elysia
            </h1>
            <p className="motion-copy-item mt-4 max-w-xl text-base leading-7 text-white/90 [--motion-copy-delay:90ms] sm:mt-5 sm:text-[1.05rem] sm:leading-8">
              תכשיטים מדויקים לרגעים שנשארים.
            </p>
            <p className="motion-copy-item mt-2 max-w-xl text-sm leading-6 text-white/78 [--motion-copy-delay:130ms] sm:text-base sm:leading-7">
              קולקציה ישראלית נקייה בטבעות, שרשראות, עגילים וצמידים.
            </p>
          </div>
        </div>

        <div
          className="home-hero-actions motion-hero-copy absolute inset-x-4 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] w-auto text-white sm:inset-x-auto sm:bottom-[var(--hero-edge)] sm:left-[var(--hero-edge)] sm:w-[min(calc(100%_-_var(--hero-edge)_-_var(--hero-edge)),36rem)] lg:w-[min(36rem,calc(50vw_-_var(--hero-edge)_-_2rem))]"
          data-testid="home-hero-actions"
          dir="rtl"
        >
          <div className="motion-copy-item grid items-stretch gap-3 px-3 [--motion-copy-delay:170ms] sm:justify-items-end sm:px-0">
            <Button
              asChild
              className="home-hero-cta-primary text-foreground hover:text-foreground border-white bg-white shadow-none hover:border-white hover:bg-white"
              size="lg"
            >
              <Link href="/category/rings">
                לקולקציה
                <ArrowLeft
                  aria-hidden="true"
                  className="home-hero-cta-icon size-4"
                />
              </Link>
            </Button>
            {heroCategoryLinks.length > 0 ? (
              <nav
                aria-label="קישורי קטגוריות מהירים"
                className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-white/82 sm:justify-end"
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
              <Link href="/search">כל הקטלוג</Link>
            </Button>
          }
          eyebrow="קטגוריות"
          title="מסלול קצר למוצר הנכון"
        />
        <RevealGrid
          className="grid grid-cols-2 gap-2.5 sm:gap-x-4 sm:gap-y-6 lg:grid-cols-4"
          variant="media"
        >
          {categories.map((category) => (
            <Link
              className="group/card block w-full min-w-0 outline-none focus-visible:ring-3 focus-visible:ring-[var(--glass-focus)] focus-visible:outline-none"
              data-testid="home-category-tile"
              href={`/category/${category.slug}`}
              key={category.slug}
            >
              <div className="bg-muted relative aspect-[4/3] overflow-hidden rounded-md sm:aspect-[4/5] sm:min-h-[220px]">
                <Image
                  alt=""
                  className="media-color object-cover object-center transition duration-[700ms] ease-[var(--ease-motion-standard)] group-hover/card:scale-[1.015]"
                  fill
                  sizes="(min-width: 1280px) 18rem, (min-width: 1024px) 25vw, 50vw"
                  src={
                    getCategoryBrandSlides(category.slug)[0]?.src ??
                    category.image
                  }
                />
                <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(16,19,20,0.48),rgba(16,19,20,0.08)_58%,rgba(255,255,255,0.04))] sm:bg-[linear-gradient(to_top,rgba(16,19,20,0.18),rgba(16,19,20,0.02)_42%,rgba(255,255,255,0.04))]" />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3 text-white sm:hidden">
                  <h3 className="min-w-0 text-base leading-5 font-medium">
                    {category.name}
                  </h3>
                  <ArrowLeft aria-hidden="true" className="size-4 shrink-0" />
                </div>
              </div>
              <div className="mt-3 hidden border-b border-[var(--glass-border)] pb-3 text-center sm:block">
                <h3 className="group-hover/card:text-muted-foreground group-focus-visible/card:text-muted-foreground min-w-0 text-base leading-6 font-medium transition-colors duration-[var(--motion-fast)] ease-[var(--ease-motion-standard)] sm:text-lg">
                  {category.name}
                </h3>
              </div>
            </Link>
          ))}
        </RevealGrid>
      </RevealSection>

      <RevealSection
        className="brand-page-band border-y border-[var(--glass-border)]"
        id="quick-search"
      >
        <div className="mx-auto grid max-w-7xl gap-4 px-[var(--ui-page-x)] py-5 sm:px-[var(--ui-page-x-wide)] sm:py-6 lg:grid-cols-[minmax(15rem,0.7fr)_minmax(0,1.9fr)] lg:items-center">
          <div className="min-w-0">
            <p className="text-muted-foreground text-sm">חיפוש מהיר</p>
            <h2 className="text-2xl font-medium">מה תרצי למצוא היום?</h2>
          </div>
          <div className="grid min-w-0 gap-3">
            <form
              action="/search"
              aria-label="חיפוש בקטלוג"
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
                  aria-label="חיפוש מוצר בקטלוג"
                  className="bg-background h-[3.25rem] rounded-md border-[var(--glass-border)] pr-11 pl-3 text-sm shadow-none focus-visible:border-[var(--glass-border-strong)]"
                  name="q"
                  placeholder="טבעת זהב, עגילי פנינה, מתנה עד 700..."
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
        <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10">
          <CommerceSectionHeader
            eyebrow="נבחרים"
            title="תכשיטים זמינים לקנייה"
          />
          <RevealGrid
            className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
            variant="cards"
          >
            {featuredProducts.map((product, index) => (
              <ProductCard
                imagePriority={index < 4}
                key={product.slug}
                product={product}
              />
            ))}
          </RevealGrid>
        </div>
      </RevealSection>
    </main>
  );
}
