import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, Droplets, ShieldCheck, Sparkles } from "lucide-react";

import { CompactPageIntro } from "~/components/compact-page-intro";
import { LegalCookiePreferencesCallout } from "~/components/legal-cookie-preferences-callout";
import { RevealSection } from "~/components/reveal";
import { SiteHeader } from "~/components/site-header";
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
    <>
      <SiteHeader />

      <main>
        <CompactPageIntro
          description="הנחיות שימוש, אחסון וניקוי שמסייעות לשמור על התכשיט ולהקטין חשיפה לנזק או רגישות."
          eyebrow="אחרי הקנייה"
          title="טיפול בתכשיטים"
          variant="content"
        />

        <RevealSection className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:py-14">
          <div className="brand-surface p-6 sm:p-8">
            <div className="grid gap-6 sm:grid-cols-3">
              <div className="glass-inset rounded-md border p-4">
                <Droplets className="size-5" aria-hidden="true" />
                <p className="mt-3 font-medium">להסיר לפני מים ולחות</p>
              </div>
              <div className="glass-inset rounded-md border p-4">
                <Sparkles className="size-5" aria-hidden="true" />
                <p className="mt-3 font-medium">לאחסן במקום יבש</p>
              </div>
              <div className="glass-inset rounded-md border p-4">
                <AlertTriangle className="size-5" aria-hidden="true" />
                <p className="mt-3 font-medium">להפסיק שימוש במקרה גירוי</p>
              </div>
            </div>

            <Separator className="my-8" />

            <LegalCookiePreferencesCallout testId="jewellery-care-cookie-preferences-callout" />

            <Separator className="my-8" />

            <div className="grid gap-7">
              {careSections.map((section, index) => {
                const sectionId = `care-section-${index + 1}`;

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

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild>
                <Link href="/warranty">מדיניות אחריות</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/service?topic=repair">שאלה על טיפול או תיקון</Link>
              </Button>
            </div>
          </div>
        </RevealSection>
      </main>
    </>
  );
}
