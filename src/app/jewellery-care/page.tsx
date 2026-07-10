import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  Circle,
  Droplets,
  Gem,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

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
    title: "כסף 925",
    text: "כל תכשיטי Elysia מבוססים על כסף 925. יש להימנע ממים, בושם, קרמים, אלכוהול, כלור וחומרי ניקוי, ולאחסן במקום יבש ונפרד ככל האפשר כדי לצמצם שריטות, קשרים, לחות ושינויי גוון. מומלץ להשתמש בקופסה או בשקית בד נקייה.",
  },
  {
    title: "ציפוי זהב ורוז גולד",
    text: "בתכשיטים עם ציפוי זהב או רוז גולד על כסף 925 ייתכן שינוי גוון או שחיקה של הציפוי לאורך זמן, בהתאם לאופן השימוש, חומציות העור, חשיפה למים, חומרים, זיעה וחיכוך. מומלץ להסיר לפני מקלחת, ים, בריכה, שינה ופעילות ספורטיבית.",
  },
  {
    title: "פנינים וזירקון",
    text: "פנינים הן חומר אורגני ורגיש במיוחד לבושם, קרמים, אלכוהול וחומרי ניקוי; מומלץ לענוד אותן אחרונות, לאחר שהעור יבש. אבני זירקון עלולות להישרט או להישבר ממכה, מתיחה או חיכוך, ולכן כדאי להסיר את התכשיט לפני פעילות מאומצת.",
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

const careSectionIcons = [Circle, Sparkles, Gem, AlertTriangle, ShieldCheck];

export default function JewelleryCarePage() {
  return (
    <ContentPageShell
      description="הנחיות שימוש, אחסון וניקוי שמסייעות לשמור על התכשיט ולהקטין חשיפה לנזק או רגישות."
      eyebrow="שירות"
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
        iconFor={(index) => careSectionIcons[index] ?? ShieldCheck}
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
