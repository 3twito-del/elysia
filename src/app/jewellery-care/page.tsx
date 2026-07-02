import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, Droplets, ShieldCheck, Sparkles } from "lucide-react";

import { ContentPageShell } from "~/components/content-page-shell";
import { LegalCookiePreferencesCallout } from "~/components/legal-cookie-preferences-callout";
import { LegalHighlightCards } from "~/components/legal-highlight-cards";
import { LegalSectionList } from "~/components/legal-section-list";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";

export const metadata: Metadata = {
  title: "טיפול בתכשיטים",
  description:
    "הנחיות טיפול ושימוש בתכשיטי Elysia: מים, בושם, אחסון, ציפוי, רגישות ושמירה על התכשיט לאורך זמן.",
  alternates: {
    canonical: "/jewellery-care",
  },
};

const careSections = [
  {
    title: "לפני מים, שינה וספורט",
    text: "מומלץ להסיר את התכשיט לפני מקלחת, ים, בריכה, שינה, פעילות ספורטיבית או כל פעילות שבה התכשיט עלול להימתח, להישרט, להישבר או להיחשף ללחות ממושכת.",
  },
  {
    title: "חומרים שיש להימנע מהם",
    text: "יש להימנע ממגע עם בושם, קרמים, אלכוהול, כלור, חומרי ניקוי וחומרים כימיים אחרים. מומלץ לענוד את התכשיט רק לאחר שהעור יבש והחומרים נספגו.",
  },
  {
    title: "אחסון",
    text: "יש לאחסן את התכשיטים במקום יבש, בנפרד ככל האפשר, כדי לצמצם שריטות, קשרים, לחות ושינויי גוון. מומלץ להשתמש בקופסה או בשקית בד נקייה.",
  },
  {
    title: "תכשיטים מצופים",
    text: "בתכשיטים מצופים ייתכן שינוי גוון או שחיקה של הציפוי לאורך זמן, בהתאם לאופן השימוש, חומציות העור, חשיפה למים, חומרים, זיעה וחיכוך.",
  },
  {
    title: "רגישות וגירוי",
    text: "במקרה של גירוי, אדמומיות או אי נוחות, יש להפסיק את השימוש בתכשיט ולפנות לגורם רפואי במידת הצורך. אין לראות במוצר כהיפואלרגני אלא אם הדבר צוין במפורש במפרט המוצר.",
  },
  {
    title: "חלקים קטנים",
    text: "אם התכשיט כולל חלקים קטנים, יש להרחיקו מילדים קטנים ולשמור אותו במקום שאינו נגיש להם.",
  },
] as const;

export default function JewelleryCarePage() {
  return (
    <ContentPageShell
      description="הנחיות שימוש, אחסון וניקוי שמסייעות לשמור על התכשיט ולהקטין חשיפה לנזק או רגישות."
      eyebrow="אחרי הקנייה"
      title="טיפול בתכשיטים"
    >
      <LegalHighlightCards
        items={[
          { icon: Droplets, label: "להסיר לפני מים ולחות" },
          { icon: Sparkles, label: "לאחסן במקום יבש" },
          { icon: AlertTriangle, label: "להפסיק שימוש במקרה גירוי" },
        ]}
      />

      <Separator className="my-8" />

      <LegalCookiePreferencesCallout testId="jewellery-care-cookie-preferences-callout" />

      <Separator className="my-8" />

      <LegalSectionList
        icon={ShieldCheck}
        idPrefix="care-section"
        sections={careSections}
      />

      <Separator className="my-8" />

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild>
          <Link href="/warranty">מדיניות אחריות</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/service?topic=repair">שאלה על טיפול או תיקון</Link>
        </Button>
      </div>
    </ContentPageShell>
  );
}
