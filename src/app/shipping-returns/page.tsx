import type { Metadata } from "next";
import Link from "next/link";
import { Mail, PackageCheck, Phone, RotateCcw, Truck } from "lucide-react";

import { CompactPageIntro } from "~/components/compact-page-intro";
import { LegalCookiePreferencesCallout } from "~/components/legal-cookie-preferences-callout";
import { RevealSection } from "~/components/reveal";
import { SiteHeader } from "~/components/site-header";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import {
  businessLegalPlaceholders,
  legalSafetySentence,
  legalPlaceholder,
} from "~/lib/legal-content";
import { getPublicContactSettings } from "~/server/services/service";

export const metadata: Metadata = {
  title: "משלוחים, ביטולים והחזרות",
  description:
    "מדיניות משלוחים, זמני אספקה, ביטול עסקה, החזר כספי, החלפות והחזרת מוצרים באתר Elysia.",
  alternates: {
    canonical: "/shipping-returns",
  },
};

export const dynamic = "force-dynamic";

const humanReturnSummary = [
  {
    title: "רוצים להחליף?",
    text: "פותחים פנייה עם מספר הזמנה והפריט המבוקש. נבדוק זמינות ונציע המשך ברור.",
  },
  {
    title: "רוצים להחזיר?",
    text: "אל תשלחו פריט לפני הנחיות מהשירות. כך נוכל לשמור על טיפול מסודר וזיכוי נכון.",
  },
  {
    title: "משהו הגיע לא תקין?",
    text: "צרפו תמונה ותיאור קצר. נבדוק את המקרה ונחזור עד יום עסקים.",
  },
] as const;

const shippingReturnSections = [
  {
    title: "משלוחים",
    text: "אפשרויות המשלוח, העלות והכתובת ייבדקו לפני השלמת ההזמנה. האחריות למסירת כתובת מלאה ונכונה היא על הלקוח/ה. אם יש צורך בשינוי כתובת לאחר ההזמנה, יש לפנות לשירות בהקדם ולא ניתן להתחייב שהשינוי יתאפשר לאחר תחילת הטיפול.",
  },
  {
    title: "זמני אספקה",
    text: `זמני האספקה המשוערים יוצגו בעמוד המוצר או בתהליך ההזמנה כאשר הם זמינים. אם אין זמן אספקה מאומת, יש להשלים אותו לפני פרסום התחייבות מחייבת: ${legalPlaceholder}. ימי אספקה אינם כוללים עיכובים שאינם בשליטת העסק, ובכל מקרה הטיפול יהיה בכפוף לדין.`,
  },
  {
    title: "כתובת שגויה / אי איסוף / מסירה שנכשלה",
    text: "במקרה של כתובת חסרה או שגויה, אי זמינות לקבלת המשלוח, אי איסוף או מסירה שנכשלה, ייתכן שיהיה צורך בתיאום מחודש ובעלות משלוח נוספת, בכפוף לדין ולנסיבות המקרה.",
  },
  {
    title: "ביטול עסקה",
    text: "בקשה לביטול עסקה תטופל בהתאם לחוק הגנת הצרכן, תקנותיו וכל דין חל. יש לפנות לשירות עם מספר הזמנה, שם מלא ופרטי התקשרות. אם המוצר כבר נשלח, ייתכן שהטיפול יותנה בהחזרת המוצר בהתאם למדיניות זו ובכפוף לדין.",
  },
  {
    title: "החזר כספי",
    text: "החזר כספי, ככל שמגיע לפי דין או לפי מדיניות האתר, יבוצע באמצעי התשלום שבו בוצעה העסקה או בדרך אחרת שתוסכם עם הלקוח/ה, לאחר בדיקת הבקשה והמוצר ככל שנדרש.",
  },
  {
    title: "החלפה",
    text: "החלפה תתאפשר לפי זמינות מלאי, מצב המוצר והוראות הדין. אם המידה, הצבע או הדגם המבוקשים אינם זמינים, השירות יציע חלופה, זיכוי או פתרון אחר בהתאם לנסיבות ולדין.",
  },
  {
    title: "החזרת מוצר",
    text: "מוצר המוחזר צריך להגיע באריזתו ככל האפשר, ללא שימוש, ללא פגם וללא סימני בלאי, יחד עם פרטי הזמנה. אין לשלוח מוצר חזרה ללא תיאום מראש עם השירות.",
  },
  {
    title: "מוצרים שהותאמו אישית",
    text: "מוצרים שיוצרו, הוזמנו או הותאמו אישית לפי בקשת הלקוח/ה עשויים להיות מוחרגים מביטול או החזרה, בכפוף להוראות הדין. יש לוודא פרטי מידה, חריטה, גוון או התאמה לפני אישור ההזמנה.",
  },
  {
    title: "מוצרים שנעשה בהם שימוש / נפגמו",
    text: "לא ניתן להתחייב לקבל החזרה של מוצר שנעשה בו שימוש, נפגם, עבר תיקון אצל צד שלישי, נחשף לחומרים או הוחזר שלא בהתאם להנחיות, למעט כאשר קיימת זכות לפי דין.",
  },
  {
    title: "דמי ביטול, בכפוף לדין",
    text: "ככל שיחולו דמי ביטול, הם ייגבו רק בהתאם להוראות הדין. אין במדיניות זו כדי ליצור חיוב שאינו מותר לפי דין.",
  },
] as const;

