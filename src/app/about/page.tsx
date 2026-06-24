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

import { AboutHeroAurora } from "./_components/about-hero-aurora";
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

const editorialPrinciples = [
  {
    title: "לוק",
    text: "ממה שלובשים. צבע, עונה, קו ותחושה — התכשיט משלים, לא מתחרה.",
  },
  {
    title: "חומר",
    text: "גוון, אבן, ברק וגימור. בחירה שמבוססת על מה שרואים לפני ההחלטה.",
  },
  {
    title: "שירות",
    text: "לשאול לפני ההזמנה. מידה, מתנה, משלוח או התאמה — קרוב כשצריך.",
  },
] as const;

const materialFacts = [
  {
    title: "חומר",
    text: "חומר וגימור, כשזמין.",
    icon: Gem,
  },
  {
    title: "מידה",
    text: "מדריך להשוואה.",
    icon: Ruler,
  },
  {
    title: "שאלה",
    text: "פנייה עם שם התכשיט.",
    icon: Headphones,
  },
] satisfies IconItem[];

const brandRhythm = [
  {
    title: "נראה נכון",
    text: "קו נקי, עדינות, נוכחות בלי רעש.",
  },
  {
    title: "מצולם ברור",
    text: "תקריב, קנה מידה, חומר ותחושה.",
  },
  {
    title: "נבחר לשימוש אמיתי",
    text: "ליום רגיל, למתנה, לערב, או לאור של קיץ.",
  },
  {
    title: "מגיע עם מענה",
    text: "מידה, טיפול, משלוח והחלפה — בלי להשאיר אותך לבד.",
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
    text: "מה שחוזר הכי הרבה — מרוכז וברור.",
    href: "/faq",
    icon: HelpCircle,
  },
  {
    title: "טיפול בתכשיטים",
    text: "שמירה על ברק, גוון וגימור לאורך זמן.",
    href: "/jewellery-care",
    icon: Sparkles,
  },
  {
    title: "משלוחים והחלפות",
    text: "מסירה, אריזת מתנה והחלפה — גלוי מראש.",
    href: "/shipping-returns",
    icon: Truck,
  },
] satisfies LinkCard[];

const floatingLabels = ["תקריב", "קנה מידה", "ענידה"] as const;

export const metadata: Metadata = {
  title: "אודות | Elysia Jewellery",
  description:
    "Elysia Jewellery היא בית תכשיטים בוטיקי לתכשיטים עדינים, מתנות ולוקים יומיומיים, עם חומר, מידה, מחיר ושירות לפני הזמנה.",
  openGraph: {
    title: "אודות Elysia Jewellery",
    description: "בית תכשיטים בוטיקי לתכשיטים עדינים, מתנות ולוקים יומיומיים.",
    images: [{ url: aboutHeroImage }],
  },
};

