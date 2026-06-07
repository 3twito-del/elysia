import type { Metadata } from "next";
import Link from "next/link";
import {
  Cookie,
  Database,
  Mail,
  Phone,
  ShieldCheck,
  UserCheck,
} from "lucide-react";

import { CommercePageHero } from "~/components/commerce-page-hero";
import { CookiePreferencesPanel } from "~/components/cookie-preferences-panel";
import { RevealSection } from "~/components/reveal";
import { SiteHeader } from "~/components/site-header";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { getPublicContactSettings } from "~/server/services/service";

export const metadata: Metadata = {
  title: "מדיניות פרטיות",
  description:
    "מדיניות פרטיות של Elysia: מידע שנאסף, מטרות שימוש, העברה, אבטחה וזכויות משתמשים.",
};

export const dynamic = "force-dynamic";

const privacySections = [
  {
    title: "תחולת תיקון 13 לחוק הגנת הפרטיות",
    text: "מדיניות זו נועדה לשקף את חובות השקיפות והאחריות לפי חוק הגנת הפרטיות, התשמ״א-1981, כפי שעודכן בתיקון 13 שנכנס לתוקף ביום 14 באוגוסט 2025. במסגרת זו אנו מתייחסים למידע אישי, למידע בעל רגישות מיוחדת ככל שנמסר, למטרות העיבוד, לגורמים שעשויים לקבל מידע ולזכויות המשתמשים.",
  },
  {
    title: "איזה מידע נאסף",
    text: "בעת שימוש באתר עשויים להיאסף פרטי קשר, הזמנה, כתובת, חשבון, פניות שירות, העדפות מבחר, תוכן שנשלח לכלי ההתאמה ומידע שימוש.",
  },
  {
    title: "מידע בעל רגישות מיוחדת",
    text: "ככלל, האתר אינו מבקש מידע רגיש שאינו דרוש להזמנה או לשירות. אם משתמש מוסר מיוזמתו מידע שעשוי להיחשב בעל רגישות מיוחדת, למשל במסגרת פנייה לשירות או ייעוץ, נעשה בו שימוש רק לצורך הטיפול בפנייה, מתן השירות, אבטחה, עמידה בדין או הגנה על זכויות.",
  },
  {
    title: "מטרות השימוש במידע",
    text: "המידע משמש להפעלת האתר, טיפול בהזמנות, מסירה, שירות, ניהול חשבון, התאמת המלצות, שיפור האתר, מניעת הונאות, אבטחת מידע, עמידה בחובות דין ושליחת עדכונים או דיוור כאשר הדבר מותר לפי דין.",
  },
  {
    title: "בעל שליטה במאגר ומחזיקים",
    text: "Elysia פועלת כבעלת השליטה במידע שנאסף במסגרת האתר, ונותני שירות חיצוניים עשויים לפעול כמחזיקים או מעבדים מטעמה לצורך מתן השירות. אנו משתדלים להגביל את הגישה למידע למורשים הנדרשים לכך בלבד, בהתאם למטרות המפורטות במדיניות זו.",
  },
  {
    title: "מסירת מידע לצדדים שלישיים",
    text: "מידע עשוי להימסר לגורמי תשתית, תשלום, מסירה, דוא״ל, SMS, אחסון, חיפוש, אבטחה, אנליטיקה ובינה מלאכותית, ככל שהדבר נדרש להפעלת השירות. מידע עשוי להימסר גם אם קיימת חובה חוקית, צו שיפוטי, דרישת רשות מוסמכת או צורך להגן על זכויות Elysia והלקוחות.",
  },
  {
    title: "עוגיות ואחסון מקומי",
    text: "האתר משתמש בעוגיות ואחסון מקומי לשירותים חיוניים כגון בחירה, התחברות, אבטחה ונגישות. מדידה ושיפור יופעלו רק לאחר בחירה בבאנר הקוקיז.",
  },
  {
    title: "אבטחת מידע ושמירה",
    text: "אנו נוקטים אמצעים סבירים ומקובלים להגנה על מידע אישי בהתאם לסוג המידע והסיכונים. מידע נשמר כל עוד הוא נדרש למטרות שלשמן נאסף, לניהול השירות, לצרכים חשבונאיים, משפטיים או חיוניים, ולאחר מכן יימחק או יעבור אנונימיזציה ככל האפשר.",
  },
  {
    title: "זכויות משתמשים",
    text: "בהתאם לחוק הגנת הפרטיות, משתמשים רשאים לפנות בבקשה לעיין במידע עליהם, ולבקש תיקון או מחיקה של מידע שאינו נכון, שלם, נהיר או מעודכן. בקשות ייבחנו בכפוף להוראות הדין, לאימות זהות, לחובות שמירה חוקיות ולמגבלות מעשיות או משפטיות.",
  },
  {
    title: "קטינים",
    text: "השימוש באתר לצורך הזמנה מיועד לבגירים או למי שקיבלו אישור הורה או אפוטרופוס. אם נמסר לנו מידע על קטין ללא אישור מתאים, ניתן לפנות אלינו ונבחן את הבקשה בהתאם לדין.",
  },
  {
    title: "עדכונים למדיניות",
    text: "מדיניות זו עשויה להתעדכן מעת לעת כדי לשקף שינויים בשירות, בטכנולוגיה או בדין. נוסח המדיניות המחייב הוא הנוסח המפורסם באתר במועד השימוש.",
  },
];

