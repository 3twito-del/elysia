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
import { ProductCard } from "~/components/product-card";
import { RevealGrid, RevealSection } from "~/components/reveal";
import { SiteHeader } from "~/components/site-header";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Separator } from "~/components/ui/separator";
import { brandMedia } from "~/lib/brand-media";
import { removeGoldLanguage } from "~/lib/gold-free-copy";
import {
  getCatalogBranches,
  getCatalogCategories,
  getFeaturedCatalogProducts,
} from "~/server/services/catalog";

const quickSearches = [
  { href: `/search?q=${encodeURIComponent("טבעת דקה")}`, label: "טבעות דקות" },
  {
    href: `/search?q=${encodeURIComponent("עגילי פנינה")}`,
    label: "עגילי פנינה",
  },
  { href: "/search?maxPrice=700", label: "מתנות עד 700" },
];

const heroStats = [
  { label: "פריטים", value: "75+", dir: "ltr" },
  { label: "סניפים", value: "2", dir: "rtl" },
  { label: "זמינות", value: "לפי סניף", dir: "rtl" },
];

const trustSignals = [
  {
    detail: "בדיקה לפני הגעה",
    icon: MapPin,
    label: "מלאי לפי סניף",
  },
  {
    detail: "התאמה למתנה, אירוע ותקציב",
    icon: Sparkles,
    label: "ייעוץ אישי",
  },
  {
    detail: "קופה מוגנת ואיסוף מסודר",
    icon: ShieldCheck,
    label: "רכישה מאובטחת",
  },
];

const serviceFlow = [
  {
    detail: "סינון לפי קטגוריה, חומר, אבן ותקציב.",
    icon: Search,
    label: "בחירה מדויקת",
  },
  {
    detail: "בדיקת מלאי בסניף לפני יציאה.",
    icon: MapPin,
    label: "מלאי קרוב",
  },
  {
    detail: "תיאום ב-WhatsApp, איסוף או קנייה אונליין.",
    icon: CalendarCheck,
    label: "מדידה או איסוף",
  },
];

const atelierNotes = [
  {
    label: "Art direction",
    value: "סטודיו נקי, תכשיט במרכז, ללא עומס ויזואלי",
  },
  {
    label: "Commerce",
    value: "מחיר, זמינות ופעולה ברורים לפני המעבר למוצר",
  },
  {
    label: "Service",
    value: "סניף, מדידה וייעוץ אישי כחלק מהחוויה",
  },
] as const;

