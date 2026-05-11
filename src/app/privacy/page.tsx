import type { Metadata } from "next";
import Link from "next/link";
import {
  Cookie,
  Database,
  LockKeyhole,
  Mail,
  Phone,
  ShieldCheck,
  UserCheck,
} from "lucide-react";

import { BrandMediaPanel } from "~/components/brand-media-panel";
import { CinematicPageHero } from "~/components/cinematic-page-hero";
import { CookiePreferencesPanel } from "~/components/cookie-preferences-panel";
import { RevealSection } from "~/components/reveal";
import { SiteHeader } from "~/components/site-header";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { brandMedia, cinematicRouteMedia } from "~/lib/brand-media";
import { publicContactEmail, publicContactPhone } from "~/lib/public-contact";

export const metadata: Metadata = {
  title: "מדיניות פרטיות",
  description:
    "מדיניות הפרטיות של Aphrodite בהתאם לחוק הגנת הפרטיות, לרבות תיקון 13: מידע שנאסף, מטרות שימוש, העברת מידע, אבטחה וזכויות משתמשים.",
};

const privacySections = [
  {
    title: "תחולת תיקון 13 לחוק הגנת הפרטיות",
    text: "מדיניות זו נועדה לשקף את חובות השקיפות והאחריות לפי חוק הגנת הפרטיות, התשמ״א-1981, כפי שעודכן בתיקון 13 שנכנס לתוקף ביום 14 באוגוסט 2025. במסגרת זו אנו מתייחסים למידע אישי, למידע בעל רגישות מיוחדת ככל שנמסר, למטרות העיבוד, לגורמים שעשויים לקבל מידע ולזכויות המשתמשים.",
  },
  {
    title: "איזה מידע נאסף",
    text: "בעת שימוש באתר עשויים להיאסף פרטי קשר, פרטי הזמנה, כתובת משלוח, פרטי חשבון, פניות שירות, תיאומי סניף, העדפות קטלוג, תוכן שנשלח לסטייליסט AI ומידע טכני כגון כתובת IP, סוג דפדפן, אירועי שימוש ותיעוד אבטחה.",
  },
  {
    title: "מידע בעל רגישות מיוחדת",
    text: "ככלל, האתר אינו מבקש מידע רגיש שאינו דרוש לרכישה או לשירות. אם משתמש מוסר מיוזמתו מידע שעשוי להיחשב בעל רגישות מיוחדת, למשל במסגרת פנייה לשירות לקוחות או ייעוץ אישי, נעשה בו שימוש רק לצורך הטיפול בפנייה, מתן השירות, אבטחה, עמידה בדין או הגנה על זכויות.",
  },
  {
    title: "מטרות השימוש במידע",
    text: "המידע משמש להפעלת האתר, טיפול בהזמנות, אספקה ואיסוף, שירות לקוחות, ניהול חשבון, התאמת המלצות, שיפור חוויית משתמש, מניעת הונאות, אבטחת מידע, עמידה בחובות דין ושליחת עדכונים או דיוור כאשר הדבר מותר לפי דין.",
  },
  {
    title: "בעל שליטה במאגר ומחזיקים",
    text: "Aphrodite פועלת כבעלת השליטה במידע שנאסף במסגרת האתר, וספקי שירות חיצוניים עשויים לפעול כמחזיקים או מעבדים מטעמה לצורך מתן השירות. אנו משתדלים להגביל את הגישה למידע למורשים ולספקים הנדרשים לכך בלבד, בהתאם למטרות המפורטות במדיניות זו.",
  },
  {
    title: "מסירת מידע לצדדים שלישיים",
    text: "מידע עשוי להימסר לספקי תשתית, סליקה, משלוחים, דוא״ל, SMS, אחסון, חיפוש, אבטחה, אנליטיקה וספקי AI, ככל שהדבר נדרש להפעלת השירות. מידע עשוי להימסר גם אם קיימת חובה חוקית, צו שיפוטי, דרישת רשות מוסמכת או צורך להגן על זכויות Aphrodite והלקוחות.",
  },
  {
    title: "עוגיות ואחסון מקומי",
    text: "האתר משתמש בעוגיות, localStorage וטכנולוגיות דומות לצורך הפעלת שירותים חיוניים כגון סל קניות, התחברות, אבטחה והעדפות נגישות. שימוש במדידה, שיפור חוויית הקנייה ומוצרים שנצפו לאחרונה יתבצע רק לאחר בחירת המשתמש בבאנר הקוקיז. ניתן לנהל או למחוק עוגיות דרך הגדרות הדפדפן, אך חלק מהשירותים עשויים להיפגע.",
  },
  {
    title: "אבטחת מידע ושמירה",
    text: "אנו נוקטים אמצעים סבירים ומקובלים להגנה על מידע אישי בהתאם לסוג המידע והסיכונים. מידע נשמר כל עוד הוא נדרש למטרות שלשמן נאסף, לניהול השירות, לצרכים חשבונאיים, משפטיים או תפעוליים, ולאחר מכן יימחק או יעבור אנונימיזציה ככל האפשר.",
  },
  {
    title: "זכויות משתמשים",
    text: "בהתאם לחוק הגנת הפרטיות, משתמשים רשאים לפנות בבקשה לעיין במידע עליהם, ולבקש תיקון או מחיקה של מידע שאינו נכון, שלם, ברור או מעודכן. בקשות ייבחנו בכפוף להוראות הדין, לאימות זהות, לחובות שמירה חוקיות ולמגבלות תפעוליות או משפטיות.",
  },
  {
    title: "קטינים",
    text: "השימוש באתר לצורך רכישה מיועד לבגירים או למי שקיבלו אישור הורה או אפוטרופוס. אם נמסר לנו מידע על קטין ללא אישור מתאים, ניתן לפנות אלינו ונבחן את הבקשה בהתאם לדין.",
  },
  {
    title: "עדכונים למדיניות",
    text: "מדיניות זו עשויה להתעדכן מעת לעת כדי לשקף שינויים בשירות, בטכנולוגיה או בדין. נוסח המדיניות המחייב הוא הנוסח המפורסם באתר במועד השימוש.",
  },
];

