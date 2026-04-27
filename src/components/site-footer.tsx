import Link from "next/link";
import { Gem, MapPin, Search, ShieldCheck, Sparkles } from "lucide-react";

import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { branches, categories } from "~/lib/catalog";

const serviceLinks = [
  { href: "/about", label: "אודות Aphrodite", icon: Gem },
  { href: "/search", label: "חיפוש בקטלוג", icon: Search },
  { href: "/checkout", label: "סל וקופה", icon: ShieldCheck },
  { href: "/account", label: "אזור לקוח", icon: Gem },
  { href: "/branches", label: "סניפים ואיסוף", icon: MapPin },
  { href: "/stylist", label: "סטייליסט AI", icon: Sparkles },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-black/10 bg-white/50 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:py-16">
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
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button asChild variant="secondary">
                <Link href="/stylist">
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

          <nav aria-label="קטגוריות">
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

          <nav aria-label="שירות וקנייה">
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

          <section aria-labelledby="footer-branches">
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
                  className="flex items-center justify-between gap-3 border-b border-black/10 pb-3 last:border-b-0"
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

        <div className="text-muted-foreground flex flex-col justify-between gap-3 text-sm sm:flex-row sm:items-center">
          <p>2026 Aphrodite. כל הזכויות שמורות.</p>
          <p>תשלום מאובטח, איסוף מסניף, אחריות ושירות מדידה בתיאום.</p>
        </div>
      </div>
    </footer>
  );
}
