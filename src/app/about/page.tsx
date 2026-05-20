import type { Metadata } from "next";
import Link from "next/link";
import { Gem, Heart, Ruler, Search, ShieldCheck, Sparkles } from "lucide-react";

import { CommercePageHero } from "~/components/commerce-page-hero";
import { RevealGrid, RevealSection } from "~/components/reveal";
import { SiteHeader } from "~/components/site-header";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { cinematicRouteMedia } from "~/lib/brand-media";

const values = [
  {
    title: "שקיפות בבחירה",
    text: "חומר, מידה, מחיר, זמינות ושירות צריכים להיות ברורים לפני שהרכישה הופכת לרגשית.",
    icon: ShieldCheck,
  },
  {
    title: "יוקרה נגישה",
    text: "קו נקי, מידע מדויק ושירות שמכבד את הזמן. פחות רעש סביב הבחירה, יותר ביטחון בתוצאה.",
    icon: Gem,
  },
  {
    title: "מידה ופרופורציה",
    text: "תכשיט יפה באמת הוא תכשיט שמונח נכון: על היד, על הצוואר, על האוזן ובחיי היום יום.",
    icon: Ruler,
  },
  {
    title: "שירות שממשיך את האתר",
    text: "הקטלוג, הייעוץ והטיפול אחרי ההזמנה בנויים כשפה אחת, לא כתחנות נפרדות.",
    icon: Heart,
  },
];

const journey = [
  {
    title: "מתחילים בשפה של הלקוחה",
    text: "אפשר להגיע עם שם דגם, תקציב, אירוע, חומר, אבן או תחושה. החיפוש נועד לכבד גם דיוק וגם אינטואיציה.",
    icon: Search,
  },
  {
    title: "מצמצמים רעש",
    text: "עמוד מוצר טוב אינו מסתיר מידע מאחורי תמונה יפה. הוא מציג פרטים בקצב שמאפשר החלטה רגועה.",
    icon: Sparkles,
  },
  {
    title: "משאירים מקום לשירות",
    text: "כאשר צריך מידה, התאמה, החלפה או שאלה לפני רכישה, השירות ממשיך את אותה חוויה נקייה.",
    icon: ShieldCheck,
  },
];

