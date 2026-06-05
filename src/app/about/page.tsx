import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  BadgeCheck,
  Camera,
  Gem,
  Handshake,
  Headphones,
  PackageCheck,
  PenLine,
  Ruler,
  Search,
  ShieldCheck,
  Sparkles,
  Store,
  Truck,
} from "lucide-react";

import { CommercePageHero } from "~/components/commerce-page-hero";
import { RevealGrid, RevealSection } from "~/components/reveal";
import { SiteHeader } from "~/components/site-header";
import { Button } from "~/components/ui/button";
import { cinematicRouteMedia } from "~/lib/brand-media";

type IconItem = {
  icon: LucideIcon;
  text: string;
  title: string;
};

type ImageTile = {
  alt: string;
  className: string;
  loading?: "eager" | "lazy";
  sizes: string;
  src: string;
};

const editorialImages = [
  {
    alt: "טבעות עדינות בצילום בוטיק חם על משטח בהיר",
    className:
      "col-span-2 aspect-[16/10] sm:col-span-1 sm:row-span-2 sm:aspect-[4/5]",
    loading: "eager",
    sizes: "(min-width: 1024px) 28vw, (min-width: 640px) 46vw, 100vw",
    src: "/brand/boutique/category-rings.avif",
  },
  {
    alt: "שרשראות עדינות על גוף בצילום בוטיק נקי",
    className: "aspect-[5/4]",
    sizes: "(min-width: 1024px) 22vw, (min-width: 640px) 46vw, 100vw",
    src: "/brand/boutique/category-necklaces.avif",
  },
  {
    alt: "עגיל עדין בצילום תקריב רך",
    className: "aspect-[5/4]",
    sizes: "(min-width: 1024px) 22vw, (min-width: 640px) 46vw, 100vw",
    src: "/brand/boutique/category-earrings.avif",
  },
] satisfies ImageTile[];

const storyImages = [
  {
    alt: "תכשיט עדין על גוף בתאורה רכה וחמה",
    className: "aspect-[16/10]",
    sizes: "(min-width: 1024px) 54vw, 100vw",
    src: "/brand/boutique/lifestyle-hero.avif",
  },
  {
    alt: "צמידים עדינים על יד בצילום בוטיק",
    className: "aspect-[4/3]",
    sizes: "(min-width: 1024px) 24vw, 100vw",
    src: "/brand/boutique/category-bracelets.avif",
  },
] satisfies ImageTile[];

const values = [
  {
    title: "מידע ברור",
    text: "חומר, מידה ומחיר מוצגים בעמוד המוצר.",
    icon: ShieldCheck,
  },
  {
    title: "חומרים",
    text: "התמונות ופרטי החומר מוצגים לפני ההזמנה.",
    icon: Gem,
  },
  {
    title: "התאמה",
    text: "מידות, אורך ומשקל מוצגים כאשר המידע זמין.",
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
    text: "תמונות המוצר מציגות את הפריט מזוויות שונות.",
    icon: Camera,
  },
  {
    title: "חיפוש",
    text: "המבחר נפתח לפי צורך, מחיר, חומר ומשפחת תכשיט בלי להכריח מסלול אחד.",
    icon: Search,
  },
  {
    title: "לפני ההזמנה",
    text: "פרטי המוצר וההזמנה מוצגים לפני אישור.",
    icon: BadgeCheck,
  },
  {
    title: "אריזה ומשלוח",
    text: "פרטי אריזה ומשלוח מופיעים בתהליך ההזמנה.",
    icon: PackageCheck,
  },
  {
    title: "שירות אישי",
    text: "שירות אישי זמין כאשר נדרש מידע נוסף.",
    icon: Headphones,
  },
] satisfies IconItem[];

const workflow = [
  {
    title: "הקולקציה",
    text: "כל תכשיט נכנס לקולקציה עם תפקיד ברור: מתנה, יום יום, אירוע, או הבחירה שלי מאוד.",
    icon: PenLine,
  },
  {
    title: "פרטי מוצר",
    text: "פרטי המוצר כוללים חומר, מידה, מחיר ומידע נוסף לפי הדגם.",
    icon: Store,
  },
  {
    title: "שירות לאחר הזמנה",
    text: "שירות זמין גם לאחר ביצוע ההזמנה.",
    icon: Truck,
  },
] satisfies IconItem[];

