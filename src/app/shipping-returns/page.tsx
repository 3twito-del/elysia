import type { Metadata } from "next";
import { PackageCheck, RotateCcw, Truck } from "lucide-react";

import { ContentPageShell } from "~/components/content-page-shell";
import { LegalContactSection } from "~/components/legal-contact-section";
import { LegalCookiePreferencesCallout } from "~/components/legal-cookie-preferences-callout";
import { LegalPlaceholderGrid } from "~/components/legal-placeholder-grid";
import { LegalSectionList } from "~/components/legal-section-list";
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
    title: "רוצה להחליף?",
    text: "פתחי פנייה עם מספר ההזמנה והפריט המבוקש. נבדוק זמינות ונחזור אלייך עם ההנחיות.",
  },
  {
    title: "רוצה להחזיר?",
    text: "אין לשלוח פריט לפני קבלת הנחיות מהשירות, כדי שנוכל לטפל בהחזרה ובזיכוי בצורה מסודרת.",
  },
  {
    title: "המוצר הגיע פגום?",
    text: "צרפי תמונה ותיאור קצר. נבדוק את המקרה ונחזור אלייך עד יום עסקים.",
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
    <ContentPageShell
      description="מידע על משלוחים, זמני אספקה, ביטול עסקה, החלפות והחזרות באתר Elysia."
      eyebrow="מדיניות שירות"
      title="משלוחים, ביטולים והחזרות"
    >
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
        <LegalPlaceholderGrid items={businessLegalPlaceholders} />
      </section>

      <Separator className="my-8" />

      <LegalCookiePreferencesCallout testId="shipping-returns-cookie-preferences-callout" />

      <Separator className="my-8" />

      <LegalSectionList
        icon={Truck}
        iconFor={(index) => (index < 3 ? Truck : RotateCcw)}
        idPrefix="shipping-return-section"
        sections={shippingReturnSections}
      />

      <Separator className="my-8" />

      <p className="text-muted-foreground leading-8">{legalSafetySentence}</p>

      <Separator className="my-8" />

      <LegalContactSection
        action={{
          href: "/service?topic=returns",
          label: "פתיחת בקשת החזרה או ביטול",
        }}
        contact={contact}
        description="ניתן לפתוח פנייה דרך שירות הלקוחות או ליצור קשר בפרטים שלהלן. אין לשלוח מוצר חזרה לפני קבלת הנחיות מהשירות."
        id="shipping-returns-contact"
        title="פתיחת בקשת ביטול, החלפה או החזרה"
      />
    </ContentPageShell>
  );
}
