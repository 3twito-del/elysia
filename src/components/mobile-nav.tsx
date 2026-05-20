"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  CircleHelp,
  Headphones,
  MapPin,
  Menu,
  Search,
  ShoppingBag,
  UserRound,
} from "lucide-react";

import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import {
  Sheet,
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
  { href: "/branches", label: "סניפים", icon: MapPin },
  { href: "/checkout", label: "סל", icon: ShoppingBag },
  { href: "/account", label: "אזור לקוח", icon: UserRound },
] as const;

const serviceActions = [
  { href: "/service", label: "שירות", icon: Headphones },
  { href: "/faq", label: "שאלות", icon: CircleHelp },
] as const;

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
          data-testid="mobile-nav-trigger"
          size="icon"
          type="button"
          variant="ghost"
        >
          <Menu aria-hidden="true" className="size-5" />
          <span className="sr-only">פתח ניווט</span>
        </Button>
      </SheetTrigger>
      <SheetContent
        className="w-[min(88vw,22rem)] overflow-y-auto p-0"
        data-testid="mobile-nav-sheet"
        showCloseButton={false}
        side="right"
      >
        <SheetTitle className="sr-only">ניווט ראשי</SheetTitle>
        <SheetDescription className="sr-only">
          קישורי ניווט ראשיים לאתר Elysia.
        </SheetDescription>

        <div className="border-b border-[var(--glass-border)] px-4 py-4">
          <Link
            className="brand-header-mark site-header-link inline-flex items-center"
            href="/"
            onClick={closeNav}
          >
            <span className="text-lg font-semibold">Elysia</span>
          </Link>
          <p className="text-muted-foreground mt-2 text-sm leading-6">
            תכשיטים אונליין, ייעוץ אישי ושירות לקוחות נגיש.
          </p>
        </div>

        <div className="grid gap-4 p-4">
          <div className="grid grid-cols-4 gap-2">
            {quickActions.map((item) => {
              const Icon = item.icon;
              const isActive = currentPathname === item.href;

              return (
                <Link
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "text-muted-foreground hover:text-foreground grid min-h-14 place-items-center gap-1.5 px-2 text-center text-xs transition-colors outline-none focus-visible:ring-3 focus-visible:ring-[var(--glass-focus)]",
                    isActive && "text-foreground font-semibold",
                  )}
                  href={item.href}
                  key={item.href}
                  onClick={closeNav}
                >
                  <Icon aria-hidden="true" className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>

          <Separator />

          <nav aria-label="ניווט קטלוג" className="grid gap-1">
            <p className="text-muted-foreground px-1 text-xs font-medium">
              קטלוג
            </p>
            {catalogItems.map((item) => {
              const isActive =
                currentPathname === item.href ||
                currentPathname.startsWith(`${item.href}/`);

              return (
                <Link
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "text-muted-foreground hover:text-foreground relative inline-flex min-h-10 items-center px-1 text-[0.96rem] transition-colors outline-none focus-visible:ring-3 focus-visible:ring-[var(--glass-focus)]",
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
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <nav aria-label="ניווט שירות" className="grid gap-1">
            <p className="text-muted-foreground px-1 text-xs font-medium">
              שירות
            </p>
            {serviceActions.map((item) => {
              const Icon = item.icon;
              const isActive = currentPathname === item.href;

              return (
                <Link
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "text-muted-foreground hover:text-foreground relative inline-flex min-h-10 items-center gap-2 px-1 text-[0.96rem] transition-colors outline-none focus-visible:ring-3 focus-visible:ring-[var(--glass-focus)]",
                    isActive &&
                      "text-foreground after:bg-foreground font-semibold after:absolute after:inset-x-1 after:bottom-1 after:h-px after:content-['']",
                  )}
                  data-testid="mobile-nav-link"
                  href={item.href}
                  key={item.href}
                  onClick={closeNav}
                >
                  <Icon aria-hidden="true" className="size-4" />
                  {item.label}
                </Link>
              );
            })}
            {editorialItems.map((item) => {
              const isActive = currentPathname === item.href;

              return (
                <Link
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "text-muted-foreground hover:text-foreground relative inline-flex min-h-10 items-center px-1 text-[0.96rem] transition-colors outline-none focus-visible:ring-3 focus-visible:ring-[var(--glass-focus)]",
                    isActive &&
                      "text-foreground after:bg-foreground font-semibold after:absolute after:inset-x-1 after:bottom-1 after:h-px after:content-['']",
                  )}
                  data-testid="mobile-nav-link"
                  href={item.href}
                  key={item.href}
                  onClick={closeNav}
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
