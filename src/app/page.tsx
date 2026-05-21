import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Gem, Search } from "lucide-react";

import { CinematicHeroSequence } from "~/components/cinematic-hero-sequence";
import { CommerceSectionHeader } from "~/components/commerce-section-header";
import { KineticImageMotion } from "~/components/kinetic-image-motion";
import { MotionMediaFrame } from "~/components/motion-media-frame";
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
        <MotionMediaFrame
          className="absolute inset-0 h-full min-h-[var(--home-hero-height)] w-full"
          contentClassName="absolute inset-0 min-h-[var(--home-hero-height)]"
          intensity="cinematic"
          motionScope="home-hero"
        >
          <KineticImageMotion
            intensity="hero"
            motionScope="home-hero"
            scrollMotion={false}
          >
            <CinematicHeroSequence
              motionScope="home-hero"
              slides={homeSlides}
              testId="cinematic-page-hero-sequence"
            />
          </KineticImageMotion>
        </MotionMediaFrame>
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
          <div className="motion-copy-item flex flex-col items-stretch gap-3 px-3 [--motion-copy-delay:170ms] sm:flex-row sm:items-center sm:justify-end sm:gap-5 sm:px-0">
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
            <Link
              className="home-hero-service-link inline-flex min-h-11 items-center justify-center text-sm font-medium text-white underline-offset-4 transition-colors outline-none hover:text-white/82 hover:underline focus-visible:ring-3 focus-visible:ring-white/45 sm:min-h-0"
              href="/service"
            >
              שירות לקוחות
            </Link>
          </div>
        </div>
      </RevealSection>

      <RevealSection
        className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10"
        id="categories"
      >
        <CommerceSectionHeader
          action={
            <Button asChild variant="outline">
              <Link href="/search">כל הקטלוג</Link>
            </Button>
          }
          eyebrow="קטגוריות"
          title="מסלול קצר למוצר הנכון"
        />
        <RevealGrid
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
          variant="media"
        >
          {categories.map((category) => (
            <Link
              className="brand-surface interactive-lift group/card flex min-h-[220px] w-full flex-col overflow-hidden rounded-md sm:min-h-[270px]"
              href={`/category/${category.slug}`}
              key={category.slug}
            >
              <div className="bg-muted relative aspect-[3/2] overflow-hidden border-b border-[var(--glass-border)]">
                <Image
                  alt=""
                  className="media-mono object-cover object-center transition duration-[700ms] ease-[var(--ease-motion-standard)] group-hover/card:scale-[1.015]"
                  fill
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                  src={
                    getCategoryBrandSlides(category.slug)[0]?.src ??
                    category.image
                  }
                />
                <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(255,255,255,0.8),rgba(255,255,255,0.08))]" />
                <div className="glass-inset absolute right-4 bottom-4 flex size-11 items-center justify-center rounded-md border">
                  <Gem aria-hidden="true" className="text-foreground size-5" />
                </div>
              </div>
              <div className="flex flex-1 flex-col p-4">
                <h3 className="text-lg font-medium">{category.name}</h3>
                <p className="text-muted-foreground mt-2 min-h-12 text-sm leading-6">
                  {category.description}
                </p>
                <span className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-medium group-hover/card:underline">
                  צפייה
                  <ArrowLeft aria-hidden="true" className="size-4" />
                </span>
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
            action={
              <Button asChild variant="outline">
                <Link href="/category/rings">טבעות מובילות</Link>
              </Button>
            }
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