export default function AboutPage() {
  return (
    <main className="elysia-page about-cinematic-page">
      <link
        as="image"
        fetchPriority="high"
        href={aboutHeroImage}
        rel="preload"
        type="image/avif"
      />
      <SiteHeader />

      <article>
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

          <AboutHeroAurora />

          <div
            className="about-hero-copy motion-hero-copy storefront-hero-copy absolute z-10 flex max-w-[min(39rem,calc(100vw-2.5rem))] flex-col items-start"
            data-testid="about-hero-copy"
            dir="rtl"
          >
            <p className="storefront-eyebrow">אודות Elysia</p>
            <h1 className="about-hero-title motion-copy-item [--motion-copy-delay:80ms]">
              מעט. מדויק. זוהר.
            </h1>
            <p className="about-hero-statement motion-copy-item [--motion-copy-delay:120ms]">
              עין לחומר, מידה ואור — תכשיטים עדינים שנבחרים בשקט, ונלבשים
              ביומיום.
            </p>
            <div className="about-hero-actions motion-copy-item [--motion-copy-delay:160ms]">
              <Button asChild className="home-hero-cta-primary" size="lg">
                <Link href="/search" prefetch={false}>
                  למבחר
                  <ArrowLeft aria-hidden="true" className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/service" prefetch={false}>
                  שאלה לשירות
                  <Headphones aria-hidden="true" className="size-4" />
                </Link>
              </Button>
            </div>
          </div>

          <AboutScrollCue />
        </RevealSection>

        {/* ── Quiet manifesto ─────────────────────────────────────────────── */}
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
            <p className="about-manifesto-text">
              לא עודף. לא רעש. לא קנייה מתוך ניחוש. Elysia נבנתה סביב בחירה
              מדויקת: תכשיט קטן, חומר נכון, מידה ברורה, ואור שעובד עם הלוק.
            </p>
          </AboutReveal>
        </RevealSection>

        {/* ── Three principles (story band) ───────────────────────────────── */}
        <RevealSection
          className="boutique-story-band about-cinematic-story px-[var(--ui-page-x)] py-[var(--ui-section-y-wide)] lg:px-0"
          id="about-editorial"
          variant="none"
        >
          <div className="boutique-story-layout mx-auto grid max-w-[92rem] gap-8 lg:items-center">
            <figure className="boutique-story-media boutique-story-media-left relative">
              <Image
                alt="תקריב על גימור וברק של תכשיט Elysia"
                className="object-cover"
                fill
                loading="lazy"
                sizes="(min-width: 1024px) 50vw, 100vw"
                src="/brand/boutique/product-detail.avif"
              />
            </figure>
            <AboutReveal className="boutique-story-copy about-story-copy">
              <p className="storefront-eyebrow about-eyebrow-dark">
                איך בוחרים
              </p>
              <h2 className="about-section-title">מתחילים בבגד ובאור.</h2>
              <p className="about-section-text">
                לא רק לתמונה. תכשיט שעובד עם הבגד, העונה, והתחושה — נבחר בשקט,
                ונלבש ביומיום.
              </p>
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
            <AboutReveal className="boutique-story-secondary-copy">
              <div className="about-principles grid gap-4">
                {editorialPrinciples.map((principle, index) => (
                  <section
                    className="about-principle-card about-rv-item"
                    key={principle.title}
                    style={{ "--rv-i": index } as CSSProperties}
                  >
                    <span className="about-principle-index">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <h3>{principle.title}</h3>
                      <p>{principle.text}</p>
                    </div>
                    <span
                      aria-hidden="true"
                      className="about-principle-sweep"
                    />
                  </section>
                ))}
              </div>
            </AboutReveal>
            <figure className="boutique-story-media boutique-story-media-right relative">
              <Image
                alt="שרשרת עדינה של Elysia על קנה מידה אמיתי"
                className="object-cover"
                fill
                loading="lazy"
                sizes="(min-width: 1024px) 50vw, 100vw"
                src="/brand/boutique/category-necklaces.avif"
              />
            </figure>
          </div>
        </RevealSection>

        {/* ── Cinematic visual story: material, light, scale ──────────────── */}
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
              <p className="storefront-eyebrow">חומר, מידה, אור</p>
              <h2 className="about-visual-story-title">
                תכשיט קטן משנה לוק שלם.
              </h2>
              <p className="about-visual-story-text">
                כל פריט נמדד לפי שאלה פשוטה: האם הוא עובד באמת — עם הבגד, עם
                הגוף, עם התקציב, ועם היום שבו הוא נענד.
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

        {/* ── Before ordering: three things, no guessing ──────────────────── */}
        <RevealSection
          className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14"
          id="about-practical-proof"
          variant="none"
        >
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <AboutReveal
              as="section"
              aria-labelledby="about-brand-timeline-title"
              data-testid="about-brand-timeline"
            >
              <p className="text-muted-foreground text-sm">לפני שמוסיפים לסל</p>
              <h2
                className="mt-3 text-3xl leading-tight font-semibold sm:text-4xl"
                id="about-brand-timeline-title"
              >
                שלושה דברים. בלי לנחש.
              </h2>
              <ol className="about-checklist mt-6 grid gap-4">
                {editorialPrinciples.map((item, index) => (
                  <li
                    className="about-rv-item grid grid-cols-[auto_minmax(0,1fr)] gap-4 border-t border-[var(--glass-border)] pt-4"
                    key={item.title}
                    style={{ "--rv-i": index } as CSSProperties}
                  >
                    <span className="glass-inset grid size-9 place-items-center rounded-md border text-sm font-medium tabular-nums">
                      {index + 1}
                    </span>
                    <span>
                      <span className="block font-semibold">{item.title}</span>
                      <span className="text-muted-foreground mt-1 block leading-7">
                        {item.text}
                      </span>
                    </span>
                  </li>
                ))}
              </ol>
            </AboutReveal>

            <div className="grid gap-4">
              <AboutReveal
                as="section"
                aria-labelledby="about-material-facts-title"
                data-testid="about-material-facts"
                delay={0.06}
              >
                <h2
                  className="text-xl font-semibold"
                  id="about-material-facts-title"
                >
                  מה לבדוק לפני שמזמינים
                </h2>
                <div className="about-facts-grid mt-4 grid gap-3 sm:grid-cols-3">
                  {materialFacts.map((fact, index) => (
                    <div
                      className="about-rv-item h-full"
                      key={fact.title}
                      style={{ "--rv-i": index } as CSSProperties}
                    >
                      <IconCard item={fact} />
                    </div>
                  ))}
                </div>
              </AboutReveal>

              <AboutReveal
                as="section"
                aria-labelledby="about-care-teaser-title"
                className="rounded-md border border-[var(--glass-border)] p-5"
                data-testid="about-care-teaser"
                delay={0.1}
              >
                <Sparkles aria-hidden="true" className="size-5" />
                <h2
                  className="mt-4 text-xl font-semibold"
                  id="about-care-teaser-title"
                >
                  מידה, טיפול או מתנה?
                </h2>
                <p className="text-muted-foreground mt-2 leading-7">
                  שאלות ותשובות, או פנייה עם שם התכשיט.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link href="/faq#faq-group-2" prefetch={false}>
                      שאלות על מידות
                    </Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link href="/service?topic=general" prefetch={false}>
                      שאלה לשירות
                    </Link>
                  </Button>
                </div>
              </AboutReveal>
            </div>
          </div>
        </RevealSection>

        {/* ── Brand rhythm timeline ───────────────────────────────────────── */}
        <RevealSection
          className="about-rhythm border-y"
          id="about-rhythm"
          variant="none"
        >
          <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:py-14">
            <div className="mb-8 max-w-2xl">
              <p className="text-muted-foreground text-sm">הקצב של Elysia</p>
              <h2 className="mt-3 text-3xl leading-tight font-semibold sm:text-4xl">
                איך פריט נכנס ל־Elysia
              </h2>
            </div>
            <AboutReveal as="ol" className="about-timeline">
              {brandRhythm.map((step, index) => (
                <li
                  className="about-timeline-item about-rv-item"
                  key={step.title}
                  style={{ "--rv-i": index } as CSSProperties}
                >
                  <span aria-hidden="true" className="about-timeline-marker">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="about-timeline-body">
                    <h3>{step.title}</h3>
                    <p>{step.text}</p>
                  </div>
                </li>
              ))}
            </AboutReveal>
          </div>
        </RevealSection>

        {/* ── Trust & service ─────────────────────────────────────────────── */}
        <RevealSection
          className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14"
          id="about-trust"
          variant="none"
        >
          <div className="mb-7 max-w-3xl">
            <p className="text-muted-foreground text-sm">שירות וביטחון</p>
            <h2 className="mt-3 text-3xl leading-tight font-semibold sm:text-4xl">
              בחירה יפה צריכה גם להיות ברורה.
            </h2>
          </div>
          <AboutReveal className="about-trust-grid grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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

        {/* ── Final CTA ───────────────────────────────────────────────────── */}
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
            <h2 className="about-final-title">תכשיט קטן. שינוי שלם.</h2>
            <p className="about-final-text">
              מידה, חומר, תקציב — וממשיכים משם. בחרי את הפריט שמחזיק את הלוק
              בשקט.
            </p>
            <div className="about-final-actions">
              <Button asChild size="lg">
                <Link href="/search" prefetch={false}>
                  למבחר
                  <Search aria-hidden="true" className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/service" prefetch={false}>
                  שאלה לשירות
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
    <section className="brand-surface p-5">
      <div className="glass-inset flex size-10 items-center justify-center rounded-md border">
        <Icon aria-hidden="true" className="size-5" />
      </div>
      <h3 className="mt-5 text-xl font-semibold">{item.title}</h3>
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
