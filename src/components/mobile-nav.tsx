"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { Gem, Menu } from "lucide-react";

import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "~/components/ui/sheet";

export type HeaderNavItem = {
  href: string;
  label: string;
};

const subscribe = () => () => undefined;
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export function MobileNav({ items }: { items: HeaderNavItem[] }) {
  const mounted = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot,
  );

  if (!mounted) {
    return (
      <Button
        aria-label="Open navigation"
        className="lg:hidden"
        disabled
        size="icon"
        type="button"
        variant="ghost"
      >
        <Menu className="size-5" />
      </Button>
    );
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button className="lg:hidden" size="icon" type="button" variant="ghost">
          <Menu className="size-5" />
          <span className="sr-only">פתח ניווט</span>
        </Button>
      </SheetTrigger>
      <SheetContent
        className="w-80 border-black/10 bg-white/90 backdrop-blur-xl"
        side="right"
      >
        <SheetTitle className="sr-only">ניווט ראשי</SheetTitle>
        <Link
          className="flex items-center gap-2 text-lg font-semibold"
          href="/"
        >
          <Gem className="text-foreground size-5" />
          Aphrodite
        </Link>
        <Separator className="my-5" />
        <nav className="grid gap-2">
          {items.map((item) => (
            <Button
              asChild
              className="justify-start"
              key={item.href}
              variant="ghost"
            >
              <Link href={item.href}>{item.label}</Link>
            </Button>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
