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

import { CompactPageIntro } from "~/components/compact-page-intro";
import { RevealSection } from "~/components/reveal";
import { SiteHeader } from "~/components/site-header";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { getPublicContactSettings } from "~/server/services/service";

export const metadata: Metadata = {
  title: "שאלות ותשובות",
  description:
    "שאלות ותשובות על תכשיטים, מידות, מסירה, החזרות ומתנות.",
};

export const dynamic = "force-dynamic";

const faqGroups = [
  {
    title: "תכשיטים",
    icon: PackageCheck,
    items: [
      {
        question: "איך יודעים אם פריט זמין?",
        answer:
          "הזמינות מופיעה בעמוד המוצר. להזמנות מיוחדות ניתן לפנות לשירות.",
      },
      {
        question: "האם המחירים כוללים מע״מ?",
        answer: "המחירים מוצגים בשקלים חדשים וכוללים מע״מ, אלא אם צוין אחרת.",
      },
      {
        question: "האם התמונות משקפות את המוצר?",
        answer:
          "התמונות נועדו להמחשה. ייתכנו הבדלים קלים בגוון, ברק או גודל יחסי בין מסכים.",
      },
    ],
  },
  {
    title: "מידות ומתנות",
    icon: Ruler,
    items: [
      {
        question: "איך בוחרים מידת טבעת?",
        answer: "ניתן להיעזר במדריך המידות או לפנות לשירות.",
      },
      {
        question: "האם אפשר לקבל עזרה בבחירת מתנה?",
        answer:
          "כן. אפשר להתחיל ממחיר, אירוע, חומר או סגנון, או לפנות לשירות עם שם התכשיט.",
      },
      {
        question: "האם ניתן לצרף ברכה או אריזת מתנה?",
        answer: "כאשר זמין, ניתן להוסיף ברכה או אריזה בהזמנה.",
      },
    ],
  },
  {
    title: "משלוחים והחזרות",
    icon: Truck,
    items: [
      {
        question: "האם ההזמנה מתבצעת באתר?",
        answer: "כן. ההזמנה מתבצעת באתר ונשלחת לכתובת שנבחרה.",
      },
      {
        question: "איך מבטלים או מחזירים הזמנה?",
        answer: "ביטול, החלפה או החזרה מתבצעים לפי מדיניות האתר והוראות הדין.",
      },
      {
        question: "מה עושים אם התקבל מוצר פגום?",
        answer: "יש לפנות לשירות עם מספר הזמנה, תמונה ותיאור המקרה.",
      },
    ],
  },
];

export default async function FaqPage() {
  const contact = await getPublicContactSettings();

  return (
    <main>
      <SiteHeader />

      <CompactPageIntro
        description="מידות, מתנות, משלוחים והחזרות - בלי לחפש בין עמודים."
        eyebrow="שירות"
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
            <p className="mt-3 font-medium">חיפוש תכשיטים</p>
          </Link>
          <Link className="brand-surface interactive-lift p-5" href="/gifts">
            <Gift className="size-5" aria-hidden="true" />
            <p className="mt-3 font-medium">מתנות לפי מחיר</p>
          </Link>
        </div>

        <section
          aria-label="סינון מהיר לפי נושא"
          className="mt-6 border-y border-[var(--glass-border)] py-4"
          data-testid="faq-topic-filter-list"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium">סינון מהיר</p>
              <p className="text-muted-foreground text-sm">
                קפיצה ישירה לנושא שמעניין אתכם.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {faqGroups.map((group, index) => (
                <Link
                  className="border-border hover:border-foreground/50 hover:bg-muted/60 rounded-full border px-3 py-1.5 text-sm transition"
                  href={`#faq-group-${index + 1}`}
                  key={group.title}
                >
                  {group.title}
                </Link>
              ))}
            </div>
          </div>
        </section>

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
            <p className="text-muted-foreground mt-3 leading-8">אפשר לפנות לשירות עם שם התכשיט, מספר הזמנה או תיאור קצר של מה שצריך.</p>
            <Button asChild className="mt-5" variant="secondary">
              <Link
                data-testid="faq-service-recovery-link"
                href="/service?topic=general"
              >
                פתיחת פנייה לשירות
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
              <Link href="/terms">לתקנון</Link>
            </Button>
          </div>
        </div>
      </RevealSection>
    </main>
  );
}