export default async function Home() {
  const [branches, categories, featuredProducts] = await Promise.all([
    getCatalogBranches(),
    getCatalogCategories(),
    getFeaturedCatalogProducts(),
  ]);

  return (
    <main>
      <SiteHeader />

      <RevealSection className="luxury-hero-frame isolate min-h-[70svh] [--hero-edge:clamp(1rem,4vw,5rem)] sm:min-h-[74vh] lg:min-h-[76vh]">
        <Image
          alt="תכשיטים ויהלומים על משטח סטודיו נקי"
          className="media-color-rich object-cover object-center"
          fill
          priority
          sizes="100vw"
          src={brandMedia.homeHero.url}
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.04),rgba(0,0,0,0.18)_42%,rgba(0,0,0,0.7))]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.54),rgba(0,0,0,0.03)_58%,rgba(0,0,0,0.08))]" />
        <div className="absolute inset-y-0 right-0 w-[min(56rem,72vw)] bg-[linear-gradient(90deg,rgba(0,0,0,0),rgba(32,40,62,0.18)_52%,rgba(255,255,255,0.06))]" />
        <div className="relative min-h-[70svh] sm:min-h-[74vh] lg:min-h-[76vh]">
          <div
            className="absolute top-[var(--hero-edge)] right-[var(--hero-edge)] w-[min(calc(100%_-_var(--hero-edge)_-_var(--hero-edge)),48rem)] text-right text-white drop-shadow-[0_14px_34px_rgba(0,0,0,0.32)] lg:w-[min(48rem,calc(50vw_-_var(--hero-edge)_-_2rem))]"
            dir="rtl"
          >
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border [border-color:var(--luxury-accent-border)] bg-white/10 px-3 py-1 text-xs font-medium text-white/90 shadow-[0_10px_28px_rgba(0,0,0,0.16)] backdrop-blur">
              <Gem className="size-3.5" />
              קולקציית סטודיו 2026
            </div>
            <h1
              className="text-right text-4xl leading-[1.05] font-semibold tracking-normal text-balance sm:text-6xl lg:text-7xl"
              dir="ltr"
            >
              Aphrodite
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-white/90 sm:mt-5 sm:text-lg sm:leading-8">
              רשת תכשיטים ישראלית עם קו סטודיו מודרני, קטלוג אונליין מלא, זמינות
              לפי סניף וייעוץ אישי לבחירת מתנה, טבעת או סט יומיומי.
            </p>
            <div className="mt-7 hidden max-w-lg grid-cols-3 gap-2 border-y border-white/20 py-4 text-right sm:grid">
              {heroStats.map((item) => (
                <div className="min-w-0" key={item.label}>
                  <div
                    className="text-lg font-semibold text-white sm:text-2xl"
                    dir={item.dir}
                  >
                    {item.value}
                  </div>
                  <div className="mt-1 text-xs text-white/70">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-[clamp(6rem,14vh,9rem)] bottom-[calc(var(--hero-edge)+8rem)] left-[var(--hero-edge)] hidden w-[min(35rem,39vw)] grid-cols-[minmax(0,1fr)_minmax(0,0.64fr)] gap-4 lg:grid"
          >
            <div className="relative overflow-hidden border border-white/25 bg-white/8 shadow-[0_34px_90px_rgba(0,0,0,0.34)]">
              <Image
                alt=""
                className="media-color-rich object-cover"
                fill
                sizes="38vw"
                src={brandMedia.collectionHeroes["bridal-edit"].url}
              />
              <div className="absolute inset-x-0 bottom-0 bg-black/68 p-4 text-white backdrop-blur-sm">
                <p className="text-sm font-medium">Aphrodite Atelier</p>
                <p className="mt-1 text-xs leading-5 text-white/72">
                  פרטי מוצר, זמינות ושירות במסלול קנייה אחד.
                </p>
              </div>
            </div>
            <div className="grid gap-4">
              <div className="relative overflow-hidden border border-white/25 bg-white/8 shadow-[0_24px_60px_rgba(0,0,0,0.26)]">
                <Image
                  alt=""
                  className="media-color object-cover"
                  fill
                  sizes="18vw"
                  src={brandMedia.homeSecondary.url}
                />
              </div>
              <div className="border border-white/22 bg-white/10 p-4 text-white shadow-[0_20px_54px_rgba(0,0,0,0.2)] backdrop-blur">
                <Gem className="mb-3 size-5" />
                <div className="text-3xl font-semibold">75+</div>
                <div className="mt-1 text-xs leading-5 text-white/70">
                  פריטים זמינים עם מלאי גלוי ואיסוף מסניף.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          className="absolute inset-x-3 bottom-5 w-auto text-white sm:inset-x-auto sm:right-[var(--hero-edge)] sm:bottom-[var(--hero-edge)] sm:w-[min(calc(100%_-_var(--hero-edge)_-_var(--hero-edge)),36rem)] lg:w-[min(36rem,calc(50vw_-_var(--hero-edge)_-_2rem))]"
          dir="rtl"
        >
          <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
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
          <div className="mt-4 flex flex-wrap justify-center gap-x-3 gap-y-2 border-t border-white/25 pt-3 pr-12 text-[0.7rem] font-medium text-white/90 sm:mt-8 sm:justify-end sm:gap-x-6 sm:gap-y-3 sm:pt-5 sm:pr-0 sm:text-sm">
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

      <RevealSection className="editorial-slab">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-7">
          <div className="commerce-command grid gap-5 rounded-md p-4 sm:p-5 lg:grid-cols-[minmax(14rem,0.8fr)_minmax(0,1.7fr)] lg:items-center lg:gap-x-8">
            <div>
              <p className="text-muted-foreground text-sm">חיפוש מהיר</p>
              <h2 className="text-xl font-semibold sm:text-2xl">
                מה תרצי למצוא היום?
              </h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {quickSearches.map((search) => (
                  <Link
                    className="glass-inset interactive-lift inline-flex h-8 items-center rounded-full border px-3 text-xs font-medium hover:[border-color:var(--luxury-accent-border)]"
                    href={search.href}
                    key={search.href}
                  >
                    {search.label}
                  </Link>
                ))}
              </div>
            </div>
            <form
              action="/search"
              aria-label="חיפוש בקטלוג"
              className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]"
              role="search"
            >
              <div className="relative">
                <Search className="text-muted-foreground absolute top-1/2 right-3 size-4 -translate-y-1/2" />
                <Input
                  className="h-12 pr-10"
                  name="q"
                  placeholder="טבעת דקה, עגילי פנינה, מתנה עד 700..."
                />
              </div>
              <Button className="h-12 gap-2" type="submit">
                חיפוש
                <Search className="size-4" />
              </Button>
            </form>
            <div className="grid gap-3 border-t border-[var(--glass-border)] pt-4 sm:grid-cols-3 lg:col-span-2">
              {trustSignals.map((signal) => {
                const Icon = signal.icon;

                return (
                  <div
                    className="flex min-w-0 items-start gap-3"
                    key={signal.label}
                  >
                    <span className="glass-inset text-foreground grid size-9 shrink-0 place-items-center rounded-md border">
                      <Icon className="size-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-medium">
                        {signal.label}
                      </span>
                      <span className="text-muted-foreground mt-0.5 block text-xs leading-5">
                        {signal.detail}
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </RevealSection>

      <RevealSection className="editorial-band signature-grid border-b border-[var(--glass-border)]">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center lg:py-16">
          <div className="grid gap-5">
            <p className="editorial-eyebrow">Aphrodite Atelier</p>
            <h2 className="editorial-title max-w-2xl text-3xl font-semibold sm:text-4xl">
              חוויית תכשיטים שבנויה כמו סטודיו, לא כמו תבנית קמעונאית.
            </h2>
            <p className="text-muted-foreground max-w-2xl leading-7">
              הקטלוג מקבל קצב של מגזין יוקרה: משטח נקי, תמונה מובחנת, פעולה
              מסחרית ברורה ושירות שמופיע במקום שבו הלקוחה צריכה אותו.
            </p>
            <div className="editorial-rule grid gap-0">
              {atelierNotes.map((note) => (
                <div
                  className="grid gap-1 border-b border-[var(--glass-border)] py-4 last:border-b-0 sm:grid-cols-[10rem_1fr]"
                  key={note.label}
                >
                  <span className="text-sm font-medium" dir="ltr">
                    {note.label}
                  </span>
                  <span className="text-muted-foreground text-sm leading-6">
                    {note.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="editorial-mosaic sm:grid-cols-[minmax(0,0.72fr)_minmax(0,1fr)] sm:items-end">
            <div className="relative aspect-[3/4] overflow-hidden border border-[var(--glass-border)]">
              <Image
                alt=""
                className="media-color-rich object-cover"
                fill
                sizes="(min-width: 1024px) 32vw, 100vw"
                src={brandMedia.homeSecondary.url}
              />
            </div>
            <div className="relative aspect-[4/5] overflow-hidden border border-[var(--glass-border)] sm:mb-10">
              <Image
                alt=""
                className="media-color object-cover"
                fill
                sizes="(min-width: 1024px) 40vw, 100vw"
                src={brandMedia.collectionHeroes["bridal-edit"].url}
              />
              <div className="bg-foreground/82 text-background absolute inset-x-0 bottom-0 p-4">
                <p className="text-sm font-medium">Bridal edit</p>
                <p className="text-background/72 mt-1 text-xs leading-5">
                  טבעות, יהלומים ומתנות שנבחרות לפי רגע, לא לפי עומס קטגוריות.
                </p>
              </div>
            </div>
          </div>
        </div>
      </RevealSection>

      <RevealSection className="signature-grid mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-start">
          <div className="max-w-2xl">
            <p className="text-muted-foreground text-sm">קטגוריות</p>
            <h2 className="text-2xl font-semibold sm:text-3xl">
              מסלול קצר למוצר הנכון
            </h2>
            <p className="text-muted-foreground mt-2 text-sm leading-6">
              כניסה מהירה לפי צורך: טבעת, שרשרת, עגילים או מתנה עם זמינות אמיתית
              מהקטלוג.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/search">כל הקטלוג</Link>
          </Button>
        </div>
        <RevealGrid className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => (
            <Link
              aria-label={`צפייה בקטגוריית ${category.name}`}
              className="glass-card interactive-lift group/card flex min-h-[22rem] w-full flex-col overflow-hidden rounded-md border"
              href={`/category/${category.slug}`}
              key={category.slug}
            >
              <div className="bg-muted relative aspect-[4/3] overflow-hidden border-b border-[var(--glass-border)]">
                <Image
                  alt=""
                  className="media-mono object-cover transition duration-500 ease-[var(--ease-liquid)] group-hover/card:scale-[1.035]"
                  fill
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                  src={category.image}
                />
                <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.5),rgba(0,0,0,0.02)_58%)]" />
                <div className="text-foreground absolute right-4 bottom-4 flex size-11 items-center justify-center rounded-md border [border-color:var(--luxury-accent-border)] bg-white/95 shadow-sm">
                  <Gem className="size-5" />
                </div>
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h3 className="text-xl font-medium">{category.name}</h3>
                <p className="text-muted-foreground mt-2 min-h-12 text-sm leading-6">
                  {removeGoldLanguage(category.description)}
                </p>
                <span className="mt-auto inline-flex items-center justify-between gap-3 border-t border-[var(--glass-border)] pt-5 text-sm font-medium">
                  <span>צפייה בקטגוריה</span>
                  <ArrowLeft className="size-4" />
                </span>
              </div>
            </Link>
          ))}
        </RevealGrid>
      </RevealSection>

      <RevealSection className="product-spotlight">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-start">
            <div className="max-w-2xl">
              <p className="text-muted-foreground text-sm">נבחרים</p>
              <h2 className="text-2xl font-semibold sm:text-3xl">
                תכשיטים זמינים לקנייה
              </h2>
              <p className="text-muted-foreground mt-2 text-sm leading-6">
                בחירה מרוכזת מהקטלוג עם חומר, קולקציה וזמינות ברורה לפני הכניסה
                לעמוד המוצר.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/category/rings">טבעות מובילות</Link>
            </Button>
          </div>
          <RevealGrid className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
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

      <RevealSection className="bg-foreground text-background relative isolate overflow-hidden border-y">
        <Image
          alt=""
          className="object-cover object-center opacity-55"
          fill
          sizes="100vw"
          src={brandMedia.homeSecondary.url}
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.18),rgba(0,0,0,0.62)_48%,rgba(0,0,0,0.86))]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(20rem,0.75fr)] lg:items-end">
          <div className="max-w-2xl">
            <p className="text-background/70 text-sm">שירות אישי</p>
            <h2 className="mt-2 max-w-[17rem] text-2xl leading-tight font-semibold text-balance sm:max-w-none sm:text-4xl">
              מהקטלוג למדידה בלי ניחושים
            </h2>
            <p className="text-background/78 mt-4 max-w-xl text-sm leading-7 sm:text-base">
              בחירה מהירה של פריט, בדיקת זמינות בסניף ותיאום מדידה או איסוף
              בערוץ אחד ברור.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                className="border-background bg-background text-foreground hover:bg-background/90"
                size="lg"
              >
                <Link href="/branches">
                  סניפים ואיסוף
                  <MapPin className="size-4" />
                </Link>
              </Button>
              <Button
                asChild
                className="border-background/45 text-background hover:bg-background hover:text-foreground border bg-transparent"
                size="lg"
                variant="ghost"
              >
                <Link href="/ai">
                  ייעוץ אישי
                  <Sparkles className="size-4" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="border-background/18 grid gap-1 border-y py-2">
            {serviceFlow.map((step) => {
              const Icon = step.icon;

              return (
                <div
                  className="grid grid-cols-[auto_1fr] items-start gap-4 py-4"
                  key={step.label}
                >
                  <span className="border-background/24 bg-background/10 grid size-10 place-items-center rounded-md border">
                    <Icon className="size-4" />
                  </span>
                  <span>
                    <span className="block text-base font-medium">
                      {step.label}
                    </span>
                    <span className="text-background/68 mt-1 block text-sm leading-6">
                      {step.detail}
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </RevealSection>

      <RevealSection className="signal-ledger px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col gap-4 border-b border-[var(--glass-border)] pb-6 sm:flex-row sm:items-end sm:justify-start">
            <div className="max-w-2xl">
              <p className="text-muted-foreground text-sm">הבטחת שירות</p>
              <h2 className="max-w-[18rem] text-2xl font-semibold sm:max-w-none sm:text-3xl">
                פחות חיכוך בין בחירה, תשלום ואיסוף
              </h2>
              <p className="text-muted-foreground mt-2 text-sm leading-6">
                המדדים המרכזיים מרוכזים במקום אחד כדי להבהיר מה קורה אחרי
                שבוחרים פריט מהקטלוג.
              </p>
            </div>
            <div className="glass-inset text-muted-foreground hidden rounded-md border px-4 py-3 text-sm sm:block">
              זמינות, שירות ותיאום במקום אחד
            </div>
          </div>
          <RevealGrid className="grid gap-5 lg:grid-cols-4">
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
        </div>
      </RevealSection>

      <Separator />

      <RevealSection className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-start">
          <div className="max-w-2xl">
            <p className="text-muted-foreground text-sm">סניפים</p>
            <h2 className="max-w-[18rem] text-2xl font-semibold sm:max-w-none sm:text-3xl">
              איסוף, מדידה ושירות קרוב
            </h2>
            <p className="text-muted-foreground mt-2 text-sm leading-6">
              כל סניף מוצג עם כתובת, שעות פתיחה, ערוצי קשר ושירותים כדי לקצר את
              הדרך מהקטלוג למדידה.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/branches">כל הסניפים</Link>
          </Button>
        </div>
        <RevealGrid className="grid gap-5 lg:grid-cols-2">
          {branches.map((branch) => (
            <BranchCard branch={branch} key={branch.slug} />
          ))}
        </RevealGrid>
      </RevealSection>
    </main>
  );
}
