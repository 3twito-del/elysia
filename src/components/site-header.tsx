"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Heart, Search, UserRound } from "lucide-react";

import {
  isCategoryHref,
  useCategoryRoutePrefetch,
} from "~/components/category-route-prefetch";
import { BrandLogo } from "~/components/brand-logo";
import { CartCountLink } from "~/components/cart-count-link";
import { MobileNav, type HeaderNavItem } from "~/components/mobile-nav";
import { Button } from "~/components/ui/button";

const navItems: HeaderNavItem[] = [
  { href: "/search?sort=newest", label: "חדש" },
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
const HOME_HEADER_SOLID_SCROLL_Y = 8;

export function SiteHeader() {
  const pathname = usePathname();
  const [hasScrolled, setHasScrolled] = useState(false);
  const isHome = pathname === "/";
  const categoryPrefetch = useCategoryRoutePrefetch(categoryNavHrefs);
  const isOverHomeHero = isHome && !hasScrolled;
  const headerState = isOverHomeHero ? "transparent" : "solid";

  useEffect(() => {
    if (pathname !== "/") return;

    let frame = 0;
    let restoreTimer = 0;

    const syncScrollState = () => {
      frame = 0;
      const scrollY =
        window.scrollY ||
        document.documentElement.scrollTop ||
        document.body.scrollTop ||
        0;

      setHasScrolled(scrollY > HOME_HEADER_SOLID_SCROLL_Y);
    };

    const requestSync = () => {
      if (frame) return;

      frame = window.requestAnimationFrame(syncScrollState);
    };

    const requestRestoredSync = () => {
      requestSync();
      window.clearTimeout(restoreTimer);
      restoreTimer = window.setTimeout(requestSync, 120);
    };

    requestRestoredSync();
    window.addEventListener("scroll", requestSync, { passive: true });
    window.addEventListener("resize", requestSync);
    window.addEventListener("pageshow", requestRestoredSync);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(restoreTimer);
      window.removeEventListener("scroll", requestSync);
      window.removeEventListener("resize", requestSync);
      window.removeEventListener("pageshow", requestRestoredSync);
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
          Elysia: ניווט ראשי, חיפוש, שירות, מועדפים ואזור אישי.
        </p>
        <div
          className="grid h-16 w-full grid-cols-[1fr_auto_1fr] items-center px-4 sm:px-6 md:h-[4.25rem] md:px-10 lg:h-[6.125rem] lg:px-16"
          dir="ltr"
        >
          <div
            className="[grid-column:3] [grid-row:1] flex min-w-0 items-center gap-5 justify-self-end sm:gap-7"
            dir="rtl"
          >
            <MobileNav
              closeOnMediaQuery={false}
              currentPathname={pathname}
              items={navItems}
              onCategoryIntent={categoryPrefetch.prefetch}
              onOpenCategoryPrefetch={categoryPrefetch.prefetchAll}
              triggerClassName="min-h-10 text-[0.94rem] font-medium"
              triggerLabel="תפריט"
              triggerMode="label"
            />
            <Link
              aria-label="חיפוש"
              className="site-header-link site-header-label-action inline-flex min-h-10 items-center gap-2 text-[0.94rem] font-medium outline-none focus-visible:ring-3 focus-visible:ring-[var(--glass-focus)]"
              href="/search"
              prefetch={false}
            >
              <Search aria-hidden="true" className="size-5" />
              <span className="hidden sm:inline">חיפוש</span>
            </Link>
          </div>

          <Link
            className="brand-header-mark site-header-link [grid-column:2] [grid-row:1] flex min-w-0 shrink-0 items-center justify-self-center"
            aria-label="Elysia - עמוד הבית"
            dir="ltr"
            href="/"
            prefetch={false}
          >
            <BrandLogo className="h-6 w-auto max-w-[9rem] sm:h-8 sm:max-w-[12.5rem] lg:h-9 lg:max-w-[14.5rem] xl:h-10 xl:max-w-[16rem]" />
          </Link>

          <div
            className="[grid-column:1] [grid-row:1] flex min-w-0 items-center gap-3 justify-self-start sm:gap-5"
            dir="rtl"
          >
            <Link
              aria-label="שירות"
              className="site-header-link site-header-label-action hidden min-h-10 items-center text-[0.94rem] font-medium outline-none focus-visible:ring-3 focus-visible:ring-[var(--glass-focus)] md:inline-flex"
              href="/service"
              prefetch={false}
            >
              שירות
            </Link>
            <Button
              asChild
              className="site-header-action hidden size-10 sm:inline-flex sm:size-11"
              size="icon"
              variant="ghost"
            >
              <Link
                data-icon-tooltip="מועדפים"
                data-icon-tooltip-placement="bottom"
                href="/wishlist"
                prefetch={false}
              >
                <Heart aria-hidden="true" className="size-5" />
                <span className="sr-only">מועדפים</span>
              </Link>
            </Button>
            <CartCountLink
              className="site-header-action inline-grid size-10 place-items-center rounded-md outline-none focus-visible:ring-3 focus-visible:ring-[var(--glass-focus)] sm:size-11"
              data-icon-tooltip="סל"
              data-icon-tooltip-placement="bottom"
            />
            <Button
              asChild
              className="site-header-action size-10 sm:size-11"
              size="icon"
              variant="ghost"
            >
              <Link
                data-icon-tooltip="אזור אישי"
                data-icon-tooltip-placement="bottom"
                href="/account"
                prefetch={false}
              >
                <UserRound aria-hidden="true" className="size-5" />
                <span className="sr-only">אזור אישי</span>
              </Link>
            </Button>
          </div>
        </div>
      </header>
      <div aria-hidden="true" className="h-16 md:h-[4.25rem] lg:h-[6.125rem]" />
    </>
  );
}
