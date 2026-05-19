import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Gem,
  Search,
} from "lucide-react";

import {
  CinematicHeroSequence,
  type CinematicHeroSlide,
} from "~/components/cinematic-hero-sequence";
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

const heroSlides = [
  {
    alt: "טבעות יהלומים על משטח סטודיו בגוון Aphrodite Aqua",
    src: "/brand/v2/hero-rings.avif",
  },
  {
    alt: "עגילי פנינה ושרשרת על זכוכית בגוון טורקיז יוקרתי",
    src: "/brand/v2/hero-pearls.avif",
  },
  {
    alt: "צמידים ותליון יהלום בתאורת סטודיו טורקיז ופנינה",
    src: "/brand/v2/hero-glass.avif",
  },
] satisfies CinematicHeroSlide[];

const homeSlides = Array.from(
  new Map(
    [...cinematicRouteMedia.home, ...heroSlides].map((slide) => [
      slide.src,
      slide,
    ]),
  ).values(),
);

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
        className="relative isolate min-h-[var(--home-hero-height)] w-screen max-w-none overflow-hidden bg-[var(--brand-aqua-deep)] [--hero-edge:clamp(1rem,4vw,5rem)] [--home-hero-height:clamp(20rem,54svh,28rem)] sm:[--home-hero-height:clamp(30rem,calc(66svh-4rem),34rem)] lg:[--hero-edge:clamp(3rem,4vw,5rem)]"
        data-testid="cinematic-page-hero"
        id="page-hero"
        initialVisible
        variant="hero"
      >
        <MotionMediaFrame
          className="absolute inset-0 h-full min-h-[var(--home-hero-height)] w-full bg-[var(--brand-aqua-deep)]"
          contentClassName="absolute inset-0 min-h-[var(--home-hero-height)]"
          intensity="cinematic"
          motionScope="home-hero"
          parallax
        >
          <KineticImageMotion intensity="hero" motionScope="home-hero">
            <CinematicHeroSequence
              motionScope="home-hero"
              slides={homeSlides}
              testId="cinematic-page-hero-sequence"
            />
          </KineticImageMotion>
        </MotionMediaFrame>
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(6,56,59,0.02),rgba(6,56,59,0.24)_42%,rgba(0,0,0,0.64))]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.56),rgba(6,56,59,0.06)_58%,rgba(185,242,236,0.09))]" />
        <div className="absolute inset-x-0 top-0 h-px bg-[rgba(185,242,236,0.42)]" />
        <div className="relative min-h-[var(--home-hero-height)]">
          <div
            className="motion-hero-copy absolute top-[var(--hero-edge)] right-[var(--hero-edge)] w-[min(calc(100%_-_var(--hero-edge)_-_var(--hero-edge)),48rem)] text-right text-white lg:w-[min(48rem,calc(50vw_-_var(--hero-edge)_-_2rem))]"
            data-testid="home-hero-copy"
            dir="rtl"
          >
            <h1
              className="motion-copy-item text-right text-4xl leading-[1.05] font-semibold tracking-normal sm:text-6xl lg:text-[4.75rem]"
              dir="ltr"
            >
              Aphrodite
            </h1>
            <p className="motion-copy-item mt-4 max-w-xl text-base leading-7 text-white/90 [--motion-copy-delay:90ms] sm:mt-5 sm:text-[1.05rem] sm:leading-8">
              תכשיטים ישראליים בקו סטודיו מודרני, עם קטלוג אונליין ושירות אישי
              לבחירה מדויקת.
            </p>
          </div>
        </div>

        <div
          className="home-hero-actions motion-hero-copy absolute inset-x-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] w-auto text-white sm:inset-x-auto sm:bottom-[var(--hero-edge)] sm:left-[var(--hero-edge)] sm:w-[min(calc(100%_-_var(--hero-edge)_-_var(--hero-edge)),36rem)] lg:w-[min(36rem,calc(50vw_-_var(--hero-edge)_-_2rem))]"
          data-testid="home-hero-actions"
          dir="rtl"
        >
          <div className="motion-copy-item flex flex-col items-stretch gap-2 px-3 [--motion-copy-delay:170ms] sm:flex-row sm:items-center sm:justify-end sm:gap-3 sm:px-0">
            <Button
              asChild
              className="border-[var(--brand-aqua)] bg-[var(--brand-aqua)] text-[var(--brand-aqua-deep)] shadow-[0_12px_30px_rgba(66,201,190,0.14)] hover:bg-[var(--brand-aqua)] hover:text-[var(--brand-aqua-deep)]"
              size="lg"
            >
              <Link href="/category/rings">
                לקולקציה
                <ArrowLeft aria-hidden="true" className="size-4" />
              </Link>
            </Button>
            <Button
              asChild
              className="border-white bg-[var(--brand-aqua-deep)] text-white shadow-none hover:border-white hover:bg-white hover:text-[var(--brand-aqua-deep)] focus-visible:border-white"
              size="lg"
              variant="outline"
            >
              <Link href="/service">שירות לקוחות</Link>
            </Button>
          </div>
        </div>
      </RevealSection>

      <RevealSection className="brand-page-band border-b" id="quick-search">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-4 sm:px-6 lg:grid-cols-[0.85fr_2fr] lg:items-center">
          <div>
            <p className="text-muted-foreground text-sm">חיפוש מהיר</p>
            <h2 className="text-2xl font-semibold">מה תרצי למצוא היום?</h2>
          </div>
          <form
            action="/search"
            aria-label="חיפוש בקטלוג"
            className="brand-control-panel grid gap-2 p-1.5 sm:grid-cols-[1fr_auto]"
            role="search"
          >
            <div className="relative">
              <Search
                aria-hidden="true"
                className="text-muted-foreground absolute top-1/2 right-3 size-4 -translate-y-1/2"
              />
              <Input
                aria-label="חיפוש מוצר בקטלוג"
                className="h-12 pr-10"
                name="q"
                placeholder="טבעת זהב, עגילי פנינה, מתנה עד 700..."
              />
            </div>
            <Button className="h-12 gap-2" type="submit">
              חיפוש
              <Search aria-hidden="true" className="size-4" />
            </Button>
          </form>
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
