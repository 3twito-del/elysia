"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { MapPin, Search, UserRound } from "lucide-react";

import {
  isCategoryHref,
  useCategoryRoutePrefetch,
} from "~/components/category-route-prefetch";
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
  { href: "/service", label: "שירות" },
];
const categoryNavHrefs = navItems
  .map((item) => item.href)
  .filter(isCategoryHref);
const desktopNavItems = navItems.slice(0, 4);

export function SiteHeader() {
  const pathname = usePathname();
  const [hasScrolled, setHasScrolled] = useState(false);
  const categoryPrefetch = useCategoryRoutePrefetch(categoryNavHrefs, {
    prefetchOnHomeIdle: true,
  });
  const isOverHomeHero = pathname === "/" && !hasScrolled;
  const headerState = isOverHomeHero ? "transparent" : "solid";

  useEffect(() => {
    let frame = 0;

    const syncScrollState = () => {
      frame = 0;
      setHasScrolled(window.scrollY > 8);
    };

    const requestSync = () => {
      if (frame) return;

      frame = window.requestAnimationFrame(syncScrollState);
    };

    requestSync();
    window.addEventListener("scroll", requestSync, { passive: true });
    window.addEventListener("resize", requestSync);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", requestSync);
      window.removeEventListener("resize", requestSync);
    };
  }, [pathname]);

  return (
    <>
      <header
        className="site-header fixed inset-x-0 top-0 z-50 h-16 md:h-[4.25rem] lg:h-[6.125rem]"
        data-header-state={headerState}
        data-over-media={isOverHomeHero ? "true" : undefined}
        dir="rtl"
      >
        <p className="sr-only">
          Elysia היא סטודיו תכשיטים אונליין עם ניווט לקטלוג, חיפוש מוצרים, שירות
          לקוחות, אזור לקוח, סל קניות וקטגוריות טבעות, שרשראות, עגילים וצמידים.
        </p>
        <div className="mx-auto grid h-16 max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 sm:px-6 md:h-[4.25rem] md:grid-cols-[auto_1fr_auto] md:gap-3 lg:h-[6.125rem] lg:gap-5">
          <div className="flex items-center justify-self-start md:hidden">
            <MobileNav
              currentPathname={pathname}
              items={navItems}
              onCategoryIntent={categoryPrefetch.prefetch}
              onOpenCategoryPrefetch={categoryPrefetch.prefetchAll}
            />
          </div>

          <Link
            className="brand-header-mark site-header-link flex min-w-0 shrink-0 items-center justify-self-center md:justify-self-start"
            dir="ltr"
            href="/"
          >
            <span className="truncate text-[1.65rem] font-medium tracking-normal sm:text-3xl lg:text-[2.35rem]">
              Elysia
            </span>
          </Link>

          <nav
            aria-label="ניווט ראשי"
            className="hidden min-w-0 items-center justify-center gap-1 md:flex"
          >
            {desktopNavItems.map((item) => {
              const categoryHref = isCategoryHref(item.href);
              const isActive =
                pathname === item.href ||
                (categoryHref && pathname.startsWith(`${item.href}/`));

              return (
                <Link
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "site-header-link relative inline-flex h-9 items-center px-2 text-[0.86rem] font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-[var(--glass-focus)] xl:px-3",
                    isActive &&
                      "text-foreground after:bg-foreground font-semibold after:absolute after:inset-x-2 after:bottom-1 after:h-px after:content-[''] xl:after:inset-x-3",
                  )}
                  href={item.href}
                  key={item.href}
                  onFocus={
                    categoryHref
                      ? () => categoryPrefetch.prefetch(item.href)
                      : undefined
                  }
                  onPointerEnter={
                    categoryHref
                      ? () => categoryPrefetch.prefetch(item.href)
                      : undefined
                  }
                  prefetch={categoryHref ? true : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div
            className="flex items-center gap-0 justify-self-end sm:gap-1"
            dir="ltr"
          >
            <Button
              asChild
              className="site-header-action"
              size="icon"
              variant="ghost"
            >
              <Link href="/search">
                <Search aria-hidden="true" className="size-5" />
                <span className="sr-only">חיפוש</span>
              </Link>
            </Button>
            <Button
              asChild
              className="site-header-action hidden md:inline-flex"
              size="icon"
              variant="ghost"
            >
              <Link href="/branches">
                <MapPin aria-hidden="true" className="size-5" />
                <span className="sr-only">סניפים ושירות</span>
              </Link>
            </Button>
            <Button
              asChild
              className="site-header-action hidden md:inline-flex"
              size="icon"
              variant="ghost"
            >
              <Link href="/account">
                <UserRound aria-hidden="true" className="size-5" />
                <span className="sr-only">אזור לקוח</span>
              </Link>
            </Button>
            <Button
              asChild
              className="site-header-action"
              size="icon"
              variant="ghost"
            >
              <CartCountLink />
            </Button>
          </div>
        </div>
      </header>
      <div aria-hidden="true" className="h-16 md:h-[4.25rem] lg:h-[6.125rem]" />
    </>
  );
}
