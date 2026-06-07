import type { Metadata } from "next";
import Link from "next/link";
import { FileCheck2, ShieldCheck, Wrench } from "lucide-react";

import { CommercePageHero } from "~/components/commerce-page-hero";
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
    title: "תקופת האחריות",
    text: "האחריות היא ל-12 חודשים ממועד קבלת המוצר, לפגמי ייצור בלבד, כפי שכבר מצוין במידע השירות באתר. האחריות אינה מהווה ביטוח מפני אובדן, שבר, בלאי טבעי או שימוש שאינו בהתאם להנחיות.",
  },
  {
    title: "מה כלול באחריות",
    text: "האחריות עשויה לכסות פגם שמקורו בתהליך הייצור או בהרכבה, לאחר בדיקת השירות ובכפוף לדין. כל בקשה נבדקת לפי פרטי ההזמנה, מצב המוצר והתמונות שיימסרו.",
  },
  {
    title: "מה לא כלול באחריות",
    text: "האחריות אינה מכסה בלאי טבעי, שינוי גוון רגיל, שבר, אובדן, שימוש לא נכון, חשיפה למים, בושם, כלור, אלכוהול, קרמים או חומרי ניקוי, ענידה בשינה או בספורט, תיקון אצל צד שלישי, נזק מכני או פגיעה שנגרמה לאחר קבלת המוצר.",
  },
  {
    title: "פתיחת בקשת אחריות",
    text: "לבדיקת אחריות יש לצרף מספר הזמנה, תמונות ברורות של המוצר ותיאור קצר של התקלה, כולל מתי זוהתה והאם נעשה שימוש במוצר.",
  },
  {
    title: "דרכי טיפול אפשריות",
    text: "לאחר בדיקה, הפתרון עשוי להיות תיקון, החלפה, זיכוי או החזר, בהתאם לדין, למצב המוצר ולשיקול דעת העסק. אין התחייבות לסוג פתרון מסוים לפני בדיקת המוצר והפרטים.",
  },
] as const;

export default function WarrantyPage() {
  return (
    <>
      <SiteHeader />

      <main>
        <CommercePageHero
          description="אחריות ל-12 חודשים לפגמי ייצור בלבד, בכפוף לבדיקה, למדיניות האתר ולכל דין."
          eyebrow="שירות לאחר קנייה"
          title="אחריות"
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
