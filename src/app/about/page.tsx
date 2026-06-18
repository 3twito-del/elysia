import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  BadgeCheck,
  Gem,
  Handshake,
  Headphones,
  PackageCheck,
  Ruler,
  Search,
  ShieldCheck,
  Sparkles,
  Truck,
} from "lucide-react";

import { DeferredFixedBackgroundBand } from "~/components/deferred-fixed-background-band";
import { RevealGrid, RevealSection } from "~/components/reveal";
import { SiteHeader } from "~/components/site-header";
import { Button } from "~/components/ui/button";

import { AboutHeroAurora } from "./_components/about-hero-aurora";

type IconItem = {
  icon: LucideIcon;
  text: string;
  title: string;
};

const aboutHeroImage = "/brand/boutique/about-hero-prism.avif";

const editorialPrinciples = [
  {
    title: "לוק",
    text: "ממה שלובשים.",
  },
  {
    title: "חומר",
    text: "גוון, אבן, ברק.",
  },
  {
    title: "שירות",
    text: "לשאול לפני ההזמנה.",
  },
] as const;

const values = [
  {
    title: "לפני שמזמינים",
    text: "חומר, מידה, מחיר, זמינות.",
    icon: ShieldCheck,
  },
  {
    title: "חומר וצבע",
    text: "כסף, ציפוי זהב, פנינה, אבן.",
    icon: Gem,
  },
  {
    title: "איך זה יושב",
    text: "מידה, אורך, משקל.",
    icon: Ruler,
  },
  {
    title: "אחרי ההזמנה",
    text: "משלוח, החלפה, מתנה.",
    icon: Handshake,
  },
] satisfies IconItem[];

const standards = [
  {
    title: "תמונות מוצר",
    text: "מבנה, קנה מידה, ענידה.",
    icon: Sparkles,
  },
  {
    title: "לפני ההזמנה",
    text: "פרטים, מחיר, משלוח.",
    icon: BadgeCheck,
  },
  {
    title: "אריזה ומשלוח",
    text: "מתנה, אריזה, מסירה.",
    icon: PackageCheck,
  },
  {
    title: "מסירה",
    text: "אונליין, עם מענה.",
    icon: Truck,
  },
] satisfies IconItem[];

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

export const metadata: Metadata = {
  title: "אודות | Elysia Jewellery",
  description:
    "Elysia Jewellery היא בית תכשיטים בוטיקי לתכשיטים עדינים, מתנות ולוקים יומיומיים, עם חומר, מידה, מחיר ושירות לפני הזמנה.",
  openGraph: {
    title: "אודות Elysia Jewellery",
    description:
      "בית תכשיטים בוטיקי לתכשיטים עדינים, מתנות ולוקים יומיומיים.",
    images: [{ url: aboutHeroImage }],
  },
};

