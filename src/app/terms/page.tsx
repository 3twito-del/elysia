import type { Metadata } from "next";
import Link from "next/link";
import {
  FileText,
  Mail,
  PackageCheck,
  Phone,
  RotateCcw,
  ShieldCheck,
  Truck,
} from "lucide-react";

import { RevealSection } from "~/components/reveal";
import { SiteHeader } from "~/components/site-header";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import {
  publicBusinessAddress,
  publicBusinessId,
  publicBusinessName,
  publicContactEmail,
  publicContactPhone,
} from "~/lib/public-contact";

export const metadata: Metadata = {
  title: "תקנון האתר",
  description:
    "תקנון ותנאי שימוש באתר Aphrodite, לרבות שימוש באתר, הזמנות, תשלום, משלוחים, ביטולים ושירות לקוחות.",
};

const termsSections = [
  {
    title: "פרטי העסק וגילוי לצרכן",
    text: `${publicBusinessName} היא הגורם המפעיל את האתר. מספר עוסק/חברה: ${publicBusinessId}. כתובת למסירת הודעות: ${publicBusinessAddress}. פרטי קשר לבירורים, ביטולים ושירות לקוחות: ${publicContactEmail}, ${publicContactPhone}. לפני שליחת הזמנה יוצגו שם המוצר, מאפייניו העיקריים, מחירו בש״ח, דמי משלוח אם קיימים, סניף מלאי, אמצעי מסירה ופרטי הלקוח כפי שנמסרו.`,
  },
  {
    title: "שימוש באתר",
    text: "השימוש באתר כפוף לתקנון זה, למדיניות הפרטיות ולכל דין. האתר מיועד להצגת קטלוג תכשיטים, בדיקת זמינות, קבלת ייעוץ, ביצוע הזמנה ותיאום שירות בסניפים.",
  },
  {
    title: "מידע, מלאי ומחירים",
    text: "אנו עושים מאמץ להציג מידע מדויק על מוצרים, מחירים, תמונות ומלאי. ייתכנו שינויי מלאי, טעויות הקלדה או פערי צבע ותצוגה בין מסכים. במקרה של טעות מהותית, נפעל לעדכן את הלקוח ולהציע תיקון, חלופה או ביטול בהתאם לדין.",
  },
  {
    title: "הזמנות ותשלום",
    text: "הזמנה תושלם רק לאחר קבלת כל הפרטים הנדרשים ואישור התשלום או אמצעי ההזמנה. תשלום מתבצע באמצעות ספקי סליקה ושירותים חיצוניים מאובטחים, בהתאם לתנאים שלהם.",
  },
  {
    title: "משלוחים ואיסוף מסניף",
    text: "זמני אספקה, אפשרויות משלוח ואיסוף מסניף יוצגו בתהליך ההזמנה או יימסרו על ידי שירות הלקוחות. איחורים הנובעים מגורמים חיצוניים יטופלו מול הלקוח בהקדם האפשרי.",
  },
  {
    title: "ביטול עסקה והחזרות",
    text: "ביטול עסקה, החלפה או החזרה יתבצעו בהתאם לחוק הגנת הצרכן, תקנותיו ומדיניות החנות כפי שתימסר במועד הרכישה. בהזמנה באתר ניתן למסור הודעת ביטול בטלפון, בדוא״ל או בכל אמצעי מקוון שפורסם באתר. ככלל, בעסקת מכר מרחוק ניתן לבטל בתוך 14 ימים ממועד קבלת המוצר או מסמך הגילוי, לפי המאוחר, בכפוף לחריגים ולמועדים מיוחדים הקבועים בדין. בעת ביטול שאינו בשל פגם, אי התאמה או אי אספקה במועד, ייתכן חיוב בדמי ביטול בשיעור 5% ממחיר העסקה או 100 ש״ח, לפי הנמוך. מוצרים שיוצרו או הותאמו במיוחד, מוצרים שנעשה בהם שימוש או מוצרים שנפגמו עשויים להיות כפופים למגבלות החזרה לפי דין. ברכישה בסניף יחולו גם כללי ביטול עסקה פרונטלית, לרבות ההוראות הייחודיות לתכשיטים.",
  },
  {
    title: "אישור תקנון ומדיניות פרטיות",
    text: "שליחת בקשת הזמנה, תיאום פגישה או שימוש בכלי AI באתר מהווים אישור כי קראת את התקנון ואת מדיניות הפרטיות הרלוונטיים לאותה פעולה. אם אינך מסכים לתנאים, אין להשלים את הפעולה באתר ויש לפנות לשירות הלקוחות לקבלת חלופה.",
  },
  {
    title: "ייעוץ AI ותוכן באתר",
    text: "המלצות סטייליסט AI ותוכן מדריכי באתר נועדו לסיוע כללי בלבד. בחירה סופית של מוצר, מידה, התאמה, תקציב או שימוש נעשית באחריות המשתמש, ורצוי לאמת פרטים חשובים מול נציג שירות או בסניף.",
  },
  {
    title: "קניין רוחני ושימוש אסור",
    text: "כל זכויות הקניין הרוחני באתר, לרבות טקסטים, עיצוב, תמונות, סימנים מסחריים וקוד, שייכות ל-Aphrodite או לצדדים שלישיים שהרשו שימוש. אין להעתיק, להפיץ, לסרוק, לבצע שימוש מסחרי בלתי מורשה או לפגוע בפעילות האתר.",
  },
  {
    title: "שינויים בתקנון",
    text: "Aphrodite רשאית לעדכן את התקנון מעת לעת. נוסח התקנון המחייב הוא הנוסח המפורסם באתר במועד השימוש או ההזמנה, בכפוף להוראות הדין.",
  },
];

