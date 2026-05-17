import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarCheck,
  Gem,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import {
  CinematicHeroSequence,
  type CinematicHeroSlide,
} from "~/components/cinematic-hero-sequence";
import { KineticImageMotion } from "~/components/kinetic-image-motion";
import { MetricCard } from "~/components/metric-card";
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
    src: "/brand/aphrodite-aqua-hero-rings.avif",
  },
  {
    alt: "עגילי פנינה ושרשרת על זכוכית בגוון טורקיז יוקרתי",
    src: "/brand/aphrodite-aqua-hero-pearls.avif",
  },
  {
    alt: "צמידים ותליון יהלום בתאורת סטודיו טורקיז ופנינה",
    src: "/brand/aphrodite-aqua-hero-glass.avif",
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
        className="relative isolate min-h-[clamp(30rem,calc(82svh-4rem),40rem)] w-screen max-w-none overflow-hidden bg-[var(--brand-aqua-deep)] [--hero-edge:clamp(1rem,4vw,5rem)] lg:[--hero-edge:clamp(3rem,4vw,5rem)]"
        data-testid="cinematic-page-hero"
        id="page-hero"
        initialVisible
        variant="hero"
      >
        <MotionMediaFrame
          className="absolute inset-0 h-full min-h-[clamp(30rem,calc(82svh-4rem),40rem)] w-full bg-[var(--brand-aqua-deep)]"
          contentClassName="absolute inset-0 min-h-[clamp(30rem,calc(82svh-4rem),40rem)]"
          intensity="cinematic"
          parallax
        >
          <KineticImageMotion intensity="hero">
            <CinematicHeroSequence
              slides={homeSlides}
              testId="cinematic-page-hero-sequence"
            />
          </KineticImageMotion>
        </MotionMediaFrame>
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(6,56,59,0.02),rgba(6,56,59,0.28)_42%,rgba(0,0,0,0.68))]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.6),rgba(6,56,59,0.08)_58%,rgba(185,242,236,0.12))]" />
        <div className="absolute inset-x-0 top-0 h-px bg-[rgba(185,242,236,0.42)]" />
        <div className="relative min-h-[clamp(30rem,calc(82svh-4rem),40rem)]">
          <div
            className="motion-hero-copy absolute top-[var(--hero-edge)] right-[var(--hero-edge)] w-[min(calc(100%_-_var(--hero-edge)_-_var(--hero-edge)),48rem)] text-right text-white lg:w-[min(48rem,calc(50vw_-_var(--hero-edge)_-_2rem))]"
            data-testid="home-hero-copy"
            dir="rtl"
          >
            <h1
              className="motion-copy-item text-right text-4xl leading-[1.05] font-semibold tracking-normal sm:text-6xl lg:text-7xl"
              dir="ltr"
            >
              Aphrodite
            </h1>
            <p className="motion-copy-item mt-4 max-w-xl text-base leading-7 text-white/90 [--motion-copy-delay:90ms] sm:mt-5 sm:text-lg sm:leading-8">
              תכשיטים ישראליים בקו סטודיו מודרני, עם קטלוג אונליין וייעוץ אישי
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
              className="border-white/70 bg-white/10 text-white shadow-none hover:border-white hover:bg-white hover:text-[var(--brand-aqua-deep)] focus-visible:border-white"
              size="lg"
              variant="outline"
            >
              <Link href="/ai">
                ייעוץ אישי
              </Link>
            </Button>
          </div>
        </div>
      </RevealSection>

      <RevealSection className="glass-chrome border-b" id="quick-search">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_2fr]">
          <div>
            <p className="text-muted-foreground text-sm">חיפוש מהיר</p>
            <h2 className="text-2xl font-semibold">מה תרצי למצוא היום?</h2>
          </div>
          <form
            action="/search"
            aria-label="חיפוש בקטלוג"
            className="grid gap-3 sm:grid-cols-[1fr_auto]"
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
        className="mx-auto max-w-7xl px-4 py-14 sm:px-6"
        id="categories"
      >
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-muted-foreground text-sm">קטגוריות</p>
            <h2 className="text-3xl font-semibold">מסלול קצר למוצר הנכון</h2>
          </div>
          <Button asChild variant="outline">
            <Link href="/search">כל הקטלוג</Link>
          </Button>
        </div>
        <RevealGrid
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
          variant="media"
        >
          {categories.map((category) => (
            <Link
              className="glass-card interactive-lift group/card flex min-h-[320px] w-full flex-col overflow-hidden rounded-md border"
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
              <div className="flex flex-1 flex-col p-5">
                <h3 className="text-xl font-medium">{category.name}</h3>
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

      <RevealSection className="liquid-section" id="featured">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-muted-foreground text-sm">נבחרים</p>
              <h2 className="text-3xl font-semibold">תכשיטים זמינים לקנייה</h2>
            </div>
            <Button asChild variant="outline">
              <Link href="/category/rings">טבעות מובילות</Link>
            </Button>
          </div>
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

      <RevealSection
        className="mx-auto max-w-7xl px-4 py-14 sm:px-6"
        id="service-metrics"
      >
        <RevealGrid className="grid gap-5 lg:grid-cols-4" variant="compact">
          <MetricCard
            detail="קטלוג מלא וזמין לרכישה מהבית"
            icon={Gem}
            label="אונליין"
            variant="soft"
            value="100%"
          />
          <MetricCard
            detail="משלוח עד הבית והחזרות בתיאום"
            icon={ShieldCheck}
            label="שירות"
            variant="soft"
            value="מלא"
          />
          <MetricCard
            detail="מתנות, אירועים ותקציב"
            icon={Sparkles}
            label="סטייליסט AI"
            variant="soft"
            value="פעיל"
          />
          <MetricCard
            detail="התאמה, מידה וייעוץ אישי"
            icon={CalendarCheck}
            label="התאמה"
            variant="soft"
            value="בתיאום"
          />
        </RevealGrid>
      </RevealSection>
    </main>
  );
}
