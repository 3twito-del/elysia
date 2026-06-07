import type { Metadata } from "next";
import Link from "next/link";
import {
  Mail,
  PackageCheck,
  Phone,
  RotateCcw,
  ShieldCheck,
  Truck,
} from "lucide-react";

import { CommercePageHero } from "~/components/commerce-page-hero";
import { RevealSection } from "~/components/reveal";
import { SiteHeader } from "~/components/site-header";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { getPublicContactSettings } from "~/server/services/service";

export const metadata: Metadata = {
  title: "תקנון",
  description:
    "תקנון ותנאי שימוש באתר Elysia: הזמנות, תשלום, מסירה, ביטולים ושירות.",
};

export const dynamic = "force-dynamic";

const termsSections = [
  {
    title: "שימוש באתר",
    text: "השימוש באתר כפוף לתקנון, למדיניות הפרטיות ולדין. האתר מציג תכשיטים, התאמה, ייעוץ והזמנה.",
  },
  {
    title: "פרטים, התאמה ומחירים",
    text: "האתר מציג מידע על תכשיטים, מחירים, תמונות והתאמה. ייתכנו טעויות או פערי צבע בין מסכים. במקרה של טעות מהותית נפעל לתיקון, חלופה או ביטול לפי דין.",
  },
  {
    title: "הזמנות ותשלום",
    text: "הזמנה תושלם לאחר קבלת הפרטים ואישור התשלום או אמצעי ההזמנה. התשלום מתבצע דרך שירותי תשלום מאובטחים.",
  },
  {
    title: "מסירה",
    text: "מועדי ואפשרויות מסירה יוצגו בתהליך ההזמנה או דרך השירות. ההזמנות מתקבלות באתר בלבד.",
  },
  {
    title: "ביטול עסקה והחזרות",
    text: "ביטול עסקה, החלפה או החזרה יתבצעו בהתאם לחוק הגנת הצרכן, תקנותיו ומדיניות Elysia כפי שתימסר במועד ההזמנה. תכשיטים שיוצרו או הותאמו במיוחד, תכשיטים שנעשה בהם שימוש או תכשיטים שנפגמו עשויים להיות כפופים למגבלות החזרה לפי דין.",
  },
  {
    title: "ייעוץ ותוכן באתר",
    text: "המלצות כלי ההתאמה והמדריכים הן סיוע כללי בלבד. בחירה סופית של תכשיט, מידה, התאמה, מחיר או שימוש היא באחריות המשתמש.",
  },
  {
    title: "קניין רוחני ושימוש אסור",
    text: "כל זכויות הקניין הרוחני באתר, לרבות טקסטים, עיצוב, תמונות, סימנים רשומים וקוד, שייכות ל-Elysia או לצדדים שלישיים שהרשו שימוש. אין להעתיק, להפיץ, לסרוק, לבצע שימוש עסקי בלתי מורשה או לפגוע בפעילות האתר.",
  },
  {
    title: "שינויים בתקנון",
    text: "Elysia רשאית לעדכן את התקנון. הנוסח המחייב הוא הנוסח באתר במועד השימוש או ההזמנה, בכפוף לדין.",
  },
];

export default async function TermsPage() {
  const contact = await getPublicContactSettings();

  return (
    <>
      <SiteHeader />

      <main>
        <CommercePageHero
          description="תנאי השימוש באתר Elysia: הזמנות, תשלום, מסירה, ביטולים ושירות."
          eyebrow="תקנון ומדיניות"
          title="תקנון"
          variant="content"
        />

      <RevealSection className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:py-14">
        <div className="brand-surface p-6 sm:p-8">
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="glass-inset rounded-md border p-4">
              <ShieldCheck className="size-5" aria-hidden="true" />
              <p className="mt-3 font-medium">שימוש הוגן ומובן</p>
            </div>
            <div className="glass-inset rounded-md border p-4">
              <Truck className="size-5" aria-hidden="true" />
              <p className="mt-3 font-medium">מסירה עד הבית</p>
            </div>
            <div className="glass-inset rounded-md border p-4">
              <RotateCcw className="size-5" aria-hidden="true" />
              <p className="mt-3 font-medium">ביטולים לפי דין</p>
            </div>
          </div>

          <Separator className="my-8" />

          <div className="grid gap-7">
            {termsSections.map((section, index) => {
              const sectionId = `terms-section-${index + 1}`;

              return (
                <section aria-labelledby={sectionId} key={section.title}>
                  <div className="flex items-center gap-3">
                    <PackageCheck className="size-5" aria-hidden="true" />
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

          <section aria-labelledby="terms-contact">
            <h2 className="text-2xl font-semibold" id="terms-contact">
              שירות ופניות
            </h2>
            <p className="text-muted-foreground mt-3 leading-8">לשאלה על הזמנה, ביטול, פרטיות או שימוש באתר ניתן לפנות אלינו.</p>
            <Button asChild className="mt-5" variant="secondary">
              <Link
                data-testid="terms-service-recovery-link"
                href="/service?topic=order"
              >
                פתיחת פנייה בנושא הזמנה
              </Link>
            </Button>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
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
              עודכן לאחרונה: 29 באפריל 2026
            </p>
            <Button asChild>
              <Link href="/privacy">למדיניות הפרטיות</Link>
            </Button>
          </div>
        </div>
      </RevealSection>
      </main>
    </>
  );
}
