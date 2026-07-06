import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  Gem,
  Headphones,
  HelpCircle,
  Ruler,
  Search,
  Sparkles,
  Truck,
} from "lucide-react";

import { DeferredFixedBackgroundBand } from "~/components/deferred-fixed-background-band";
import { RevealSection } from "~/components/reveal";
import { SiteHeader } from "~/components/site-header";
import { Button } from "~/components/ui/button";

import { AboutChapterNav, type AboutChapter } from "./_components/about-chapter-nav";
import { AboutReveal, AboutScrollCue } from "./_components/about-reveal";

type IconItem = {
  icon: LucideIcon;
  text: string;
  title: string;
};

type LinkCard = {
  href: string;
  icon: LucideIcon;
  text: string;
  title: string;
};

const aboutHeroImage = "/brand/boutique/about-hero-prism.avif";

const aboutChapters: AboutChapter[] = [
  { id: "about-manifesto", index: "01", label: "הסיפור" },
  { id: "about-editorial", index: "02", label: "העקרונות" },
  { id: "about-rhythm", index: "03", label: "התהליך" },
  { id: "about-practical-proof", index: "04", label: "שירות" },
];

const aboutStats = [
  { value: "925", label: "כסף סטרלינג בבסיס כל פריט" },
  { value: "12", label: "חודשי אחריות על פגמי ייצור" },
  { value: "24", label: "שעות עד מענה בימי עסקים" },
  { value: "100%", label: "חנות אונליין עם שירות אישי" },
] as const;

const editorialPrinciples = [
  {
    title: "עיצוב",
    text: "תכשיטים בקווים נקיים ובעיצוב קלאסי, שמשתלבים עם כל לוק.",
  },
  {
    title: "חומרים",
    text: "כסף 925 וציפויי זהב איכותיים, עם אבנים ופנינים נבחרות.",
  },
  {
    title: "שירות",
    text: "מענה אישי לכל שאלה על מידה, מתנה או משלוח, לפני ההזמנה ואחריה.",
  },
] as const;

const materialFacts = [
  {
    title: "חומר",
    text: "פרטי החומר והגימור מופיעים בכל עמוד מוצר.",
    icon: Gem,
  },
  {
    title: "מידה",
    text: "מדריך מידות מפורט לבחירה נכונה.",
    icon: Ruler,
  },
  {
    title: "שירות",
    text: "אפשר לפנות אלינו עם שם המוצר לכל שאלה.",
    icon: Headphones,
  },
] satisfies IconItem[];

const brandRhythm = [
  {
    title: "בחירה",
    text: "אנחנו בוחרים פריטים בקווים נקיים ובעיצוב קלאסי.",
  },
  {
    title: "בדיקה",
    text: "כל פריט נבדק מול העקרונות שלנו: עיצוב, חומר וגימור.",
  },
  {
    title: "צילום",
    text: "כל פריט מצולם מקרוב, כולל קנה מידה וחומר.",
  },
  {
    title: "ליווי",
    text: "מדריך מידות, הוראות טיפול, משלוח והחלפות לכל פריט.",
  },
] as const;

const trustCards = [
  {
    title: "מדריך מידות",
    text: "אורך, קוטר ומשקל להשוואה לפני ההזמנה.",
    href: "/size-guide",
    icon: Ruler,
  },
  {
    title: "שאלות ותשובות",
    text: "תשובות לשאלות הנפוצות, במקום אחד.",
    href: "/faq",
    icon: HelpCircle,
  },
  {
    title: "טיפול בתכשיטים",
    text: "איך שומרים על ברק, גוון וגימור לאורך זמן.",
    href: "/jewellery-care",
    icon: Sparkles,
  },
  {
    title: "משלוחים והחלפות",
    text: "כל המידע על משלוחים, החלפות והחזרות.",
    href: "/shipping-returns",
    icon: Truck,
  },
] satisfies LinkCard[];

const floatingLabels = ["חומר", "מידות", "גימור"] as const;

export const metadata: Metadata = {
  title: "אודות | Elysia Jewellery",
  description:
    "Elysia Jewellery היא חנות תכשיטים אונליין: טבעות, שרשראות, עגילים וצמידים בכסף 925 ובציפוי זהב, עם מדריך מידות ושירות אישי.",
  openGraph: {
    title: "אודות Elysia Jewellery",
    description:
      "חנות תכשיטים אונליין לתכשיטי כסף 925 וציפוי זהב, עם מדריך מידות ושירות אישי.",
    images: [{ url: aboutHeroImage }],
  },
};

