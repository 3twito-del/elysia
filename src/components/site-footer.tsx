import Link from "next/link";
import { SiInstagram, SiTiktok } from "react-icons/si";

import { NewsletterForm } from "~/components/newsletter-form";
import { Separator } from "~/components/ui/separator";
import { getCatalogCategories } from "~/server/services/catalog";

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

export async function SiteFooter() {
  const categories = await getCatalogCategories();

  const catalogLinks = [
    ...categories.map((category) => ({
      href: `/category/${category.slug}`,
      label: category.name,
    })),
    { href: "/search", label: "חיפוש בקטלוג" },
  ];

  return (
    <footer className="bg-transparent" dir="rtl">
      <div className="mx-auto max-w-7xl px-4 pt-12 pb-[calc(6.5rem+env(safe-area-inset-bottom))] sm:px-6 sm:pt-16 sm:pb-14 lg:pt-20 lg:pb-16">
        <div className="grid gap-12 border-t border-[var(--glass-border)] pt-10 sm:pt-12 lg:grid-cols-[1.28fr_0.72fr_0.72fr_0.72fr] lg:gap-16">
          <section className="max-w-xl">
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

          <FooterNav
            ariaLabel="ניווט קטלוג"
            links={catalogLinks}
            title="קטלוג"
          />
          <FooterNav
            ariaLabel="ניווט שירות וקנייה"
            links={commerceLinks}
            title="שירות וקנייה"
          />
          <FooterNav
            ariaLabel="ניווט מידע"
            links={informationLinks}
            title="מידע"
          />
        </div>

        <Separator className="my-9 sm:my-10" />

        <div className="text-muted-foreground grid gap-6 text-sm lg:grid-cols-[1fr_auto_auto] lg:items-center">
          <p className="max-w-xl text-center leading-7 lg:text-start">
            2026 Elysia. כל הזכויות שמורות. כל הזמנה מטופלת בתשומת לב, מאריזה
            ועד שירות לאחר קנייה.
          </p>
          <nav
            aria-label="קישורי מדיניות"
            className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 lg:justify-start"
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
    </footer>
  );
}

function FooterNav({
  ariaLabel,
  links,
  title,
}: {
  ariaLabel: string;
  links: readonly { href: string; label: string }[];
  title: string;
}) {
  return (
    <nav aria-label={ariaLabel}>
      <h2 className="text-foreground text-xs font-medium">{title}</h2>
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
    </nav>
  );
}
