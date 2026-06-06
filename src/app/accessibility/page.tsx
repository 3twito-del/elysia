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
    "הצהרת נגישות של Elysia: התאמות באתר ופרטי פנייה.",
};

export const dynamic = "force-dynamic";

export default async function AccessibilityPage() {
  const contact = await getPublicContactSettings();

  return (
    <>
      <SiteHeader />

      <main>
        <CommercePageHero
          description="האתר והשירות מיועדים להיות זמינים, ברורים ונוחים לשימוש."
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
            <p className="text-muted-foreground mt-4 leading-8">האתר נבנה בהתאם לתקנות הנגישות ולתקן ישראלי 5568, המבוסס על WCAG 2.0 ברמה AA ככל האפשר.</p>
            <p className="text-muted-foreground mt-4 leading-8">נגישות דורשת בדיקה שוטפת. אם מצאתם רכיב לא נגיש, ניתן לפנות אלינו עם הפרטים.</p>
          </section>

          <Separator className="my-8" />

          <section aria-labelledby="accessibility-tools">
            <h2 className="text-2xl font-semibold" id="accessibility-tools">
              התאמות נגישות באתר
            </h2>
            <ul className="text-muted-foreground mt-4 grid gap-3 leading-8">
              <li>כפתור נגישות קבוע לפתיחת התאמות מכל עמוד ציבורי.</li>
              <li>הגדלת טקסט בשלוש רמות.</li>
              <li>מצב ניגודיות גבוהה לשיפור קריאות הטקסט והרכיבים.</li>
              <li>הדגשת קישורים בקו תחתון.</li>
              <li>הפחתת אנימציות ומעברים.</li>
              <li>הסתרה זמנית של כפתור הנגישות הצף, בלי להסיר את קישור ההצהרה בפוטר.</li>
              <li>כותרות, כפתורים וקישורים סמנטיים לניווט מקלדת.</li>
            </ul>
          </section>

          <Separator className="my-8" />

          <section aria-labelledby="accessibility-contact">
            <h2 className="text-2xl font-semibold" id="accessibility-contact">
              פנייה בנושא נגישות
            </h2>
            <p className="text-muted-foreground mt-4 leading-8">בפנייה בנושא נגישות יש לציין עמוד, דפדפן, תיאור בעיה וטכנולוגיה מסייעת, אם קיימת.</p>
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
    </>
  );
}
