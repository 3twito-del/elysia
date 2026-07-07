import type { Metadata } from "next";
import Link from "next/link";
import { FileCheck2, ShieldCheck, Wrench } from "lucide-react";

import { ContentPageShell } from "~/components/content-page-shell";
import { LegalCookiePreferencesCallout } from "~/components/legal-cookie-preferences-callout";
import { LegalHighlightCards } from "~/components/legal-highlight-cards";
import { LegalSectionList } from "~/components/legal-section-list";
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
    text: "אם מתגלה פגם שנראה קשור לייצור או להרכבה, נבדוק את הפריט לפי מספר ההזמנה, מצב התכשיט והתמונות שיצורפו לפנייה.",
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
    <ContentPageShell
      description="מדיניות האחריות של Elysia: 12 חודשים לפגמי ייצור, עם בדיקה לפי פרטי ההזמנה."
      eyebrow="שירות"
      title="מדיניות אחריות"
    >
      <LegalHighlightCards
        items={[
          { icon: ShieldCheck, label: "12 חודשים ממועד הקבלה" },
          { icon: Wrench, label: "פגמי ייצור בלבד" },
          { icon: FileCheck2, label: "בדיקה לפי פרטי ההזמנה" },
        ]}
      />

      <Separator className="my-8" />

      <LegalCookiePreferencesCallout testId="warranty-cookie-preferences-callout" />

      <Separator className="my-8" />

      <LegalSectionList
        icon={ShieldCheck}
        idPrefix="warranty-section"
        sections={warrantySections}
      />

      <Separator className="my-8" />

      <p className="text-muted-foreground leading-8">{legalSafetySentence}</p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button asChild>
          <Link href="/service?topic=repair">פתיחת בקשת אחריות</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/jewellery-care">הנחיות טיפול בתכשיטים</Link>
        </Button>
      </div>
    </ContentPageShell>
  );
}