export default function TermsPage() {
  return (
    <main>
      <SiteHeader />

      <RevealSection className="editorial-band signature-grid border-b border-[var(--glass-border)]">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:py-16">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Aphrodite</p>
              <h1 className="editorial-title mt-3 text-4xl font-semibold tracking-normal sm:text-5xl">
                תקנון האתר
              </h1>
              <p className="text-muted-foreground mt-4 max-w-3xl leading-8">
                התקנון מסדיר את השימוש באתר, בקטלוג, בהזמנות ובשירותים
                הדיגיטליים של Aphrodite. הוא אינו גורע מזכויות המוקנות לכם לפי
                דין.
              </p>
            </div>
            <div className="atelier-panel w-fit p-4">
              <FileText className="size-8" aria-hidden="true" />
            </div>
          </div>
        </div>
      </RevealSection>

      <RevealSection className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:py-14">
        <div className="atelier-panel p-6 sm:p-8">
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="border-y border-[var(--glass-border)] py-4">
              <ShieldCheck className="size-5" aria-hidden="true" />
              <p className="mt-3 font-medium">שימוש הוגן וברור</p>
            </div>
            <div className="border-y border-[var(--glass-border)] py-4">
              <Truck className="size-5" aria-hidden="true" />
              <p className="mt-3 font-medium">משלוח ואיסוף מסניף</p>
            </div>
            <div className="border-y border-[var(--glass-border)] py-4">
              <RotateCcw className="size-5" aria-hidden="true" />
              <p className="mt-3 font-medium">ביטולים לפי דין</p>
            </div>
          </div>

          <Separator className="my-8" />

          <div className="grid gap-7">
            {termsSections.map((section, index) => {
              const sectionId = `terms-section-${index + 1}`;

              return (
                <section aria-labelledby={sectionId} key={section.title}>
                  <div className="flex items-center gap-3">
                    <PackageCheck className="size-5" aria-hidden="true" />
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

          <section aria-labelledby="terms-contact">
            <h2 className="text-2xl font-semibold" id="terms-contact">
              שירות לקוחות ופניות
            </h2>
            <p className="text-muted-foreground mt-3 leading-8">
              לכל שאלה לגבי הזמנה, ביטול, פרטיות או שימוש באתר ניתן לפנות אלינו
              בפרטים הבאים.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <a
                className="atelier-panel hover:text-foreground flex items-center gap-3 p-4 transition"
                href={`mailto:${publicContactEmail}`}
              >
                <Mail className="size-5" aria-hidden="true" />
                <span>{publicContactEmail}</span>
              </a>
              <a
                className="atelier-panel hover:text-foreground flex items-center gap-3 p-4 transition"
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
              עודכן לאחרונה: 7 במאי 2026.
            </p>
            <Button asChild>
              <Link href="/privacy">למדיניות הפרטיות</Link>
            </Button>
          </div>
        </div>
      </RevealSection>
    </main>
  );
}
