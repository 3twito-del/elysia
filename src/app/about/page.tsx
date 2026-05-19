import type { Metadata } from "next";
import Link from "next/link";
import {
  Gem,
  Gift,
  Heart,
  Ruler,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { CommercePageHero } from "~/components/commerce-page-hero";
import { RevealGrid, RevealSection } from "~/components/reveal";
import { SiteHeader } from "~/components/site-header";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { cinematicRouteMedia } from "~/lib/brand-media";

const values = [
  {
    title: "שקיפות בבחירה",
    text: "כל תכשיט צריך להיות ברור לפני שהוא מרגש: חומר, מידה, מחיר, זמינות אונליין והדרך שבה הוא ירגיש כחלק מהחיים.",
    icon: ShieldCheck,
  },
  {
    title: "יוקרה נגישה",
    text: "לא יוקרה שמרחיקה, אלא יוקרה שמסדרת את העולם סביבך: פחות רעש, יותר דיוק, שירות שמכבד את הזמן ואת ההחלטה.",
    icon: Gem,
  },
  {
    title: "ייעוץ ומדידה",
    text: "אנחנו מתייחסים למדידה ולייעוץ כאל חלק מהעיצוב עצמו. תכשיט יפה באמת הוא תכשיט שמונח נכון.",
    icon: Ruler,
  },
  {
    title: "רכישה אונליין",
    text: "הקטלוג הדיגיטלי ושירות הלקוחות עובדים יחד כדי לקצר את המרחק בין השראה, בדיקה, רכישה וקבלת התכשיט.",
    icon: ShieldCheck,
  },
];

const journey = [
  {
    title: "חיפוש שמתחיל בשפה שלך",
    text: "לא כולם נכנסים לאתר עם שם דגם מדויק. לפעמים מתחילים בתקציב, באירוע, בצבע זהב, במידה, באדם שיקבל את המתנה או בתחושה שרוצים להשאיר. Aphrodite נבנית כך שהחיפוש יכבד גם את הדיוק וגם את האינטואיציה.",
    icon: Search,
  },
  {
    title: "בחירה שמחזיקה מידע",
    text: "עמוד מוצר טוב לא מסתפק בתמונה יפה. הוא צריך לספר מה החומר, מה האבן, איך בוחרים מידה, האם המוצר זמין אונליין ומה אפשר לעשות אם רוצים לשלוח או לשמור להמשך.",
    icon: Sparkles,
  },
  {
    title: "שירות כהמשך של האתר",
    text: "השירות אינו תיקון לחוויית האונליין, אלא המשך שלה. הוא המקום שבו אפשר לשאול, לדייק מידה ולהבין פרופורציה בלי להתחיל מחדש את תהליך הבחירה.",
    icon: Sparkles,
  },
  {
    title: "רגע מסירה שנשאר נקי",
    text: "אריזה, ברכה ומשלוח הם חלק מהזיכרון. הם צריכים להיות מדויקים, לא צעקניים; חגיגיים, לא כבדים; מוכנים להינתן, אבל עדיין אישיים.",
    icon: Gift,
  },
];

export const metadata: Metadata = {
  title: "אודות",
  description:
    "הסיפור של Aphrodite: סטודיו תכשיטים ישראלי מודרני שמחבר יופי, ביטחון, שקיפות וחוויית קנייה נקייה.",
  openGraph: {
    title: "אודות Aphrodite",
    description:
      "דף אודות מפואר בעברית על Aphrodite, השראת אפרודיטה והולדת ונוס, וחוויית תכשיטים שנבנית סביב יופי עם ביטחון.",
    images: [{ url: "/brand/aphrodite-aqua-about.avif" }],
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
          description="Aphrodite היא סטודיו תכשיטים ישראלי מודרני שנבנה סביב רעיון פשוט: תכשיט יפה באמת הוא בחירה שמעניקה ביטחון, לא עוד רעש."
          eyebrow="אודות Aphrodite"
          id="page-hero"
          media={{
            alt: "Aphrodite",
            priority: true,
            slides: cinematicRouteMedia.about,
          }}
          metrics={[
            { label: "שם", value: "Aphrodite" },
            { label: "כוונה", value: "יופי עם ביטחון" },
            { label: "אופי", value: "סטודיו ישראלי מודרני" },
          ]}
          title="יופי שנולד ברגע שבו בחירה הופכת לביטחון."
          variant="content"
        />

        <RevealSection
          className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20"
          id="about-name"
        >
          <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <div className="sticky top-24">
              <p className="text-muted-foreground text-sm">השם Aphrodite</p>
              <h2 className="mt-3 text-4xl leading-tight font-semibold sm:text-5xl">
                לא אלילה על מדף, אלא רעיון על יופי שנכנס לחיים.
              </h2>
            </div>

            <div className="text-muted-foreground grid gap-6 text-lg leading-9">
              <p>
                השם Aphrodite נושא איתו זיכרון עתיק: דמות שנולדת מן הים, מתוך
                תנועה, אור ומבט. במיתולוגיה היוונית אפרודיטה אינה רק סמל ליופי
                חיצוני; היא נקודת מפגש בין משיכה, עדינות, כוח, רגש ובחירה. כשהשם
                הזה מופיע על תכשיט, הוא מזכיר לנו שיופי אמיתי אינו מסתכם בברק.
                הוא תלוי בשאלה איך הדבר מונח על הגוף, איך הוא מאיר את הפנים, איך
                הוא משתלב בתנועה, ובעיקר איך הוא גורם לאדם שמול המראה להרגיש.
              </p>
              <p>
                בוטיצ׳לי צייר את ונוס ברגע של הופעה: לא כאובייקט, אלא כרגע שבו
                העולם נעצר כדי לראות צורה חדשה של נוכחות. אנחנו מתבוננים ביצירה
                הזאת לא כדי לחקות אותה, אלא כדי ללמוד ממנה איפוק. יש בה מרחב,
                נשימה, קו, עור, אור, ים ושקט. אותה הבנה מובילה גם את שפת
                התכשיטים שלנו: לא להעמיס, לא להכריז בקול רם מדי, לא לנתק את
                היופי מן האדם שעונד אותו. תכשיט טוב אינו משתלט על מי שלובש אותו.
                הוא מדייק אותו.
              </p>
              <p>
                לכן דף האודות הזה אינו מספר על מיתוס רחוק בלבד. הוא מספר על הדרך
                שבה מיתוס יכול להפוך לשירות, לעיצוב, למידה, לקטלוג, לקופסה קטנה
                שמוגשת בזמן הנכון. Aphrodite נולדה מתוך הרצון לחבר בין שפה גבוהה
                של יופי לבין חוויית קנייה ברורה, שקופה ונגישה. זו אינה סתירה.
                להפך: ככל שהרגע רגשי יותר, כך הוא צריך מערכת שמעניקה ביטחון.
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
                    מאחורי Aphrodite עומד צוות אנונימי במובן הטוב של המילה:
                    אנשים שמעדיפים שהעבודה, השירות והדיוק ידברו לפני השם שלהם.
                    זהו צוות שחושב כמו סטודיו, פועל כמו מערכת מסחר מודרנית,
                    ומתייחס לכל תכשיט כאל מפגש בין אסתטיקה, מידע ואמון. אין כאן
                    צורך בסיפור מייסדים רומנטי כדי להצדיק את המותג. הסיפור נמצא
                    בדרך שבה החוויה בנויה.
                  </p>
                  <p>
                    אנחנו מאמינים שתכשיטים אינם צריכים להרגיש מרוחקים. הם יכולים
                    להיות יוקרתיים ועדיין ברורים; חגיגיים ועדיין שימושיים;
                    רגשיים ועדיין קלים לרכישה. הלקוחה או הלקוח אינם צריכים לנחש
                    מה מתאים, מה זמין, מה המחיר הסופי או מה יקרה אחרי הרכישה.
                    תפקידנו הוא להסיר ערפל, לא להוסיף מסתורין מיותר.
                  </p>
                  <p>
                    מתוך המקום הזה נבנתה Aphrodite כמותג שמחבר קטלוג, ייעוץ,
                    מידה, שירות ומתנה אחת שלמה. האונליין אינו רק חלון ראווה. הוא
                    כלי בחירה. שירות הלקוחות הוא המקום לשיחה, התאמה ואישור. הוא
                    דרך להתחיל בחירה כשלא יודעים עדיין איך לנסח את הרצון.
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
                    בפרטים: פרופורציה, מידה, חומר, אירוע, אדם, הרגל וסגנון חיים.
                  </p>
                </div>
                <div className="brand-surface p-6">
                  <ShieldCheck aria-hidden="true" className="size-7" />
                  <p className="mt-5 text-2xl font-semibold">
                    אמון הוא חלק מהעיצוב.
                  </p>
                  <p className="text-muted-foreground mt-3 leading-7">
                    כשכל פרט מוצג בשקט ובבהירות, היופי יכול לעשות את שלו. החלטה
                    רגועה היא החלטה שנשארת טובה גם אחרי שהמסך נסגר.
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

        <RevealSection className="brand-page-band">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
            <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
              <div className="brand-surface p-6 sm:p-8 lg:sticky lg:top-24 lg:p-10">
                <p className="text-muted-foreground text-sm">
                  איך אנחנו חושבים על תכשיט
                </p>
                <h2 className="mt-3 text-4xl leading-tight font-semibold">
                  בין חומר, מידה וזיכרון יש מרחב קטן שבו נוצרת בחירה נכונה.
                </h2>
                <p className="text-muted-foreground mt-5 leading-8">
                  תכשיט הוא פריט קטן יחסית, אבל הוא נושא עליו מערכת רחבה של
                  משמעויות. הוא קרוב לעור, קרוב לפנים, קרוב לידיים ולתנועה. הוא
                  נראה באור בוקר ובאור ערב, בתמונה, בעבודה, בארוחת חג, בפגישה
                  וביום רגיל לחלוטין. לכן העיצוב שלו אינו מסתיים בקו יפה. הוא
                  ממשיך בשאלה האם הקו הזה יישאר נכון גם אחרי הרבה ענידות, גם
                  כשהוא משתלב עם תכשיטים אחרים, וגם כשהוא הופך לחלק מההרגל.
                </p>
              </div>

              <div className="text-muted-foreground grid gap-6 text-lg leading-9">
                <p>
                  אנחנו אוהבים תכשיטים שמצליחים להיות נוכחים בלי להפריע. טבעת
                  יכולה להיות דקה ועדיין לזכור את עצמה. שרשרת יכולה להיות
                  מינימלית ועדיין למשוך מבט. עגילים יכולים להיות נקיים ועדיין
                  להאיר את הפנים. צמיד יכול להיות יומיומי ועדיין להרגיש כמו
                  החלטה חגיגית. זהו סוג היופי שמעניין אותנו: יופי שלא צריך
                  להוכיח כל הזמן שהוא יוקרתי, משום שהדיוק שלו ניכר בדרך שבה הוא
                  מתיישב על הגוף.
                </p>
                <p>
                  מתוך תפיסה זו, חוויית הקנייה אינה נספח. היא חלק מהתכשיט. כאשר
                  אדם רוכש מתנה, טבעת אירוסין, זוג עגילים או שרשרת לעצמו, הוא
                  מבקש יותר ממוצר. הוא מבקש ודאות. הוא רוצה לדעת שהמחיר ברור,
                  שהמידה ניתנת לבדיקה, ששירות הלקוחות יכול לעזור, שהאריזה מכבדת
                  את הרגע, שהשירות לא ייעלם אחרי התשלום. כל פרט כזה מקטין את
                  המרחק בין התלהבות לבין החלטה, ומאפשר ליופי להישאר חופשי מחרדה.
                </p>
                <p>
                  לכן אנחנו מתכננים את Aphrodite כשפה אחת: קטלוג שמציג מידע בלי
                  להציף, כרטיס מוצר שמכבד את התמונה אבל לא מסתיר את הפרטים,
                  שירות אונליין שמחזיק את החוויה בידיים, ושיחה אישית שמתחילה
                  בשאלה ולא בתשובה מוכנה. מבחינתנו, שירות טוב אינו אומר לומר
                  לכולם מה מתאים להם. שירות טוב הוא לבנות מספיק בהירות כדי שכל
                  אדם יוכל לזהות מה מתאים לו.
                </p>
                <p>
                  יש תכשיטים שנבחרים כי הם מתאימים לאירוע מסוים, ויש כאלה
                  שנבחרים כי הם מצליחים להישאר גם אחרי שהאירוע נגמר. Aphrodite
                  מבקשת לכבד את שני המצבים האלה. אנחנו אוהבים את הרגע החגיגי, את
                  הקופסה שנפתחת, את הברכה ואת המבט הראשון; אבל אנחנו חושבים גם
                  על החודש שאחר כך, על השימוש היומיומי, על היד שנשלחת אל השרשרת
                  בלי לחשוב, ועל התחושה שתכשיט מסוים הפך להיות “שלי” לא בגלל
                  שהוא חדש, אלא בגלל שהוא נכון.
                </p>
                <div className="brand-surface text-foreground p-6">
                  <p className="text-2xl leading-9 font-semibold">
                    יופי טוב אינו ממהר. הוא נותן לעין להתקרב, ליד לבדוק, וללב
                    להבין שהבחירה שלו יכולה להיות שקטה.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </RevealSection>

        <Separator />

        <RevealSection
          className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20"
          id="about-experience"
        >
          <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr]">
            <div>
              <p className="text-muted-foreground text-sm">חוויית הקנייה</p>
              <h2 className="mt-3 text-4xl leading-tight font-semibold">
                הדרך אל התכשיט חשובה כמעט כמו התכשיט עצמו.
              </h2>
              <p className="text-muted-foreground mt-5 text-lg leading-8">
                בחירה בתכשיט היא פעולה רגשית, אבל היא לא צריכה להיות מעורפלת.
                אנחנו רוצים שהלקוחה תוכל לנוע בין השראה לבין החלטה בלי לאבד את
                תחושת השליטה: לראות, לסנן, להשוות, לשמור, לשאול, למדוד ולקבל
                תשובה. כל שלב נבנה כדי להחזיר את תשומת הלב לדבר החשוב: איך
                התכשיט מרגיש כשהוא הופך לחלק מהחיים.
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
                        <h3 className="text-xl font-semibold">{item.title}</h3>
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
        </RevealSection>

        <RevealSection className="brand-page-band">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
            <div className="brand-surface mx-auto max-w-4xl p-6 text-center sm:p-8 lg:p-12">
              <Sparkles aria-hidden="true" className="mx-auto size-8" />
              <h2 className="mt-6 text-4xl leading-tight font-semibold">
                Aphrodite אינה מבקשת שתבחרו מהר. היא מבקשת שתבחרו בביטחון.
              </h2>
              <p className="text-muted-foreground mx-auto mt-5 max-w-3xl text-lg leading-8">
                יש תכשיטים שמתחילים בתמונה ויש תכשיטים שמתחילים באדם. אנחנו
                מעדיפים להתחיל באדם: בסגנון שלו, ברגע שלו, בשאלה מה הוא רוצה
                לזכור ומה הוא רוצה להרגיש. משם מגיעים אל החומר, אל האבן, אל
                המידה ואל הקופסה. אם בסוף הדרך התכשיט נראה כאילו הוא היה שם
                תמיד, עשינו את העבודה שלנו.
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
          </div>
        </RevealSection>
      </article>
    </main>
  );
}
