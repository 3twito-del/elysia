"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import {
  ArrowLeft,
  CircleHelp,
  Gift,
  Heart,
  Headphones,
  History,
  Menu,
  Ruler,
  Search,
  ShoppingBag,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";

import { BrandLogo } from "~/components/brand-logo";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "~/components/ui/sheet";
import {
  COOKIE_CONSENT_EVENT,
  RECENTLY_VIEWED_STORAGE_KEY,
} from "~/lib/cookie-consent";
import { useCookieConsentValue } from "~/lib/use-cookie-consent";
import { cn } from "~/lib/utils";

export type HeaderNavItem = {
  href: string;
  label: string;
};

type MobileNavProps = {
  closeOnMediaQuery?: string | false;
  currentPathname: string;
  items: HeaderNavItem[];
  onCategoryIntent?: (href: string) => void;
  onOpenCategoryPrefetch?: () => void;
  triggerClassName?: string;
  triggerLabel?: string;
  triggerMode?: "icon" | "label";
};

const quickActions = [
  { href: "/search", label: "חיפוש", icon: Search },
  { href: "/branches", label: "אונליין", icon: Headphones },
  { href: "/wishlist", label: "מועדפים", icon: Heart },
  { href: "/checkout", label: "הבחירה", icon: ShoppingBag },
  { href: "/account", label: "אזור אישי", icon: UserRound },
] as const;

const serviceActions = [
  { href: "/service", label: "שירות", icon: Headphones },
  { href: "/faq", label: "שאלות", icon: CircleHelp },
] as const;

const spotlightActions = [
  {
    href: "/stylist",
    label: "יועץ התאמה",
    description: "התאמה לפי סגנון, חומר ומידה",
    icon: Sparkles,
  },
  {
    href: "/gifts",
    label: "מתנות",
    description: "בחירה לפי מחיר, אירוע וחומר",
    icon: Gift,
  },
  {
    href: "/size-guide",
    label: "מדריך מידות",
    description: "טבעות, צמידים, שרשראות ועגילים",
    icon: Ruler,
  },
] as const;

function isCollectionNavigationItem(item: HeaderNavItem) {
  return (
    item.href.startsWith("/category/") || item.href === "/search?sort=newest"
  );
}

function getMobileNavStaggerStyle(index: number) {
  return { "--mobile-nav-index": index } as CSSProperties;
}

