import Link from "next/link";
import {
  ChevronDown,
  CircleHelp,
  Gem,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { NewsletterForm } from "~/components/newsletter-form";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import {
  getCatalogBranches,
  getCatalogCategories,
} from "~/server/services/catalog";

const serviceLinks = [
  { href: "/about", label: "אודות Aphrodite", icon: Gem },
  { href: "/search", label: "חיפוש בקטלוג", icon: Search },
  { href: "/checkout", label: "סל וקופה", icon: ShieldCheck },
  { href: "/account", label: "אזור לקוח", icon: Gem },
  { href: "/branches", label: "סניפים ואיסוף", icon: MapPin },
  { href: "/ai", label: "סטייליסט AI", icon: Sparkles },
  { href: "/faq", label: "שאלות ותשובות", icon: CircleHelp },
];

export async function SiteFooter() {
  const [branches, categories] = await Promise.all([
    getCatalogBranches(),
    getCatalogCategories(),
  ]);

  return (
    <footer className="site-chrome editorial-slab border-t">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:py-16">
        <div className="editorial-rule mb-10 grid gap-4 py-5 text-sm sm:grid-cols-3">
          {[
            "זמינות לפי סניף",
            "ייעוץ אישי ומתנות",
            "קופה, איסוף ושירות במקום אחד",
          ].map((item) => (
            <div className="atelier-line ps-4" key={item}>
              {item}
            </div>
          ))}
        </div>
        <div className="grid gap-12 lg:grid-cols-[1.25fr_0.8fr_0.85fr_1fr]">
          <section className="max-w-lg">
            <Link className="inline-flex items-center gap-2" href="/">
              <Gem className="text-foreground size-5" />
              <span className="text-2xl font-semibold tracking-normal">
                Aphrodite
              </span>
            </Link>
            <p className="text-muted-foreground mt-4 text-sm leading-7">
              רשת תכשיטי סטודיו ישראלית במיצוב יוקרה נגישה, עם קטלוג אונליין,
              זמינות לפי סניף וייעוץ אישי לבחירת תכשיט או מתנה.
            </p>
            <NewsletterForm />
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button asChild variant="secondary">
                <Link href="/ai">
                  ייעוץ אישי
                  <Sparkles className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/branches">
                  מציאת סניף
                  <MapPin className="size-4" />
                </Link>
              </Button>
            </div>
          </section>

          <div className="grid gap-3 lg:hidden">
            <details className="group glass-inset rounded-md border">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 text-sm font-semibold [&::-webkit-details-marker]:hidden">
                קטגוריות
                <ChevronDown className="size-4 transition group-open:rotate-180" />
              </summary>
              <ul className="text-muted-foreground grid gap-3 border-t border-[var(--glass-border)] p-4 text-sm">
                {categories.map((category) => (
                  <li key={category.slug}>
                    <Link
                      className="hover:text-foreground transition"
                      href={`/category/${category.slug}`}
                    >
                      {category.name}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link
                    className="hover:text-foreground transition"
                    href="/gifts"
                  >
                    מתנות
                  </Link>
                </li>
              </ul>
            </details>

            <details className="group glass-inset rounded-md border">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 text-sm font-semibold [&::-webkit-details-marker]:hidden">
                שירות וקנייה
                <ChevronDown className="size-4 transition group-open:rotate-180" />
              </summary>
              <ul className="grid gap-3 border-t border-[var(--glass-border)] p-4 text-sm">
                {serviceLinks.map((item) => {
                  const Icon = item.icon;

                  return (
                    <li key={item.href}>
                      <Link
                        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 transition"
                        href={item.href}
                      >
                        <Icon className="size-4" />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </details>

            <details className="group glass-inset rounded-md border">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 text-sm font-semibold [&::-webkit-details-marker]:hidden">
                סניפים וקשר
                <ChevronDown className="size-4 transition group-open:rotate-180" />
              </summary>
              <div className="grid gap-4 border-t border-[var(--glass-border)] p-4">
                <p className="text-muted-foreground text-sm leading-7">
                  בדיקת זמינות, מדידה ואיסוף מתבצעים בעמוד הסניפים כדי לשמור על
                  מידע מעודכן.
                </p>
                <ul className="grid gap-3 text-sm">
                  {branches.map((branch) => (
                    <li
                      className="flex items-center justify-between gap-3 border-b border-[var(--glass-border)] pb-3 last:border-b-0"
                      key={branch.slug}
                    >
                      <span className="font-medium">{branch.name}</span>
                      <span className="text-muted-foreground">
                        {branch.city}
                      </span>
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  className="w-full justify-between"
                  variant="outline"
                >
                  <Link href="/branches">
                    לכל הסניפים
                    <MapPin className="size-4" />
                  </Link>
                </Button>
              </div>
            </details>
          </div>

          <nav aria-label="קטגוריות" className="hidden lg:block">
            <h2 className="text-sm font-semibold">קטגוריות</h2>
            <ul className="text-muted-foreground mt-4 grid gap-3 text-sm">
              {categories.map((category) => (
                <li key={category.slug}>
                  <Link
                    className="hover:text-foreground transition"
                    href={`/category/${category.slug}`}
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  className="hover:text-foreground transition"
                  href="/gifts"
                >
                  מתנות
                </Link>
              </li>
            </ul>
          </nav>

          <nav aria-label="שירות וקנייה" className="hidden lg:block">
            <h2 className="text-sm font-semibold">שירות וקנייה</h2>
            <ul className="mt-4 grid gap-3 text-sm">
              {serviceLinks.map((item) => {
                const Icon = item.icon;

                return (
                  <li key={item.href}>
                    <Link
                      className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 transition"
                      href={item.href}
                    >
                      <Icon className="size-4" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <section
            aria-labelledby="footer-branches"
            className="hidden lg:block"
          >
            <h2 className="text-sm font-semibold" id="footer-branches">
              סניפים וקשר
            </h2>
            <p className="text-muted-foreground mt-4 text-sm leading-7">
              בדיקת זמינות, מדידה ואיסוף מתבצעים בעמוד הסניפים כדי לשמור על מידע
              מעודכן ולא לחזור על פרטים בכל תחתית עמוד.
            </p>
            <ul className="mt-5 grid gap-3 text-sm">
              {branches.map((branch) => (
                <li
                  className="flex items-center justify-between gap-3 border-b border-[var(--glass-border)] pb-3 last:border-b-0"
                  key={branch.slug}
                >
                  <span className="font-medium">{branch.name}</span>
                  <span className="text-muted-foreground">{branch.city}</span>
                </li>
              ))}
            </ul>
            <Button
              asChild
              className="mt-6 w-full justify-between"
              variant="outline"
            >
              <Link href="/branches">
                לכל הסניפים
                <MapPin className="size-4" />
              </Link>
            </Button>
          </section>
        </div>

        <Separator className="my-8" />

        <div className="text-muted-foreground flex flex-col justify-between gap-4 text-sm lg:flex-row lg:items-center">
          <p>2026 Aphrodite. כל הזכויות שמורות.</p>
          <nav
            aria-label="קישורי מדיניות"
            className="flex flex-wrap items-center gap-x-4 gap-y-2"
          >
            <Link className="hover:text-foreground transition" href="/terms">
              תקנון האתר
            </Link>
            <Link className="hover:text-foreground transition" href="/privacy">
              מדיניות פרטיות
            </Link>
            <Link
              className="hover:text-foreground transition"
              href="/accessibility"
            >
              הצהרת נגישות
            </Link>
            <Link
              className="hover:text-foreground transition"
              href="/newsletter/unsubscribe"
            >
              הסרה מדיוור
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
