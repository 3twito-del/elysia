"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Gem, Search, ShoppingBag, UserRound } from "lucide-react";

import { MobileNav, type HeaderNavItem } from "~/components/mobile-nav";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

const navItems: HeaderNavItem[] = [
  { href: "/category/rings", label: "טבעות" },
  { href: "/category/necklaces", label: "שרשראות" },
  { href: "/category/earrings", label: "עגילים" },
  { href: "/category/bracelets", label: "צמידים" },
  { href: "/category/rings?tag=bridal", label: "אירוסין" },
  { href: "/gifts", label: "מתנות" },
  { href: "/about", label: "אודות" },
  { href: "/branches", label: "סניפים" },
  { href: "/ai", label: "ייעוץ אישי" },
];

type HeaderScrollState = "top" | "shown" | "hidden";

export function SiteHeader() {
  const scrollState = useHeaderScrollState();
  const isCompact = scrollState !== "top";

  return (
    <header
      className={cn(
        "glass-chrome site-chrome sticky top-0 z-40 border-b transition-transform duration-300 ease-[var(--ease-liquid)] will-change-transform motion-reduce:translate-y-0 motion-reduce:transition-none",
        scrollState === "hidden" && "-translate-y-[calc(100%-0.5rem)]",
      )}
      data-scroll={scrollState}
      dir="rtl"
    >
      <div
        className={cn(
          "mx-auto grid max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-3 px-4 transition-[height] duration-300 ease-[var(--ease-liquid)] motion-reduce:transition-none sm:px-6 lg:gap-6",
          isCompact ? "h-14" : "h-16",
        )}
      >
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
            <Link href="/checkout">
              <ShoppingBag className="size-5" />
              <span className="sr-only">סל קניות</span>
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

function useHeaderScrollState() {
  const [scrollState, setScrollState] = useState<HeaderScrollState>("top");

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let lastScrollY = Math.max(window.scrollY, 0);
    let frame = 0;

    const shouldReduceMotion = () =>
      mediaQuery.matches ||
      document.documentElement.dataset.accessibilityMotion === "reduce";

    const syncScrollState = () => {
      frame = 0;

      if (shouldReduceMotion()) {
        setScrollState(window.scrollY > 24 ? "shown" : "top");
        lastScrollY = Math.max(window.scrollY, 0);
        return;
      }

      const currentScrollY = Math.max(window.scrollY, 0);
      const delta = currentScrollY - lastScrollY;

      if (currentScrollY < 24) {
        setScrollState("top");
      } else if (delta > 8 && currentScrollY > 96) {
        setScrollState("hidden");
      } else if (delta < -6) {
        setScrollState("shown");
      }

      lastScrollY = currentScrollY;
    };

    const requestSync = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(syncScrollState);
    };

    const handleMotionPreference = () => {
      if (shouldReduceMotion()) {
        setScrollState(window.scrollY > 24 ? "shown" : "top");
      } else {
        requestSync();
      }
    };

    requestSync();
    window.addEventListener("scroll", requestSync, { passive: true });
    window.addEventListener(
      "aphrodite:accessibility-settings",
      handleMotionPreference,
    );
    mediaQuery.addEventListener("change", handleMotionPreference);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", requestSync);
      window.removeEventListener(
        "aphrodite:accessibility-settings",
        handleMotionPreference,
      );
      mediaQuery.removeEventListener("change", handleMotionPreference);
    };
  }, []);

  return scrollState;
}
