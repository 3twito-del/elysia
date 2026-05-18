"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Gem, Search, UserRound } from "lucide-react";

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
  { href: "/ai", label: "ייעוץ אישי" },
  { href: "/service", label: "שירות" },
];
const categoryNavHrefs = navItems
  .map((item) => item.href)
  .filter(isCategoryHref);

type HeaderScrollState = "top" | "shown" | "hidden";
type AnchorScrollEventDetail = {
  phase?: "start" | "settle" | "end";
  targetTop?: number;
};

export function SiteHeader() {
  const pathname = usePathname();
  const scrollState = useHeaderScrollState();
  const categoryPrefetch = useCategoryRoutePrefetch(categoryNavHrefs, {
    prefetchOnHomeIdle: true,
  });

  return (
    <header
      className={cn(
        "glass-chrome site-chrome sticky top-0 z-50 h-16 border-b transition-transform duration-[220ms] ease-[var(--ease-motion-standard)] motion-reduce:translate-y-0 motion-reduce:transition-none",
        scrollState === "hidden"
          ? "-translate-y-[calc(100%+1px)]"
          : "translate-y-0",
      )}
      data-scroll={scrollState}
      dir="rtl"
    >
      <div className="mx-auto grid h-16 max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 sm:px-6 lg:grid-cols-[auto_1fr_auto] lg:gap-6">
        <div className="flex items-center justify-self-start lg:hidden">
          <MobileNav
            items={navItems}
            onCategoryIntent={categoryPrefetch.prefetch}
            onOpenCategoryPrefetch={categoryPrefetch.prefetchAll}
          />
        </div>

        <Link
          className="brand-header-mark flex min-w-0 shrink-0 items-center gap-2 justify-self-center lg:justify-self-start"
          dir="ltr"
          href="/"
        >
          <Gem aria-hidden="true" className="size-5" />
          <span className="truncate text-lg font-semibold tracking-normal sm:text-xl">
            Aphrodite
          </span>
        </Link>

        <nav
          aria-label="ניווט ראשי"
          className="hidden min-w-0 items-center justify-center gap-1 lg:flex"
        >
          {navItems.map((item) => {
            const categoryHref = isCategoryHref(item.href);
            const isActive =
              pathname === item.href ||
              (categoryHref && pathname.startsWith(`${item.href}/`));

            return (
              <Button
                asChild
                className={cn(
                  "h-10 px-3 text-[0.94rem] font-medium xl:px-4",
                  isActive &&
                    "bg-secondary text-foreground hover:bg-secondary shadow-none",
                )}
                key={item.href}
                variant="ghost"
              >
                <Link
                  aria-current={isActive ? "page" : undefined}
                  href={item.href}
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
              </Button>
            );
          })}
        </nav>

        <div className="flex items-center gap-1 justify-self-end" dir="ltr">
          <Button asChild size="icon" variant="ghost">
            <Link href="/search">
              <Search aria-hidden="true" className="size-5" />
              <span className="sr-only">חיפוש</span>
            </Link>
          </Button>
          <Button asChild size="icon" variant="ghost">
            <Link href="/account">
              <UserRound aria-hidden="true" className="size-5" />
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

function useHeaderScrollState() {
  const pathname = usePathname();
  const [scrollState, setScrollState] = useState<HeaderScrollState>("top");
  const anchorScrollLockUntil = useRef(0);
  const shouldHideDuringAnchorScroll = useRef(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let lastScrollY = Math.max(window.scrollY, 0);
    let frame = 0;
    const routeFrame = window.requestAnimationFrame(() => {
      lastScrollY = Math.max(window.scrollY, 0);
      setScrollState(lastScrollY > 24 ? "shown" : "top");
    });

    const shouldReduceMotion = () =>
      mediaQuery.matches ||
      document.documentElement.dataset.accessibilityMotion === "reduce";

    const syncScrollState = () => {
      frame = 0;

      const currentScrollY = Math.max(window.scrollY, 0);
      const delta = currentScrollY - lastScrollY;

      if (performance.now() < anchorScrollLockUntil.current) {
        if (currentScrollY < 24) {
          setScrollState("top");
        } else if (shouldReduceMotion()) {
          setScrollState("shown");
        } else if (shouldHideDuringAnchorScroll.current) {
          setScrollState("hidden");
        }

        lastScrollY = currentScrollY;
        return;
      }

      if (currentScrollY < 24) {
        setScrollState("top");
      } else if (shouldReduceMotion()) {
        setScrollState("shown");
      } else if (delta > 10 && currentScrollY > 160) {
        setScrollState("hidden");
      } else if (delta < -8) {
        setScrollState("shown");
      }

      lastScrollY = currentScrollY;
    };

    const requestSync = () => {
      if (frame) return;

      frame = window.requestAnimationFrame(syncScrollState);
    };

    const handleAnchorScroll = (event: Event) => {
      const detail = (event as CustomEvent<AnchorScrollEventDetail>).detail;
      const currentScrollY = Math.max(window.scrollY, 0);

      shouldHideDuringAnchorScroll.current =
        (detail?.targetTop ?? currentScrollY) > 160;
      anchorScrollLockUntil.current =
        performance.now() + (detail?.phase === "end" ? 260 : 1500);

      if (
        currentScrollY >= 24 &&
        shouldHideDuringAnchorScroll.current &&
        !shouldReduceMotion()
      ) {
        setScrollState("hidden");
      }

      lastScrollY = currentScrollY;
    };

    requestSync();
    window.addEventListener("scroll", requestSync, { passive: true });
    window.addEventListener("aphrodite:accessibility-settings", requestSync);
    window.addEventListener("aphrodite:anchor-scroll", handleAnchorScroll);
    mediaQuery.addEventListener("change", requestSync);

    return () => {
      window.cancelAnimationFrame(routeFrame);
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", requestSync);
      window.removeEventListener(
        "aphrodite:accessibility-settings",
        requestSync,
      );
      window.removeEventListener("aphrodite:anchor-scroll", handleAnchorScroll);
      mediaQuery.removeEventListener("change", requestSync);
    };
  }, [pathname]);

  return scrollState;
}
