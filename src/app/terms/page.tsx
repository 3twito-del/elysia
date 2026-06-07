import type { Metadata } from "next";
import Link from "next/link";
import {
  FileText,
  Mail,
  PackageCheck,
  Phone,
  ShieldCheck,
} from "lucide-react";

import { CommercePageHero } from "~/components/commerce-page-hero";
import { RevealSection } from "~/components/reveal";
import { SiteHeader } from "~/components/site-header";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import {
  businessLegalPlaceholders,
  policyLinks,
  termsSafetySentence,
  vatIncludedNotice,
} from "~/lib/legal-content";
import { getPublicContactSettings } from "~/server/services/service";

export const metadata: Metadata = {
  title: "תקנון האתר",
  description:
    "תקנון ותנאי שימוש באתר Elysia: הזמנות, תשלום, מלאי, מחירים, משלוחים, ביטולים, אחריות, פרטיות, קניין רוחני ויצירת קשר.",
  alternates: {
    canonical: "/terms",
  },
};

export const dynamic = "force-dynamic";

const termsSections = [
  {
    title: "כללי",
    text: "השימוש באתר Elysia, גלישה בו, יצירת פנייה או ביצוע הזמנה מהווים הסכמה לתקנון זה, למדיניות הפרטיות ולמדיניות המשלוחים, הביטולים וההחזרות. אם אינך מסכים/ה לתנאים, אין להשתמש באתר או לבצע הזמנה.",
  },
  {
    title: "פרטי העסק",
    text: "פרטי העסק מופיעים להלן ויש להשלים אותם לפני הפעלה מסחרית מלאה. אין לראות בשם המותג Elysia תחליף לשם המשפטי של העסק או לפרטי עוסק/חברה.",
  },
  {
    title: "הגדרות",
    text: "האתר, העסק, המשתמש, הלקוח, המוצר, ההזמנה, השירות והמדיניות מתייחסים לשימוש באתר Elysia, לתכשיטים ולשירותים הנלווים המוצגים בו, אלא אם נאמר אחרת במפורש.",
  },
  {
    title: "כשירות לשימוש ורכישה",
    text: "השימוש באתר וביצוע הזמנה מיועדים לבגירים או למי שקיבלו אישור הורה או אפוטרופוס. המשתמש/ת מתחייב/ת למסור פרטים נכונים, מלאים ועדכניים.",
  },
  {
    title: "תהליך ההזמנה",
    text: "הזמנה באתר כוללת בחירת מוצר, מידה או אפשרות זמינה, מסירת פרטי התקשרות וכתובת, אישור מדיניות ותשלום או פתיחת בקשת תשלום. הזמנה תיחשב מחייבת רק לאחר אישור העסק והתשלום, לפי העניין.",
  },
  {
    title: "אישור ההזמנה",
    text: "קבלת מספר הזמנה או הודעת קליטה אינה מהווה אישור סופי לאספקת המוצר. העסק רשאי לבדוק זמינות מלאי, מחיר, פרטי תשלום וכתובת לפני אישור סופי, בכפוף לדין.",
  },
  {
    title: "זמינות מלאי",
    text: "מלאי המוצרים עשוי להשתנות. אם מוצר אינו זמין לאחר ביצוע הזמנה, השירות יפנה ללקוח/ה לצורך חלופה, המתנה, זיכוי, ביטול או החזר בהתאם לדין.",
  },
  {
    title: "טעויות מחיר או תיאור",
    text: "ייתכנו טעויות סופר, תיאור, תמונה, מחיר או זמינות. במקרה של טעות מהותית, העסק יפעל לתיקון, ייצור קשר עם הלקוח/ה ויטפל בהזמנה בהתאם לדין.",
  },
  {
    title: "מחירים ומע״מ",
    text: `${vatIncludedNotice} מחיר המוצר, עלות המשלוח והסכום הסופי יוצגו לפני המעבר לתשלום או לפני אישור ההזמנה ככל שהמידע זמין.`,
  },
  {
    title: "תשלום וסליקה",
    text: "תשלום באתר, ככל שמופעל, מתבצע דרך ספק סליקה חיצוני. אין למסור פרטי כרטיס אשראי בטפסי שירות, בצ׳אט או בשדה הערות. פרטי התשלום יעובדו בהתאם למדיניות ספק הסליקה ולדין.",
  },
  {
    title: "משלוחים",
    text: "משלוחים, כתובת שגויה, אי איסוף, זמני אספקה ועלויות משלוח מפורטים במדיניות המשלוחים, הביטולים וההחזרות. יש לוודא שהכתובת ופרטי הקשר נכונים לפני אישור ההזמנה.",
  },
  {
    title: "ביטולים, החזרות והחלפות",
    text: "ביטול עסקה, החלפה, החזרת מוצר והחזר כספי יטופלו בהתאם למדיניות המשלוחים, הביטולים וההחזרות ולכל דין. מוצרים מותאמים אישית או מוצרים שנעשה בהם שימוש עשויים להיות כפופים למגבלות לפי דין.",
  },
  {
    title: "אחריות",
    text: "האחריות, ככל שחלה, מוגבלת לפגמי ייצור למשך 12 חודשים ממועד קבלת המוצר, אלא אם צוין אחרת ובכפוף למדיניות האחריות. האחריות אינה מכסה בלאי טבעי, שימוש לא נכון, שבר, אובדן או חשיפה לחומרים.",
  },
  {
    title: "שימוש אסור באתר",
    text: "אין להשתמש באתר לצורך פעילות בלתי חוקית, פגיעה באבטחה, העתקה, כרייה, סריקה, שיבוש פעילות, התחזות, שליחת תוכן פוגעני או מסירת מידע כוזב.",
  },
  {
    title: "קניין רוחני",
    text: "כל זכויות הקניין הרוחני באתר, לרבות טקסטים, תמונות, עיצוב, סימנים, קוד ותוכן, שייכות ל-Elysia או לצדדים שלישיים שהרשו שימוש. אין להעתיק, להפיץ או לעשות שימוש מסחרי ללא הרשאה.",
  },
  {
    title: "פרטיות וקוקיז",
    text: "איסוף ושימוש במידע אישי, עוגיות, דיוור שיווקי, ספקי שירות וזכויות משתמשים מפורטים במדיניות הפרטיות. ניתן לנהל העדפות פרטיות דרך קישור ניהול ההעדפות באתר.",
  },
  {
    title: "הגבלת אחריות, בכפוף לדין",
    text: "האתר והשירותים ניתנים כפי שהם, בכפוף לדין. אין בתקנון כדי להגביל אחריות שאינה ניתנת להגבלה לפי דין, לרבות זכויות צרכניות מחייבות.",
  },
  {
    title: "שינויי תקנון",
    text: "העסק רשאי לעדכן את התקנון מעת לעת. הנוסח המחייב הוא הנוסח המפורסם באתר במועד השימוש או ההזמנה, בכפוף להוראות הדין.",
  },
  {
    title: "דין וסמכות שיפוט, בכפוף להוראות הדין",
    text: "על התקנון יחולו דיני מדינת ישראל, בכפוף לכל הוראת דין קוגנטית החלה על צרכנים. סמכות השיפוט תיקבע בהתאם להוראות הדין.",
  },
  {
    title: "יצירת קשר",
    text: "לשאלות לגבי הזמנה, ביטול, פרטיות, נגישות או שימוש באתר ניתן לפנות לשירות הלקוחות דרך עמוד השירות או בפרטי הקשר המופיעים באתר.",
  },
] as const;

