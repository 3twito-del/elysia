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

import { CompactPageIntro } from "~/components/compact-page-intro";
import { CookiePreferencesPanel } from "~/components/cookie-preferences-panel";
import { RevealSection } from "~/components/reveal";
import { SiteHeader } from "~/components/site-header";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import {
  privacyProviderPlaceholders,
  privacySensitiveInfoWarning,
} from "~/lib/legal-content";
import { getPublicContactSettings } from "~/server/services/service";

export const metadata: Metadata = {
  title: "מדיניות פרטיות",
  description:
    "מדיניות פרטיות של Elysia: סוגי מידע שנאסף, מטרות שימוש, עוגיות, דיוור, ספקי שירות, אבטחת מידע וזכויות עיון, תיקון ומחיקה.",
  alternates: {
    canonical: "/privacy",
  },
};

export const dynamic = "force-dynamic";

const privacySections = [
  {
    title: "Analytics, CRM ופרופיל לקוח",
    text: "מערכת Elysia שומרת אירועי מסחר ותפעול כגון הזמנות, תשלומים, פניות שירות, תורים ו־Wishlist כצורך עסקי להפעלת השירות, תמיכה, מניעת הונאות וניתוח תפעולי. אירועי גלישה ושיווק מזוהים כמו page views, צפיות מוצר, clicks וחיפושים נרשמים רק לאחר אישור מדידה. אירועי Analytics אינם כוללים IP raw, טלפון, כתובת מלאה או פרטי תשלום; מידע אישי נשאר בטבלאות הלקוח, ההזמנות והשירות המוגנות.",
  },
  {
    title: "זהות בעל השליטה במידע",
    text: "בעל השליטה במידע הוא העסק המפעיל את אתר Elysia. יש להשלים את השם המשפטי ופרטי הקשר הייעודיים לפרטיות לפני הפעלה מסחרית מלאה.",
  },
  {
    title: "סוגי מידע שנאסף",
    text: "בעת שימוש באתר עשויים להיאסף פרטי קשר, פרטי הזמנה, כתובת משלוח, היסטוריית פניות, העדפות מידה או מוצרים, פעולות בסל, נתוני שימוש טכניים, העדפות קוקיז ומידע שהמשתמש/ת מוסר/ת מיוזמתו בטפסים.",
  },
  {
    title: "מטרות השימוש",
    text: "המידע משמש להפעלת האתר, טיפול בהזמנות, מסירה, שירות לקוחות, ניהול חשבון, מניעת הונאות, אבטחת מידע, שיפור השירות, עמידה בחובות דין ושליחת דיוור שיווקי רק כאשר הדבר מותר לפי דין ובהתאם להסכמה.",
  },
  {
    title: "מידע שנמסר בעת רכישה",
    text: "בעת רכישה או פתיחת הזמנה עשויים להימסר שם, טלפון, אימייל, כתובת, פרטי מוצר, כמות, מחיר, משלוח וסכום לתשלום. פרטי כרטיס אשראי אינם נמסרים בטפסי השירות באתר ומעובדים דרך ספק סליקה חיצוני ככל שמופעל.",
  },
  {
    title: "פניות שירות וקבצים מצורפים",
    text: `פניות שירות עשויות לכלול תיאור פנייה, מספר הזמנה, תמונות או קבצים. ${privacySensitiveInfoWarning} אם צורף מידע שאינו נדרש, ניתן לבקש את מחיקתו בכפוף לדין וליכולות הטכניות.`,
  },
  {
    title: "עוגיות וכלי מדידה",
    text: "האתר משתמש בעוגיות ובאחסון מקומי לצרכים חיוניים כמו סל, נגישות, התחברות, אבטחה ותפעול. מדידה, אנליטיקה או שיווק יופעלו רק לאחר הסכמה מתאימה, ככל שהם קיימים באתר.",
  },
  {
    title: "דיוור שיווקי",
    text: "הרשמה לעדכונים ודיוור שיווקי מתבצעת רק לאחר סימון הסכמה ייעודית שאינה מסומנת מראש. ניתן להסיר את ההרשמה בכל עת באמצעות קישור הסרה או פנייה לשירות.",
  },
  {
    title: "ספקי שירות חיצוניים",
    text: "מידע עשוי להימסר לספקי אחסון, סליקה, דיוור, אנליטיקה, חיפוש, אבטחה, שירות לקוחות, משלוחים וספקים טכנולוגיים אחרים, רק ככל שנדרש להפעלת השירות, למטרות המפורטות במדיניות זו או לפי דין.",
  },
  {
    title: "העברה מחוץ לישראל",
    text: "ככל שספקי שירות חיצוניים מאחסנים או מעבדים מידע מחוץ לישראל, ההעברה תתבצע לפי הסדרים מקובלים ובהתאם לדין החל. יש להשלים את פרטי הספקים והמדינות הרלוונטיות ככל שידועים.",
  },
  {
    title: "אבטחת מידע",
    text: "העסק נוקט אמצעים סבירים ומקובלים להגנה על מידע אישי בהתאם לסוג המידע והסיכון. עם זאת, אין מערכת מאובטחת באופן מוחלט, ולכן אין למסור מידע רגיש שאינו נחוץ.",
  },
  {
    title: "תקופות שמירת מידע",
    text: "מידע נשמר כל עוד הוא נדרש למטרות שלשמן נאסף, לניהול הזמנות ושירות, לעמידה בחובות חשבונאיות ומשפטיות, לאבטחה ולמניעת הונאות. לאחר מכן יימחק או יעבור אנונימיזציה ככל האפשר.",
  },
  {
    title: "זכויות עיון, תיקון ומחיקה",
    text: "בהתאם לדין, ניתן לפנות בבקשה לעיין במידע אישי, לתקן מידע שאינו נכון או לבקש מחיקה. בקשות ייבחנו בכפוף לאימות זהות, חובות שמירה חוקיות, זכויות צדדים שלישיים ומגבלות טכניות או משפטיות.",
  },
  {
    title: "יצירת קשר בענייני פרטיות",
    text: "לפנייה בנושא פרטיות יש לציין פרטי זיהוי, דרך חזרה ותיאור הבקשה. אין לצרף מסמכים או מידע רגיש שאינם נחוצים לטיפול בבקשה.",
  },
] as const;

