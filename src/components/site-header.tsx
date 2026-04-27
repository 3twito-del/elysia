import Link from "next/link";
import { Gem, Search, ShoppingBag, UserRound } from "lucide-react";

import { MobileNav, type HeaderNavItem } from "~/components/mobile-nav";
import { Button } from "~/components/ui/button";

const navItems: HeaderNavItem[] = [
  { href: "/category/rings", label: "טבעות" },
  { href: "/category/necklaces", label: "שרשראות" },
  { href: "/category/earrings", label: "עגילים" },
  { href: "/category/bracelets", label: "צמידים" },
  { href: "/category/rings?tag=bridal", label: "אירוסין" },
  { href: "/gifts", label: "מתנות" },
  { href: "/about", label: "אודות" },
  { href: "/branches", label: "סניפים" },
  { href: "/stylist", label: "ייעוץ אישי" },
];

export function SiteHeader() {
  return (
    <header className="site-chrome sticky top-0 z-40 border-b border-black/10 bg-white/75 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <MobileNav items={navItems} />
          <Link className="flex items-center gap-2" href="/">
            <Gem className="text-foreground size-5" />
            <span className="text-xl font-semibold tracking-normal">
              Aphrodite
            </span>
          </Link>
        </div>

        <nav className="hidden items-center gap-0.5 lg:flex">
          {navItems.map((item) => (
            <Button asChild className="px-3" key={item.href} variant="ghost">
              <Link href={item.href}>{item.label}</Link>
            </Button>
          ))}
        </nav>

        <div className="flex items-center gap-1">
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
