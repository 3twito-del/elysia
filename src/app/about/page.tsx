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
import { HomeHeroVideo } from "~/components/home-hero-video";
import { RevealGrid, RevealSection } from "~/components/reveal";
import { SiteHeader } from "~/components/site-header";
import { Button } from "~/components/ui/button";

type IconItem = {
  icon: LucideIcon;
  text: string;
  title: string;
};

const aboutHeroPoster = "/brand/boutique/lifestyle-hero-poster.avif";
const aboutHeroVideoMp4 = "/brand/boutique/lifestyle-hero.mp4";
const aboutHeroVideoWebm = "/brand/boutique/lifestyle-hero.webm";

const editorialPrinciples = [
  {
    title: "בחירה",
    text: "מתחילים במשפחת תכשיט, שימוש, תקציב או מתנה, ורואים את הפרטים לפני שמוסיפים לסל.",
  },
  {
    title: "מידע",
    text: "חומר, מידה, מחיר ותמונות מוצגים באופן שמאפשר להשוות בין פריטים בלי לנחש.",
  },
  {
    title: "שירות",
    text: "כשצריך עזרה בהתאמה, מידה או משלוח, אפשר לפנות לשירות מתוך הקשר הבחירה.",
  },
] as const;

const values = [
  {
    title: "מידע מסודר",
    text: "חומר, מידה ומחיר מוצגים בעמוד המוצר לפני ההזמנה.",
    icon: ShieldCheck,
  },
  {
    title: "חומרים",
    text: "זהב, כסף, פנינים ואבני צבע מוצגים לפי הדגם והמידע הזמין.",
    icon: Gem,
  },
  {
    title: "התאמה",
    text: "מידות, אורך ומשקל מוצגים כאשר המידע זמין, עם מדריך מידות תומך.",
    icon: Ruler,
  },
  {
    title: "שירות",
    text: "שירות זמין בנושאי הזמנה, משלוח, החלפה והחזרה.",
    icon: Handshake,
  },
] satisfies IconItem[];

const standards = [
  {
    title: "תמונות מוצר",
    text: "כל פריט מוצג עם תמונות שמבהירות מבנה, קנה מידה ואופי ענידה.",
    icon: Sparkles,
  },
  {
    title: "לפני ההזמנה",
    text: "פרטי המוצר, מחיר ומשלוח מוצגים לפני אישור ההזמנה.",
    icon: BadgeCheck,
  },
  {
    title: "אריזה ומשלוח",
    text: "אפשרויות אריזה ומשלוח זמינות בתהליך ההזמנה.",
    icon: PackageCheck,
  },
  {
    title: "מסירה",
    text: "הזמנה ושירות מתבצעים אונליין, עם מענה לשאלות לפני ואחרי ההזמנה.",
    icon: Truck,
  },
] satisfies IconItem[];

const materialFacts = [
  {
    title: "חומר",
    text: "כרטיסי מוצר מציגים חומר כאשר המידע זמין בקטלוג.",
    icon: Gem,
  },
  {
    title: "מידה",
    text: "מדריך המידות מסייע להשוות טבעת, צמיד, שרשרת או עגילים.",
    icon: Ruler,
  },
  {
    title: "שירות",
    text: "אפשר לפתוח פנייה עם פרטי המוצר לפני הבחירה.",
    icon: Headphones,
  },
] satisfies IconItem[];

export const metadata: Metadata = {
  title: "אודות",
  description:
    "Elysia מציגה תכשיטים עם חומר, מידה, מחיר ושירות מסודר לפני ההזמנה.",
  openGraph: {
    title: "Elysia",
    description: "תכשיטי Elysia עם חומר, מידה, מחיר ושירות מסודר לפני ההזמנה.",
    images: [{ url: "/brand/boutique/lifestyle-hero.avif" }],
  },
};

