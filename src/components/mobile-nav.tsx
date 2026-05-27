"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import {
  ArrowLeft,
  CircleHelp,
  Gift,
  Headphones,
  Menu,
  Ruler,
  Search,
  ShoppingBag,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";

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
import { cn } from "~/lib/utils";

export type HeaderNavItem = {
  href: string;
  label: string;
};

type MobileNavProps = {
  currentPathname: string;
  items: HeaderNavItem[];
  onCategoryIntent?: (href: string) => void;
  onOpenCategoryPrefetch?: () => void;
};

const quickActions = [
  { href: "/search", label: "חיפוש", icon: Search },
  { href: "/branches", label: "אונליין", icon: Headphones },
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
    label: "סטייליסט אישי",
    description: "התאמה לפי סגנון, חומר ומידה",
    icon: Sparkles,
  },
  {
    href: "/gifts",
    label: "מתנות",
    description: "בחירה מדויקת לפי רגע ומחווה",
    icon: Gift,
  },
  {
    href: "/size-guide",
    label: "מדריך מידות",
    description: "טבעות, צמידים, שרשראות ועגילים",
    icon: Ruler,
  },
] as const;

function getMobileNavStaggerStyle(index: number) {
  return { "--mobile-nav-index": index } as CSSProperties;
}

export function MobileNav({
  currentPathname,
  items,
  onCategoryIntent,
  onOpenCategoryPrefetch,
}: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const closeNav = () => setOpen(false);
  const catalogItems = items.slice(0, 5);
  const editorialItems = items
    .slice(5)
    .filter(
      (item) => !serviceActions.some((action) => action.href === item.href),
    );

  useEffect(() => {
    if (open) {
      onOpenCategoryPrefetch?.();
    }
  }, [onOpenCategoryPrefetch, open]);

  return (
    <Sheet
      closeOnMediaQuery="(min-width: 768px)"
      onOpenChange={setOpen}
      open={open}
    >
      <SheetTrigger asChild>
        <Button
          aria-label="פתיחת ניווט"
          className="site-header-action md:hidden"
          data-icon-tooltip="פתיחת ניווט"
          data-icon-tooltip-placement="bottom"
          data-testid="mobile-nav-trigger"
          size="icon"
          type="button"
          variant="ghost"
        >
          <Menu aria-hidden="true" className="size-5" />
          <span className="sr-only">תפריט</span>
        </Button>
      </SheetTrigger>
      <SheetContent
        className="mobile-nav-panel w-[min(90vw,23.5rem)] overflow-y-auto p-0"
        data-testid="mobile-nav-sheet"
        showCloseButton={false}
        side="right"
      >
        <SheetTitle className="sr-only">ניווט ראשי</SheetTitle>
        <SheetDescription className="sr-only">
          קישורי ניווט ראשיים לאתר Elysia.
        </SheetDescription>

        <div className="mobile-nav-header border-b border-[var(--glass-border)] px-4 py-3.5">
          <div className="flex items-start justify-between gap-3">
            <Link
              className="brand-header-mark site-header-link mobile-nav-animated-item inline-flex min-h-10 items-center"
              href="/"
              onClick={closeNav}
              style={getMobileNavStaggerStyle(0)}
            >
              <span className="text-lg font-semibold">Elysia</span>
            </Link>
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
          </div>
          <p
            className="text-muted-foreground mobile-nav-animated-item mt-2 text-sm leading-6"
            style={getMobileNavStaggerStyle(1)}
          >
            תכשיטים בקו מדוד, ייעוץ אישי ושירות שקט.
          </p>
        </div>

        <div className="grid gap-3 p-3.5">
          <div className="grid grid-cols-4 gap-2">
            {quickActions.map((item, index) => {
              const Icon = item.icon;
              const isActive = currentPathname === item.href;

              return (
                <Link
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "mobile-nav-quick-action mobile-nav-animated-item text-muted-foreground hover:text-foreground grid min-h-12 place-items-center gap-1 rounded-md px-2 text-center text-xs transition-colors outline-none focus-visible:ring-3 focus-visible:ring-[var(--glass-focus)]",
                    isActive && "text-foreground font-semibold",
                  )}
                  href={item.href}
                  key={item.href}
                  onClick={closeNav}
                  style={getMobileNavStaggerStyle(2 + index)}
                >
                  <Icon aria-hidden="true" className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>

          <nav
            aria-label="מסלולים מהירים"
            className="mobile-nav-feature-list grid gap-1"
          >
            <p
              className="text-muted-foreground mobile-nav-animated-item px-1 text-xs font-medium"
              style={getMobileNavStaggerStyle(6)}
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
                    "mobile-nav-feature-link mobile-nav-animated-item group/nav-feature grid min-h-[3.75rem] grid-cols-[auto_1fr_auto] items-center gap-2.5 border-b border-[var(--glass-border)] px-1 py-2 outline-none focus-visible:ring-3 focus-visible:ring-[var(--glass-focus)]",
                    isActive && "text-foreground font-semibold",
                  )}
                  href={item.href}
                  key={item.href}
                  onClick={closeNav}
                  style={getMobileNavStaggerStyle(7 + index)}
                >
                  <span className="mobile-nav-feature-icon grid size-8 place-items-center rounded-md border border-[var(--glass-border)]">
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
          </nav>

          <Separator
            className="mobile-nav-animated-item"
            style={getMobileNavStaggerStyle(11)}
          />

          <nav
            aria-label="ניווט הקולקציה"
            className="mobile-nav-section grid gap-1"
          >
            <p
              className="text-muted-foreground mobile-nav-animated-item px-1 text-xs font-medium"
              style={getMobileNavStaggerStyle(12)}
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
                    "mobile-nav-link mobile-nav-animated-item text-muted-foreground hover:text-foreground relative inline-flex min-h-10 items-center rounded-md px-1 text-[0.96rem] transition-colors outline-none focus-visible:ring-3 focus-visible:ring-[var(--glass-focus)]",
                    isActive &&
                      "text-foreground after:bg-foreground font-semibold after:absolute after:inset-x-1 after:bottom-1 after:h-px after:content-['']",
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
                  prefetch={
                    item.href.startsWith("/category/") ? true : undefined
                  }
                  style={getMobileNavStaggerStyle(13 + index)}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <nav
            aria-label="ניווט שירות"
            className="mobile-nav-section grid gap-1"
          >
            <p
              className="text-muted-foreground mobile-nav-animated-item px-1 text-xs font-medium"
              style={getMobileNavStaggerStyle(19)}
            >
              שירות
            </p>
            {serviceActions.map((item, index) => {
              const Icon = item.icon;
              const isActive = currentPathname === item.href;

              return (
                <Link
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "mobile-nav-link mobile-nav-animated-item text-muted-foreground hover:text-foreground relative inline-flex min-h-10 items-center gap-2 rounded-md px-1 text-[0.96rem] transition-colors outline-none focus-visible:ring-3 focus-visible:ring-[var(--glass-focus)]",
                    isActive &&
                      "text-foreground after:bg-foreground font-semibold after:absolute after:inset-x-1 after:bottom-1 after:h-px after:content-['']",
                  )}
                  data-testid="mobile-nav-link"
                  href={item.href}
                  key={item.href}
                  onClick={closeNav}
                  style={getMobileNavStaggerStyle(20 + index)}
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
                    "mobile-nav-link mobile-nav-animated-item text-muted-foreground hover:text-foreground relative inline-flex min-h-10 items-center rounded-md px-1 text-[0.96rem] transition-colors outline-none focus-visible:ring-3 focus-visible:ring-[var(--glass-focus)]",
                    isActive &&
                      "text-foreground after:bg-foreground font-semibold after:absolute after:inset-x-1 after:bottom-1 after:h-px after:content-['']",
                  )}
                  data-testid="mobile-nav-link"
                  href={item.href}
                  key={item.href}
                  onClick={closeNav}
                  style={getMobileNavStaggerStyle(22 + index)}
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