export default function AboutPage() {
  return (
    <main className="about-cinematic-page">
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
            <p className="storefront-eyebrow">Elysia</p>
            <h1 className="about-hero-title motion-copy-item [--motion-copy-delay:80ms]">
              מעט. מדויק. זוהר.
            </h1>
            <p className="about-hero-statement motion-copy-item [--motion-copy-delay:120ms]">
              עין לחומר, מידה ואור.
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
        </RevealSection>

        <RevealSection
          className="boutique-story-band about-cinematic-story px-[var(--ui-page-x)] py-[var(--ui-section-y-wide)] lg:px-0"
          id="about-editorial"
        >
          <div className="boutique-story-layout mx-auto grid max-w-[92rem] gap-8 lg:items-center">
            <figure className="boutique-story-media boutique-story-media-left relative">
              <Image
                alt=""
                className="object-cover"
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                src="/brand/boutique/product-detail.avif"
              />
            </figure>
            <div className="boutique-story-copy about-story-copy">
              <p className="storefront-eyebrow">איך בוחרים</p>
              <h2 className="about-section-title">
                מתחילים בבגד ובאור.
              </h2>
              <p className="about-section-text">
                לא רק לתמונה. תכשיט שעובד עם הבגד, העונה, והתחושה.
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
            </div>
            <div className="boutique-story-secondary-copy">
              <div className="grid gap-4">
                {editorialPrinciples.map((principle, index) => (
                  <section
                    className="boutique-story-principle"
                    key={principle.title}
                  >
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <div>
                      <h3>{principle.title}</h3>
                      <p>{principle.text}</p>
                    </div>
                  </section>
                ))}
              </div>
            </div>
            <figure className="boutique-story-media boutique-story-media-right relative">
              <Image
                alt=""
                className="object-cover"
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                src="/brand/boutique/category-necklaces.avif"
              />
            </figure>
          </div>
        </RevealSection>

        <DeferredFixedBackgroundBand
          className="boutique-fixed-image-band about-fixed-image-band"
          id="about-fixed-editorial-image"
        />

        <RevealSection
          className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14"
          id="about-who-is-behind-elysia"
        >
          <div className="grid gap-8 border-y border-[var(--glass-border)] py-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
            <div>
              <p className="text-muted-foreground text-sm">מי עומד מאחורי Elysia</p>
              <h2 className="mt-3 text-3xl leading-tight font-semibold sm:text-4xl">
                עריכה קטנה. נבחרת בשקט.
              </h2>
            </div>
            <div className="grid gap-4 text-muted-foreground leading-8">
              <p>
                רעיון אחד: לא להציף. תכשיטים עדינים, מצולמים נכון, עם חומר,
                מידה ומחיר לפני ההחלטה.
              </p>
            </div>
          </div>
        </RevealSection>

        <RevealSection
          className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14"
          id="about-practical-proof"
          variant="none"
        >
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <section
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
              <ol className="mt-6 grid gap-4">
                {editorialPrinciples.map((item, index) => (
                  <li
                    className="grid grid-cols-[auto_minmax(0,1fr)] gap-4 border-t border-[var(--glass-border)] pt-4"
                    key={item.title}
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
            </section>

            <div className="grid gap-4">
              <section
                aria-labelledby="about-material-facts-title"
                data-testid="about-material-facts"
              >
                <h2
                  className="text-xl font-semibold"
                  id="about-material-facts-title"
                >
                  מה לבדוק לפני שמזמינים
                </h2>
                <RevealGrid
                  className="mt-4 grid gap-3 sm:grid-cols-3"
                  variant="compact"
                >
                  {materialFacts.map((fact) => (
                    <IconCard item={fact} key={fact.title} />
                  ))}
                </RevealGrid>
              </section>

              <section
                aria-labelledby="about-care-teaser-title"
                className="rounded-md border border-[var(--glass-border)] p-5"
                data-testid="about-care-teaser"
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
              </section>
            </div>
          </div>
        </RevealSection>

        <RevealSection
          className="about-values-section mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14"
          id="about-values"
        >
          <div className="mb-7 max-w-3xl">
            <p className="text-muted-foreground text-sm">מה רואים באתר</p>
            <h2 className="mt-3 text-3xl leading-tight font-semibold sm:text-4xl">
              הפרטים שצריך כדי לבחור.
            </h2>
          </div>

          <RevealGrid
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
            variant="cards"
          >
            {values.map((value) => (
              <IconCard item={value} key={value.title} />
            ))}
          </RevealGrid>
        </RevealSection>

        <RevealSection
          className="brand-page-band border-y"
          id="about-standards"
        >
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.84fr_1.16fr] lg:py-14">
            <div>
              <p className="text-muted-foreground text-sm">לפני ההזמנה</p>
              <h2 className="mt-3 text-3xl leading-tight font-semibold sm:text-4xl">
                חומר, מידה, מחיר, משלוח.
              </h2>
              <p className="text-muted-foreground mt-5 leading-8">
                תקריב, מחיר גלוי, ושירות כשצריך.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button asChild variant="outline">
                  <Link href="/category/rings" prefetch={false}>
                    טבעות
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/category/earrings" prefetch={false}>
                    עגילים
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/gifts" prefetch={false}>
                    מתנות
                  </Link>
                </Button>
              </div>
            </div>

            <RevealGrid className="grid gap-3 sm:grid-cols-2" variant="compact">
              {standards.map((standard) => (
                <IconRow item={standard} key={standard.title} />
              ))}
            </RevealGrid>
          </div>
        </RevealSection>

        <RevealSection
          className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14"
          id="about-close"
          variant="none"
        >
          <div className="grid gap-6 border-t border-[var(--glass-border)] pt-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <Sparkles aria-hidden="true" className="size-7" />
              <h2 className="mt-4 max-w-3xl text-3xl leading-tight font-semibold sm:text-4xl">
                תכשיט קטן משנה לוק שלם.
              </h2>
              <p className="text-muted-foreground mt-4 max-w-3xl leading-8">
                מידה, חומר, תקציב. וממשיכים משם.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
              <Button asChild>
                <Link href="/search" prefetch={false}>
                  למבחר
                  <Search aria-hidden="true" className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/service" prefetch={false}>
                  שאלה לשירות
                  <Headphones aria-hidden="true" className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
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

function IconRow({ item }: { item: IconItem }) {
  const Icon = item.icon;

  return (
    <section className="border-b border-[var(--glass-border)] pb-4 last:border-b-0">
      <div className="flex gap-4">
        <div className="glass-inset flex size-10 shrink-0 items-center justify-center rounded-md border">
          <Icon aria-hidden="true" className="size-5" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">{item.title}</h3>
          <p className="text-muted-foreground mt-1.5 leading-7">{item.text}</p>
        </div>
      </div>
    </section>
  );
}