export const metadata: Metadata = {
  title: "אודות",
  description:
    "הסיפור של Elysia: סטודיו תכשיטים ישראלי מודרני שמחבר יופי, שקיפות, שירות ובחירה שקטה.",
  openGraph: {
    title: "אודות Elysia",
    description:
      "דף אודות בעברית על Elysia, סטודיו תכשיטים מודרני שנבנה סביב יופי מדויק ובחירה בטוחה.",
    images: [{ url: "/brand/cinematic/cinematic-editorial.avif" }],
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
                  קטלוג שקט ומדויק
                  <Search aria-hidden="true" className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/service">
                  שירות לקוחות
                  <Sparkles aria-hidden="true" className="size-4" />
                </Link>
              </Button>
            </>
          }
          description="Elysia היא סטודיו תכשיטים ישראלי מודרני שנבנה סביב רעיון פשוט: תכשיט יפה באמת הוא בחירה שמעניקה ביטחון, לא עוד רעש."
          eyebrow="אודות Elysia"
          id="page-hero"
          media={{
            alt: "תכשיטי Elysia על משטח סטודיו בגוון אקווה",
            priority: true,
            slides: cinematicRouteMedia.about,
          }}
          metrics={[
            { label: "שם", value: "Elysia" },
            { label: "כוונה", value: "יופי עם ביטחון" },
            { label: "אופי", value: "סטודיו ישראלי מודרני" },
          ]}
          title="יופי שנבחר בשקט ונשאר נכון."
          variant="content"
        />

        <RevealSection
          className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20"
          id="about-name"
        >
          <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <div className="sticky top-24">
              <p className="text-muted-foreground text-sm">השם Elysia</p>
              <h2 className="mt-3 text-4xl leading-tight font-semibold sm:text-5xl">
                שם קצר, נקי וזכיר, בלי סמל שמסביר אותו יתר על המידה.
              </h2>
            </div>

            <div className="text-muted-foreground grid gap-6 text-lg leading-9">
              <p>
                Elysia נבחר כשם שיכול לעמוד לבדו. הוא רך מספיק לתכשיט עדין,
                מדויק מספיק לקטלוג מסחרי, וזכיר מספיק כדי לא להזדקק לסימן נוסף.
                לכן הלוגו של המותג הוא השם בלבד: טיפוגרפיה נקייה, קצב שקט,
                ונוכחות שמאפשרת לתכשיטים לשאת את החומר, האור והפרטים.
              </p>
              <p>
                הבחירה בשם כזה מכתיבה גם את חוויית הקנייה. אנחנו לא מבקשים
                להעמיס על הלקוחה הבטחות גדולות או שפה רועשת. אנחנו מבקשים לבנות
                מרחב שבו אפשר לראות, להשוות, לשאול, למדוד ולהחליט מתוך ביטחון.
                היוקרה נמצאת באיפוק, לא בעוד שכבה של קישוט.
              </p>
              <p>
                מתוך המקום הזה נבנתה Elysia כשפה אחת: קטלוג שמציג מידע בלי
                להציף, כרטיס מוצר שמכבד את התמונה אבל לא מסתיר את הפרטים, שירות
                אונליין שמחזיק את החוויה בידיים, ואריזה שמרגישה חגיגית בלי להפוך
                לכבדה.
              </p>
            </div>
          </div>
        </RevealSection>

        <RevealSection className="brand-page-band" id="about-story">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
            <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div className="brand-surface p-6 sm:p-8 lg:p-10">
                <p className="text-muted-foreground text-sm">הסיפור שלנו</p>
                <h2 className="mt-3 text-4xl leading-tight font-semibold">
                  סטודיו ישראלי שמבקש להפוך יוקרה לדבר שאפשר להבין.
                </h2>
                <div className="text-muted-foreground mt-6 grid gap-5 leading-8">
                  <p>
                    מאחורי Elysia עומד צוות שמעדיף שהעבודה, השירות והדיוק ידברו
                    לפני שמות האנשים. אנחנו חושבים כמו סטודיו, פועלים כמו מערכת
                    מסחר מודרנית, ומתייחסים לכל תכשיט כמפגש בין אסתטיקה, מידע
                    ואמון.
                  </p>
                  <p>
                    תכשיטים אינם צריכים להרגיש מרוחקים. הם יכולים להיות יוקרתיים
                    ועדיין ברורים; חגיגיים ועדיין שימושיים; רגשיים ועדיין קלים
                    לרכישה. תפקידנו להסיר ערפל, לא להוסיף מסתורין מיותר.
                  </p>
                </div>
              </div>

              <div className="grid gap-4">
                <div className="brand-surface p-6">
                  <Heart aria-hidden="true" className="size-7" />
                  <p className="mt-5 text-2xl font-semibold">
                    לא לבחור רק יפה. לבחור נכון.
                  </p>
                  <p className="text-muted-foreground mt-3 leading-7">
                    ההבדל בין תכשיט שמרשים לרגע לבין תכשיט שנענד שוב ושוב נמצא
                    בפרטים: פרופורציה, מידה, חומר, אירוע והרגלים.
                  </p>
                </div>
                <div className="brand-surface p-6">
                  <ShieldCheck aria-hidden="true" className="size-7" />
                  <p className="mt-5 text-2xl font-semibold">
                    אמון הוא חלק מהעיצוב.
                  </p>
                  <p className="text-muted-foreground mt-3 leading-7">
                    כאשר כל פרט מוצג בשקט ובבהירות, היופי יכול לעשות את שלו
                    וההחלטה נשארת רגועה גם אחרי שהמסך נסגר.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </RevealSection>

        <RevealSection
          className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20"
          id="about-values"
        >
          <div className="mb-9 max-w-3xl">
            <p className="text-muted-foreground text-sm">ערכים</p>
            <h2 className="mt-3 text-4xl leading-tight font-semibold">
              שקיפות, איפוק ושירות שמאפשרים ליופי להישאר נקי.
            </h2>
          </div>

          <RevealGrid
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
            variant="cards"
          >
            {values.map((value) => {
              const Icon = value.icon;

              return (
                <section className="brand-surface p-6" key={value.title}>
                  <div className="glass-inset flex size-11 items-center justify-center rounded-md border">
                    <Icon aria-hidden="true" className="size-5" />
                  </div>
                  <h3 className="mt-6 text-2xl font-semibold">{value.title}</h3>
                  <p className="text-muted-foreground mt-3 leading-7">
                    {value.text}
                  </p>
                </section>
              );
            })}
          </RevealGrid>
        </RevealSection>

        <RevealSection className="brand-page-band" id="about-experience">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
            <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr]">
              <div>
                <p className="text-muted-foreground text-sm">חוויית הקנייה</p>
                <h2 className="mt-3 text-4xl leading-tight font-semibold">
                  הדרך אל התכשיט חשובה כמעט כמו התכשיט עצמו.
                </h2>
                <p className="text-muted-foreground mt-5 text-lg leading-8">
                  בחירה בתכשיט היא פעולה רגשית, אבל היא לא צריכה להיות מעורפלת.
                  כל שלב באתר נועד להחזיר את תשומת הלב לדבר החשוב: איך התכשיט
                  ירגיש כשהוא יהפוך לחלק מהחיים.
                </p>
              </div>

              <RevealGrid className="grid gap-4" variant="compact">
                {journey.map((item) => {
                  const Icon = item.icon;

                  return (
                    <section className="brand-surface p-5" key={item.title}>
                      <div className="flex gap-4">
                        <div className="glass-inset flex size-10 shrink-0 items-center justify-center rounded-md border">
                          <Icon aria-hidden="true" className="size-5" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold">
                            {item.title}
                          </h3>
                          <p className="text-muted-foreground mt-2 leading-7">
                            {item.text}
                          </p>
                        </div>
                      </div>
                    </section>
                  );
                })}
              </RevealGrid>
            </div>
          </div>
        </RevealSection>

        <Separator />

        <RevealSection className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
          <div className="brand-surface mx-auto max-w-4xl p-6 text-center sm:p-8 lg:p-12">
            <Sparkles aria-hidden="true" className="mx-auto size-8" />
            <h2 className="mt-6 text-4xl leading-tight font-semibold">
              Elysia אינה מבקשת שתבחרו מהר. היא מבקשת שתבחרו בביטחון.
            </h2>
            <p className="text-muted-foreground mx-auto mt-5 max-w-3xl text-lg leading-8">
              יש תכשיטים שמתחילים בתמונה ויש תכשיטים שמתחילים באדם. אנחנו
              מעדיפים להתחיל באדם: בסגנון שלו, ברגע שלו, בשאלה מה הוא רוצה לזכור
              ומה הוא רוצה להרגיש.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild variant="outline">
                <Link href="/search">חיפוש בקטלוג</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/service">שירות לקוחות</Link>
              </Button>
            </div>
          </div>
        </RevealSection>
      </article>
    </main>
  );
}
