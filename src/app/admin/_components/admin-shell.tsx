import type { LucideIcon } from "lucide-react";
import {
  Bell,
  Boxes,
  CalendarClock,
  ClipboardList,
  Gauge,
  Headset,
  History,
  LogOut,
  Newspaper,
  PackageCheck,
  PlugZap,
  Users,
} from "lucide-react";
import Link from "next/link";

import { adminLogoutAction } from "~/app/admin/actions";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import type { AuthorizedAdmin } from "~/server/auth/admin-access";
import { cn } from "~/lib/utils";

type AdminShellProps = {
  active: AdminSection;
  admin: AuthorizedAdmin;
  children: React.ReactNode;
  description: string;
  eyebrow?: string;
  title: string;
};

export type AdminSection =
  | "appointments"
  | "audit"
  | "blog"
  | "catalog"
  | "customers"
  | "integrations"
  | "inventory"
  | "notifications"
  | "orders"
  | "overview"
  | "service";

const navItems: Array<{
  href: string;
  icon: LucideIcon;
  id: AdminSection;
  label: string;
}> = [
  { href: "/admin", icon: Gauge, id: "overview", label: "סקירה" },
  { href: "/admin/blog", icon: Newspaper, id: "blog", label: "מגזין" },
  { href: "/admin/orders", icon: ClipboardList, id: "orders", label: "הזמנות" },
  { href: "/admin/catalog", icon: PackageCheck, id: "catalog", label: "קטלוג" },
  { href: "/admin/inventory", icon: Boxes, id: "inventory", label: "מלאי" },
  { href: "/admin/customers", icon: Users, id: "customers", label: "לקוחות" },
  { href: "/admin/service", icon: Headset, id: "service", label: "שירות" },
  {
    href: "/admin/notifications",
    icon: Bell,
    id: "notifications",
    label: "Push",
  },
  {
    href: "/admin/appointments",
    icon: CalendarClock,
    id: "appointments",
    label: "תורים",
  },
  {
    href: "/admin/integrations",
    icon: PlugZap,
    id: "integrations",
    label: "אינטגרציות",
  },
  { href: "/admin/audit", icon: History, id: "audit", label: "יומן ביקורת" },
];

export function AdminShell({
  active,
  admin,
  children,
  description,
  eyebrow = "ניהול פנימי",
  title,
}: AdminShellProps) {
  return (
    <main className="bg-background min-h-screen" dir="rtl">
      <div className="mx-auto grid max-w-[1440px] gap-0 lg:grid-cols-[17rem_1fr]">
        <aside className="border-border/70 bg-card/95 border-b backdrop-blur lg:sticky lg:top-0 lg:z-30 lg:min-h-screen lg:border-e lg:border-b-0">
          <div className="grid gap-4 p-4 lg:p-5">
            <Link
              className="admin-brand-mark flex items-center text-lg font-semibold"
              dir="ltr"
              href="/admin"
            >
              Elysia
            </Link>
            <nav
              aria-label="אזורי ניהול"
              className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-1"
            >
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = active === item.id;

                return (
                  <Button
                    asChild
                    className={cn(
                      "h-11 w-full min-w-0 justify-start gap-2 px-3 text-start whitespace-normal lg:h-10",
                      isActive && "border-[var(--glass-border-strong)]",
                    )}
                    key={item.href}
                    variant={isActive ? "secondary" : "ghost"}
                  >
                    <Link
                      aria-current={isActive ? "page" : undefined}
                      href={item.href}
                    >
                      <Icon aria-hidden="true" className="size-4" />
                      <span className="min-w-0 truncate">{item.label}</span>
                    </Link>
                  </Button>
                );
              })}
            </nav>
            <Separator className="hidden lg:block" />
            <div className="bg-background/70 hidden gap-3 rounded-md border p-3 text-sm lg:grid">
              <div>
                <p className="font-medium">{admin.name}</p>
                <p className="text-muted-foreground">{admin.roleName}</p>
              </div>
              <form action={adminLogoutAction}>
                <Button
                  className="w-full gap-2"
                  type="submit"
                  variant="outline"
                >
                  <LogOut aria-hidden="true" className="size-4" />
                  יציאה
                </Button>
              </form>
            </div>
          </div>
        </aside>

        <section className="min-w-0 px-[var(--ui-page-x)] py-[var(--ui-section-y)] lg:px-[var(--ui-page-x-wide)] lg:py-[var(--ui-section-y-wide)]">
          <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="min-w-0">
              <Badge className="mb-3" variant="secondary">
                {eyebrow}
              </Badge>
              <h1 className="text-3xl font-semibold tracking-normal sm:text-4xl">
                {title}
              </h1>
              <p className="text-muted-foreground mt-3 max-w-3xl leading-7">
                {description}
              </p>
            </div>
            <form action={adminLogoutAction} className="lg:hidden">
              <Button className="gap-2" type="submit" variant="outline">
                <LogOut aria-hidden="true" className="size-4" />
                יציאה
              </Button>
            </form>
          </div>
          {children}
        </section>
      </div>
    </main>
  );
}
