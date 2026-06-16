"use client";

import Link from "next/link";
import {
  ChevronDown,
  MessageCircle,
  PackageCheck,
  Ruler,
  ShieldCheck,
} from "lucide-react";
import { SiInstagram, SiTiktok } from "react-icons/si";

import { BrandLogo } from "~/components/brand-logo";
import { NewsletterForm } from "~/components/newsletter-form";
import { SiteFooterDisclosures } from "~/components/site-footer-disclosures";
import {
  cookiePreferencesLink,
  footerBusinessDetails,
  policyLinks,
} from "~/lib/legal-content";

const catalogLinks = [
  { href: "/search", label: "כל התכשיטים" },
  { href: "/search?sort=newest", label: "חדש בקולקציה" },
  { href: "/category/rings", label: "טבעות" },
  { href: "/category/necklaces", label: "שרשראות" },
  { href: "/category/earrings", label: "עגילים" },
  { href: "/category/bracelets", label: "צמידים" },
  { href: "/gifts", label: "מתנות" },
] as const;

const commerceLinks = [
  { href: "/checkout", label: "סל" },
  { href: "/size-guide", label: "מדריך מידות" },
  { href: "/service", label: "שירות אישי" },
  { href: "/faq", label: "שאלות ותשובות" },
] as const;

const informationLinks = [
  { href: "/about", label: "אודות" },
  { href: "/branches", label: "סניפים" },
  { href: "/account", label: "אזור אישי" },
] as const;

const footerPolicyLinks = [...policyLinks, cookiePreferencesLink] as const;

const socialLinks = [
  {
    href: "https://www.instagram.com/elysia.one/",
    label: "אינסטגרם",
    ariaLabel: "אינסטגרם של Elysia",
    icon: SiInstagram,
  },
  {
    href: "https://www.tiktok.com/@elysia_jewellery",
    label: "טיקטוק",
    ariaLabel: "טיקטוק של Elysia",
    icon: SiTiktok,
  },
] as const;

const footerTrustSignals = [
  {
    href: "/shipping-returns",
    icon: PackageCheck,
    label: "מסירה והחזרות",
    text: "תיאום מסירה, החלפה והחזרה לפי מדיניות האתר.",
  },
  {
    href: "/size-guide",
    icon: Ruler,
    label: "בחירת מידה",
    text: "מידות טבעות, צמידים ושרשראות לפני הזמנה.",
  },
  {
    href: "/warranty",
    icon: ShieldCheck,
    label: "אחריות ושירות",
    text: "אחריות, תיקון ובדיקת פריט דרך שירות Elysia.",
  },
  {
    href: "/service",
    icon: MessageCircle,
    label: "שירות אישי",
    text: "שאלה על פריט, מתנה, מידה או הזמנה קיימת.",
  },
] as const;

