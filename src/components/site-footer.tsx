import Link from "next/link";
import {
  Gem,
  MapPin,
  MessageCircle,
  Phone,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

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
    <footer className="border-t border-black/10 bg-white/60 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-14">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr_0.85fr_1.15fr]">
          <section className="max-w-md">
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
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button asChild>
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
            <div className="mt-4 grid gap-5">
              {branches.map((branch) => (
                <address
                  className="text-muted-foreground not-italic"
                  key={branch.slug}
                >
                  <p className="text-foreground text-sm font-medium">
                    {branch.name}
                  </p>
                  <p className="mt-1 flex items-center gap-2 text-sm">
                    <MapPin className="size-4" />
                    {branch.address}, {branch.city}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-3 text-sm">
                    <a
                      className="hover:text-foreground inline-flex items-center gap-1.5 transition"
                      href={`tel:${branch.phone}`}
                    >
                      <Phone className="size-4" />
                      {branch.phone}
                    </a>
                    <a
                      className="hover:text-foreground inline-flex items-center gap-1.5 transition"
                      href={`https://wa.me/${branch.whatsapp}`}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <MessageCircle className="size-4" />
                      WhatsApp
                    </a>
                  </div>
                </address>
              ))}
            </div>
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