export default async function TermsPage() {
  const contact = await getPublicContactSettings();

  return (
    <>
      <SiteHeader />

      <main>
        <CommercePageHero
          description="תנאי שימוש באתר Elysia: הזמנות, מחירים, תשלום, משלוחים, ביטולים, אחריות, פרטיות ושירות."
          eyebrow="תקנון ומדיניות"
          title="תקנון האתר"
          variant="content"
        />

        <RevealSection className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:py-14">
          <div className="brand-surface p-6 sm:p-8">
            <section aria-labelledby="terms-business-details">
              <div className="flex items-center gap-3">
                <ShieldCheck className="size-5" aria-hidden="true" />
                <h2
                  className="text-2xl font-semibold"
                  id="terms-business-details"
                >
                  פרטי העסק
                </h2>
              </div>
              <dl className="mt-5 grid gap-3 sm:grid-cols-2">
                {businessLegalPlaceholders.map((item) => (
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

            <nav
              aria-label="קישורי מדיניות קשורים"
              className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3"
            >
              {policyLinks
                .filter((item) => item.href !== "/terms")
                .map((item) => (
                  <Link
                    className="glass-inset hover:text-foreground rounded-md border p-3 text-sm font-medium transition"
                    href={item.href}
                    key={item.href}
                  >
                    {item.label}
                  </Link>
                ))}
            </nav>

            <Separator className="my-8" />

            <div className="grid gap-7">
              {termsSections.map((section, index) => {
                const sectionId = `terms-section-${index + 1}`;

                return (
                  <section aria-labelledby={sectionId} key={section.title}>
                    <div className="flex items-center gap-3">
                      <FileText className="size-5" aria-hidden="true" />
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

            <p className="text-muted-foreground leading-8">
              {termsSafetySentence}
            </p>

            <Separator className="my-8" />

            <section aria-labelledby="terms-contact">
              <h2 className="text-2xl font-semibold" id="terms-contact">
                שירות ופניות
              </h2>
              <p className="text-muted-foreground mt-3 leading-8">
                לשאלה על הזמנה, ביטול, פרטיות או שימוש באתר ניתן לפנות אלינו.
              </p>
              <Button asChild className="mt-5" variant="secondary">
                <Link
                  data-testid="terms-service-recovery-link"
                  href="/service?topic=order"
                >
                  פתיחת פנייה בנושא הזמנה
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
                עודכן לאחרונה: 7 ביוני 2026
              </p>
              <Button asChild>
                <Link href="/shipping-returns">
                  <PackageCheck aria-hidden="true" className="size-4" />
                  למדיניות משלוחים והחזרות
                </Link>
              </Button>
            </div>
          </div>
        </RevealSection>
      </main>
    </>
  );
}