export default async function PrivacyPage() {
  const contact = await getPublicContactSettings();

  return (
    <>
      <SiteHeader />

      <main>
        <CompactPageIntro
          description="כיצד נאסף, נשמר, משותף ומוגן מידע אישי באתר ובשירות."
          eyebrow="פרטיות ומידע"
          title="מדיניות פרטיות"
          variant="content"
        />

        <RevealSection className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:py-14">
          <div className="brand-surface p-6 sm:p-8">
            <section aria-labelledby="privacy-controller">
              <div className="flex items-center gap-3">
                <ShieldCheck className="size-5" aria-hidden="true" />
                <h2 className="text-2xl font-semibold" id="privacy-controller">
                  פרטי בעל השליטה וספקים
                </h2>
              </div>
              <dl className="mt-5 grid gap-3 sm:grid-cols-2">
                {privacyProviderPlaceholders.map((item) => (
                  <div
                    className="glass-inset rounded-md border p-4"
                    key={item.label}
                  >
                    <dt className="text-muted-foreground text-sm">
                      {item.label}
                    </dt>
                    <dd className="mt-1 font-medium">{item.value}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <Separator className="my-8" />

            <div className="grid gap-6 sm:grid-cols-3">
              <div className="glass-inset rounded-md border p-4">
                <Database className="size-5" aria-hidden="true" />
                <p className="mt-3 font-medium">מידע שנמסר ונוצר באתר</p>
              </div>
              <div className="glass-inset rounded-md border p-4">
                <Cookie className="size-5" aria-hidden="true" />
                <p className="mt-3 font-medium">מדידה רק לאחר הסכמה</p>
              </div>
              <div className="glass-inset rounded-md border p-4">
                <UserCheck className="size-5" aria-hidden="true" />
                <p className="mt-3 font-medium">זכויות עיון, תיקון ומחיקה</p>
              </div>
            </div>

            <Separator className="my-8" />

            <div className="grid gap-7">
              {privacySections.map((section, index) => {
                const sectionId = `privacy-section-${index + 1}`;
                const Icon = index === 5 ? Cookie : Database;

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

            <section aria-labelledby="privacy-first-party-analytics">
              <h2
                className="text-2xl font-semibold"
                id="privacy-first-party-analytics"
              >
                מדידת גלישה first-party ו־session replay
              </h2>
              <p className="text-muted-foreground mt-3 leading-8">
                מערכת המדידה של Elysia פועלת בתוך האתר ואינה שולחת נתוני גלישה
                ל־Google Analytics, Hotjar, PostHog Cloud או שירות SaaS אנליטיקס
                אחר. היא עשויה לשמור page views, route changes, scroll depth,
                clicks, חיפושים, משפכי רכישה, attribution ו־session replay ממוסך
                לצורך שיפור האתר, מדידת קמפיינים ותפעול CRM/ERP/Finance.
              </p>
              <p className="text-muted-foreground mt-3 leading-8">
                Replay נחסם לחלוטין באזורי admin, ושדות קלט, תשלום, סיסמאות
                ואזורים רגישים ממוסכים או נחסמים לפני שמירה. לא נשמר IP גולמי,
                ערכי שדות, פרטי תשלום, כתובות מלאות או טלפונים בתוך payload
                אנליטיקס. נתוני raw analytics ו־rollups נשמרים ללא מחיקה
                אוטומטית כברירת מחדל עסקית, אך ניתן לפנות לבקשת מחיקה או
                אנונימיזציה ידנית בכפוף לדין ולזיהוי מתאים.
              </p>
            </section>

            <Separator className="my-8" />

            <section
              aria-labelledby="privacy-local-storage"
              data-testid="privacy-local-storage-notice"
            >
              <h2 className="text-2xl font-semibold" id="privacy-local-storage">
                אחסון מקומי ומדידה בהסכמה
              </h2>
              <p className="text-muted-foreground mt-3 leading-8">
                מועדפים, צפיות אחרונות, מידות, פעולות לא מקוונות ומזהה PWA
                נשמרים בדפדפן. מדידה ואירועי שימוש שאינם חיוניים מופעלים לפי
                העדפות העוגיות.
              </p>
            </section>

            <Separator className="my-8" />

            <section aria-labelledby="privacy-contact">
              <h2 className="text-2xl font-semibold" id="privacy-contact">
                פנייה בנושא פרטיות
              </h2>
              <p className="text-muted-foreground mt-3 leading-8">
                למימוש זכויות או בקשת פרטיות יש לציין פרטי זיהוי ומהות פנייה.
                {` ${privacySensitiveInfoWarning}`}
              </p>
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
                עודכן לאחרונה: 23 ביוני 2026
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
