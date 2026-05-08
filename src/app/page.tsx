import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarCheck,
  Gem,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { BranchCard } from "~/components/branch-card";
import { MetricCard } from "~/components/metric-card";
import { MotionMediaFrame } from "~/components/motion-media-frame";
import { ProductCard } from "~/components/product-card";
import { RevealGrid, RevealSection } from "~/components/reveal";
import { SiteHeader } from "~/components/site-header";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Separator } from "~/components/ui/separator";
import {
  getCatalogBranches,
  getCatalogCategories,
  getFeaturedCatalogProducts,
} from "~/server/services/catalog";

export default async function Home() {
  const [branches, categories, featuredProducts] = await Promise.all([
    getCatalogBranches(),
    getCatalogCategories(),
    getFeaturedCatalogProducts(),
  ]);

  return (
    <main>
      <SiteHeader />

      <RevealSection
        className="relative min-h-[76svh] overflow-hidden [--hero-edge:clamp(1rem,4vw,5rem)] sm:min-h-[78vh]"
        initialVisible
        variant="hero"
      >
        <MotionMediaFrame
          className="absolute inset-0 min-h-[76svh] sm:min-h-[78vh]"
          contentClassName="absolute inset-[-3%]"
          intensity="hero"
          parallax
        >
          <Image
            alt="תכשיטי זהב ויהלומים על משטח סטודיו נקי"
            className="media-mono object-cover"
            fill
            priority
            sizes="100vw"
            src="https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=2200&q=85"
          />
        </MotionMediaFrame>
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.05),rgba(0,0,0,0.36)_45%,rgba(0,0,0,0.7))]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.62),rgba(0,0,0,0.08)_56%,rgba(0,0,0,0.12))]" />
        <div className="relative min-h-[76svh] sm:min-h-[78vh]">
          <div
            className="motion-hero-copy absolute top-[var(--hero-edge)] right-[var(--hero-edge)] w-[min(calc(100%_-_var(--hero-edge)_-_var(--hero-edge)),48rem)] text-right text-white lg:w-[min(48rem,calc(50vw_-_var(--hero-edge)_-_2rem))]"
            dir="rtl"
          >
            <h1
              className="motion-copy-item text-right text-4xl leading-[1.05] font-semibold tracking-normal sm:text-6xl lg:text-7xl"
              dir="ltr"
            >
              Aphrodite
            </h1>
            <p className="motion-copy-item mt-4 max-w-xl text-base leading-7 text-white/90 [--motion-copy-delay:90ms] sm:mt-5 sm:text-lg sm:leading-8">
              רשת תכשיטים ישראלית עם קו סטודיו מודרני, קטלוג אונליין מלא, זמינות
              לפי סניף וייעוץ אישי לבחירת מתנה, טבעת או סט יומיומי.
            </p>
          </div>
        </div>

        <div
          className="motion-hero-copy absolute inset-x-3 bottom-5 w-auto text-white sm:inset-x-auto sm:bottom-[var(--hero-edge)] sm:left-[var(--hero-edge)] sm:w-[min(calc(100%_-_var(--hero-edge)_-_var(--hero-edge)),36rem)] lg:w-[min(36rem,calc(50vw_-_var(--hero-edge)_-_2rem))]"
          dir="rtl"
        >
          <div className="motion-copy-item flex flex-col items-stretch gap-2 [--motion-copy-delay:170ms] sm:flex-row sm:items-center sm:justify-end sm:gap-3">
            <Button asChild size="lg">
              <Link href="/category/rings">
                לקולקציה
                <ArrowLeft className="size-4" />
              </Link>
            </Button>
            <Button
              asChild
              className="text-foreground hover:bg-muted hover:text-foreground border-white bg-white"
              size="lg"
              variant="outline"
            >
              <Link href="/ai">
                ייעוץ סטייליסט AI
                <Sparkles className="size-4" />
              </Link>
            </Button>
          </div>
          <div className="motion-copy-item mt-4 flex flex-wrap justify-center gap-x-3 gap-y-2 border-t border-white/25 pt-3 pr-12 text-[0.7rem] font-medium text-white/90 [--motion-copy-delay:240ms] sm:mt-8 sm:justify-end sm:gap-x-6 sm:gap-y-3 sm:pt-5 sm:pr-0 sm:text-sm">
            {[
              { icon: MapPin, label: "זמינות לפי סניף" },
              { icon: Sparkles, label: "ייעוץ אישי" },
              { icon: ShieldCheck, label: "קופה מאובטחת" },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <div className="flex items-center gap-2" key={item.label}>
                  <Icon className="size-4" />
                  {item.label}
                </div>
              );
            })}
          </div>
        </div>
      </RevealSection>

      <RevealSection className="glass-chrome border-b">
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
              <Search className="text-muted-foreground absolute top-1/2 right-3 size-4 -translate-y-1/2" />
              <Input
                className="h-12 pr-10"
                name="q"
                placeholder="טבעת זהב, עגילי פנינה, מתנה עד 700..."
              />
            </div>
            <Button className="h-12 gap-2" type="submit">
              חיפוש
              <Search className="size-4" />
            </Button>
          </form>
        </div>
      </RevealSection>

      <RevealSection className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
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
              className="glass-card interactive-lift group/card flex min-h-[260px] w-full flex-col overflow-hidden rounded-md border"
              href={`/category/${category.slug}`}
              key={category.slug}
            >
              <div className="bg-muted relative h-28 overflow-hidden border-b border-[var(--glass-border)]">
                <Image
                  alt=""
                  className="media-mono object-cover transition duration-500 ease-[var(--ease-liquid)] group-hover/card:scale-[1.035]"
                  fill
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                  src={category.image}
                />
                <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(255,255,255,0.8),rgba(255,255,255,0.08))]" />
                <div className="glass-inset absolute right-4 bottom-4 flex size-11 items-center justify-center rounded-md border">
                  <Gem className="text-foreground size-5" />
                </div>
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h3 className="text-xl font-medium">{category.name}</h3>
                <p className="text-muted-foreground mt-2 min-h-12 text-sm leading-6">
                  {category.description}
                </p>
                <span className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-medium group-hover/card:underline">
                  צפייה
                  <ArrowLeft className="size-4" />
                </span>
              </div>
            </Link>
          ))}
        </RevealGrid>
      </RevealSection>

      <RevealSection className="liquid-section">
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

      <RevealSection className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <RevealGrid className="grid gap-5 lg:grid-cols-4" variant="compact">
          <MetricCard
            detail="זמינות לפי סניף לפני הגעה"
            icon={MapPin}
            label="סניפים"
            variant="soft"
            value="2"
          />
          <MetricCard
            detail="איסוף, משלוח או החזרה בסניף"
            icon={ShieldCheck}
            label="אומניצ׳אנל"
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
            detail="מדידה וייעוץ אישי"
            icon={CalendarCheck}
            label="תורים"
            variant="soft"
            value="בתיאום"
          />
        </RevealGrid>
      </RevealSection>

      <Separator />

      <RevealSection className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="mb-8">
          <p className="text-muted-foreground text-sm">סניפים</p>
          <h2 className="text-3xl font-semibold">איסוף, מדידה ושירות קרוב</h2>
        </div>
        <RevealGrid className="grid gap-5 lg:grid-cols-2" variant="cards">
          {branches.map((branch) => (
            <BranchCard branch={branch} key={branch.slug} />
          ))}
        </RevealGrid>
      </RevealSection>
    </main>
  );
}
