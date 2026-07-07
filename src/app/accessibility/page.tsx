import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, ShieldCheck } from "lucide-react";

import { ContentPageShell } from "~/components/content-page-shell";
import { LegalContactSection } from "~/components/legal-contact-section";
import { LegalCookiePreferencesCallout } from "~/components/legal-cookie-preferences-callout";
import { LegalPlaceholderGrid } from "~/components/legal-placeholder-grid";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import {
  accessibilityPlaceholders,
  legalLastUpdated,
} from "~/lib/legal-content";
import { getPublicContactSettings } from "~/server/services/service";

export const metadata: Metadata = {
  title: "הצהרת נגישות",
  description:
    "הצהרת נגישות של Elysia: התאמות באתר, רכז/ת נגישות, דרכי פנייה, מגבלות ידועות וזמן מענה.",
  alternates: {
    canonical: "/accessibility",
  },
};

export const dynamic = "force-dynamic";

export default async function AccessibilityPage() {
  const contact = await getPublicContactSettings();

  return (
    <ContentPageShell
      description="האתר והשירות מיועדים להיות זמינים ונוחים לשימוש לכלל המשתמשים."
      eyebrow="נגישות"
      title="הצהרת נגישות"
    >
      <section aria-labelledby="accessibility-details">
        <div className="flex items-center gap-3">
          <ShieldCheck className="size-5" aria-hidden="true" />
          <h2 className="text-2xl font-semibold" id="accessibility-details">
            פרטי נגישות נדרשים
          </h2>
        </div>
        <LegalPlaceholderGrid items={accessibilityPlaceholders} />
      </section>

      <Separator className="my-8" />

      <LegalCookiePreferencesCallout testId="accessibility-cookie-preferences-callout" />

      <Separator className="my-8" />

      <section aria-labelledby="accessibility-standard">
        <div className="flex items-center gap-3">
          <ShieldCheck className="size-5" aria-hidden="true" />
          <h2 className="text-2xl font-semibold" id="accessibility-standard">
            רמת הנגישות באתר
          </h2>
        </div>
        <p className="text-muted-foreground mt-4 leading-8">
          האתר נבנה במטרה לעמוד בדרישות הנגישות החלות ובתקן ישראלי 5568, המבוסס
          על WCAG 2.0 ברמה AA ככל האפשר. נגישות דורשת בדיקה שוטפת, ולכן ייתכנו
          רכיבים שדורשים תיקון או התאמה נוספת.
        </p>
        <p className="text-muted-foreground mt-4 leading-8">
          אם מצאתם רכיב שאינו נגיש, ניתן לפנות אלינו עם תיאור הבעיה, כתובת
          העמוד, דפדפן וטכנולוגיה מסייעת שבה נעשה שימוש, אם קיימת.
        </p>
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
          <li>
            הסתרה זמנית של כפתור הנגישות הצף, בלי להסיר את קישור ההצהרה בפוטר.
          </li>
          <li>כותרות, כפתורים וקישורים סמנטיים לניווט מקלדת.</li>
        </ul>
      </section>

      <Separator className="my-8" />

      <section aria-labelledby="accessibility-limitations">
        <div className="flex items-center gap-3">
          <AlertTriangle className="size-5" aria-hidden="true" />
          <h2 className="text-2xl font-semibold" id="accessibility-limitations">
            מגבלות ידועות
          </h2>
        </div>
        <p className="text-muted-foreground mt-4 leading-8">
          מגבלות ידועות: [להשלמה / לא ידועות]. אם קיימים קבצים, תמונות, סרטונים,
          רכיבי צד שלישי או תהליכי תשלום שאינם בשליטת האתר, ייתכן שהם ידרשו
          התאמה או חלופה נגישה.
        </p>
      </section>

      <Separator className="my-8" />

      <LegalContactSection
        action={{
          href: "/service?topic=accessibility-privacy",
          label: "פתיחת פנייה בנושא נגישות",
          testId: "accessibility-service-recovery-link",
        }}
        contact={contact}
        description="בפנייה בנושא נגישות יש לציין עמוד, דפדפן, תיאור בעיה וטכנולוגיה מסייעת, אם קיימת. זמן מענה משוער: [להשלמה]."
        id="accessibility-contact"
        title="פנייה בנושא נגישות"
      />

      <Separator className="my-8" />

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <p className="text-muted-foreground text-sm">
          ההצהרה עודכנה לאחרונה: {legalLastUpdated.accessibility}.
        </p>
        <Button asChild>
          <Link href="/">חזרה לעמוד הבית</Link>
        </Button>
      </div>
    </ContentPageShell>
  );
}