export function SiteFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="site-footer" dir="rtl">
      <div className="site-footer-inner mx-auto max-w-7xl px-4 pt-12 pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:px-6 sm:pt-16 sm:pb-16 lg:pt-20 lg:pb-18">
        <div className="site-footer-primary grid gap-12 lg:grid-cols-[minmax(20rem,0.95fr)_minmax(0,1.45fr)] lg:gap-16 xl:gap-20">
          <section
            aria-labelledby="footer-brand-title"
            className="site-footer-brand"
          >
            <Link
              aria-label="Elysia - עמוד הבית"
              className="brand-footer-mark inline-flex items-center"
              href="/"
            >
              <BrandLogo className="h-12 w-auto max-w-[14.5rem] sm:h-14 sm:max-w-[18rem]" />
            </Link>
            <h2 className="sr-only" id="footer-brand-title">
              Elysia
            </h2>
            <p className="site-footer-brand-text mt-6 max-w-lg text-base leading-8 sm:text-[1.05rem]">
              תכשיטים עדינים, מדויקים ונקיים — לבחירה יומיומית, למתנה ולאור של
              קיץ.
            </p>
            <div className="site-footer-newsletter mt-9 max-w-xl">
              <p className="site-footer-kicker text-xs font-medium tracking-normal">
                הצטרפות לעדכונים
              </p>
              <p className="site-footer-newsletter-copy mt-3 max-w-md text-sm leading-7">
                קבלי עדכונים על קולקציות חדשות, מתנות ופריטים שנבחרו בקפידה.
              </p>
              <NewsletterForm
                hintText="נשלח רק כשיש קולקציה חדשה, רעיון למתנה או פריט שנבחר בקפידה."
                submitLabel="הצטרפות לעדכונים"
                variant="footer"
              />
            </div>
          </section>

          <nav
            aria-label="ניווט תחתון"
            className="site-footer-nav grid gap-0 md:grid-cols-2 md:gap-x-10 md:gap-y-10 xl:grid-cols-4 xl:gap-12"
            data-footer-nav-root
          >
            <FooterNav links={catalogLinks} title="קולקציות" />
            <FooterNav links={commerceLinks} title="שירות" />
            <FooterNav links={informationLinks} title="Elysia" />
            <FooterNav
              links={footerPolicyLinks}
              title="מדיניות"
              titleTestId="footer-policy-heading"
            />
          </nav>
        </div>
        <FooterTrustLayer />
        <SiteFooterDisclosures />

        <div className="site-footer-legal grid gap-5 text-sm md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:gap-10">
          <div className="grid gap-2 text-center md:text-start">
            <p className="max-w-xl leading-7" data-testid="footer-copyright">
              © {currentYear} Elysia. כל הזכויות שמורות.
            </p>
            <p
              className="max-w-xl text-xs leading-6"
              data-testid="footer-business-details"
            >
              {footerBusinessDetails}
            </p>
          </div>
          <nav
            aria-label="רשתות חברתיות"
            className="flex items-center justify-center gap-2 md:justify-end"
          >
            {socialLinks.map((item) => {
              const Icon = item.icon;

              return (
                <a
                  aria-label={item.ariaLabel}
                  className="footer-social-link inline-grid size-10 place-items-center rounded-full border transition"
                  data-icon-tooltip={item.label}
                  data-icon-tooltip-placement="top"
                  href={item.href}
                  key={item.href}
                  rel="noreferrer"
                  target="_blank"
                  title={item.label}
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

function FooterNav({
  links,
  title,
  titleTestId,
}: {
  links: readonly { href: string; label: string }[];
  title: string;
  titleTestId?: string;
}) {
  return (
    <details className="footer-nav-disclosure" data-footer-nav-disclosure open>
      <summary className="footer-nav-summary">
        <h2 className="text-xs font-medium" data-testid={titleTestId}>
          {title}
        </h2>
        <ChevronDown
          aria-hidden="true"
          className="footer-nav-chevron size-4"
          strokeWidth={1.8}
        />
      </summary>
      <ul className="mt-5 grid gap-3 text-sm">
        {links.map((item) => (
          <li key={item.href}>
            <Link
              className="inline-flex min-h-10 items-center transition"
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

function FooterTrustLayer() {
  return (
    <section
      aria-label="אמון ושירות לפני הזמנה"
      className="footer-trust-layer mt-12 border-y border-[var(--glass-border)] py-5"
      data-testid="footer-trust-layer"
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {footerTrustSignals.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              className="footer-trust-link grid min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-3 rounded-md px-0 py-1.5 transition focus-visible:ring-3 focus-visible:ring-[var(--glass-focus)] focus-visible:outline-none"
              data-testid="footer-trust-link"
              href={item.href}
              key={item.href}
            >
              <span
                aria-hidden="true"
                className="glass-inset grid size-9 place-items-center rounded-md border"
              >
                <Icon className="size-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium">{item.label}</span>
                <span className="text-muted-foreground mt-1 block text-xs leading-5">
                  {item.text}
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