export default function AboutPage() {
  return (
    <main className="about-cinematic-page">
      <link
        as="image"
        fetchPriority="high"
        href={aboutHeroPoster}
        rel="preload"
        type="image/avif"
      />
      <SiteHeader />

      <article>
        <RevealSection
          className="home-cinematic-hero storefront-hero about-cinematic-hero relative isolate min-h-[var(--home-hero-height)] w-screen max-w-none overflow-hidden"
          data-testid="cinematic-page-hero"
          id="page-hero"
          initialVisible
          variant="hero"
        >
          <HomeHeroVideo
            className="storefront-hero-image object-cover"
            mp4Src={aboutHeroVideoMp4}
            posterSrc={aboutHeroPoster}
            webmSrc={aboutHeroVideoWebm}
          />
          <div className="storefront-hero-scrim absolute inset-0" />
          <div className="storefront-hero-wash absolute inset-0" />

          <div
            className="about-hero-copy motion-hero-copy storefront-hero-copy absolute z-10 flex max-w-[min(39rem,calc(100vw-2.5rem))] flex-col items-start"
            data-testid="about-hero-copy"
            dir="rtl"
          >
            <p className="storefront-eyebrow">Elysia</p>
            <h1 className="about-hero-title motion-copy-item [--motion-copy-delay:80ms]">
              תכשיטים עם פרטים מסודרים.
            </h1>
            <p className="about-hero-statement motion-copy-item [--motion-copy-delay:120ms]">
              בחירה שקטה של טבעות, שרשראות, עגילים וצמידים, עם חומר, מידה ושירות
              שמופיעים לפני ההזמנה.
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
                  שירות
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
              <p className="storefront-eyebrow">הגישה</p>
              <h2 className="about-section-title">
                בחירה שמתחילה באור, חומר ופרופורציה.
              </h2>
              <p className="about-section-text">
                תכשיט מדויק מתחיל בפרופורציה, חומר ומידע מסודר. כל פריט מוצג כך
                שניתן לראות מבנה, מידה ופרטים לפני הזמנה.
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
          id="about-practical-proof"
          variant="none"
        >
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <section
              aria-labelledby="about-brand-timeline-title"
              data-testid="about-brand-timeline"
            >
              <p className="text-muted-foreground text-sm">תהליך הבחירה</p>
              <h2
                className="mt-3 text-3xl leading-tight font-semibold sm:text-4xl"
                id="about-brand-timeline-title"
              >
                שלושה דברים שכדאי לדעת לפני הזמנה.
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
                  עובדות שימושיות לבחירה
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
                  שאלות על טיפול, מידה או התאמה
                </h2>
                <p className="text-muted-foreground mt-2 leading-7">
                  ניתן לעבור לשאלות ותשובות או לפתוח פנייה עם פרטי המוצר.
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
          </div>
        </RevealSection>

        <RevealSection
          className="about-values-section mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14"
          id="about-values"
        >
          <div className="mb-7 max-w-3xl">
            <p className="text-muted-foreground text-sm">מידע ושירות</p>
            <h2 className="mt-3 text-3xl leading-tight font-semibold sm:text-4xl">
              מידע מסודר לאורך תהליך הבחירה וההזמנה.
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
              <p className="text-muted-foreground text-sm">שירות</p>
              <h2 className="mt-3 text-3xl leading-tight font-semibold sm:text-4xl">
                לפני ההזמנה מוצגים חומר, מידה, מחיר ומשלוח.
              </h2>
              <p className="text-muted-foreground mt-5 leading-8">
                בכל תכשיט נדרשים תקריב, תיאור קצר, מחיר גלוי ושירות לאימות התאמה
                לפני הזמנה.
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
                Elysia מאפשרת לבחור, לבדוק ולהזמין.
              </h2>
              <p className="text-muted-foreground mt-4 max-w-3xl leading-8">
                בחירה מתחילה במידה, חומר, תקציב ושימוש.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
              <Button asChild>
                <Link href="/search" prefetch={false}>
                  חיפוש במבחר
                  <Search aria-hidden="true" className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/service" prefetch={false}>
                  שירות
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
