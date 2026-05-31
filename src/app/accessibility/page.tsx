import type { Metadata } from "next";
import Link from "next/link";
import { Mail, Phone, ShieldCheck } from "lucide-react";

import { CommercePageHero } from "~/components/commerce-page-hero";
import { RevealSection } from "~/components/reveal";
import { SiteHeader } from "~/components/site-header";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { getPublicContactSettings } from "~/server/services/service";

export const metadata: Metadata = {
  title: "הצהרת נגישות",
  description:
    "הצהרת הנגישות של Elysia, פירוט התאמות באתר ופרטי פנייה בנושא נגישות.",
};

export const dynamic = "force-dynamic";

export default async function AccessibilityPage() {
  const contact = await getPublicContactSettings();

  return (
    <main>
      <SiteHeader />

      <CommercePageHero
        description="אנחנו פועלים להנגיש את האתר והשירות כך שיהיו זמינים, ברורים ונוחים לשימוש."
        eyebrow="נגישות"
        title="הצהרת נגישות"
        variant="content"
      />

      <RevealSection className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:py-14">
        <div className="brand-surface p-6 sm:p-8">
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
              מוגבלות (התאמות נגישות לשירות), התשע&quot;ג-2013, ובהתאם למידע
              ושירות תקן ישראלי 5568 המבוסס על הנחיות WCAG 2.0 ברמה AA ככל
              האפשר.
            </p>
            <p className="text-muted-foreground mt-4 leading-8">
              לצד זאת, נגישות מלאה מחייבת בחינה מקצועית שוטפת. אם מצאתם רכיב,
              תוכן או תהליך שאינו נגיש, נשמח לקבל פרטים כדי לתקן אותו במהירות.
            </p>
          </section>

          <Separator className="my-8" />

          <section aria-labelledby="accessibility-tools">
            <h2 className="text-2xl font-semibold" id="accessibility-tools">
              התאמות נגישות באתר
            </h2>
            <ul className="text-muted-foreground mt-4 grid gap-3 leading-8">
              <li>כפתור נגישות קבוע לפתיחת תפריט התאמות מכל עמוד ציבורי.</li>
              <li>אפשרות להגדלת טקסט בשלוש רמות.</li>
              <li>מצב ניגודיות גבוהה לשיפור קריאות הטקסט והרכיבים.</li>
              <li>הדגשת קישורים בקו תחתון.</li>
              <li>הפחתת אנימציות ומעברי עמוד למשתמשים הרגישים לתנועה.</li>
              <li>
                אפשרות להסתרה זמנית של כפתור הנגישות הצף בעמוד הנוכחי, בלי להסיר
                את קישור הצהרת הנגישות הקבוע בפוטר.
              </li>
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
            <Button asChild className="mt-5" variant="secondary">
              <Link
                data-testid="accessibility-service-recovery-link"
                href="/service?topic=accessibility-privacy"
              >
                פתיחת פנייה בנושא נגישות
              </Link>
            </Button>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
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
