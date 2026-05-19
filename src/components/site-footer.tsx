import Link from "next/link";
import {
  ChevronDown,
  CircleHelp,
  Gem,
  Search,
  Share2,
  ShieldCheck,
} from "lucide-react";

import { NewsletterForm } from "~/components/newsletter-form";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { getCatalogCategories } from "~/server/services/catalog";

const serviceLinks = [
  { href: "/about", label: "אודות Aphrodite", icon: Gem },
  { href: "/search", label: "חיפוש בקטלוג", icon: Search },
  { href: "/checkout", label: "סל וקופה", icon: ShieldCheck },
  { href: "/account", label: "אזור לקוח", icon: Gem },
  { href: "/faq", label: "שאלות ותשובות", icon: CircleHelp },
  { href: "/service", label: "שירות לקוחות", icon: CircleHelp },
];

const socialLink = {
  href: "https://www.instagram.com/aphrodite.one/",
  label: "רשתות חברתיות",
};

export async function SiteFooter() {
  const categories = await getCatalogCategories();

  return (
    <footer className="glass-chrome site-chrome border-t">
      <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:py-9">
        <div className="grid gap-6 lg:grid-cols-[1.08fr_0.72fr_0.82fr_0.9fr]">
          <section className="max-w-lg">
            <Link
              className="brand-footer-mark inline-flex items-center gap-2"
              href="/"
            >
              <Gem aria-hidden="true" className="size-5" />
              <span className="text-2xl font-semibold tracking-normal">
                Aphrodite
              </span>
            </Link>
            <p className="text-muted-foreground mt-3 max-w-md text-sm leading-6">
              רשת תכשיטי סטודיו ישראלית במיצוב יוקרה נגישה, עם קטלוג אונליין,
              רכישה מאובטחת ושירות אישי לבחירת תכשיט או מתנה.
            </p>
            <NewsletterForm />
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Button asChild variant="outline">
                <Link href="/search">
                  חיפוש בקטלוג
                  <Search aria-hidden="true" className="size-4" />
                </Link>
              </Button>
            </div>
          </section>

          <div className="grid gap-2 lg:hidden">
            <details className="group border-b border-[var(--glass-border)]">
              <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold [&::-webkit-details-marker]:hidden">
                קטגוריות
                <ChevronDown
                  aria-hidden="true"
                  className="size-4 transition group-open:rotate-180"
                />
              </summary>
              <ul className="text-muted-foreground grid gap-3 border-t border-[var(--glass-border)] p-4 text-sm">
                {categories.map((category) => (
                  <li key={category.slug}>
                    <Link
                      className="hover:text-foreground inline-flex min-h-9 items-center transition"
                      href={`/category/${category.slug}`}
                    >
                      {category.name}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link
                    className="hover:text-foreground inline-flex min-h-9 items-center transition"
                    href="/gifts"
                  >
                    מתנות
                  </Link>
                </li>
              </ul>
            </details>

            <details className="group border-b border-[var(--glass-border)]">
              <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold [&::-webkit-details-marker]:hidden">
                שירות וקנייה
                <ChevronDown
                  aria-hidden="true"
                  className="size-4 transition group-open:rotate-180"
                />
              </summary>
              <ul className="grid gap-3 border-t border-[var(--glass-border)] p-4 text-sm">
                {serviceLinks.map((item) => {
                  const Icon = item.icon;

                  return (
                    <li key={item.href}>
                      <Link
                        className="text-muted-foreground hover:text-foreground inline-flex min-h-9 items-center gap-2 transition"
                        href={item.href}
                      >
                        <Icon aria-hidden="true" className="size-4" />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </details>

            <details className="group border-b border-[var(--glass-border)]">
              <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold [&::-webkit-details-marker]:hidden">
                שירות אונליין
                <ChevronDown
                  aria-hidden="true"
                  className="size-4 transition group-open:rotate-180"
                />
              </summary>
              <div className="grid gap-4 border-t border-[var(--glass-border)] p-4">
                <p className="text-muted-foreground text-sm leading-6">
                  כל המכירות מתקיימות אונליין בשלב זה, עם משלוח עד הבית ושירות
                  לקוחות שמלווה את ההזמנה.
                </p>
                <Button
                  asChild
                  className="w-full justify-between"
                  variant="outline"
                >
                  <Link href="/faq">
                    שאלות נפוצות
                    <CircleHelp aria-hidden="true" className="size-4" />
                  </Link>
                </Button>
              </div>
            </details>
          </div>

          <nav aria-label="קטגוריות" className="hidden lg:block">
            <h2 className="text-sm font-semibold">קטגוריות</h2>
            <ul className="text-muted-foreground mt-3 grid gap-1.5 text-sm">
              {categories.map((category) => (
                <li key={category.slug}>
                  <Link
                    className="hover:text-foreground inline-flex min-h-8 items-center transition"
                    href={`/category/${category.slug}`}
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  className="hover:text-foreground inline-flex min-h-8 items-center transition"
                  href="/gifts"
                >
                  מתנות
                </Link>
              </li>
            </ul>
          </nav>

          <nav aria-label="שירות וקנייה" className="hidden lg:block">
            <h2 className="text-sm font-semibold">שירות וקנייה</h2>
            <ul className="mt-3 grid gap-1.5 text-sm">
              {serviceLinks.map((item) => {
                const Icon = item.icon;

                return (
                  <li key={item.href}>
                    <Link
                      className="text-muted-foreground hover:text-foreground inline-flex min-h-8 items-center gap-2 transition"
                      href={item.href}
                    >
                      <Icon aria-hidden="true" className="size-4" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <section
            aria-labelledby="footer-online-service"
            className="hidden lg:block"
          >
            <h2 className="text-sm font-semibold" id="footer-online-service">
              שירות אונליין
            </h2>
            <p className="text-muted-foreground mt-4 text-sm leading-6">
              כל המכירות מתקיימות אונליין בשלב זה. ההזמנות נשלחות לכתובת הלקוח,
              וצוות השירות זמין לייעוץ, התאמה ומעקב אחרי ההזמנה.
            </p>
            <Button
              asChild
              className="mt-4 w-full justify-between"
              variant="outline"
            >
              <Link href="/faq">
                שאלות נפוצות
                <CircleHelp aria-hidden="true" className="size-4" />
              </Link>
            </Button>
          </section>
        </div>

        <Separator className="my-4" />

        <div className="text-muted-foreground flex flex-col justify-between gap-4 text-sm lg:flex-row lg:items-center">
          <p>2026 Aphrodite. כל הזכויות שמורות.</p>
          <nav
            aria-label="קישורי מדיניות"
            className="flex flex-wrap items-center gap-x-4 gap-y-2"
          >
            <Link
              className="hover:text-foreground inline-flex min-h-8 items-center transition"
              href="/terms"
            >
              תקנון האתר
            </Link>
            <Link
              className="hover:text-foreground inline-flex min-h-8 items-center transition"
              href="/privacy"
            >
              מדיניות פרטיות
            </Link>
            <Link
              className="hover:text-foreground inline-flex min-h-8 items-center transition"
              href="/accessibility"
            >
              הצהרת נגישות
            </Link>
            <a
              aria-label="רשתות חברתיות של Aphrodite"
              className="hover:text-foreground inline-flex min-h-8 items-center gap-1.5 transition"
              href={socialLink.href}
              rel="noreferrer"
              target="_blank"
            >
              <Share2 aria-hidden="true" className="size-4" />
              {socialLink.label}
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
