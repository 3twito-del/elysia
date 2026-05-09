"use client";

import Link from "next/link";
import { Gem, Search, UserRound } from "lucide-react";

import { CartCountLink } from "~/components/cart-count-link";
import { MobileNav, type HeaderNavItem } from "~/components/mobile-nav";
import { Button } from "~/components/ui/button";

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
  return (
    <header
      className="glass-chrome site-chrome sticky top-0 z-50 border-b"
      dir="rtl"
    >
      <div className="mx-auto grid h-16 max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-3 px-4 sm:px-6 lg:gap-6">
        <div className="flex min-w-0 items-center gap-2 justify-self-start">
          <MobileNav items={navItems} />
          <Link
            className="flex min-w-0 shrink-0 items-center gap-2"
            dir="ltr"
            href="/"
          >
            <Gem className="text-foreground size-5" />
            <span className="truncate text-lg font-semibold tracking-normal sm:text-xl">
              Aphrodite
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
              className="px-2 text-sm xl:px-3"
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
