import Link from "next/link";
import {
  CalendarCheck,
  Heart,
  LogOut,
  PackageCheck,
  Ruler,
} from "lucide-react";

import { CustomerOtpForm } from "./_components/customer-otp-form";
import { customerLogoutAction } from "./actions";
import { MetricCard } from "~/components/metric-card";
import { RevealGrid, RevealSection } from "~/components/reveal";
import { SiteHeader } from "~/components/site-header";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { auth } from "~/server/auth";
import { db } from "~/server/db";

export const metadata = {
  title: "אזור לקוח",
};

export const dynamic = "force-dynamic";

function formatPrice(amount: number) {
  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
    maximumFractionDigits: 0,
  }).format(amount);
}

async function loadCustomerAccount(userId: string) {
  const customer = await db.customer.findUnique({
    where: { userId },
    include: {
      appointments: {
        orderBy: { startsAt: "desc" },
        take: 3,
        include: { branch: true },
      },
      orders: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
      savedSizes: true,
      wishlist: {
        include: {
          items: {
            orderBy: { createdAt: "desc" },
            include: {
              variant: {
                include: {
                  product: true,
                },
              },
            },
          },
        },
      },
    },
  });

  return customer;
}

export default async function AccountPage() {
  const session = await auth();
  const customer = session?.user?.id
    ? await loadCustomerAccount(session.user.id).catch((error: unknown) => {
        if (process.env.NODE_ENV === "development") {
          console.error("[account] failed to load customer account", error);
        }

        return null;
      })
    : null;

  if (!session?.user || session.user.adminUserId || !customer) {
    return (
      <main>
        <SiteHeader />
        <RevealSection className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <h1 className="text-4xl font-semibold">אזור לקוח</h1>
          <p className="text-muted-foreground mt-3 max-w-2xl leading-7">
            כניסה מאובטחת באמצעות קוד חד-פעמי. לאחר הכניסה יוצגו הזמנות,
            Wishlist, מידות שמורות ותורים.
          </p>
          <div className="mt-8 grid gap-5 lg:grid-cols-[420px_1fr]">
            <Card className="rounded-md">
              <CardHeader className="border-b border-[var(--glass-border)] pb-4">
                <CardTitle>כניסת לקוח</CardTitle>
              </CardHeader>
              <CardContent>
                <CustomerOtpForm />
              </CardContent>
            </Card>
            <RevealGrid className="grid gap-5 sm:grid-cols-2">
              <MetricCard
                detail="סטטוס, חשבוניות והחזרות"
                icon={PackageCheck}
                label="הזמנות"
                variant="soft"
                value="מאובטח"
              />
              <MetricCard
                detail="מוצרים שמורים לקנייה"
                icon={Heart}
                label="Wishlist"
                variant="soft"
                value="פעיל"
              />
              <MetricCard
                detail="טבעות, שרשראות וצמידים"
                icon={Ruler}
                label="מידות"
                variant="soft"
                value="פרופיל"
              />
              <MetricCard
                detail="מדידה וייעוץ בסניף"
                icon={CalendarCheck}
                label="תורים"
                variant="soft"
                value="בתיאום"
              />
            </RevealGrid>
          </div>
        </RevealSection>
      </main>
    );
  }

  const wishlistItems = customer.wishlist?.items ?? [];

  return (
    <main>
      <SiteHeader />
      <RevealSection className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-4xl font-semibold">אזור לקוח</h1>
            <p className="text-muted-foreground mt-3 max-w-2xl leading-7">
              {customer.firstName ?? session.user.name ?? "לקוח/ה"} מחובר/ת. כאן
              נשמרות הזמנות, פריטים מועדפים, מידות ותורים.
            </p>
          </div>
          <form action={customerLogoutAction}>
            <Button className="gap-2" type="submit" variant="outline">
              <LogOut className="size-4" />
              יציאה
            </Button>
          </form>
        </div>

        <RevealGrid className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            detail="הזמנות אחרונות"
            icon={PackageCheck}
            label="הזמנות"
            value={String(customer.orders.length)}
          />
          <MetricCard
            detail="פריטים שמורים"
            icon={Heart}
            label="Wishlist"
            value={String(wishlistItems.length)}
          />
          <MetricCard
            detail="מידות שמורות"
            icon={Ruler}
            label="מידות"
            value={String(customer.savedSizes.length)}
          />
          <MetricCard
            detail="תורים אחרונים"
            icon={CalendarCheck}
            label="תורים"
            value={String(customer.appointments.length)}
          />
        </RevealGrid>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Card className="rounded-md">
            <CardHeader>
              <CardTitle>הזמנות אחרונות</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {customer.orders.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  אין הזמנות משויכות לחשבון הזה עדיין.
                </p>
              ) : (
                customer.orders.map((order) => (
                  <div
                    className="glass-inset flex items-center justify-between gap-4 rounded-md border p-3"
                    key={order.id}
                  >
                    <div>
                      <p className="font-medium">{order.orderNumber}</p>
                      <p className="text-muted-foreground text-xs">
                        {order.status}
                      </p>
                    </div>
                    <span>{formatPrice(Number(order.total))}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="rounded-md">
            <CardHeader>
              <CardTitle>Wishlist</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {wishlistItems.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  עדיין לא נשמרו מוצרים.
                </p>
              ) : (
                wishlistItems.map((item) => (
                  <Link
                    className="glass-inset flex items-center justify-between gap-4 rounded-md border p-3 transition hover:border-[var(--glass-border-strong)]"
                    href={`/product/${item.variant.product.slug}`}
                    key={item.id}
                  >
                    <div>
                      <p className="font-medium">{item.variant.product.name}</p>
                      <p className="text-muted-foreground text-xs">
                        {item.variant.name}
                      </p>
                    </div>
                    <Heart className="size-4" />
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </RevealSection>
    </main>
  );
}
