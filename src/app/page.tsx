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
} from "~/server/services/catalog";

const homeSlides = cinematicRouteMedia.home.slice(0, 1);

const quickSearchSuggestions = [
  { href: "/search?q=טבעת%20זהב", label: "טבעת זהב" },
  { href: "/search?q=עגילי%20פנינה", label: "עגילי פנינה" },
  { href: "/search?maxPrice=700", label: "מתנה עד 700" },
  { href: "/search?category=rings", label: "טבעות" },
] as const;

const collectionCopy: Record<string, string> = {
  bracelets: "קווים נקיים לשכבה עדינה על היד.",
  earrings: "אור קטן סביב הפנים, ליום ולערב.",
  necklaces: "שרשראות שנבנות בשכבות שקטות.",
  rings: "טבעות שנשארות קרובות למחווה.",
};

const materialPrinciples = [
  {
    title: "מתכת שמחזיקה קו",
    text: "זהב, כסף וגימורים בהירים נבחרים לפי איך שהם פוגשים אור, עור ותנועה.",
  },
  {
    title: "אבנים ללא עודף",
    text: "יהלום, פנינה וזירקון מוצגים במינון שמכבד את הפריט ולא מכסה עליו.",
  },
  {
    title: "פרופורציה לפני קישוט",
    text: "כל תכשיט נבחן ביחס ליד, לצוואר או לפנים, כדי להרגיש טבעי ולא מקרי.",
  },
] as const;

const giftRitual = [
  {
    title: "בחירה",
    text: "מתחילים ברגע: יום הולדת, תודה, התחלה חדשה או מחווה שקטה.",
  },
  {
    title: "דיוק",
    text: "בודקים מידה, חומר, תקציב וזמינות לפני שממשיכים להזמנה.",
  },
  {
    title: "מסירה",
    text: "האריזה, הברכה והשירות נבנים כחלק מהתכשיט עצמו.",
  },
] as const;

export const metadata: Metadata = {
  title: "Maison תכשיטים ישראלי",
  description:
    "עמוד הבית של Elysia: סטודיו תכשיטים ישראלי עם קולקציות חתימה, חומריות שקטה, טקס מתנה, ייעוץ אישי ומבחר פריטים אוצרותי.",
  openGraph: {
    title: "Elysia | Maison תכשיטים ישראלי",
    description:
      "קולקציות תכשיטים מדודות, רכישה אונליין ושירות אישי שנבנים סביב בחירה שקטה.",
    images: [{ url: "/brand/v2/editorial-home.avif" }],
  },
};