const brandTimeline = [
  {
    title: "בחירה",
    text: "מתחילים ממשפחת תכשיט, תקציב או צורך: יום יום, מתנה או אירוע.",
  },
  {
    title: "בדיקה",
    text: "משווים חומר, מידה, מחיר ותמונות לפני שמוסיפים לסל.",
  },
  {
    title: "שירות",
    text: "אם חסר פרט, עוברים לשירות עם הקשר ברור למוצר או לנושא.",
  },
] as const;

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
    title: "מסירה",
    text: "הזמנה ושירות מתבצעים אונליין כל עוד אין נקודת שירות פיזית.",
    icon: Truck,
  },
] satisfies IconItem[];

export const metadata: Metadata = {
  title: "אודות",
  description:
    "Elysia היא בית תכשיטים ישראלי עם פרטי מוצר ברורים, הזמנה מקוונת ושירות לפני ההזמנה ולאחריה.",
  openGraph: {
    title: "Elysia",
    description: "בית תכשיטים ישראלי עם מידע ברור על חומר, מידה, מחיר ושירות.",
    images: [{ url: "/brand/boutique/lifestyle-hero.avif" }],
  },
};

export default function AboutPage() {
  return (
    <main>
      <SiteHeader />

      <article>
        <CommercePageHero
          actions={
            <>
              <Button asChild>
                <Link href="/search">
                  למבחר
                  <Search aria-hidden="true" className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/service">
                  שירות אישי
                  <Headphones aria-hidden="true" className="size-4" />
                </Link>
              </Button>
            </>
          }
          className="[&_.commerce-page-hero-inner]:pb-6 lg:[&_.commerce-page-hero-inner]:pb-8"
          description="Elysia מציגה קולקציות תכשיטים עם מידע ברור, שירות והזמנה מקוונת."
          eyebrow="Elysia"
          id="page-hero"
          media={{
            alt: "תכשיטי Elysia בצילום בוטיק רך",
            priority: true,
            sizes: "(min-width: 1024px) 34vw, 100vw",
            slides: cinematicRouteMedia.about,
          }}
          metrics={[
            { label: "מיקוד", value: "תכשיטי בית" },
            { label: "גישה", value: "דיוק מאופק" },
            { label: "שירות", value: "לפני ואחרי הזמנה" },
          ]}
          metricsMode="inline"
          title="תכשיטים עם פרטים ברורים."
          variant="content"
        />

        <RevealSection
          className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-12"
          id="about-editorial"
          variant="none"
        >
          <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
            <div>
              <p className="text-muted-foreground text-sm">הגישה</p>
              <h2 className="mt-3 max-w-2xl text-3xl leading-tight font-semibold sm:text-4xl">
                תכשיטים, מידע ושירות במקום אחד.
              </h2>
              <div className="text-muted-foreground mt-5 grid max-w-2xl gap-4 text-base leading-8">
                <p>
                  תכשיט טוב מתחיל בפרופורציה, בחומר ובמידע ברור. אנחנו מציגים כל
                  תכשיט כך שאפשר לראות את המבנה, להבין את המידה ולאמת את הפרטים
                  לפני ההזמנה.
                </p>
                <p>
                  לצד הקולקציה יש שירות לשאלות על מתנה, מידה, אירוע או בחירה
                  יומיומית. המטרה היא לצמצם אי־ודאות לפני אישור ההזמנה.
                </p>
              </div>
              <dl className="mt-7 grid gap-3 sm:grid-cols-3">
                <div className="border-t border-[var(--glass-border)] pt-3">
                  <dt className="text-muted-foreground text-xs">חומר</dt>
                  <dd className="mt-1 text-xl font-semibold">
                    זהב, כסף, פנינים ואבנים
                  </dd>
                </div>
                <div className="border-t border-[var(--glass-border)] pt-3">
                  <dt className="text-muted-foreground text-xs">מסירה</dt>
                  <dd className="mt-1 text-xl font-semibold">עד הבית</dd>
                </div>
                <div className="border-t border-[var(--glass-border)] pt-3">
                  <dt className="text-muted-foreground text-xs">שירות</dt>
                  <dd className="mt-1 text-xl font-semibold">
                    לפני ההזמנה ולאחריה
                  </dd>
                </div>
              </dl>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {editorialImages.map((image) => (
                <EditorialImage image={image} key={image.src} />
              ))}
            </div>
          </div>
        </RevealSection>

        <RevealSection className="brand-page-band border-y" id="about-story">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
            <div className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-start">
              <div>
                <p className="text-muted-foreground text-sm">Elysia</p>
                <h2 className="mt-3 max-w-3xl text-3xl leading-tight font-semibold sm:text-4xl">
                  Elysia נבנתה כדי שהבחירה בתכשיט תהיה ברורה לפני אישור ההזמנה.
                </h2>
                <div className="text-muted-foreground mt-5 grid max-w-3xl gap-4 leading-8">
                  <p>
                    מאחורי המותג עומדת תפיסה פשוטה: תכשיט יפה באמת לא צריך
                    להסתמך על מסתורין. הוא צריך תמונה טובה, פרטים ברורים,
                    פרופורציה נכונה ושירות שמכבד את הזמן של הלקוח.
                  </p>
                  <p>
                    לכן אנחנו בוחרים תכשיטים שנראים טוב מקרוב ונשארים נוחים
                    בשימוש: טבעת שאפשר לענוד כל יום, שרשרת שמחזיקה שכבות, עגילים
                    שלא מכבידים ומתנה שמגיעה ארוזה נכון.
                  </p>
                </div>
              </div>

              <RevealGrid className="grid gap-3" variant="compact">
                {workflow.map((item) => (
                  <IconRow item={item} key={item.title} />
                ))}
              </RevealGrid>
            </div>

            <div className="mt-8 grid gap-3 lg:grid-cols-[1.38fr_0.62fr]">
              {storyImages.map((image) => (
                <EditorialImage image={image} key={image.src} />
              ))}
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
              <p className="text-muted-foreground text-sm">תהליך הבחירה</p>
              <h2
                className="mt-3 text-3xl leading-tight font-semibold sm:text-4xl"
                id="about-brand-timeline-title"
              >
                שלושה צעדים לפני הזמנה.
              </h2>
              <ol className="mt-6 grid gap-4">
                {brandTimeline.map((item, index) => (
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
                  אפשר לעבור לשאלות ותשובות או לפתוח פנייה עם פרטי המוצר והצורך.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link href="/faq#faq-group-2">שאלות על מידות</Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link href="/service?topic=general">פנייה לשירות</Link>
                  </Button>
                </div>
              </section>
            </div>
          </div>
        </RevealSection>

        <RevealSection
          className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14"
          id="about-values"
        >
          <div className="mb-7 max-w-3xl">
            <p className="text-muted-foreground text-sm">מידע ושירות</p>
            <h2 className="mt-3 text-3xl leading-tight font-semibold sm:text-4xl">
              מידע ברור לאורך תהליך הבחירה וההזמנה.
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
                בכל תכשיט אנחנו מעדיפים מידע שאפשר לפעול לפיו: תקריב שמראה
                גימור, תיאור קצר שמסביר שימוש, מחיר ברור ושירות שמאפשר לוודא
                התאמה לפני אישור הבחירה.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button asChild variant="outline">
                  <Link href="/category/rings">טבעות</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/category/earrings">עגילים</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/gifts">מתנות</Link>
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
                Elysia מאפשרת לבחור, לבדוק ולהזמין במקום אחד.
              </h2>
              <p className="text-muted-foreground mt-4 max-w-3xl leading-8">
                יש תכשיטים שמתחילים בתמונה ויש תכשיטים שמתחילים בצורך. אנחנו
                מעדיפים להתחיל בצורך: מידה, חומר, תקציב ושימוש.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
              <Button asChild>
                <Link href="/search">
                  חיפוש במבחר
                  <Search aria-hidden="true" className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/service">
                  שירות אישי
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

function EditorialImage({ image }: { image: ImageTile }) {
  return (
    <figure
      className={`bg-muted relative overflow-hidden rounded-md border border-[var(--glass-border)] ${image.className}`}
    >
      <Image
        alt={image.alt}
        className="media-mono object-cover object-center"
        fill
        loading={image.loading ?? "lazy"}
        sizes={image.sizes}
        src={image.src}
      />
    </figure>
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
