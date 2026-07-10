"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  { href: "/category/sets", label: "סטים" },
  { href: "/gifts", label: "מתנות" },
] as const;

const commerceLinks = [
  { href: "/checkout", label: "סל הקניות" },
  { href: "/size-guide", label: "מדריך מידות" },
  { href: "/service", label: "שירות לקוחות" },
  { href: "/faq", label: "שאלות ותשובות" },
] as const;

const informationLinks = [
  { href: "/about", label: "אודות" },
  { href: "/blog", label: "מגזין" },
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
    label: "החלפות והחזרות",
    text: "כל המידע על משלוחים, החזרות וביטול עסקה.",
  },
  {
    href: "/size-guide",
    icon: Ruler,
    label: "מדריך מידות",
    text: "איך בוחרים מידה נכונה לפני ההזמנה.",
  },
  {
    href: "/warranty",
    icon: ShieldCheck,
    label: "אחריות 12 חודשים",
    text: "כיסוי לפגמי ייצור לפי מדיניות האחריות.",
  },
  {
    href: "/service",
    icon: MessageCircle,
    label: "שירות לקוחות",
    text: "מענה לכל פנייה בתוך יום עסקים אחד.",
  },
] as const;

export function SiteFooter() {
  const currentYear = new Date().getFullYear();
  const pathname = usePathname();
  // Keep the transactional checkout surface focused: no marketing newsletter.
  // The home page has its own dedicated newsletter band, so suppress the footer
  // duplicate there too (avoid two signup forms on one page).
  const showNewsletter = pathname !== "/checkout" && pathname !== "/";

  return (
    <footer className="site-footer elysia-section" dir="rtl">
      <div className="site-footer-inner mx-auto max-w-[92rem] px-[var(--ui-page-x)] pt-10 pb-[calc(4.75rem+env(safe-area-inset-bottom))] sm:px-[var(--ui-page-x-wide)] sm:pt-20 sm:pb-20 lg:pt-24 lg:pb-24">
        <div className="site-footer-primary grid gap-14 lg:grid-cols-[minmax(22rem,0.95fr)_minmax(0,1.35fr)] lg:gap-20 xl:gap-24">
          <section
            aria-labelledby="footer-brand-title"
            className="site-footer-brand"
          >
            <Link
              aria-label="Elysia - עמוד הבית"
              className="brand-footer-mark inline-flex items-center"
              href="/"
            >
              <BrandLogo className="h-8 w-auto max-w-[11rem] sm:h-10 sm:max-w-[13rem]" />
            </Link>
            <span className="sr-only" id="footer-brand-title">
              Elysia
            </span>
            <p className="site-footer-brand-text mt-7 hidden max-w-lg text-base leading-8 sm:block sm:text-[1.05rem] sm:leading-9">
              ב-Elysia תמצאי תכשיטי כסף 925 וציפוי זהב, לכל יום ולאירועים
              מיוחדים.
            </p>
            {showNewsletter ? (
              <div className="site-footer-newsletter mt-7 max-w-xl sm:mt-11">
                <p className="site-footer-kicker text-xs font-medium tracking-normal">
                  הרשמה לניוזלטר
                </p>
                <p className="site-footer-newsletter-copy mt-4 hidden max-w-md text-sm leading-7 sm:block sm:leading-8">
                  עדכונים על קולקציות חדשות ופריטים נבחרים, ישירות למייל.
                </p>
                <NewsletterForm
                  hintText="אפשר לבטל את ההרשמה בכל עת."
                  submitLabel="הרשמה"
                  variant="footer"
                />
              </div>
            ) : null}
          </section>

          <nav
            aria-label="ניווט תחתון"
            className="site-footer-nav grid gap-0 md:grid-cols-2 md:gap-x-14 md:gap-y-12 xl:grid-cols-4 xl:gap-x-16 xl:gap-y-14"
            data-footer-nav-root
          >
            <FooterNav links={catalogLinks} title="קולקציות" />
            <FooterNav links={commerceLinks} title="תמיכה" />
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

        <div className="site-footer-legal grid gap-7 text-sm md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:gap-12">
          <div className="grid gap-2 text-center md:text-start">
            <p className="max-w-xl leading-7" data-testid="footer-copyright">
              © {currentYear} Elysia. כל הזכויות שמורות.
            </p>
            {/* TODO(owner): populate footerBusinessDetails in
                src/lib/legal-content.ts with the verified legal business name
                and registration number. Until then we never expose the
                bracketed CMS placeholder to visitors. */}
            {footerBusinessDetails.includes("[") ? null : (
              <p
                className="max-w-xl text-xs leading-6"
                data-testid="footer-business-details"
              >
                {footerBusinessDetails}
              </p>
            )}
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
      <ul className="mt-6 grid gap-4 text-sm">
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
      aria-label="שירות ומידע"
      className="footer-trust-layer mt-16 hidden border-y border-[var(--glass-border)] py-8 sm:block"
      data-testid="footer-trust-layer"
    >
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4 xl:gap-8">
        {footerTrustSignals.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              className="footer-trust-link grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-start gap-3 rounded-md px-0 py-3 transition focus-visible:ring-3 focus-visible:ring-[var(--glass-focus)] focus-visible:outline-none"
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