export default async function ShippingReturnsPage() {
  const contact = await getPublicContactSettings();

  return (
    <>
      <SiteHeader />

      <main className="elysia-page">
        <CompactPageIntro
          description="מידע על משלוחים, זמני אספקה, ביטול עסקה, החלפות והחזרות באתר Elysia."
          eyebrow="מדיניות שירות"
          title="משלוחים, ביטולים והחזרות"
          variant="content"
        />

        <RevealSection className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:py-14">
          <div className="brand-surface p-6 sm:p-8">
            <section
              aria-labelledby="shipping-returns-human-summary"
              data-testid="shipping-returns-human-summary"
            >
              <div className="flex items-center gap-3">
                <RotateCcw className="size-5" aria-hidden="true" />
                <h2
                  className="text-2xl font-semibold"
                  id="shipping-returns-human-summary"
                >
                  לפני הטקסט המשפטי: כך זה עובד בפועל
                </h2>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {humanReturnSummary.map((item) => (
                  <section
                    className="glass-inset rounded-md border p-4"
                    key={item.title}
                  >
                    <h3 className="font-medium">{item.title}</h3>
                    <p className="text-muted-foreground mt-2 text-sm leading-6">
                      {item.text}
                    </p>
                  </section>
                ))}
              </div>
            </section>

            <Separator className="my-8" />

            <section aria-labelledby="business-details">
              <div className="flex items-center gap-3">
                <PackageCheck className="size-5" aria-hidden="true" />
                <h2 className="text-2xl font-semibold" id="business-details">
                  פרטי העסק
                </h2>
              </div>
              <dl className="mt-5 grid gap-3 sm:grid-cols-2">
                {businessLegalPlaceholders.map((item) => (
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

            <LegalCookiePreferencesCallout testId="shipping-returns-cookie-preferences-callout" />

            <Separator className="my-8" />

            <div className="grid gap-7">
              {shippingReturnSections.map((section, index) => {
                const sectionId = `shipping-return-section-${index + 1}`;
                const Icon = index < 3 ? Truck : RotateCcw;

                return (
                  <section aria-labelledby={sectionId} key={section.title}>
                    <div className="flex items-center gap-3">
                      <Icon className="size-5" aria-hidden="true" />
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

            <Separator className="my-8" />

            <section aria-labelledby="shipping-returns-contact">
              <h2
                className="text-2xl font-semibold"
                id="shipping-returns-contact"
              >
                פתיחת בקשת ביטול, החלפה או החזרה
              </h2>
              <p className="text-muted-foreground mt-3 leading-8">
                ניתן לפתוח פנייה דרך שירות הלקוחות או ליצור קשר בפרטים שלהלן.
                אין לשלוח מוצר חזרה לפני קבלת הנחיות מהשירות.
              </p>
              <Button asChild className="mt-5" variant="secondary">
                <Link href="/service?topic=returns">
                  פתיחת בקשת החזרה או ביטול
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
          </div>
        </RevealSection>
      </main>
    </>
  );
}
