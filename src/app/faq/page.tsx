import type { Metadata } from "next";
import Link from "next/link";
import {
  ChevronDown,
  Gift,
  Mail,
  PackageCheck,
  Phone,
  Ruler,
  Search,
  Truck,
} from "lucide-react";

import { CommercePageHero } from "~/components/commerce-page-hero";
import { RevealSection } from "~/components/reveal";
import { SiteHeader } from "~/components/site-header";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { getPublicContactSettings } from "~/server/services/service";

export const metadata: Metadata = {
  title: "שאלות ותשובות",
  description:
    "שאלות ותשובות על בחירה ב-Elysia, זמינות פריטים, מידות, משלוחים, החזרות ומתנות.",
};

export const dynamic = "force-dynamic";

const faqGroups = [
  {
    title: "בחירה ופריטים",
    icon: PackageCheck,
    items: [
      {
        question: "איך יודעים אם פריט זמין?",
        answer:
          "בעמוד הפריט ובקטגוריות מוצגת זמינות להזמנה דיגיטלית ככל שהמידע קיים באתר. מלאי עשוי להשתנות, ולכן לפני הזמנה חשובה מומלץ לוודא זמינות מול שירות הלקוחות.",
      },
      {
        question: "האם המחירים באתר כוללים מע״מ?",
        answer:
          "המחירים באתר מוצגים בשקלים חדשים וכוללים מע״מ, אלא אם צוין אחרת במפורש.",
      },
      {
        question: "האם התמונות זהות לפריט בפועל?",
        answer:
          "התמונות נועדו להמחשה מדויקת ככל האפשר, אך ייתכנו הבדלים קלים בגוון, ברק, גודל יחסי או תצוגה בין מסכים.",
      },
    ],
  },
  {
    title: "מידות ומתנות",
    icon: Ruler,
    items: [
      {
        question: "איך בוחרים מידת טבעת?",
        answer:
          "אפשר להיעזר במדריכי המידה באתר או להתייעץ עם נציג לפני ההזמנה. אם מדובר במתנה ואין מידה ודאית, מומלץ לבחור פריט שניתן להחלפה.",
      },
      {
        question: "האם אפשר לקבל המלצה למתנה?",
        answer:
          "כן. אזור המתנות מאפשר לבחור לפי טווח מחיר, אירוע, חומר וסגנון. אפשר לפנות לשירות הלקוחות כדי לאמת התאמה לפני הזמנה.",
      },
      {
        question: "האם ניתן לצרף ברכה או אריזת מתנה?",
        answer:
          "בפריטים ובהזמנות נתמכות ניתן לציין בקשה לברכה או אריזה. אם האפשרות לא מופיעה, ניתן לפנות לשירות הלקוחות לפני השלמת ההזמנה.",
      },
    ],
  },
  {
    title: "משלוחים והחזרות",
    icon: Truck,
    items: [
      {
        question: "האם ההזמנות מתקבלות מרחוק בלבד?",
        answer:
          "כן. בשלב זה ההזמנות מתקבלות באתר בלבד, ונשלחות לכתובת שתבחרו בתהליך הקופה.",
      },
      {
        question: "איך מבטלים עסקה או מחזירים פריט?",
        answer:
          "ביטול עסקה, החלפה או החזרה מתבצעים בהתאם לחוק הגנת הצרכן, תקנותיו ומדיניות החנות. פריטים מותאמים אישית או פריטים שנעשה בהם שימוש עשויים להיות כפופים למגבלות לפי דין.",
      },
      {
        question: "מה עושים אם התקבל פריט פגום?",
        answer:
          "יש לפנות אלינו בהקדם עם מספר הזמנה, תמונה ותיאור הבעיה. נבדוק את המקרה ונציע תיקון, החלפה או פתרון אחר בהתאם לדין ולמדיניות השירות.",
      },
    ],
  },
];

export default async function FaqPage() {
  const contact = await getPublicContactSettings();

  return (
    <main>
      <SiteHeader />

      <CommercePageHero
        description="תשובות קצרות על בחירה באתר, זמינות פריטים, מידות, משלוחים ומתנות."
        eyebrow="עזרה ושירות"
        title="שאלות ותשובות"
        variant="content"
      />

      <RevealSection
        className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:py-14"
        id="faq-shortcuts"
      >
        <div className="grid gap-6 sm:grid-cols-2">
          <Link className="brand-surface interactive-lift p-5" href="/search">
            <Search className="size-5" aria-hidden="true" />
            <p className="mt-3 font-medium">חיפוש בקטלוג</p>
          </Link>
          <Link className="brand-surface interactive-lift p-5" href="/gifts">
            <Gift className="size-5" aria-hidden="true" />
            <p className="mt-3 font-medium">מתנות לפי טווח מחיר</p>
          </Link>
        </div>

        <div className="brand-surface mt-8 p-6 sm:p-8" id="faq-groups">
          <div className="grid gap-10">
            {faqGroups.map((group, index) => {
              const Icon = group.icon;
              const groupId = `faq-group-${index + 1}`;

              return (
                <section aria-labelledby={groupId} key={group.title}>
                  <div className="mb-4 flex items-center gap-3">
                    <Icon className="size-5" aria-hidden="true" />
                    <h2 className="text-2xl font-semibold" id={groupId}>
                      {group.title}
                    </h2>
                  </div>
                  <div className="grid gap-3">
                    {group.items.map((item) => (
                      <details
                        className="glass-inset group rounded-md border p-4"
                        key={item.question}
                      >
                        <summary className="hover:text-foreground flex cursor-pointer list-none items-center justify-between gap-3 rounded-sm font-medium transition outline-none focus-visible:ring-3 focus-visible:ring-[var(--glass-focus)]">
                          <span>{item.question}</span>
                          <ChevronDown
                            className="size-4 shrink-0 transition group-open:rotate-180"
                            aria-hidden="true"
                          />
                        </summary>
                        <p className="text-muted-foreground mt-3 leading-8">
                          {item.answer}
                        </p>
                      </details>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>

          <Separator className="my-8" />

          <section aria-labelledby="faq-contact">
            <h2 className="text-2xl font-semibold" id="faq-contact">
              לא מצאתם תשובה?
            </h2>
            <p className="text-muted-foreground mt-3 leading-8">
              אפשר לפנות לשירות הלקוחות עם פרטי הפריט, מספר ההזמנה או תיאור
              הבקשה.
            </p>
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
              עודכן לאחרונה: 29 באפריל 2026.
            </p>
            <Button asChild>
              <Link href="/terms">לתקנון האתר</Link>
            </Button>
          </div>
        </div>
      </RevealSection>
    </main>
  );
}
