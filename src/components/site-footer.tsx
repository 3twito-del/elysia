"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { SiInstagram, SiTiktok } from "react-icons/si";

import { NewsletterForm } from "~/components/newsletter-form";
import { SiteFooterDisclosures } from "~/components/site-footer-disclosures";

const catalogLinks = [
  { href: "/category/rings", label: "טבעות" },
  { href: "/category/necklaces", label: "שרשראות" },
  { href: "/category/earrings", label: "עגילים" },
  { href: "/category/bracelets", label: "צמידים" },
  { href: "/search", label: "חיפוש בקטלוג" },
] as const;

const commerceLinks = [
  { href: "/checkout", label: "קופה ותשלום" },
  { href: "/service", label: "שירות לקוחות" },
  { href: "/faq", label: "שאלות ותשובות" },
  { href: "/size-guide", label: "מדריך מידות" },
] as const;

const informationLinks = [
  { href: "/about", label: "אודות Elysia" },
  { href: "/branches", label: "סניפים ושירות" },
  { href: "/account", label: "אזור לקוח" },
] as const;

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

export function SiteFooter() {
  return (
    <footer className="site-footer bg-transparent" dir="rtl">
      <div className="site-footer-inner mx-auto max-w-7xl px-4 pt-10 pb-[calc(6.5rem+env(safe-area-inset-bottom))] sm:px-6 sm:pt-14 sm:pb-14 lg:pt-20 lg:pb-16">
        <div className="site-footer-primary grid gap-9 md:grid-cols-[minmax(18rem,0.95fr)_minmax(0,1.45fr)] md:gap-12 lg:grid-cols-[minmax(20rem,1fr)_minmax(0,1.9fr)] lg:gap-16">
          <section className="site-footer-brand max-w-xl md:max-w-md lg:max-w-xl">
            <Link
              aria-label="Elysia - עמוד הבית"
              className="brand-footer-mark inline-flex items-center"
              href="/"
            >
              <span className="text-4xl leading-none font-[var(--font-latin-brand)] font-medium tracking-normal sm:text-5xl">
                Elysia
              </span>
            </Link>
            <p className="text-muted-foreground mt-6 max-w-md text-sm leading-8 sm:text-[0.95rem]">
              סטודיו תכשיטים ישראלי עם קולקציות מדודות, רכישה אונליין ושירות
              אישי שמלווה את הבחירה בעדינות.
            </p>
            <div className="mt-7 max-w-md">
              <p className="text-foreground text-xs font-medium">
                עדכונים שקטים
              </p>
              <NewsletterForm />
            </div>
          </section>

          <nav
            aria-label="ניווט תחתון"
            className="site-footer-nav grid md:grid-cols-3 md:gap-10 lg:gap-12"
            data-footer-nav-root
          >
            <FooterNav links={catalogLinks} title="קטלוג" />
            <FooterNav links={commerceLinks} title="שירות וקנייה" />
            <FooterNav links={informationLinks} title="מידע" />
          </nav>
        </div>
        <SiteFooterDisclosures />

        <div className="site-footer-legal text-muted-foreground grid gap-5 text-sm md:grid-cols-[minmax(18rem,0.95fr)_minmax(0,1.45fr)] md:items-center md:gap-12 lg:grid-cols-[minmax(20rem,1fr)_minmax(0,1.9fr)] lg:gap-16">
          <p
            className="max-w-xl text-center leading-7 md:text-start"
            data-testid="footer-copyright"
          >
            2026 Elysia. כל הזכויות שמורות. כל הזמנה מטופלת בתשומת לב, מאריזה
            ועד שירות לאחר קנייה.
          </p>
          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center md:gap-8">
            <nav
              aria-label="קישורי מדיניות"
              className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 md:justify-start"
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
              className="flex items-center justify-center gap-2 md:justify-end"
            >
              {socialLinks.map((item) => {
                const Icon = item.icon;

                return (
                  <a
                    aria-label={item.ariaLabel}
                    className="footer-social-link text-foreground hover:text-foreground inline-grid size-9 place-items-center rounded-full border border-[var(--glass-border)] transition"
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
      </div>
    </footer>
  );
}

function FooterNav({
  links,
  title,
}: {
  links: readonly { href: string; label: string }[];
  title: string;
}) {
  return (
    <details className="footer-nav-disclosure" data-footer-nav-disclosure open>
      <summary className="footer-nav-summary">
        <h2 className="text-foreground text-xs font-medium">{title}</h2>
        <ChevronDown
          aria-hidden="true"
          className="footer-nav-chevron size-4"
          strokeWidth={1.8}
        />
      </summary>
      <ul className="text-muted-foreground mt-5 grid gap-3 text-sm">
        {links.map((item) => (
          <li key={item.href}>
            <Link
              className="hover:text-foreground inline-flex min-h-8 items-center transition"
              href={item.href}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </details>
  );
}
