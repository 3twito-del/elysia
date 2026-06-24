import type { Metadata } from "next";
import Link from "next/link";
import { FileCheck2, ShieldCheck, Wrench } from "lucide-react";

import { CompactPageIntro } from "~/components/compact-page-intro";
import { LegalCookiePreferencesCallout } from "~/components/legal-cookie-preferences-callout";
import { RevealSection } from "~/components/reveal";
import { SiteHeader } from "~/components/site-header";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { legalSafetySentence } from "~/lib/legal-content";

export const metadata: Metadata = {
  title: "אחריות",
  description:
    "מדיניות האחריות של Elysia לתכשיטים, כולל כיסוי לפגמי ייצור, החרגות ואופן פתיחת בקשת שירות.",
  alternates: {
    canonical: "/warranty",
  },
};

const warrantySections = [
  {
    title: "כמה זמן האחריות?",
    text: "כל תכשיט Elysia מגיע עם אחריות ל-12 חודשים ממועד הקבלה, לפגמי ייצור בלבד.",
  },
  {
    title: "מה כלול?",
    text: "אם מתגלה פגם שנראה קשור לייצור או להרכבה, נבדוק את הפריט לפי מספר ההזמנה, מצב התכשיט והתמונות שתשלחו.",
  },
  {
    title: "מה לא נחשב אחריות?",
    text: "בלאי טבעי, שינוי גוון רגיל, שבר, אובדן, חשיפה למים, בושם, כלור, חומרי ניקוי, שימוש בספורט או תיקון אצל צד שלישי אינם מכוסים.",
  },
  {
    title: "איך פותחים בקשה?",
    text: "פותחים פנייה קצרה לשירות עם מספר הזמנה, תמונות ברורות ותיאור של מה שקרה. נחזור עד יום עסקים עם המשך טיפול.",
  },
  {
    title: "מה יכול להיות הפתרון?",
    text: "לאחר בדיקה נציע תיקון, החלפה, זיכוי או פתרון אחר שמתאים למצב הפריט ולמדיניות האתר.",
  },
] as const;

export default function WarrantyPage() {
  return (
    <>
      <SiteHeader />

      <main className="elysia-page">
        <CompactPageIntro
          description="אחריות קצרה וברורה: 12 חודשים לפגמי ייצור, בדיקה לפי פרטי ההזמנה, והמשך טיפול בלי ניסוחים מיותרים."
          eyebrow="אחרי הקנייה"
          title="אחריות Elysia"
          variant="content"
        />

        <RevealSection className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:py-14">
          <div className="brand-surface p-6 sm:p-8">
            <div className="grid gap-6 sm:grid-cols-3">
              <div className="glass-inset rounded-md border p-4">
                <ShieldCheck className="size-5" aria-hidden="true" />
                <p className="mt-3 font-medium">12 חודשים ממועד הקבלה</p>
              </div>
              <div className="glass-inset rounded-md border p-4">
                <Wrench className="size-5" aria-hidden="true" />
                <p className="mt-3 font-medium">פגמי ייצור בלבד</p>
              </div>
              <div className="glass-inset rounded-md border p-4">
                <FileCheck2 className="size-5" aria-hidden="true" />
                <p className="mt-3 font-medium">בדיקה לפי פרטי ההזמנה</p>
              </div>
            </div>

            <Separator className="my-8" />

            <LegalCookiePreferencesCallout testId="warranty-cookie-preferences-callout" />

            <Separator className="my-8" />

            <div className="grid gap-7">
              {warrantySections.map((section, index) => {
                const sectionId = `warranty-section-${index + 1}`;

                return (
                  <section aria-labelledby={sectionId} key={section.title}>
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="size-5" aria-hidden="true" />
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
              {legalSafetySentence}
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button asChild>
                <Link href="/service?topic=repair">פתיחת בקשת אחריות</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/jewellery-care">הנחיות טיפול בתכשיטים</Link>
              </Button>
            </div>
          </div>
        </RevealSection>
      </main>
    </>
  );
}
