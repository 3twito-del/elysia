import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, Mail, Phone, ShieldCheck } from "lucide-react";

import { CommercePageHero } from "~/components/commerce-page-hero";
import { RevealSection } from "~/components/reveal";
import { SiteHeader } from "~/components/site-header";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { accessibilityPlaceholders } from "~/lib/legal-content";
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
    <>
      <SiteHeader />

      <main>
        <CommercePageHero
          description="האתר והשירות מיועדים להיות זמינים ונוחים לשימוש לכלל המשתמשים."
          eyebrow="נגישות"
          title="הצהרת נגישות"
          variant="content"
        />

        <RevealSection className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:py-14">
          <div className="brand-surface p-6 sm:p-8">
            <section aria-labelledby="accessibility-details">
              <div className="flex items-center gap-3">
                <ShieldCheck className="size-5" aria-hidden="true" />
                <h2 className="text-2xl font-semibold" id="accessibility-details">
                  פרטי נגישות נדרשים
                </h2>
              </div>
              <dl className="mt-5 grid gap-3 sm:grid-cols-2">
                {accessibilityPlaceholders.map((item) => (
                  <div
                    className="glass-inset rounded-md border p-4"
                    key={item.label}
                  >
                    <dt className="text-muted-foreground text-sm">
                      {item.label}
                    </dt>
                    <dd className="mt-1 font-medium">{item.value}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <Separator className="my-8" />

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
                האתר נבנה במטרה לעמוד בדרישות הנגישות החלות ובתקן ישראלי 5568,
                המבוסס על WCAG 2.0 ברמה AA ככל האפשר. נגישות דורשת בדיקה
                שוטפת, ולכן ייתכנו רכיבים שדורשים תיקון או התאמה נוספת.
              </p>
              <p className="text-muted-foreground mt-4 leading-8">
                אם מצאתם רכיב שאינו נגיש, ניתן לפנות אלינו עם תיאור הבעיה,
                כתובת העמוד, דפדפן וטכנולוגיה מסייעת שבה נעשה שימוש, אם קיימת.
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
                  הסתרה זמנית של כפתור הנגישות הצף, בלי להסיר את קישור
                  ההצהרה בפוטר.
                </li>
                <li>כותרות, כפתורים וקישורים סמנטיים לניווט מקלדת.</li>
              </ul>
            </section>

            <Separator className="my-8" />

            <section aria-labelledby="accessibility-limitations">
              <div className="flex items-center gap-3">
                <AlertTriangle className="size-5" aria-hidden="true" />
                <h2
                  className="text-2xl font-semibold"
                  id="accessibility-limitations"
                >
                  מגבלות ידועות
                </h2>
              </div>
              <p className="text-muted-foreground mt-4 leading-8">
                מגבלות ידועות: [להשלמה / לא ידועות]. אם קיימים קבצים, תמונות,
                סרטונים, רכיבי צד שלישי או תהליכי תשלום שאינם בשליטת האתר,
                ייתכן שהם ידרשו התאמה או חלופה נגישה.
              </p>
            </section>

            <Separator className="my-8" />

            <section aria-labelledby="accessibility-contact">
              <h2 className="text-2xl font-semibold" id="accessibility-contact">
                פנייה בנושא נגישות
              </h2>
              <p className="text-muted-foreground mt-4 leading-8">
                בפנייה בנושא נגישות יש לציין עמוד, דפדפן, תיאור בעיה
                וטכנולוגיה מסייעת, אם קיימת. זמן מענה משוער: [להשלמה].
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
                ההצהרה עודכנה לאחרונה: 7 ביוני 2026.
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