export default async function PrivacyPage() {
  const contact = await getPublicContactSettings();

  return (
    <>
      <SiteHeader />

      <main>
        <CommercePageHero
          description="כיצד נאסף, נשמר ומוגן מידע אישי באתר ובשירות."
          eyebrow="פרטיות ומידע"
          title="מדיניות פרטיות"
          variant="content"
        />

      <RevealSection className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:py-14">
        <div className="brand-surface p-6 sm:p-8">
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
            <p className="text-muted-foreground mt-3 leading-8">תיקון 13 מחזק שקיפות ואחריות בעיבוד מידע אישי. המדיניות מפרטת מידע, מטרות, מסירה, זכויות ופרטי פנייה.</p>
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

          <section
            aria-labelledby="privacy-local-storage"
            data-testid="privacy-local-storage-notice"
          >
            <h2 className="text-2xl font-semibold" id="privacy-local-storage">
              אחסון מקומי ומדידה בהסכמה
            </h2>
            <p className="text-muted-foreground mt-3 leading-8">מועדפים, צפיות אחרונות, מידות, פעולות לא מקוונות ומזהה PWA נשמרים בדפדפן. מדידה ואירועי שימוש שאינם חיוניים מופעלים לפי העדפות העוגיות.</p>
          </section>

          <Separator className="my-8" />

          <section aria-labelledby="privacy-contact">
            <h2 className="text-2xl font-semibold" id="privacy-contact">
              פנייה בנושא פרטיות
            </h2>
            <p className="text-muted-foreground mt-3 leading-8">למימוש זכויות או בקשת פרטיות יש לציין פרטי זיהוי ומהות פנייה.</p>
            <Button asChild className="mt-5" variant="secondary">
              <Link
                data-testid="privacy-service-recovery-link"
                href="/service?topic=accessibility-privacy"
              >
                פתיחת פנייה בנושא פרטיות
              </Link>
            </Button>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <a
                className="glass-inset hover:text-foreground flex items-center gap-3 rounded-md border p-4 transition"
                href={`mailto:${contact.email}`}
              >
                <Mail className="size-5" aria-hidden="true" />
                <span>{contact.email}</span>
              </a>
              <a
                className="glass-inset hover:text-foreground flex items-center gap-3 rounded-md border p-4 transition"
                href={contact.phoneHref}
              >
                <Phone className="size-5" aria-hidden="true" />
                <span>{contact.phoneDisplay}</span>
              </a>
            </div>
          </section>

          <Separator className="my-8" />

          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <p className="text-muted-foreground text-sm">
              עודכן לאחרונה: 1 במאי 2026.
            </p>
            <Button asChild>
              <Link href="/terms">לתקנון</Link>
            </Button>
          </div>
        </div>
      </RevealSection>
      </main>
    </>
  );
}
