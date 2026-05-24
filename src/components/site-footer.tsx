import Link from "next/link";
import {
  ChevronDown,
  CircleHelp,
  Headphones,
  Info,
  MapPin,
  Ruler,
  ShoppingBag,
  UserRound,
  WandSparkles,
} from "lucide-react";
import { SiInstagram, SiTiktok } from "react-icons/si";

import { NewsletterForm } from "~/components/newsletter-form";
import { Separator } from "~/components/ui/separator";
import { getCatalogCategories } from "~/server/services/catalog";

const serviceLinks = [
  { href: "/about", label: "אודות Elysia", icon: Info },
  { href: "/branches", label: "סניפים ושירות", icon: MapPin },
  { href: "/account", label: "אזור לקוח", icon: UserRound },
  { href: "/checkout", label: "קופה ותשלום", icon: ShoppingBag },
  { href: "/faq", label: "שאלות ותשובות", icon: CircleHelp },
  { href: "/service", label: "שירות לקוחות", icon: Headphones },
  { href: "/size-guide", label: "מדריך מידות", icon: Ruler },
  { href: "/stylist", label: "ייעוץ אישי", icon: WandSparkles },
];

const primaryServiceLinks = serviceLinks.slice(0, 7);
const secondaryServiceLinks = serviceLinks.slice(7);

const policyLinks = [
  { href: "/terms", label: "תקנון האתר" },
  { href: "/privacy", label: "מדיניות פרטיות" },
  { href: "/accessibility", label: "הצהרת נגישות" },
] as const;

const socialLinks = [
  {
    href: "https://www.instagram.com/elysia.one/",
    label: "אינסטגרם",
    ariaLabel: "אינסטגרם של Elysia",
    icon: SiInstagram,
  },
  {
    href: "https://www.tiktok.com/@elysia.one",
    label: "טיקטוק",
    ariaLabel: "טיקטוק של Elysia",
    icon: SiTiktok,
  },
] as const;

export async function SiteFooter() {
  const categories = await getCatalogCategories();

  return (
    <footer className="bg-transparent">
      <div className="mx-auto max-w-7xl px-4 pt-10 pb-[calc(6.5rem+env(safe-area-inset-bottom))] sm:px-6 sm:pt-12 sm:pb-12 md:py-14 lg:py-16">
        <div className="grid gap-8 md:grid-cols-2 md:items-start lg:grid-cols-[1.3fr_0.55fr_0.64fr_0.64fr_1fr]">
          <section className="max-w-lg">
            <Link
              className="brand-footer-mark inline-flex items-center"
              href="/"
            >
              <span className="text-2xl font-semibold tracking-normal">
                Elysia
              </span>
            </Link>
            <p className="text-muted-foreground mt-5 max-w-md text-sm leading-7">
              רשת תכשיטי סטודיו ישראלית במיצוב יוקרה נגישה, עם קטלוג אונליין,
              רכישה מאובטחת ושירות אישי לבחירת תכשיט או מתנה.
            </p>
            <NewsletterForm />
          </section>

          <div className="grid gap-3 md:hidden">
            <details className="group border-b border-[var(--glass-border)]">
              <summary
                aria-expanded="true"
                className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold [&::-webkit-details-marker]:hidden"
              >
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
                    href="/search"
                  >
                    חיפוש בקטלוג
                  </Link>
                </li>
              </ul>
            </details>

            <details className="group border-b border-[var(--glass-border)]">
              <summary
                aria-expanded="true"
                className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold [&::-webkit-details-marker]:hidden"
              >
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
              <summary
                aria-expanded="true"
                className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold [&::-webkit-details-marker]:hidden"
              >
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
              </div>
            </details>
          </div>

          <nav aria-label="קטגוריות" className="hidden md:block">
            <h2 className="text-sm font-semibold">קטגוריות</h2>
            <ul className="text-muted-foreground mt-5 grid gap-2 text-sm">
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
                  href="/search"
                >
                  חיפוש בקטלוג
                </Link>
              </li>
            </ul>
          </nav>

          <nav aria-label="שירות וקנייה" className="hidden md:block">
            <h2 className="text-sm font-semibold">שירות וקנייה</h2>
            <ul className="mt-5 grid gap-2 text-sm">
              {primaryServiceLinks.map((item) => {
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

          <nav aria-label="שירות וקנייה - המשך" className="hidden md:block">
            <h2 aria-hidden="true" className="invisible text-sm font-semibold">
              שירות וקנייה
            </h2>
            <ul className="mt-5 grid gap-2 text-sm">
              {secondaryServiceLinks.map((item) => {
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
            className="hidden md:block"
          >
            <h2 className="text-sm font-semibold" id="footer-online-service">
              שירות אונליין
            </h2>
            <p className="text-muted-foreground mt-5 text-sm leading-7">
              כל המכירות מתקיימות אונליין בשלב זה. ההזמנות נשלחות לכתובת הלקוח,
              וצוות השירות זמין לייעוץ, התאמה ומעקב אחרי ההזמנה.
            </p>
          </section>
        </div>

        <Separator className="my-7 sm:my-8" />

        <div className="text-muted-foreground grid gap-5 text-sm sm:gap-4 lg:grid-cols-[1fr_auto_auto] lg:items-center">
          <span className="text-center lg:text-start">
            2026 Elysia. כל הזכויות שמורות.
          </span>
          <nav
            aria-label="קישורי מדיניות"
            className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 lg:justify-start"
          >
            {policyLinks.map((item) => (
              <Link
                className="hover:text-foreground inline-flex min-h-8 items-center transition"
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <nav
            aria-label="רשתות חברתיות"
            className="flex items-center justify-center gap-2 lg:justify-end"
          >
            {socialLinks.map((item) => {
              const Icon = item.icon;

              return (
                <a
                  aria-label={item.ariaLabel}
                  className="footer-social-link hover:text-foreground text-foreground inline-grid size-9 place-items-center rounded-full border border-[var(--glass-border)] transition"
                  data-icon-tooltip={item.label}
                  data-icon-tooltip-placement="top"
                  href={item.href}
                  key={item.href}
                  rel="noreferrer"
                  target="_blank"
                >
                  <Icon aria-hidden="true" className="size-4" />
                </a>
              );
            })}
          </nav>
        </div>
      </div>
    </footer>
  );
}
