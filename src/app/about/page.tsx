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
    alt: "טבעות כסף ויהלומים על משטח סטודיו בגוון אקווה",
    className:
      "col-span-2 aspect-[16/10] sm:col-span-1 sm:row-span-2 sm:aspect-[4/5]",
    loading: "eager",
    sizes: "(min-width: 1024px) 28vw, (min-width: 640px) 46vw, 100vw",
    src: "/brand/v2/content-editorial.avif",
  },
  {
    alt: "טבעת זהב ויהלומים בצילום מוצר נקי",
    className: "aspect-[5/4]",
    sizes: "(min-width: 1024px) 22vw, (min-width: 640px) 46vw, 100vw",
    src: "/brand/v2/product-focus.avif",
  },
  {
    alt: "תכשיטי פנינה וזכוכית בסטודיו אקווה",
    className: "aspect-[5/4]",
    sizes: "(min-width: 1024px) 22vw, (min-width: 640px) 46vw, 100vw",
    src: "/brand/v2/hero-pearls.avif",
  },
] satisfies ImageTile[];

const storyImages = [
  {
    alt: "קומפוזיציית תכשיטים עריכתית עם טבעות וזכוכית אקווה",
    className: "aspect-[16/10]",
    sizes: "(min-width: 1024px) 54vw, 100vw",
    src: "/brand/aphrodite-aqua-about.avif",
  },
  {
    alt: "מגש שירות עם אריזה ותכשיטי פנינה",
    className: "aspect-[4/3]",
    sizes: "(min-width: 1024px) 24vw, 100vw",
    src: "/brand/v2/service-task.avif",
  },
] satisfies ImageTile[];

const values = [
  {
    title: "שקיפות לפני רגש",
    text: "חומר, מידה, מחיר וזמינות מוצגים לפני שהלקוחה צריכה לנחש. היוקרה נשארת ברורה.",
    icon: ShieldCheck,
  },
  {
    title: "חומר במרכז",
    text: "התמונה, הפרופורציה והפירוט הטכני מקבלים קדימות על פני מסרים רועשים או קישוטים עודפים.",
    icon: Gem,
  },
  {
    title: "התאמה שימושית",
    text: "אנחנו בודקים איך התכשיט יישב ביום יום: על היד, על הצוואר, באירוע ובשגרה.",
    icon: Ruler,
  },
  {
    title: "שירות שממשיך",
    text: "ייעוץ, הזמנה, משלוח, החלפה ושאלות אחרי קנייה נבנים כחוויה אחת ולא כתחנות נפרדות.",
    icon: Handshake,
  },
] satisfies IconItem[];

const standards = [
  {
    title: "צילום שמראה פרטים",
    text: "צפיפות התמונות מכוונת להחלטה: מבט אווירה, תקריב חומר ותמונה שמסבירה שימוש.",
    icon: Camera,
  },
  {
    title: "חיפוש בלי רעש",
    text: "הקטלוג מוביל לפי צורך, תקציב, חומר וקטגוריה בלי להכריח מסלול רכישה אחד.",
    icon: Search,
  },
  {
    title: "אישור לפני פעולה",
    text: "הלקוחה מקבלת סימני אמון ברורים לפני הזמנה, לא רק אחרי שהמוצר בעגלה.",
    icon: BadgeCheck,
  },
  {
    title: "אריזה ומסירה",
    text: "החוויה לא מסתיימת בכפתור התשלום. גם פתיחת האריזה צריכה להרגיש מדויקת.",
    icon: PackageCheck,
  },
  {
    title: "מענה אנושי",
    text: "במקומות שבהם בחירה דיגיטלית לא מספיקה, השירות נכנס בעדינות ולא משתלט.",
    icon: Headphones,
  },
] satisfies IconItem[];

const workflow = [
  {
    title: "עורכים את הקולקציה",
    text: "כל פריט נכנס לקטלוג עם תפקיד ברור: מתנה, יום יום, אירוע, או בחירה אישית מאוד.",
    icon: PenLine,
  },
  {
    title: "בודקים שימוש אמיתי",
    text: "אנחנו מסתכלים על משקל, סגירה, אורך, שכבות ונוחות לפני שממליצים על פריט לרגע מסוים.",
    icon: Store,
  },
  {
    title: "מלווים אחרי ההזמנה",
    text: "משלוח, שאלה, התאמה או החלפה נשארים חלק מהמותג ולא נספח תפעולי.",
    icon: Truck,
  },
] satisfies IconItem[];

