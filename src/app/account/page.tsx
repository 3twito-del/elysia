import Link from "next/link";
import Image from "next/image";
import {
  CalendarCheck,
  Heart,
  LogOut,
  MapPin,
  PackageCheck,
  Ruler,
  ShieldCheck,
  Trash2,
} from "lucide-react";

import { CustomerOtpForm } from "./_components/customer-otp-form";
import { CustomerAddressForm } from "./_components/customer-address-form";
import { CustomerPrivacyActions } from "./_components/customer-privacy-actions";
import { customerLogoutAction, removeWishlistItemAction } from "./actions";
import { BrandMediaPanel } from "~/components/brand-media-panel";
import { CinematicPageHero } from "~/components/cinematic-page-hero";
import { MetricCard } from "~/components/metric-card";
import { RevealGrid, RevealSection } from "~/components/reveal";
import { SiteHeader } from "~/components/site-header";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { EmptyState } from "~/components/ui/empty-state";
import { brandMedia, cinematicRouteMedia } from "~/lib/brand-media";
import {
  getAppointmentStatusLabel,
  getOrderStatusLabel,
} from "~/lib/commerce-labels";
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
      appointments: {
        orderBy: { startsAt: "desc" },
        take: 3,
        include: { branch: true },
      },
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
        <CinematicPageHero
          actions={
            <>
              <Button asChild size="lg">
                <Link href="#account-login">כניסה מאובטחת</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="#account-benefits">מה נשמר כאן</Link>
              </Button>
            </>
          }
          description="כניסה מאובטחת להזמנות, Wishlist, מידות שמורות, תורים ופרטיות."
          eyebrow="Aphrodite Account"
          scrollCue={{ href: "#account-login", label: "לכניסה" }}
          slides={cinematicRouteMedia.account}
          stats={[
            { label: "כניסה", value: "OTP" },
            { label: "Wishlist", value: "שמור" },
            { label: "פרטיות", value: "בשליטה" },
          ]}
          title="אזור לקוח"
          variant="service"
        />
        <RevealSection
          className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12"
          id="account-login"
        >
          <h1 className="text-3xl font-semibold sm:text-4xl">אזור לקוח</h1>
          <p className="text-muted-foreground mt-3 max-w-2xl leading-7">
            כניסה מאובטחת באמצעות קוד חד-פעמי. לאחר הכניסה יוצגו הזמנות,
            Wishlist, מידות שמורות ותורים.
          </p>
          <BrandMediaPanel
            alt="Aqua account and service jewelry tray"
            className="hidden"
            priority
            slides={brandMedia.service}
            variant="compact"
          />
          <div className="mt-6 grid gap-5 sm:mt-8 lg:grid-cols-[minmax(0,420px)_1fr]">
            <Card className="rounded-md">
              <CardHeader className="border-b border-[var(--glass-border)] pb-4">
                <CardTitle>כניסת לקוח</CardTitle>
              </CardHeader>
              <CardContent>
                <CustomerOtpForm />
              </CardContent>
            </Card>
            <RevealGrid
              className="grid gap-5 sm:grid-cols-2"
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
      <CinematicPageHero
        actions={
          <>
            <Button asChild size="lg">
              <Link href="#account-orders">הזמנות אחרונות</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="#account-service">תורים ושירות</Link>
            </Button>
          </>
        }
        description="כל ההזמנות, המועדפים, המידות, הכתובות והפרטיות שלך במקום אחד."
        eyebrow="Aphrodite Account"
        scrollCue={{ href: "#account-overview", label: "לסקירה" }}
        slides={cinematicRouteMedia.account}
        stats={[
          { label: "הזמנות", value: String(customer.orders.length) },
          { label: "Wishlist", value: String(wishlistItems.length) },
          { label: "תורים", value: String(customer.appointments.length) },
        ]}
        title="אזור לקוח"
        variant="service"
      />
      <RevealSection
        className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12"
        id="account-overview"
      >
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-3xl font-semibold sm:text-4xl">אזור לקוח</h1>
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
        <BrandMediaPanel
          alt="Aqua account and service jewelry tray"
          className="hidden"
          priority
          slides={brandMedia.service}
          variant="compact"
        />

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
          <Card className="rounded-md" id="account-orders">
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

          <Card className="rounded-md" id="account-wishlist">
            <CardHeader>
              <CardTitle>Wishlist</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {wishlistItems.length === 0 ? (
                <EmptyState
                  description="עדיין לא נשמרו מוצרים."
                  icon={Heart}
                  title="Wishlist ריק"
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
                      <Button size="icon" type="submit" variant="ghost">
                        <Trash2 className="size-4" />
                        <span className="sr-only">הסרה</span>
                      </Button>
                    </form>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="rounded-md" id="account-addresses">
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

          <Card className="rounded-md" id="account-sizes">
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
          <Card className="rounded-md" id="account-service">
            <CardHeader>
              <CardTitle>תורים</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {customer.appointments.length === 0 ? (
                <EmptyState
                  description="אפשר לתאם מדידה, איסוף או ייעוץ אישי באחד הסניפים."
                  icon={CalendarCheck}
                  title="אין תורים קרובים"
                  variant="inset"
                  actions={
                    <Button asChild variant="outline">
                      <Link href="/branches">תיאום תור</Link>
                    </Button>
                  }
                />
              ) : (
                <>
                  {customer.appointments.map((appointment) => (
                    <div
                      className="glass-inset rounded-md border p-3"
                      key={appointment.id}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{appointment.topic}</p>
                          <p className="text-muted-foreground text-sm">
                            {appointment.branch.name} ·{" "}
                            {appointment.startsAt.toLocaleString("he-IL")}
                          </p>
                        </div>
                        <Badge className="shrink-0" variant="secondary">
                          {getAppointmentStatusLabel(appointment.status)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  <Button asChild className="w-fit" variant="outline">
                    <Link href="/branches">תיאום תור נוסף</Link>
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-md" id="account-privacy">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="size-5" />
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
