"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  CircleHelp,
  Gem,
  Menu,
  Search,
  ShoppingBag,
  Sparkles,
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

export type HeaderNavItem = {
  href: string;
  label: string;
};

type MobileNavProps = {
  items: HeaderNavItem[];
  onCategoryIntent?: (href: string) => void;
  onOpenCategoryPrefetch?: () => void;
};

const quickActions = [
  { href: "/search", label: "חיפוש", icon: Search },
  { href: "/checkout", label: "סל", icon: ShoppingBag },
  { href: "/account", label: "אזור לקוח", icon: UserRound },
] as const;

const serviceActions = [
  { href: "/service", label: "שירות", icon: CircleHelp },
  { href: "/ai", label: "ייעוץ אישי", icon: Sparkles },
  { href: "/faq", label: "שאלות", icon: CircleHelp },
] as const;

export function MobileNav({
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
      closeOnMediaQuery="(min-width: 1024px)"
      onOpenChange={setOpen}
      open={open}
    >
      <SheetTrigger asChild>
        <Button
          aria-label="פתיחת ניווט"
          className="lg:hidden"
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
          קישורי ניווט ראשיים לאתר Aphrodite.
        </SheetDescription>

        <div className="border-b border-[var(--glass-border)] px-4 py-4">
          <Link
            className="brand-header-mark inline-flex items-center gap-2"
            href="/"
            onClick={closeNav}
          >
            <Gem aria-hidden="true" className="size-5" />
            <span className="text-lg font-semibold">Aphrodite</span>
          </Link>
          <p className="text-muted-foreground mt-2 text-sm leading-6">
            ׳§׳˜׳׳•׳’ ׳׳•׳ ׳׳™׳™׳, ׳™׳™׳¢׳•׳¥ ׳׳™׳©׳™ ׳•׳©׳™׳¨׳•׳× ׳˜׳׳₪׳•׳ ׳™.
          </p>
        </div>

        <div className="grid gap-4 p-4">
          <div className="grid grid-cols-3 gap-2">
            {quickActions.map((item) => {
              const Icon = item.icon;

              return (
                <Button
                  asChild
                  className="h-auto min-h-14 flex-col gap-1.5 px-2 text-xs"
                  key={item.href}
                  variant="outline"
                >
                  <Link href={item.href} onClick={closeNav}>
                    <Icon aria-hidden="true" className="size-4" />
                    {item.label}
                  </Link>
                </Button>
              );
            })}
          </div>

          <Separator />

          <nav aria-label="ניווט קטלוג" className="grid gap-1">
            <p className="text-muted-foreground px-1 text-xs font-medium">
              קטלוג
            </p>
            {catalogItems.map((item) => (
              <Button
                asChild
                className="h-10 justify-start px-3 text-[0.96rem]"
                key={item.href}
                variant="ghost"
              >
                <Link
                  data-testid="mobile-nav-link"
                  href={item.href}
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
              </Button>
            ))}
          </nav>

          <nav aria-label="ניווט שירות" className="grid gap-1">
            <p className="text-muted-foreground px-1 text-xs font-medium">
              שירות
            </p>
            {serviceActions.map((item) => {
              const Icon = item.icon;

              return (
                <Button
                  asChild
                  className="h-10 justify-start gap-2 px-3 text-[0.96rem]"
                  key={item.href}
                  variant="ghost"
                >
                  <Link
                    data-testid="mobile-nav-link"
                    href={item.href}
                    onClick={closeNav}
                  >
                    <Icon aria-hidden="true" className="size-4" />
                    {item.label}
                  </Link>
                </Button>
              );
            })}
            {editorialItems.map((item) => (
              <Button
                asChild
                className="h-10 justify-start px-3 text-[0.96rem]"
                key={item.href}
                variant="ghost"
              >
                <Link
                  data-testid="mobile-nav-link"
                  href={item.href}
                  onClick={closeNav}
                >
                  {item.label}
                </Link>
              </Button>
            ))}
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  );
}