export const metadata: Metadata = {
  title: "אודות",
  description:
    "Elysia היא סטודיו תכשיטים ישראלי מודרני עם קטלוג אונליין, פרטי מוצר ברורים ושירות אישי לפני ואחרי הזמנה.",
  openGraph: {
    title: "אודות Elysia",
    description:
      "סטודיו תכשיטים ישראלי שמחבר יופי נקי, חומר גלוי, בחירה מדויקת ושירות אישי.",
    images: [{ url: "/brand/v2/content-editorial.avif" }],
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
                  לקטלוג
                  <Search aria-hidden="true" className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/service">
                  שירות לקוחות
                  <Headphones aria-hidden="true" className="size-4" />
                </Link>
              </Button>
            </>
          }
          className="[&_.commerce-page-hero-inner]:pb-6 lg:[&_.commerce-page-hero-inner]:pb-8"
          description="Elysia היא סטודיו תכשיטים ישראלי שמבקש להפוך רכישת תכשיט אונליין לדבר ברור, יפה ואנושי. פחות רעש מסביב לבחירה, יותר חומר, אור, פרופורציה ושירות."
          eyebrow="אודות Elysia"
          id="page-hero"
          media={{
            alt: "תכשיטי Elysia על משטח סטודיו בגוון אקווה",
            priority: true,
            sizes: "(min-width: 1024px) 34vw, 100vw",
            slides: cinematicRouteMedia.about,
          }}
          metrics={[
            { label: "מיקוד", value: "תכשיטים אונליין" },
            { label: "גישה", value: "יוקרה נגישה" },
            { label: "שירות", value: "אישי ומדוד" },
          ]}
          metricsMode="inline"
          title="סטודיו תכשיטים שמעדיף דיוק על רעש."
          variant="content"
        />

        <RevealSection
          className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-12"
          id="about-editorial"
          variant="none"
        >
          <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
            <div>
              <p className="text-muted-foreground text-sm">הגישה שלנו</p>
              <h2 className="mt-3 max-w-2xl text-3xl leading-tight font-semibold sm:text-4xl">
                לא מספרים על יוקרה מרחוק. מראים אותה קרוב, בקצב שאפשר לבחור בו.
              </h2>
              <div className="text-muted-foreground mt-5 grid max-w-2xl gap-4 text-base leading-8">
                <p>
                  תכשיט טוב מתחיל בפרופורציה, בחומר ובשקט. אנחנו מציגים כל פריט
                  כך שאפשר לראות את הקו, להבין את המידה, לבדוק את המחיר ולהרגיש
                  בטוחים לפני ההזמנה.
                </p>
                <p>
                  לצד הקטלוג יש שירות אישי שמכיר את הרגע: מתנה, מידה, אירוע או
                  בחירה יומיומית. המטרה אינה למהר את ההחלטה, אלא להפוך אותה
                  לברורה יותר.
                </p>
              </div>
              <dl className="mt-7 grid gap-3 sm:grid-cols-3">
                <div className="border-t border-[var(--glass-border)] pt-3">
                  <dt className="text-muted-foreground text-xs">חומר</dt>
                  <dd className="mt-1 text-xl font-semibold">
                    זהב, כסף ופנינים
                  </dd>
                </div>
                <div className="border-t border-[var(--glass-border)] pt-3">
                  <dt className="text-muted-foreground text-xs">מסירה</dt>
                  <dd className="mt-1 text-xl font-semibold">
                    אונליין עד הבית
                  </dd>
                </div>
                <div className="border-t border-[var(--glass-border)] pt-3">
                  <dt className="text-muted-foreground text-xs">שירות</dt>
                  <dd className="mt-1 text-xl font-semibold">
                    לפני ואחרי הזמנה
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
                <p className="text-muted-foreground text-sm">הסיפור שלנו</p>
                <h2 className="mt-3 max-w-3xl text-3xl leading-tight font-semibold sm:text-4xl">
                  Elysia נבנתה כדי שהבחירה בתכשיט תרגיש מדויקת לפני שהיא מרגישה
                  חגיגית.
                </h2>
                <div className="text-muted-foreground mt-5 grid max-w-3xl gap-4 leading-8">
                  <p>
                    מאחורי המותג עומדת תפיסה פשוטה: תכשיט יפה באמת לא צריך
                    להסתמך על מסתורין. הוא צריך תמונה טובה, פרטים ברורים,
                    פרופורציה נכונה ושירות שמכבד את הזמן של הלקוחה.
                  </p>
                  <p>
                    לכן אנחנו בוחרים פריטים שנראים טוב מקרוב ונשארים נוחים
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
          id="about-values"
        >
          <div className="mb-7 max-w-3xl">
            <p className="text-muted-foreground text-sm">עקרונות</p>
            <h2 className="mt-3 text-3xl leading-tight font-semibold sm:text-4xl">
              ארבע הבטחות שמחזיקות את הקטלוג, את ההזמנה ואת השירות.
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
              <p className="text-muted-foreground text-sm">סטנדרט שירות</p>
              <h2 className="mt-3 text-3xl leading-tight font-semibold sm:text-4xl">
                לפני רכישה צריכה להיות תשובה: חומר, מידה, זמינות ומסירה.
              </h2>
              <p className="text-muted-foreground mt-5 leading-8">
                בכל פריט אנחנו מעדיפים מידע שאפשר לפעול לפיו: תקריב שמראה גימור,
                תיאור קצר שמסביר שימוש, מחיר ברור ושירות שמאפשר לוודא התאמה לפני
                שמירת ההזמנה.
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
                Elysia לא מבקשת שתבחרו מהר. היא מבקשת שתבחרו נכון.
              </h2>
              <p className="text-muted-foreground mt-4 max-w-3xl leading-8">
                יש תכשיטים שמתחילים בתמונה ויש תכשיטים שמתחילים באדם. אנחנו
                מעדיפים להתחיל באדם: בסגנון שלו, ברגע שלו, ובשאלה מה הוא רוצה
                לזכור.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
              <Button asChild>
                <Link href="/search">
                  חיפוש בקטלוג
                  <Search aria-hidden="true" className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/service">
                  ייעוץ ושירות
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