export default async function Home() {
  const [categories, featuredProducts] = await Promise.all([
    getCatalogCategories(),
    getFeaturedCatalogProducts(8),
  ]);
  const signatureCollections = categories.slice(0, 4);
  const curatedProducts = featuredProducts.slice(0, 4);
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
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.02),rgba(0,0,0,0.18)_42%,rgba(0,0,0,0.62))]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.70),rgba(0,0,0,0.10)_58%,rgba(0,0,0,0.24))]" />
        <div className="absolute inset-x-0 top-0 h-px bg-white opacity-30" />
        <div className="relative min-h-[var(--home-hero-height)]">
          <div
            className="motion-hero-copy absolute top-[var(--hero-edge)] right-[var(--hero-edge)] w-[min(calc(100%_-_var(--hero-edge)_-_var(--hero-edge)),50rem)] text-right text-white lg:w-[min(50rem,calc(52vw_-_var(--hero-edge)_-_2rem))]"
            data-testid="home-hero-copy"
            dir="rtl"
          >
            <p className="motion-copy-item text-xs font-medium tracking-normal text-white/78">
              סטודיו תכשיטים ישראלי
            </p>
            <h1
              className="home-hero-wordmark motion-copy-item mt-4 text-right text-5xl leading-[0.96] font-medium tracking-normal sm:text-7xl lg:text-[6rem]"
              dir="ltr"
            >
              Elysia
            </h1>
            <p className="motion-copy-item mt-5 max-w-2xl text-xl leading-8 text-white/94 [--motion-copy-delay:90ms] sm:text-3xl sm:leading-10">
              Maison קטן לתכשיטים שנבחרים בשקט, נענדים לאורך זמן ונשארים קרובים.
            </p>
            <p className="motion-copy-item mt-4 max-w-xl text-sm leading-7 text-white/78 [--motion-copy-delay:130ms] sm:text-base sm:leading-8">
              קולקציות חתימה, חומריות מדודה ושירות אישי לפני הבחירה, בזמן
              ההזמנה ולאחר המסירה.
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
                כניסה לקולקציות
                <ArrowLeft
                  aria-hidden="true"
                  className="home-hero-cta-icon size-4"
                />
              </Link>
            </Button>
            {heroCategoryLinks.length > 0 ? (
              <nav
                aria-label="קישורי קולקציות מהירים"
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
              <Link href="/search">כל הקולקציה</Link>
            </Button>
          }
          description="ארבע נקודות כניסה עריכתיות אל הקטלוג, לפי מחווה, חומר וקו."
          eyebrow="קולקציות חתימה"
          title="לא מתחילים במוצר. מתחילים בתחושה."
        />
        <RevealGrid
          className="grid grid-cols-2 gap-2.5 sm:gap-x-4 sm:gap-y-6 lg:grid-cols-4"
          variant="media"
        >
          {signatureCollections.map((category) => (
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
                <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(16,19,20,0.54),rgba(16,19,20,0.12)_56%,rgba(255,255,255,0.04))] sm:bg-[linear-gradient(to_top,rgba(16,19,20,0.24),rgba(16,19,20,0.03)_44%,rgba(255,255,255,0.04))]" />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3 text-white sm:hidden">
                  <div className="min-w-0">
                    <h3 className="min-w-0 text-base leading-5 font-medium">
                      {category.name}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/78">
                      {collectionCopy[category.slug] ?? category.description}
                    </p>
                  </div>
                  <ArrowLeft aria-hidden="true" className="size-4 shrink-0" />
                </div>
              </div>
              <div className="mt-3 hidden border-b border-[var(--glass-border)] pb-3 text-center sm:block">
                <h3 className="group-hover/card:text-muted-foreground group-focus-visible/card:text-muted-foreground min-w-0 text-base leading-6 font-medium transition-colors duration-[var(--motion-fast)] ease-[var(--ease-motion-standard)] sm:text-lg">
                  {category.name}
                </h3>
                <p className="text-muted-foreground mx-auto mt-1 max-w-48 text-sm leading-6">
                  {collectionCopy[category.slug] ?? category.description}
                </p>
              </div>
            </Link>
          ))}
        </RevealGrid>
      </RevealSection>

      <RevealSection
        className="brand-page-band border-y border-[var(--glass-border)]"
        id="materials"
      >
        <div className="mx-auto grid max-w-7xl gap-8 px-[var(--ui-page-x)] py-[var(--ui-section-y)] sm:px-[var(--ui-page-x-wide)] lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-center">
          <div className="relative min-h-[22rem] overflow-hidden rounded-md bg-muted sm:min-h-[28rem]">
            <Image
              alt="תכשיטי זהב ופנינים על זכוכית אקווה בתאורת סטודיו"
              className="media-color-rich object-cover"
              fill
              sizes="(min-width: 1024px) 48vw, 100vw"
              src="/brand/v2/content-editorial.avif"
            />
          </div>
          <div className="grid gap-6">
            <CommerceSectionHeader
              description="היוקרה של Elysia אינה נשענת על עודף. היא נשענת על משקל נכון, מפגש אור עדין והבטחה שהפריט יישאר שימושי גם אחרי הרגע הראשון."
              eyebrow="אומנות וחומרים"
              title="חומר, אור ופרופורציה לפני כל דבר אחר."
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
              description="מתנה טובה אינה צריכה להיות רועשת. היא צריכה להגיע בזמן הנכון, בגודל הנכון, עם מספיק שקט כדי לזכור אותה."
              eyebrow="טקס מתנה"
              title="מחשבה קטנה שמגיעה עטופה בדיוק."
            />
            <Button asChild className="mt-6" variant="outline">
              <Link href="/gifts">
                מתנות תכשיטים
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
                <p className="text-muted-foreground text-sm" dir="ltr">
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
              description="כשמידה, שכבות, מתנה או חומר דורשים עוד עין, הייעוץ האישי נכנס בשקט. לא כדי לבחור במקומך, אלא כדי לדייק את הבחירה שכבר התחילה."
              eyebrow="ייעוץ אישי"
              title="עין נוספת לפני החלטה קטנה וחשובה."
            />
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button asChild>
                <Link href="/stylist">
                  התחלת ייעוץ אישי
                  <MessageCircle aria-hidden="true" className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/size-guide">מדריך מידות</Link>
              </Button>
            </div>
          </div>
          <div className="relative min-h-[22rem] overflow-hidden rounded-md bg-muted sm:min-h-[28rem]">
            <Image
              alt="מגש שירות עם אריזת תכשיטים ופנינים"
              className="media-color-rich object-cover"
              fill
              priority
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
            <p className="text-muted-foreground text-sm">חיפוש שקט</p>
            <h2 className="text-2xl font-medium">אם כבר יודעים מה מחפשים.</h2>
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
        <div className="mx-auto max-w-7xl px-[var(--ui-page-x)] py-[var(--ui-section-y)] sm:px-[var(--ui-page-x-wide)]">
          <CommerceSectionHeader
            action={
              <Button asChild size="sm" variant="outline">
                <Link href="/search">
                  צפייה במבחר המלא
                  <Gem aria-hidden="true" className="size-4" />
                </Link>
              </Button>
            }
            description="מעט פריטים, מספיק כיוון. מבחר שמראה את היד של הסטודיו לפני שהוא מציג את כל המדף."
            eyebrow="מבחר אוצרותי"
            title="פריטים שנבחרו לפתוח איתם את הדלת."
          />
          <RevealGrid
            className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
            variant="cards"
          >
            {curatedProducts.map((product, index) => (
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
