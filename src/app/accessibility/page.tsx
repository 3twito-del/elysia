import type { Metadata } from "next";
import Link from "next/link";
import { Mail, Phone, ShieldCheck } from "lucide-react";

import { CompactPageIntro } from "~/components/compact-page-intro";
import { RevealSection } from "~/components/reveal";
import { SiteHeader } from "~/components/site-header";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { publicContactEmail, publicContactPhone } from "~/lib/public-contact";

export const metadata: Metadata = {
  title: "הצהרת נגישות",
  description:
    "הצהרת הנגישות של Aphrodite, פירוט התאמות באתר ופרטי פנייה בנושא נגישות.",
};

export default function AccessibilityPage() {
  return (
    <main>
      <SiteHeader />

      <CompactPageIntro
        actions={
          <>
            <Button asChild>
              <Link href="#accessibility-standard">רמת נגישות</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="#accessibility-contact">פנייה בנושא נגישות</Link>
            </Button>
          </>
        }
        description="אנחנו פועלים להנגיש את האתר והשירותים הדיגיטליים כך שיהיו זמינים, ברורים ונוחים לשימוש."
        eyebrow="Aphrodite Accessibility"
        metrics={[
          { label: "תנועה", value: "ניתנת להפחתה" },
          { label: "טקסט", value: "ניתן להגדלה" },
          { label: "ניגודיות", value: "זמינה" },
        ]}
        title="הצהרת נגישות"
      />

      <RevealSection className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:py-14">
        <div className="glass-panel rounded-md border p-6 sm:p-8">
          <section aria-labelledby="accessibility-standard">
            <div className="flex items-center gap-3">
              <ShieldCheck className="size-5" aria-hidden="true" />
              <h2
                className="text-2xl font-semibold"
                id="accessibility-standard"
              >
                רמת הנגישות באתר
              </h2>
            </div>
            <p className="text-muted-foreground mt-4 leading-8">
              האתר נבנה במטרה לעמוד בדרישות תקנות שוויון זכויות לאנשים עם
              מוגבלות (התאמות נגישות לשירות), התשע&quot;ג-2013, ובהתאם לעקרונות
              תקן ישראלי 5568 המבוסס על הנחיות WCAG 2.0 ברמה AA ככל האפשר.
            </p>
            <p className="text-muted-foreground mt-4 leading-8">
              לצד זאת, נגישות מלאה מחייבת בדיקה מקצועית שוטפת. אם מצאתם רכיב,
              תוכן או תהליך שאינו נגיש, נשמח לקבל פרטים כדי לתקן אותו במהירות.
            </p>
          </section>

          <Separator className="my-8" />

          <section aria-labelledby="accessibility-tools">
            <h2 className="text-2xl font-semibold" id="accessibility-tools">
              התאמות זמינות באתר
            </h2>
            <ul className="text-muted-foreground mt-4 grid gap-3 leading-8">
              <li>כפתור נגישות קבוע לפתיחת תפריט התאמות מכל עמוד ציבורי.</li>
              <li>אפשרות להגדלת טקסט בשלוש רמות.</li>
              <li>מצב ניגודיות גבוהה לשיפור קריאות הטקסט והרכיבים.</li>
              <li>הדגשת קישורים בקו תחתון.</li>
              <li>הפחתת אנימציות ומעברי עמוד למשתמשים הרגישים לתנועה.</li>
              <li>
                שימוש בכותרות, כפתורים וקישורים סמנטיים התומכים בניווט מקלדת.
              </li>
            </ul>
          </section>

          <Separator className="my-8" />

          <section aria-labelledby="accessibility-contact">
            <h2 className="text-2xl font-semibold" id="accessibility-contact">
              פנייה בנושא נגישות
            </h2>
            <p className="text-muted-foreground mt-4 leading-8">
              בפנייה בנושא נגישות מומלץ לציין את כתובת העמוד, סוג הדפדפן, תיאור
              הבעיה והטכנולוגיה המסייעת שבה נעשה שימוש, אם ישנה.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
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
              ההצהרה עודכנה לאחרונה: 29 באפריל 2026.
            </p>
            <Button asChild>
              <Link href="/">חזרה לעמוד הבית</Link>
            </Button>
          </div>
        </div>
      </RevealSection>
    </main>
  );
}
