"use client";

import Link from "next/link";
import {
  CircleHelp,
  Gem,
  MapPin,
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
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "~/components/ui/sheet";

export type HeaderNavItem = {
  href: string;
  label: string;
};

const quickActions = [
  { href: "/search", label: "חיפוש", icon: Search },
  { href: "/checkout", label: "סל", icon: ShoppingBag },
  { href: "/account", label: "אזור לקוח", icon: UserRound },
] as const;

const serviceActions = [
  { href: "/ai", label: "ייעוץ אישי", icon: Sparkles },
  { href: "/branches", label: "סניפים", icon: MapPin },
  { href: "/faq", label: "שאלות", icon: CircleHelp },
] as const;

export function MobileNav({ items }: { items: HeaderNavItem[] }) {
  const catalogItems = items.slice(0, 5);
  const editorialItems = items
    .slice(5)
    .filter(
      (item) => !serviceActions.some((action) => action.href === item.href),
    );

  return (
    <Sheet closeOnMediaQuery="(min-width: 1024px)">
      <SheetTrigger asChild>
        <Button
          aria-label="פתיחת ניווט"
          className="lg:hidden"
          data-testid="mobile-nav-trigger"
          size="icon"
          type="button"
          variant="ghost"
        >
          <Menu className="size-5" />
          <span className="sr-only">פתח ניווט</span>
        </Button>
      </SheetTrigger>
      <SheetContent
        className="w-[min(88vw,22rem)] overflow-y-auto p-0"
        data-testid="mobile-nav-sheet"
        side="right"
      >
        <SheetHeader className="border-b border-[var(--glass-border)] p-4">
          <Link
            className="flex items-center gap-2 text-lg font-semibold"
            dir="ltr"
            href="/"
          >
            <Gem className="text-foreground size-5" />
            Aphrodite
          </Link>
          <SheetTitle className="sr-only">ניווט ראשי</SheetTitle>
          <SheetDescription className="sr-only">
            קישורי ניווט ראשיים לאתר Aphrodite.
          </SheetDescription>
        </SheetHeader>

        <div className="grid gap-4 p-4">
          <div className="grid grid-cols-3 gap-2">
            {quickActions.map((item) => {
              const Icon = item.icon;

              return (
                <Button
                  asChild
                  className="h-auto min-h-16 flex-col gap-2 px-2 text-xs"
                  key={item.href}
                  variant="outline"
                >
                  <Link href={item.href}>
                    <Icon className="size-4" />
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
                className="h-11 justify-start px-3 text-base"
                key={item.href}
                variant="ghost"
              >
                <Link data-testid="mobile-nav-link" href={item.href}>
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
                  className="h-11 justify-start gap-2 px-3 text-base"
                  key={item.href}
                  variant="ghost"
                >
                  <Link data-testid="mobile-nav-link" href={item.href}>
                    <Icon className="size-4" />
                    {item.label}
                  </Link>
                </Button>
              );
            })}
            {editorialItems.map((item) => (
              <Button
                asChild
                className="h-11 justify-start px-3 text-base"
                key={item.href}
                variant="ghost"
              >
                <Link data-testid="mobile-nav-link" href={item.href}>
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