export default function PrivacyPage() {
  return (
    <main>
      <SiteHeader />

      <CinematicPageHero
        actions={
          <>
            <Button asChild size="lg">
              <Link href="#privacy-section-1">עיקרי המדיניות</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="#privacy-contact">פנייה בנושא פרטיות</Link>
            </Button>
          </>
        }
        description="כיצד אנחנו אוספים, משתמשים, שומרים ומגנים על מידע אישי במסגרת האתר והשירותים."
        eyebrow="Aphrodite Policy"
        scrollCue={{ href: "#privacy-section-1", label: "לעיקרי המדיניות" }}
        slides={cinematicRouteMedia.legal}
        stats={[
          { label: "עדכון", value: "2026" },
          { label: "זכויות", value: "עיון ותיקון" },
          { label: "קוקיז", value: "בשליטה" },
        ]}
        title="מדיניות פרטיות"
        variant="editorial"
      />

      <RevealSection aria-hidden="true" className="hidden" variant="none">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:py-16">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Aphrodite</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-normal sm:text-5xl">
                מדיניות פרטיות
              </h1>
              <p className="text-muted-foreground mt-4 max-w-3xl leading-8">
                המדיניות מפרטת כיצד אנו אוספים, משתמשים, שומרים ומגנים על מידע
                אישי במסגרת האתר והשירותים הדיגיטליים.
              </p>
            </div>
            <div className="glass-card w-fit rounded-md border p-4">
              <LockKeyhole className="size-8" aria-hidden="true" />
            </div>
          </div>
          <BrandMediaPanel
            alt="Subtle Aphrodite Aqua policy glass accent"
            className="mt-7 h-28"
            priority
            slides={brandMedia.policy}
            variant="content"
          />
        </div>
      </RevealSection>

      <RevealSection className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:py-14">
        <div className="glass-panel rounded-md border p-6 sm:p-8">
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="glass-inset rounded-md border p-4">
              <Database className="size-5" aria-hidden="true" />
              <p className="mt-3 font-medium">מידע שנמסר ונוצר באתר</p>
            </div>
            <div className="glass-inset rounded-md border p-4">
              <ShieldCheck className="size-5" aria-hidden="true" />
              <p className="mt-3 font-medium">אבטחה ושימוש מוגבל</p>
            </div>
            <div className="glass-inset rounded-md border p-4">
              <UserCheck className="size-5" aria-hidden="true" />
              <p className="mt-3 font-medium">זכויות עיון ותיקון</p>
            </div>
          </div>

          <div className="glass-inset mt-6 rounded-md border p-5">
            <div className="flex items-center gap-3">
              <ShieldCheck className="size-5" aria-hidden="true" />
              <h2 className="text-xl font-semibold">
                עדכון לפי תיקון 13 לחוק הגנת הפרטיות
              </h2>
            </div>
            <p className="text-muted-foreground mt-3 leading-8">
              תיקון 13 מחזק את חובות השקיפות, ההגדרה והאחריות בעיבוד מידע אישי.
              לכן המדיניות מפרטת מראש איזה מידע נאסף, לאילו מטרות, למי הוא עשוי
              להימסר, כיצד נשמרות זכויות המשתמשים וכיצד ניתן לפנות בנושא פרטיות.
            </p>
          </div>

          <Separator className="my-8" />

          <div className="grid gap-7">
            {privacySections.map((section, index) => {
              const Icon = index === 3 ? Cookie : Database;
              const sectionId = `privacy-section-${index + 1}`;

              return (
                <section aria-labelledby={sectionId} key={section.title}>
                  <div className="flex items-center gap-3">
                    <Icon className="size-5" aria-hidden="true" />
                    <h2 className="text-2xl font-semibold" id={sectionId}>
                      {section.title}
                    </h2>
                  </div>
                  <p className="text-muted-foreground mt-3 leading-8">
                    {section.text}
                  </p>
                </section>
              );
            })}
          </div>

          <Separator className="my-8" />

          <CookiePreferencesPanel />

          <Separator className="my-8" />

          <section aria-labelledby="privacy-contact">
            <h2 className="text-2xl font-semibold" id="privacy-contact">
              פנייה בנושא פרטיות
            </h2>
            <p className="text-muted-foreground mt-3 leading-8">
              למימוש זכויות, שאלות או בקשות בנושא פרטיות, יש לציין את פרטי
              הזיהוי הדרושים לטיפול בבקשה ואת מהות הפנייה.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <a
                className="glass-inset hover:text-foreground flex items-center gap-3 rounded-md border p-4 transition"
                href={`mailto:${publicContactEmail}`}
              >
                <Mail className="size-5" aria-hidden="true" />
                <span>{publicContactEmail}</span>
              </a>
              <a
                className="glass-inset hover:text-foreground flex items-center gap-3 rounded-md border p-4 transition"
                href={`tel:${publicContactPhone}`}
              >
                <Phone className="size-5" aria-hidden="true" />
                <span>{publicContactPhone}</span>
              </a>
            </div>
          </section>

          <Separator className="my-8" />

          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <p className="text-muted-foreground text-sm">
              עודכן לאחרונה: 1 במאי 2026.
            </p>
            <Button asChild>
              <Link href="/terms">לתקנון האתר</Link>
            </Button>
          </div>
        </div>
      </RevealSection>
    </main>
  );
}
