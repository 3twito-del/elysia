"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gem, Search, UserRound } from "lucide-react";

import { CartCountLink } from "~/components/cart-count-link";
import { MobileNav, type HeaderNavItem } from "~/components/mobile-nav";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

const navItems: HeaderNavItem[] = [
  { href: "/category/rings", label: "טבעות" },
  { href: "/category/necklaces", label: "שרשראות" },
  { href: "/category/earrings", label: "עגילים" },
  { href: "/category/bracelets", label: "צמידים" },
  { href: "/gifts", label: "מתנות" },
  { href: "/about", label: "אודות" },
  { href: "/branches", label: "סניפים" },
  { href: "/ai", label: "ייעוץ אישי" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header
      className="glass-chrome site-chrome sticky top-0 z-40 border-b"
      dir="rtl"
    >
      <div className="mx-auto grid h-16 max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-3 px-4 sm:px-6 lg:gap-6">
        <div className="flex min-w-0 items-center gap-2 justify-self-start">
          <MobileNav items={navItems} />
          <Link
            className="flex min-w-0 shrink-0 items-center gap-2.5"
            dir="ltr"
            href="/"
          >
            <span className="grid size-8 place-items-center border border-[var(--luxury-accent-border)] bg-[var(--luxury-accent-soft)]">
              <Gem className="size-4 text-[var(--foreground)]" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-lg leading-5 font-semibold tracking-normal sm:text-xl">
                Aphrodite
              </span>
              <span className="text-muted-foreground hidden text-[0.68rem] leading-4 sm:block">
                Fine jewelry studio
              </span>
            </span>
          </Link>
        </div>

        <nav
          aria-label="ניווט ראשי"
          className="hidden min-w-0 items-center justify-center gap-0.5 lg:flex"
        >
          {navItems.map((item) => (
            <Button
              asChild
              className={cn(
                "relative px-2 text-sm after:absolute after:inset-x-3 after:bottom-1 after:h-px after:origin-center after:scale-x-0 after:bg-[var(--luxury-accent)] after:transition-transform after:duration-200 hover:after:scale-x-100 xl:px-3",
                isNavItemActive(pathname, item.href) &&
                  "text-foreground bg-[var(--luxury-accent-soft)] after:scale-x-100",
              )}
              key={item.href}
              variant="ghost"
            >
              <Link href={item.href}>{item.label}</Link>
            </Button>
          ))}
        </nav>

        <div className="flex items-center gap-1 justify-self-end" dir="ltr">
          <Button asChild size="icon" variant="ghost">
            <Link href="/search">
              <Search className="size-5" />
              <span className="sr-only">חיפוש</span>
            </Link>
          </Button>
          <Button asChild size="icon" variant="ghost">
            <Link href="/account">
              <UserRound className="size-5" />
              <span className="sr-only">אזור לקוח</span>
            </Link>
          </Button>
          <Button asChild size="icon" variant="ghost">
            <CartCountLink />
          </Button>
        </div>
      </div>
    </header>
  );
}

function isNavItemActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
