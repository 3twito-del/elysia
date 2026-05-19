import Link from "next/link";
import Image from "next/image";
import {
  AlertTriangle,
  Heart,
  LayoutDashboard,
  LogOut,
  MapPin,
  PackageCheck,
  Ruler,
  ShieldCheck,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";

import { CustomerOtpForm } from "./_components/customer-otp-form";
import { CustomerAddressForm } from "./_components/customer-address-form";
import { CustomerPrivacyActions } from "./_components/customer-privacy-actions";
import { customerLogoutAction, removeWishlistItemAction } from "./actions";
import { CommercePageHero } from "~/components/commerce-page-hero";
import { MetricCard } from "~/components/metric-card";
import { RevealGrid, RevealSection } from "~/components/reveal";
import { SiteHeader } from "~/components/site-header";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { EmptyState } from "~/components/ui/empty-state";
import { getOrderStatusLabel } from "~/lib/commerce-labels";
import { formatPrice } from "~/lib/format";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { DEFAULT_CATALOG_IMAGE } from "~/server/services/catalog";

export const metadata = {
  title: "אזור לקוח",
};

export const dynamic = "force-dynamic";

async function loadCustomerAccount(userId: string) {
  const customer = await db.customer.findUnique({
    where: { userId },
    include: {
      orders: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
      addresses: true,
      savedSizes: true,
      wishlist: {
        include: {
          items: {
            orderBy: { createdAt: "desc" },
            include: {
              variant: {
                include: {
                  product: {
                    include: {
                      media: {
                        where: { kind: "IMAGE" },
                        orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
                        take: 1,
                      },
                    },
                  },
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

function AccountStatePage({
  actions,
  description,
  icon,
  testId,
  title,
}: {
  actions?: ReactNode;
  description: ReactNode;
  icon: LucideIcon;
  testId: string;
  title: ReactNode;
}) {
  return (
    <main>
      <SiteHeader />
      <section className="mx-auto flex min-h-[60vh] max-w-3xl items-center px-4 py-16 sm:px-6">
        <Card className="w-full rounded-md">
          <CardContent className="p-4 sm:p-6">
            <EmptyState
              actions={actions}
              description={description}
              icon={icon}
              testId={testId}
              title={title}
              variant="inset"
            />
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

export default async function AccountPage() {
  const session = await auth();
  const isCustomerSession = Boolean(
    session?.user?.id && !session.user.adminUserId,
  );
  let accountLoadFailed = false;
  const customer =
    session?.user?.id && !session.user.adminUserId
      ? await loadCustomerAccount(session.user.id).catch((error: unknown) => {
          if (process.env.NODE_ENV === "development") {
            console.error("[account] failed to load customer account", error);
          }

          accountLoadFailed = true;
          return null;
        })
      : null;

  if (session?.user?.adminUserId) {
    return (
      <AccountStatePage
        actions={
          <>
            <Button asChild>
              <Link href="/admin">
                <LayoutDashboard aria-hidden="true" className="size-4" />
                מעבר לניהול
              </Link>
            </Button>
            <form action={customerLogoutAction}>
              <Button className="gap-2" type="submit" variant="outline">
                <LogOut aria-hidden="true" className="size-4" />
                יציאה
              </Button>
            </form>
          </>
        }
        description="הסשן הנוכחי שייך למשתמש ניהול. אזור לקוחות מציג נתוני לקוח בלבד, כדי לא לערבב בין תפעול לבין פרטים אישיים."
        icon={ShieldCheck}
        testId="account-admin-forbidden"
        title="אזור לקוחות זמין ללקוחות בלבד"
      />
    );
  }

  if (isCustomerSession && accountLoadFailed) {
    return (
      <AccountStatePage
        actions={
          <>
            <Button asChild>
              <Link href="/account">ניסיון חוזר</Link>
            </Button>
            <form action={customerLogoutAction}>
              <Button className="gap-2" type="submit" variant="outline">
                <LogOut aria-hidden="true" className="size-4" />
                יציאה
              </Button>
            </form>
          </>
        }
        description="לא הצלחנו לטעון את ההזמנות, הכתובות והמועדפים כרגע. הנתונים לא נמחקו, ואפשר לנסות שוב בעוד רגע."
        icon={AlertTriangle}
        testId="account-load-error"
        title="לא ניתן לטעון את אזור הלקוח"
      />
    );
  }

  if (isCustomerSession && !customer) {
    return (
      <AccountStatePage
        actions={
          <>
            <Button asChild>
              <Link href="/account">כניסה מחדש</Link>
            </Button>
            <form action={customerLogoutAction}>
              <Button className="gap-2" type="submit" variant="outline">
                <LogOut aria-hidden="true" className="size-4" />
                יציאה
              </Button>
            </form>
          </>
        }
        description="הסשן פעיל, אבל לא נמצא פרופיל לקוח תואם. כניסה מחדש תיצור חיבור נקי לחשבון הלקוח."
        icon={AlertTriangle}
        testId="account-missing-customer"
        title="פרופיל הלקוח לא נמצא"
      />
    );
  }

  if (!session?.user || !customer) {
    return (
      <main>
        <SiteHeader />
        <CommercePageHero
          className="account-entry-intro"
          description="כניסה מאובטחת להזמנות, מועדפים, מידות שמורות, שירות ופרטיות."
          eyebrow="Aphrodite Account"
          title="אזור לקוח"
          variant="checkout"
        />
        <RevealSection
          aria-label="כניסה לאזור לקוח"
          className="mx-auto max-w-7xl scroll-mt-24 px-4 pt-1 pb-8 sm:scroll-mt-28 sm:px-6 sm:pt-3 sm:pb-10"
          id="account-login"
        >
          <div className="grid gap-5 lg:grid-cols-[minmax(0,400px)_1fr]">
            <Card className="rounded-md" size="sm">
              <CardHeader className="border-b border-[var(--glass-border)] pb-4">
                <CardTitle>כניסת לקוח</CardTitle>
              </CardHeader>
              <CardContent>
                <CustomerOtpForm />
              </CardContent>
            </Card>
            <RevealGrid
              className="grid scroll-mt-24 gap-5 sm:scroll-mt-28 sm:grid-cols-2"
              id="account-benefits"
              variant="compact"
            >
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
                label="מועדפים"
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
                detail="ייעוץ אונליין ושירות אישי"
                icon={ShieldCheck}
                label="שירות"
                variant="soft"
                value="זמין"
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
      <CommercePageHero
        className="account-entry-intro"
        description="כל ההזמנות, המועדפים, המידות, הכתובות והפרטיות שלך במקום אחד."
        eyebrow="Aphrodite Account"
        title="אזור לקוח"
        variant="checkout"
      />
      <RevealSection
        className="mx-auto max-w-7xl scroll-mt-24 px-4 py-7 sm:scroll-mt-28 sm:px-6 sm:py-10"
        id="account-overview"
      >
        <div className="mb-6 flex justify-end">
          <form action={customerLogoutAction}>
            <Button className="gap-2" type="submit" variant="outline">
              <LogOut aria-hidden="true" className="size-4" />
              יציאה
            </Button>
          </form>
        </div>
        <RevealGrid
          className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4"
          variant="cards"
        >
          <MetricCard
            detail="הזמנות אחרונות"
            icon={PackageCheck}
            label="הזמנות"
            value={String(customer.orders.length)}
          />
          <MetricCard
            detail="פריטים שמורים"
            icon={Heart}
            label="מועדפים"
            value={String(wishlistItems.length)}
          />
          <MetricCard
            detail="מידות שמורות"
            icon={Ruler}
            label="מידות"
            value={String(customer.savedSizes.length)}
          />
          <MetricCard
            detail="ייעוץ ומעקב אחרי הזמנות"
            icon={ShieldCheck}
            label="שירות"
            value="אונליין"
          />
        </RevealGrid>

        <div className="mt-7 grid gap-5 lg:grid-cols-2">
          <Card
            className="scroll-mt-24 rounded-md sm:scroll-mt-28"
            id="account-orders"
            size="sm"
          >
            <CardHeader>
              <CardTitle>הזמנות אחרונות</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {customer.orders.length === 0 ? (
                <EmptyState
                  description="אין הזמנות משויכות לחשבון הזה עדיין."
                  icon={PackageCheck}
                  title="אין הזמנות"
                  variant="inset"
                  actions={
                    <Button asChild variant="outline">
                      <Link href="/category/rings">בחירת תכשיט ראשון</Link>
                    </Button>
                  }
                />
              ) : (
                customer.orders.map((order) => (
                  <Link
                    className="glass-inset flex min-w-0 items-center justify-between gap-4 rounded-md border p-3"
                    href={`/account/orders/${order.id}`}
                    key={order.id}
                  >
                    <div className="min-w-0">
                      <p className="font-medium">{order.orderNumber}</p>
                      <Badge className="mt-1 w-fit" variant="secondary">
                        {getOrderStatusLabel(order.status)}
                      </Badge>
                    </div>
                    <span className="shrink-0 font-medium">
                      {formatPrice(Number(order.total))}
                    </span>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          <Card
            className="scroll-mt-24 rounded-md sm:scroll-mt-28"
            id="account-wishlist"
            size="sm"
          >
            <CardHeader>
              <CardTitle>מועדפים</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {wishlistItems.length === 0 ? (
                <EmptyState
                  description="עדיין לא נשמרו מוצרים."
                  icon={Heart}
                  title="אין פריטים מועדפים"
                  variant="inset"
                  actions={
                    <Button asChild variant="outline">
                      <Link href="/search">חיפוש בקטלוג</Link>
                    </Button>
                  }
                />
              ) : (
                wishlistItems.map((item) => (
                  <div
                    className="glass-inset flex items-center justify-between gap-4 rounded-md border p-3"
                    key={item.id}
                  >
                    <Link
                      className="flex min-w-0 flex-1 items-center gap-3"
                      href={`/product/${item.variant.product.slug}`}
                    >
                      <span className="bg-muted relative size-14 shrink-0 overflow-hidden rounded-md border border-[var(--glass-border)]">
                        <Image
                          alt=""
                          className="media-color object-cover"
                          fill
                          sizes="56px"
                          src={
                            item.variant.product.media[0]?.url ??
                            DEFAULT_CATALOG_IMAGE
                          }
                        />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-medium">
                          {item.variant.product.name}
                        </span>
                        <span className="text-muted-foreground block text-xs">
                          {item.variant.name}
                        </span>
                      </span>
                    </Link>
                    <form action={removeWishlistItemAction}>
                      <input name="itemId" type="hidden" value={item.id} />
                      <Button
                        aria-label={`הסרת ${item.variant.product.name} מהמועדפים`}
                        size="icon"
                        type="submit"
                        variant="ghost"
                      >
                        <Trash2 aria-hidden="true" className="size-4" />
                        <span className="sr-only">הסרה</span>
                      </Button>
                    </form>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card
            className="scroll-mt-24 rounded-md sm:scroll-mt-28"
            id="account-addresses"
            size="sm"
          >
            <CardHeader>
              <CardTitle>כתובות שמורות</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              {customer.addresses.length === 0 ? (
                <EmptyState
                  description="אפשר לשמור כתובת למסירה מהירה בהזמנה הבאה."
                  icon={MapPin}
                  title="אין כתובות שמורות"
                  variant="inset"
                />
              ) : (
                customer.addresses.map((address) => (
                  <div
                    className="glass-inset rounded-md border p-3"
                    key={address.id}
                  >
                    <p className="font-medium">
                      {address.label ?? address.recipient}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {address.city}, {address.street}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {address.phone}
                    </p>
                  </div>
                ))
              )}
              <CustomerAddressForm />
            </CardContent>
          </Card>

          <Card
            className="scroll-mt-24 rounded-md sm:scroll-mt-28"
            id="account-sizes"
            size="sm"
          >
            <CardHeader>
              <CardTitle>מידות וסגנון</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {customer.savedSizes.length === 0 ? (
                <EmptyState
                  description="עדיין לא נשמרו מידות."
                  icon={Ruler}
                  title="אין מידות שמורות"
                  variant="inset"
                  actions={
                    <Button asChild variant="outline">
                      <Link href="/stylist">בניית פרופיל סגנון</Link>
                    </Button>
                  }
                />
              ) : (
                customer.savedSizes.map((size) => (
                  <div
                    className="glass-inset flex items-center justify-between rounded-md border p-3"
                    key={size.id}
                  >
                    <span>{size.kind}</span>
                    <span className="font-medium">{size.value}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
          <Card
            className="scroll-mt-24 rounded-md sm:scroll-mt-28"
            id="account-service"
            size="sm"
          >
            <CardHeader>
              <CardTitle>שירות</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <EmptyState
                description="אפשר לקבל ייעוץ אישי, עזרה בבחירת מידה ומעקב אחרי הזמנות דרך שירות הלקוחות."
                icon={ShieldCheck}
                title="שירות אונליין"
                variant="inset"
                actions={
                  <>
                    <Button asChild variant="outline">
                      <Link href="/faq">שאלות נפוצות</Link>
                    </Button>
                    <Button asChild>
                      <Link href="/service">שירות לקוחות</Link>
                    </Button>
                  </>
                }
              />
            </CardContent>
          </Card>

          <Card
            className="scroll-mt-24 rounded-md sm:scroll-mt-28"
            id="account-privacy"
            size="sm"
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck aria-hidden="true" className="size-5" />
                פרטיות ונתונים
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CustomerPrivacyActions />
            </CardContent>
          </Card>
        </div>
      </RevealSection>
    </main>
  );
}
