import type { Metadata } from "next";
import Link from "next/link";
import {
  ChevronDown,
  CircleHelp,
  Gift,
  Mail,
  PackageCheck,
  Phone,
  Ruler,
  Search,
  Sparkles,
  Truck,
} from "lucide-react";

import { BrandMediaPanel } from "~/components/brand-media-panel";
import { CinematicPageHero } from "~/components/cinematic-page-hero";
import { RevealSection } from "~/components/reveal";
import { SiteHeader } from "~/components/site-header";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { brandMedia, cinematicRouteMedia } from "~/lib/brand-media";
import { publicContactEmail, publicContactPhone } from "~/lib/public-contact";

export const metadata: Metadata = {
  title: "שאלות ותשובות",
  description:
    "שאלות ותשובות על קנייה ב-Aphrodite, זמינות מוצרים, מידות, משלוחים, החזרות, מתנות וסטייליסט AI.",
};

const faqGroups = [
  {
    title: "קנייה ומוצרים",
    icon: PackageCheck,
    items: [
      {
        question: "איך יודעים אם מוצר זמין?",
        answer:
          "בעמוד המוצר ובקטגוריות מוצגת זמינות לפי סניף ככל שהמידע קיים במערכת. מלאי עשוי להשתנות, ולכן לפני הגעה במיוחד לסניף מומלץ לוודא זמינות מול שירות הלקוחות.",
      },
      {
        question: "האם המחירים באתר כוללים מע״מ?",
        answer:
          "המחירים באתר מוצגים בשקלים חדשים וכוללים מע״מ, אלא אם צוין אחרת במפורש.",
      },
      {
        question: "האם התמונות זהות למוצר בפועל?",
        answer:
          "התמונות נועדו להמחשה מדויקת ככל האפשר, אך ייתכנו הבדלים קלים בגוון, ברק, גודל יחסי או תצוגה בין מסכים.",
      },
    ],
  },
  {
    title: "מידות, מתנות וייעוץ",
    icon: Ruler,
    items: [
      {
        question: "איך בוחרים מידת טבעת?",
        answer:
          "אפשר להיעזר במדריכי המידה באתר או לתאם מדידה בסניף. אם מדובר במתנה ואין מידה ודאית, מומלץ לבחור מוצר שניתן להחלפה או להתייעץ עם נציג.",
      },
      {
        question: "האם אפשר לקבל המלצה למתנה?",
        answer:
          "כן. אזור המתנות והסטייליסט AI מאפשרים לבחור לפי תקציב, אירוע, סגנון והעדפות. ההמלצות הן כלי עזר ואפשר לאמת אותן מול נציג לפני רכישה.",
      },
      {
        question: "האם ניתן לצרף ברכה או אריזת מתנה?",
        answer:
          "במוצרים ובהזמנות נתמכות ניתן לציין בקשה לברכה או אריזה. אם האפשרות לא מופיעה, ניתן לפנות לשירות הלקוחות לפני השלמת ההזמנה.",
      },
    ],
  },
  {
    title: "משלוחים, איסוף והחזרות",
    icon: Truck,
    items: [
      {
        question: "האם אפשר לאסוף מסניף?",
        answer:
          "כן, כאשר המוצר זמין לאיסוף או ניתן להעברה לסניף. אפשרויות האיסוף יוצגו בתהליך ההזמנה או יתואמו מול שירות הלקוחות.",
      },
      {
        question: "איך מבטלים עסקה או מחזירים מוצר?",
        answer:
          "ביטול עסקה, החלפה או החזרה מתבצעים בהתאם לחוק הגנת הצרכן, תקנותיו ומדיניות החנות. מוצרים מותאמים אישית או מוצרים שנעשה בהם שימוש עשויים להיות כפופים למגבלות לפי דין.",
      },
      {
        question: "מה עושים אם התקבל מוצר פגום?",
        answer:
          "יש לפנות אלינו בהקדם עם מספר הזמנה, תמונה ותיאור הבעיה. נבדוק את המקרה ונציע תיקון, החלפה או פתרון אחר בהתאם לדין ולמדיניות השירות.",
      },
    ],
  },
];

const faqAnchors = [
  { id: "page-hero", label: "פתיחה" },
  { id: "faq-shortcuts", label: "קיצורים" },
  { id: "faq-groups", label: "שאלות" },
  { id: "faq-contact", label: "שירות" },
];

export default function FaqPage() {
  return (
    <main>
      <SiteHeader />

      <CinematicPageHero
        actions={
          <>
            <Button asChild size="lg">
              <Link href="#faq-groups">לשאלות</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="#faq-contact">יצירת קשר</Link>
            </Button>
          </>
        }
        anchors={faqAnchors}
        description="תשובות קצרות על קנייה באתר, זמינות בסניפים, מידות, משלוחים, מתנות והמלצות AI."
        eyebrow="Aphrodite Help"
        slides={cinematicRouteMedia.faq}
        stats={[
          { label: "נושאים", value: String(faqGroups.length) },
          { label: "שירות", value: "זמין" },
          { label: "AI", value: "פעיל" },
        ]}
        title="שאלות ותשובות"
        variant="editorial"
      />

      <RevealSection aria-hidden="true" className="hidden" variant="none">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:py-16">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Aphrodite</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-normal sm:text-5xl">
                שאלות ותשובות
              </h1>
              <p className="text-muted-foreground mt-4 max-w-3xl leading-8">
                תשובות קצרות לשאלות נפוצות על קנייה באתר, זמינות בסניפים, מידות,
                משלוחים, מתנות והמלצות AI.
              </p>
            </div>
            <div className="glass-card w-fit rounded-md border p-4">
              <CircleHelp className="size-8" aria-hidden="true" />
            </div>
          </div>
          <BrandMediaPanel
            alt="Subtle Aphrodite Aqua policy glass accent"
            className="mt-7 h-28"
            priority
            slides={brandMedia.policy}
            variant="content"
          />
        </div>
      </RevealSection>

      <RevealSection
        className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:py-14"
        id="faq-shortcuts"
      >
        <div className="grid gap-6 sm:grid-cols-3">
          <Link
            className="glass-card interactive-lift rounded-md border p-5"
            href="/search"
          >
            <Search className="size-5" aria-hidden="true" />
            <p className="mt-3 font-medium">חיפוש בקטלוג</p>
          </Link>
          <Link
            className="glass-card interactive-lift rounded-md border p-5"
            href="/gifts"
          >
            <Gift className="size-5" aria-hidden="true" />
            <p className="mt-3 font-medium">מתנות לפי תקציב</p>
          </Link>
          <Link
            className="glass-card interactive-lift rounded-md border p-5"
            href="/ai"
          >
            <Sparkles className="size-5" aria-hidden="true" />
            <p className="mt-3 font-medium">סטייליסט AI</p>
          </Link>
        </div>

        <div
          className="glass-panel mt-8 rounded-md border p-6 sm:p-8"
          id="faq-groups"
        >
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
              אפשר לפנות לשירות הלקוחות עם פרטי המוצר, מספר ההזמנה או תיאור
              הבקשה.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <a
                className="glass-inset hover:text-foreground flex items-center gap-3 rounded-md border p-4 transition"
                href={`mailto:${publicContactEmail}`}
              >
                <Mail className="size-5" aria-hidden="true" />
                <span>{publicContactEmail}</span>
              </a>
              <a
                className="glass-inset hover:text-foreground flex items-center gap-3 rounded-md border p-4 transition"
                href={`tel:${publicContactPhone}`}
              >
                <Phone className="size-5" aria-hidden="true" />
                <span>{publicContactPhone}</span>
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