export default function AboutPage() {
  return (
    <main className="elysia-page about-cinematic-page about-v2">
      <link
        as="image"
        fetchPriority="high"
        href={aboutHeroImage}
        rel="preload"
        type="image/avif"
      />
      <SiteHeader />

      <article>
        {/* ── Chapter 00: cinematic hero ─────────────────────────────────── */}
        <RevealSection
          className="home-cinematic-hero storefront-hero about-cinematic-hero relative isolate min-h-[var(--home-hero-height)] w-screen max-w-none overflow-hidden"
          data-testid="about-cinematic-page-hero"
          id="page-hero"
          initialVisible
          variant="none"
        >
          <Image
            alt=""
            aria-hidden="true"
            className="storefront-hero-image object-cover"
            draggable={false}
            fill
            fetchPriority="high"
            priority
            sizes="100vw"
            src={aboutHeroImage}
          />
          <div className="storefront-hero-scrim absolute inset-0" />
          <div className="storefront-hero-wash absolute inset-0" />

          <div
            className="about-hero-copy motion-hero-copy storefront-hero-copy absolute z-10 flex max-w-[min(39rem,calc(100vw-2.5rem))] flex-col items-start"
            data-testid="about-hero-copy"
            dir="rtl"
          >
            <p className="storefront-eyebrow">אודות Elysia</p>
            <h1 className="about-hero-title motion-copy-item [--motion-copy-delay:80ms]">
              תכשיטים בעיצוב קלאסי
            </h1>
            <p className="about-hero-statement motion-copy-item [--motion-copy-delay:120ms]">
              Elysia היא חנות אונליין לתכשיטי כסף 925 וציפוי זהב, לכל יום
              ולאירועים מיוחדים.
            </p>
            <div className="about-hero-actions motion-copy-item [--motion-copy-delay:160ms]">
              <Button asChild className="home-hero-cta-primary" size="lg">
                <Link href="/search" prefetch={false}>
                  לכל התכשיטים
                  <ArrowLeft aria-hidden="true" className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/service" prefetch={false}>
                  צרי קשר
                  <Headphones aria-hidden="true" className="size-4" />
                </Link>
              </Button>
            </div>
          </div>

          <AboutScrollCue />
        </RevealSection>

        <AboutChapterNav chapters={aboutChapters} />

        {/* ── Chapter 01: manifesto + facts ──────────────────────────────── */}
        <RevealSection
          className="about-manifesto px-[var(--ui-page-x)] py-[var(--ui-section-y-wide)]"
          id="about-manifesto"
          variant="none"
        >
          <AboutReveal
            as="div"
            className="about-manifesto-grid mx-auto grid max-w-[88rem] gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:items-start"
          >
            <div className="about-manifesto-aside">
              <p className="storefront-eyebrow about-eyebrow-dark">
                מי עומד מאחורי Elysia
              </p>
              <span aria-hidden="true" className="about-rule" />
            </div>
            <div>
              <p className="about-manifesto-text">
                אנחנו מאמינים שתכשיט טוב נמדד ביום-יום: בנוחות שלו, בגימור שלו
                ובשירות שעומד מאחוריו.
              </p>
              <p className="about-manifesto-support">
                Elysia הוקמה מתוך אהבה לתכשיטים עדינים ואיכותיים. אנחנו בוחרים
                כל פריט בקפידה לפי העיצוב, החומר ואיכות הגימור, ומלווים אותך
                בשירות אישי מהבחירה ועד המשלוח.
              </p>
            </div>
          </AboutReveal>

          <AboutReveal
            as="dl"
            aria-label="Elysia במספרים"
            className="about-stats mx-auto grid max-w-[88rem]"
            data-testid="about-stats-band"
            delay={0.08}
          >
            {aboutStats.map((stat, index) => (
              <div
                className="about-stat about-rv-item"
                key={stat.value}
                style={{ "--rv-i": index } as CSSProperties}
              >
                <dt className="about-stat-label order-2">{stat.label}</dt>
                <dd className="about-stat-value order-1">{stat.value}</dd>
              </div>
            ))}
          </AboutReveal>
        </RevealSection>

        {/* ── Chapter 02: principles with sticky editorial media ─────────── */}
        <RevealSection
          className="about-editorial-v2 px-[var(--ui-page-x)] py-[var(--ui-section-y-wide)]"
          id="about-editorial"
          variant="none"
        >
          <div className="about-editorial-grid">
            <figure className="boutique-story-media boutique-story-media-left about-sticky-figure relative">
              <Image
                alt="שרשרת עדינה של Elysia בצילום תקריב על קנה מידה אמיתי"
                className="media-color object-cover"
                fill
                loading="lazy"
                sizes="(min-width: 1024px) 44vw, 100vw"
                src="/brand/boutique/category-necklaces.avif"
              />
            </figure>

            <AboutReveal className="about-editorial-copy">
              <p className="storefront-eyebrow about-eyebrow-dark">
                מה מנחה אותנו
              </p>
              <h2 className="about-section-title">שלושה עקרונות, כל פריט</h2>
              <p className="about-section-text">
                לפני שפריט נכנס לקולקציה, הוא נבחן מול שלושה עקרונות קבועים.
                אלה שיקולי הבחירה שתפגשי בכל עמוד מוצר.
              </p>
              <ol className="about-principles-list">
                {editorialPrinciples.map((principle, index) => (
                  <li
                    className="about-principle-row about-rv-item"
                    key={principle.title}
                    style={{ "--rv-i": index } as CSSProperties}
                  >
                    <span aria-hidden="true" className="about-principle-num">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <h3>{principle.title}</h3>
                      <p>{principle.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <div className="about-story-actions">
                <Button asChild variant="outline">
                  <Link href="/size-guide" prefetch={false}>
                    מדריך מידות
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/gifts" prefetch={false}>
                    מתנות
                  </Link>
                </Button>
              </div>
            </AboutReveal>
          </div>

          <AboutReveal
            as="figure"
            className="boutique-story-media boutique-story-media-right about-figure-banner relative"
            delay={0.05}
          >
            <Image
              alt="גימור וברק של תכשיטי כסף 925 וציפוי זהב בצילום רוחב"
              className="media-color object-cover"
              fill
              loading="lazy"
              sizes="100vw"
              src="/brand/boutique/lifestyle-hero-poster.avif"
            />
            <figcaption className="about-figure-caption">
              כסף 925 וציפוי זהב, בצילום תקריב של הגימור.
            </figcaption>
          </AboutReveal>
        </RevealSection>

        {/* ── Cinematic fixed band: material, light, scale ───────────────── */}
        <RevealSection
          className="about-visual-story relative isolate"
          id="about-visual-story"
          variant="none"
        >
          <DeferredFixedBackgroundBand
            className="boutique-fixed-image-band about-fixed-image-band"
            id="about-fixed-editorial-image"
          />
          <div className="about-visual-story-overlay">
            <AboutReveal className="about-visual-story-copy" dir="rtl">
              <p className="storefront-eyebrow">איכות ושקיפות</p>
              <h2 className="about-visual-story-title">
                איכות שרואים בכל פרט.
              </h2>
              <p className="about-visual-story-text">
                בכל עמוד מוצר תמצאי את פרטי החומר, המידות והמחיר, כדי שתוכלי
                לבחור בביטחון.
              </p>
              <ul className="about-floating-labels">
                {floatingLabels.map((label, index) => (
                  <li
                    className="about-floating-label about-rv-item"
                    key={label}
                    style={{ "--rv-i": index } as CSSProperties}
                  >
                    {label}
                  </li>
                ))}
              </ul>
            </AboutReveal>
          </div>
        </RevealSection>

        {/* ── Chapter 03: process timeline ───────────────────────────────── */}
        <RevealSection
          className="about-rhythm border-y"
          data-testid="about-brand-timeline"
          id="about-rhythm"
          variant="none"
        >
          <div className="mx-auto max-w-[88rem] px-4 py-10 sm:px-6 lg:py-14">
            <div className="mb-9 max-w-2xl">
              <p className="text-muted-foreground text-sm">איך אנחנו עובדים</p>
              <h2 className="mt-3 text-3xl leading-tight font-semibold sm:text-4xl">
                איך פריט נכנס לקולקציה
              </h2>
            </div>
            <AboutReveal as="ol" className="about-timeline-flow">
              {brandRhythm.map((step, index) => (
                <li
                  className="about-flow-step about-rv-item"
                  key={step.title}
                  style={{ "--rv-i": index } as CSSProperties}
                >
                  <span aria-hidden="true" className="about-flow-marker">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="about-flow-body">
                    <h3>{step.title}</h3>
                    <p>{step.text}</p>
                  </div>
                </li>
              ))}
            </AboutReveal>
          </div>
        </RevealSection>

        {/* ── Chapter 04: practical proof and service ────────────────────── */}
        <RevealSection
          className="mx-auto max-w-[88rem] px-4 py-10 sm:px-6 lg:py-14"
          id="about-practical-proof"
          variant="none"
        >
          <div className="mb-7 max-w-3xl">
            <p className="text-muted-foreground text-sm">שירות ומידע</p>
            <h2 className="mt-3 text-3xl leading-tight font-semibold sm:text-4xl">
              כל המידע לפני ההזמנה
            </h2>
          </div>

          <AboutReveal
            as="section"
            aria-labelledby="about-material-facts-title"
            data-testid="about-material-facts"
          >
            <h3
              className="text-xl font-semibold"
              id="about-material-facts-title"
            >
              מה לבדוק לפני שמזמינים
            </h3>
            <div className="about-facts-grid mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {materialFacts.map((fact, index) => (
                <div
                  className="about-rv-item h-full"
                  key={fact.title}
                  style={{ "--rv-i": index } as CSSProperties}
                >
                  <IconCard item={fact} />
                </div>
              ))}
              <section
                aria-labelledby="about-care-teaser-title"
                className="about-care-card about-rv-item brand-surface h-full p-5"
                data-testid="about-care-teaser"
                style={{ "--rv-i": materialFacts.length } as CSSProperties}
              >
                <div className="glass-inset flex size-10 items-center justify-center rounded-md border">
                  <Sparkles aria-hidden="true" className="size-5" />
                </div>
                <h4
                  className="mt-5 text-xl font-semibold"
                  id="about-care-teaser-title"
                >
                  יש לך שאלה?
                </h4>
                <p className="text-muted-foreground mt-3 leading-7">
                  בדקי את עמוד השאלות והתשובות, או פני אלינו ישירות.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link href="/faq#faq-group-2" prefetch={false}>
                      שאלות על מידות
                    </Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link href="/service?topic=general" prefetch={false}>
                      פנייה לשירות
                    </Link>
                  </Button>
                </div>
              </section>
            </div>
          </AboutReveal>

          <AboutReveal
            className="about-trust-grid mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
            delay={0.05}
          >
            {trustCards.map((card, index) => (
              <div
                className="about-rv-item h-full"
                key={card.title}
                style={{ "--rv-i": index } as CSSProperties}
              >
                <TrustCard item={card} />
              </div>
            ))}
          </AboutReveal>
        </RevealSection>

        {/* ── Final CTA ──────────────────────────────────────────────────── */}
        <RevealSection
          className="about-final px-[var(--ui-page-x)] py-[var(--ui-section-y-wide)]"
          id="about-close"
          variant="none"
        >
          <AboutReveal className="about-final-inner mx-auto max-w-5xl text-center">
            <Sparkles
              aria-hidden="true"
              className="about-final-spark mx-auto size-7"
            />
            <h2 className="about-final-title">מצאי את התכשיט הבא שלך</h2>
            <p className="about-final-text">
              גלי את הקולקציה שלנו. לכל שאלה על מידה, חומר או מתנה, צוות
              השירות זמין בשבילך.
            </p>
            <div className="about-final-actions">
              <Button asChild size="lg">
                <Link href="/search" prefetch={false}>
                  לכל התכשיטים
                  <Search aria-hidden="true" className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/service" prefetch={false}>
                  צרי קשר
                  <Headphones aria-hidden="true" className="size-4" />
                </Link>
              </Button>
            </div>
          </AboutReveal>
        </RevealSection>
      </article>
    </main>
  );
}

function IconCard({ item }: { item: IconItem }) {
  const Icon = item.icon;

  return (
    <section className="brand-surface h-full p-5">
      <div className="glass-inset flex size-10 items-center justify-center rounded-md border">
        <Icon aria-hidden="true" className="size-5" />
      </div>
      <h4 className="mt-5 text-xl font-semibold">{item.title}</h4>
      <p className="text-muted-foreground mt-3 leading-7">{item.text}</p>
    </section>
  );
}

function TrustCard({ item }: { item: LinkCard }) {
  const Icon = item.icon;

  return (
    <Link
      className="about-trust-card brand-surface p-5"
      href={item.href}
      prefetch={false}
    >
      <div className="glass-inset flex size-10 items-center justify-center rounded-md border">
        <Icon aria-hidden="true" className="size-5" />
      </div>
      <h3 className="mt-5 flex items-center justify-between gap-2 text-lg font-semibold">
        {item.title}
        <ArrowLeft
          aria-hidden="true"
          className="about-trust-arrow size-4 shrink-0"
        />
      </h3>
      <p className="text-muted-foreground mt-2 leading-7">{item.text}</p>
    </Link>
  );
}