export function MobileNav({
  closeOnMediaQuery = "(min-width: 768px)",
  currentPathname,
  items,
  onCategoryIntent,
  onOpenCategoryPrefetch,
  triggerClassName,
  triggerLabel = "תפריט",
  triggerMode = "icon",
}: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const consentValue = useCookieConsentValue();
  const [recentlyViewedProductHref, setRecentlyViewedProductHref] = useState<
    string | null
  >(null);
  const closeNav = () => setOpen(false);
  const catalogItems = items.filter(isCollectionNavigationItem);
  const editorialItems = items
    .filter((item) => !isCollectionNavigationItem(item))
    .filter(
      (item) =>
        item.href !== "/gifts" &&
        !serviceActions.some((action) => action.href === item.href),
    );
  const quickActionStartIndex = 2;
  const spotlightKickerIndex = quickActionStartIndex + quickActions.length;
  const spotlightActionStartIndex = spotlightKickerIndex + 1;
  const recentlyViewedIndex =
    spotlightActionStartIndex + spotlightActions.length;
  const separatorIndex =
    recentlyViewedIndex + (recentlyViewedProductHref ? 1 : 0);
  const catalogKickerIndex = separatorIndex + 1;
  const catalogStartIndex = catalogKickerIndex + 1;
  const serviceKickerIndex = catalogStartIndex + catalogItems.length;
  const serviceStartIndex = serviceKickerIndex + 1;
  const editorialStartIndex = serviceStartIndex + serviceActions.length;

  useEffect(() => {
    if (open) {
      onOpenCategoryPrefetch?.();
    }
  }, [onOpenCategoryPrefetch, open]);

  useEffect(() => {
    const syncRecentlyViewedShortcut = () => {
      if (consentValue !== "all") {
        setRecentlyViewedProductHref(null);
        return;
      }

      setRecentlyViewedProductHref(getRecentlyViewedProductHref());
    };

    syncRecentlyViewedShortcut();
    window.addEventListener("storage", syncRecentlyViewedShortcut);
    window.addEventListener(COOKIE_CONSENT_EVENT, syncRecentlyViewedShortcut);

    return () => {
      window.removeEventListener("storage", syncRecentlyViewedShortcut);
      window.removeEventListener(
        COOKIE_CONSENT_EVENT,
        syncRecentlyViewedShortcut,
      );
    };
  }, [consentValue]);

  return (
    <Sheet
      closeOnMediaQuery={closeOnMediaQuery || undefined}
      onOpenChange={setOpen}
      open={open}
    >
      <SheetTrigger asChild>
        <Button
          aria-label="פתיחת ניווט"
          className={cn(
            "site-header-action",
            triggerMode === "icon"
              ? "md:hidden"
              : "site-header-label-action gap-2 px-0",
            triggerClassName,
          )}
          data-icon-tooltip={triggerMode === "icon" ? "פתיחת ניווט" : undefined}
          data-icon-tooltip-placement={
            triggerMode === "icon" ? "bottom" : undefined
          }
          data-testid="mobile-nav-trigger"
          size={triggerMode === "icon" ? "icon" : "default"}
          type="button"
          variant="ghost"
        >
          <Menu aria-hidden="true" className="size-5" />
          <span
            className={triggerMode === "icon" ? "sr-only" : "hidden sm:inline"}
          >
            {triggerLabel}
          </span>
        </Button>
      </SheetTrigger>
      <SheetContent
        className="mobile-nav-panel mobile-nav-panel-luxury w-[min(100dvw,31rem)] overflow-y-auto p-0"
        data-nav-variant="luxury-editorial"
        data-testid="mobile-nav-sheet"
        dir="rtl"
        showCloseButton={false}
        side="right"
      >
        <SheetTitle className="sr-only">ניווט ראשי</SheetTitle>
        <SheetDescription className="sr-only">
          קישורי ניווט ראשיים לאתר Elysia.
        </SheetDescription>

        <div className="mobile-nav-header border-b border-[var(--glass-border)] px-5 py-5 sm:px-7">
          <div className="flex min-h-11 items-center justify-between gap-4">
            <SheetClose asChild>
              <Button
                aria-label="סגירת ניווט"
                className="mobile-nav-close"
                data-icon-tooltip="סגירה"
                data-icon-tooltip-placement="bottom"
                data-testid="mobile-nav-close"
                size="icon"
                type="button"
                variant="ghost"
              >
                <X aria-hidden="true" className="size-5" />
              </Button>
            </SheetClose>
            <Link
              aria-label="Elysia - עמוד הבית"
              className="brand-header-mark site-header-link mobile-nav-animated-item inline-flex min-h-10 items-center justify-self-end"
              href="/"
              onClick={closeNav}
              style={getMobileNavStaggerStyle(0)}
            >
              <BrandLogo className="h-5 w-auto max-w-[7.25rem]" />
            </Link>
          </div>
          <p
            className="mobile-nav-animated-item text-foreground mt-6 max-w-[24rem] text-[1.05rem] leading-8"
            style={getMobileNavStaggerStyle(1)}
          >
            תכשיטים, מידע, הזמנה ושירות.
          </p>
        </div>

        <div className="mobile-nav-luxury-body grid gap-8 px-5 py-6 sm:px-7">
          <nav
            aria-label="קיצורי שירות"
            className="mobile-nav-quick-list grid border-y border-[var(--glass-border)]"
          >
            {quickActions.map((item, index) => {
              const Icon = item.icon;
              const isActive = currentPathname === item.href;

              return (
                <Link
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "mobile-nav-quick-action mobile-nav-animated-item text-muted-foreground hover:text-foreground grid min-h-[3.25rem] grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-[var(--glass-border)] px-0 text-sm transition-colors outline-none last:border-b-0 focus-visible:ring-3 focus-visible:ring-[var(--glass-focus)]",
                    isActive && "text-foreground font-semibold",
                  )}
                  href={item.href}
                  key={item.href}
                  onClick={closeNav}
                  style={getMobileNavStaggerStyle(
                    quickActionStartIndex + index,
                  )}
                >
                  <Icon aria-hidden="true" className="size-4" />
                  <span>{item.label}</span>
                  <ArrowLeft
                    aria-hidden="true"
                    className="mobile-nav-feature-arrow size-4"
                  />
                </Link>
              );
            })}
          </nav>

          <nav
            aria-label="מסלולים מהירים"
            className="mobile-nav-feature-list grid gap-0"
          >
            <p
              className="mobile-nav-section-kicker text-muted-foreground mobile-nav-animated-item text-xs font-medium"
              style={getMobileNavStaggerStyle(spotlightKickerIndex)}
            >
              בחירה מהירה
            </p>
            {spotlightActions.map((item, index) => {
              const Icon = item.icon;
              const isActive = currentPathname === item.href;

              return (
                <Link
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "mobile-nav-feature-link mobile-nav-animated-item group/nav-feature grid min-h-[4.25rem] grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-[var(--glass-border)] px-0 py-3 outline-none focus-visible:ring-3 focus-visible:ring-[var(--glass-focus)]",
                    isActive && "text-foreground font-semibold",
                  )}
                  href={item.href}
                  key={item.href}
                  onClick={closeNav}
                  style={getMobileNavStaggerStyle(
                    spotlightActionStartIndex + index,
                  )}
                >
                  <span className="mobile-nav-feature-icon grid size-9 place-items-center">
                    <Icon aria-hidden="true" className="size-4" />
                  </span>
                  <span className="grid min-w-0 gap-0.5">
                    <span className="truncate text-[0.95rem] font-medium">
                      {item.label}
                    </span>
                    <span className="text-muted-foreground truncate text-xs">
                      {item.description}
                    </span>
                  </span>
                  <ArrowLeft
                    aria-hidden="true"
                    className="mobile-nav-feature-arrow size-4"
                  />
                </Link>
              );
            })}
            {recentlyViewedProductHref ? (
              <Link
                className="mobile-nav-feature-link mobile-nav-animated-item group/nav-feature grid min-h-[4.25rem] grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-[var(--glass-border)] px-0 py-3 outline-none focus-visible:ring-3 focus-visible:ring-[var(--glass-focus)]"
                data-testid="mobile-nav-recently-viewed-shortcut"
                href={recentlyViewedProductHref}
                onClick={closeNav}
                style={getMobileNavStaggerStyle(recentlyViewedIndex)}
              >
                <span className="mobile-nav-feature-icon grid size-9 place-items-center">
                  <History aria-hidden="true" className="size-4" />
                </span>
                <span className="grid min-w-0 gap-0.5">
                  <span className="truncate text-[0.95rem] font-medium">
                    נצפה לאחרונה
                  </span>
                  <span className="text-muted-foreground truncate text-xs">
                    חזרה מהירה למוצר האחרון שפתחתם
                  </span>
                </span>
                <ArrowLeft
                  aria-hidden="true"
                  className="mobile-nav-feature-arrow size-4"
                />
              </Link>
            ) : null}
          </nav>

          <Separator
            className="mobile-nav-animated-item"
            style={getMobileNavStaggerStyle(separatorIndex)}
          />

          <nav
            aria-label="ניווט הקולקציה"
            className="mobile-nav-section grid gap-0"
          >
            <p
              className="mobile-nav-section-kicker text-muted-foreground mobile-nav-animated-item text-xs font-medium"
              style={getMobileNavStaggerStyle(catalogKickerIndex)}
            >
              הקולקציה
            </p>
            {catalogItems.map((item, index) => {
              const isActive =
                currentPathname === item.href ||
                currentPathname.startsWith(`${item.href}/`);

              return (
                <Link
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "mobile-nav-link mobile-nav-animated-item text-muted-foreground hover:text-foreground relative inline-flex min-h-[3.05rem] items-center border-b border-[var(--glass-border)] px-0 text-[1.08rem] transition-colors outline-none focus-visible:ring-3 focus-visible:ring-[var(--glass-focus)]",
                    isActive &&
                      "text-foreground after:bg-foreground font-semibold after:absolute after:inset-x-0 after:bottom-0 after:h-px after:content-['']",
                  )}
                  data-testid="mobile-nav-link"
                  href={item.href}
                  key={item.href}
                  onFocus={
                    item.href.startsWith("/category/")
                      ? () => onCategoryIntent?.(item.href)
                      : undefined
                  }
                  onClick={closeNav}
                  onPointerEnter={
                    item.href.startsWith("/category/")
                      ? () => onCategoryIntent?.(item.href)
                      : undefined
                  }
                  prefetch={false}
                  style={getMobileNavStaggerStyle(catalogStartIndex + index)}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <nav
            aria-label="ניווט מידע ושירות"
            className="mobile-nav-section grid gap-0"
          >
            <p
              className="mobile-nav-section-kicker text-muted-foreground mobile-nav-animated-item text-xs font-medium"
              style={getMobileNavStaggerStyle(serviceKickerIndex)}
            >
              מידע ושירות
            </p>
            {serviceActions.map((item, index) => {
              const Icon = item.icon;
              const isActive = currentPathname === item.href;

              return (
                <Link
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "mobile-nav-link mobile-nav-animated-item text-muted-foreground hover:text-foreground relative inline-flex min-h-[3.05rem] items-center gap-2 border-b border-[var(--glass-border)] px-0 text-[1.08rem] transition-colors outline-none focus-visible:ring-3 focus-visible:ring-[var(--glass-focus)]",
                    isActive &&
                      "text-foreground after:bg-foreground font-semibold after:absolute after:inset-x-0 after:bottom-0 after:h-px after:content-['']",
                  )}
                  data-testid="mobile-nav-link"
                  href={item.href}
                  key={item.href}
                  onClick={closeNav}
                  style={getMobileNavStaggerStyle(serviceStartIndex + index)}
                >
                  <Icon aria-hidden="true" className="size-4" />
                  {item.label}
                </Link>
              );
            })}
            {editorialItems.map((item, index) => {
              const isActive = currentPathname === item.href;

              return (
                <Link
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "mobile-nav-link mobile-nav-animated-item text-muted-foreground hover:text-foreground relative inline-flex min-h-[3.05rem] items-center border-b border-[var(--glass-border)] px-0 text-[1.08rem] transition-colors outline-none focus-visible:ring-3 focus-visible:ring-[var(--glass-focus)]",
                    isActive &&
                      "text-foreground after:bg-foreground font-semibold after:absolute after:inset-x-0 after:bottom-0 after:h-px after:content-['']",
                  )}
                  data-testid="mobile-nav-link"
                  href={item.href}
                  key={item.href}
                  onClick={closeNav}
                  style={getMobileNavStaggerStyle(editorialStartIndex + index)}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function getRecentlyViewedProductHref() {
  try {
    const parsed: unknown = JSON.parse(
      window.localStorage.getItem(RECENTLY_VIEWED_STORAGE_KEY) ?? "[]",
    );

    const firstSlug = Array.isArray(parsed)
      ? parsed.find((value): value is string => typeof value === "string")
      : undefined;

    return firstSlug ? `/product/${firstSlug}` : null;
  } catch {
    return null;
  }
}
