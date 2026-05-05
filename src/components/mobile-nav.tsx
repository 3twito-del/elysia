"use client";

import Link from "next/link";
import { Gem, Menu } from "lucide-react";

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

export function MobileNav({ items }: { items: HeaderNavItem[] }) {
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
            Navigation links for the primary site sections.
          </SheetDescription>
        </SheetHeader>
        <Separator />
        <nav aria-label="ניווט מובייל" className="grid gap-1 p-3">
          {items.map((item) => (
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
      </SheetContent>
    </Sheet>
  );
}
