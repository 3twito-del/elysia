import Link from "next/link";
import Image from "next/image";
import {
  AlertTriangle,
  Heart,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  MapPin,
  PackageCheck,
  RotateCcw,
  Ruler,
  ShieldCheck,
  Trash2,
  Truck,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";

import { CustomerOtpForm } from "./_components/customer-otp-form";
import { CustomerAddressForm } from "./_components/customer-address-form";
import { CustomerPrivacyActions } from "./_components/customer-privacy-actions";
import { CustomerSavedSizesForm } from "./_components/customer-saved-sizes-form";
import { createAccountServiceHref } from "./_lib/account-recovery";
import {
  createAccountOrderTimeline,
  getCurrentOrderTimelineEvent,
} from "./_lib/order-timeline";
import { getWishlistDecisionSupport } from "./_lib/wishlist-shortlist";
import { customerLogoutAction, removeWishlistItemAction } from "./actions";
import { CommercePageHero } from "~/components/commerce-page-hero";
import { MetricCard } from "~/components/metric-card";
import { RevealGrid, RevealSection } from "~/components/reveal";
import { SiteHeader } from "~/components/site-header";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { EmptyState } from "~/components/ui/empty-state";
import {
  getOrderSourceDescription,
  getOrderSourceLabel,
  getOrderStatusLabel,
  getShopifyFinancialStatusLabel,
  getShopifyFulfillmentStatusLabel,
} from "~/lib/commerce-labels";
import { formatPrice } from "~/lib/format";
import {
  formatSavedSize,
  getSizeKindLabel,
  sizeFitKinds,
  type SizeFitKind,
} from "~/lib/size-fit";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { DEFAULT_CATALOG_IMAGE } from "~/server/services/catalog";

export const metadata = {
  title: "אזור אישי",
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
                      category: true,
                      material: true,
                      media: {
                        where: { kind: "IMAGE" },
                        orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
                        take: 1,
                      },
                      stone: true,
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

  if (!customer) return null;

  const shopifyOrderMirrors = await db.shopifyOrderMirror.findMany({
    where: { customerEmail: customer.email },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return { ...customer, shopifyOrderMirrors };
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
        description="הסשן הנוכחי שייך למשתמש ניהול. האזור האישי מציג נתוני לקוח בלבד, כדי לשמור על הפרדה ברורה מפרטי הניהול."
        icon={ShieldCheck}
        testId="account-admin-forbidden"
        title="האזור האישי מיועד ללקוחות בלבד"
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
        description="פרטי החשבון אינם פתוחים כרגע. הנתונים לא נמחקו, ואפשר לנסות שוב בעוד רגע."
        icon={AlertTriangle}
        testId="account-load-error"
        title="האזור האישי אינו פתוח כרגע"
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
          description="כניסה להזמנות, מועדפים, מידות ופרטי חשבון."
          eyebrow="אזור אישי"
          title="אזור אישי"
          variant="checkout"
        />
        <RevealSection
          aria-label="כניסה לאזור אישי"
          className="mx-auto max-w-7xl scroll-mt-24 px-4 pt-1 pb-8 sm:scroll-mt-28 sm:px-6 sm:pt-3 sm:pb-10"
          id="account-login"
        >
          <div className="grid gap-5 lg:grid-cols-[minmax(0,400px)_1fr]">
            <Card className="rounded-md" size="sm">
              <CardHeader className="border-b border-[var(--glass-border)] pb-4">
                <CardTitle>כניסה</CardTitle>
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
                detail="פריטים שנשמרו להמשך"
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
                detail="פניות ושירות"
                icon={ShieldCheck}
                label="שירות"
                variant="soft"
                value="פתוח"
              />
            </RevealGrid>
          </div>
        </RevealSection>
      </main>
    );
  }

  const wishlistItems = customer.wishlist?.items ?? [];
  const wishlistDecisionSupport = getWishlistDecisionSupport(
    wishlistItems.map((item) => ({
      categoryName: item.variant.product.category.name,
      categorySlug: item.variant.product.category.slug,
      materialName: item.variant.product.material.name,
      productName: item.variant.product.name,
      productSlug: item.variant.product.slug,
      stoneName: item.variant.product.stone?.name,
      variantName: item.variant.name,
    })),
  );
  const accountOrderCount =
    customer.orders.length + customer.shopifyOrderMirrors.length;
  const latestLocalOrderNumber = customer.orders[0]?.orderNumber;
  const latestSupplierOrderNumber =
    customer.shopifyOrderMirrors[0]?.shopifyOrderName ??
    customer.shopifyOrderMirrors[0]?.shopifyOrderId;

  return (
    <main>
      <SiteHeader />
      <CommercePageHero
        className="account-entry-intro"
        description="כל ההזמנות, המועדפים, המידות, הכתובות והפרטיות שלך במקום אחד."
        eyebrow="אזור אישי"
        title="אזור אישי"
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
            value={String(accountOrderCount)}
          />
          <MetricCard
            detail="בחירות שמורות"
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
            value="מרחוק"
          />
        </RevealGrid>

        <AccountRecoveryShortcuts
          latestLocalOrderNumber={latestLocalOrderNumber}
          latestSupplierOrderNumber={latestSupplierOrderNumber}
        />

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
              {accountOrderCount === 0 ? (
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
                <>
                  {customer.orders.map((order) => {
                    const currentTimelineEvent = getCurrentOrderTimelineEvent(
                      createAccountOrderTimeline(order),
                    );

                    return (
                      <Link
                        className="glass-inset flex min-w-0 items-center justify-between gap-4 rounded-md border p-3"
                        data-testid="account-local-order"
                        href={`/account/orders/${order.id}`}
                        key={order.id}
                      >
                        <div className="min-w-0">
                          <p className="font-medium">{order.orderNumber}</p>
                          <div className="mt-1 flex flex-wrap gap-1.5">
                            <Badge className="w-fit" variant="secondary">
                              {getOrderSourceLabel("LOCAL")}
                            </Badge>
                            <Badge className="w-fit" variant="outline">
                              {getOrderStatusLabel(order.status)}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground mt-1 text-xs">
                            {getOrderSourceDescription("LOCAL")}
                          </p>
                          {currentTimelineEvent ? (
                            <p
                              className="text-muted-foreground mt-1 text-xs leading-5"
                              data-testid="account-local-order-timeline"
                            >
                              {currentTimelineEvent.label}
                              {" · "}
                              {currentTimelineEvent.description}
                            </p>
                          ) : null}
                        </div>
                        <span className="shrink-0 font-medium">
                          {formatPrice(Number(order.total))}
                        </span>
                      </Link>
                    );
                  })}
                  {customer.shopifyOrderMirrors.map((order) => (
                    <div
                      className="glass-inset flex min-w-0 items-center justify-between gap-4 rounded-md border p-3"
                      data-testid="account-shopify-mirror-order"
                      key={order.id}
                    >
                      <div className="min-w-0">
                        <p className="font-medium">
                          {order.shopifyOrderName ?? order.shopifyOrderId}
                        </p>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          <Badge className="w-fit" variant="secondary">
                            {getOrderSourceLabel("SHOPIFY_MIRROR")}
                          </Badge>
                          <Badge className="w-fit" variant="outline">
                            לקריאה בלבד
                          </Badge>
                        </div>
                        <p
                          className="text-muted-foreground mt-1 text-xs leading-5"
                          data-testid="account-shopify-mirror-order-timeline"
                        >
                          {getOrderSourceDescription("SHOPIFY_MIRROR")}
                        </p>
                        <p className="text-muted-foreground mt-1 text-xs leading-5">
                          תשלום:{" "}
                          {getShopifyFinancialStatusLabel(
                            order.financialStatus,
                          )}{" "}
                          · מסירה:{" "}
                          {getShopifyFulfillmentStatusLabel(
                            order.fulfillmentStatus,
                          )}
                        </p>
                        <Link
                          className="text-foreground mt-2 inline-flex text-xs font-medium underline-offset-4 hover:underline"
                          data-testid="account-shopify-service-link"
                          href={createAccountServiceHref({
                            message:
                              "אשמח לעזרה בהזמנת ספק שמופיעה באזור הלקוח.",
                            orderNumber:
                              order.shopifyOrderName ?? order.shopifyOrderId,
                            topic: "order",
                          })}
                        >
                          עזרה בהזמנת ספק
                        </Link>
                      </div>
                      <span className="shrink-0 font-medium">
                        {formatPrice(Number(order.total))}
                      </span>
                    </div>
                  ))}
                </>
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
                  description="עדיין לא נשמרה בחירה."
                  icon={Heart}
                  title="אין בחירות שמורות"
                  variant="inset"
                  actions={
                    <Button asChild variant="outline">
                      <Link href="/search">חיפוש במבחר</Link>
                    </Button>
                  }
                />
              ) : (
                <>
                  {wishlistDecisionSupport ? (
                    <div
                      className="glass-inset grid gap-3 rounded-md border p-3"
                      data-testid="account-wishlist-decision-support"
                    >
                      <p className="text-sm font-medium">
                        {wishlistDecisionSupport.summary}
                      </p>
                      <div className="grid gap-2 sm:grid-cols-3">
                        {wishlistDecisionSupport.cues.map((cue) => (
                          <div
                            className="bg-background rounded-md border border-[var(--glass-border)] p-2"
                            key={cue.id}
                          >
                            <p className="text-muted-foreground text-[0.7rem] tracking-normal uppercase">
                              {cue.label}
                            </p>
                            <p className="mt-1 truncate text-xs font-medium">
                              {cue.value}
                            </p>
                          </div>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button asChild size="sm" variant="outline">
                          <Link href={wishlistDecisionSupport.categoryHref}>
                            המשך בקטגוריה
                          </Link>
                        </Button>
                        <Button asChild size="sm" variant="outline">
                          <Link href="/size-guide">בדיקת מידה</Link>
                        </Button>
                        <Button asChild size="sm" variant="ghost">
                          <Link href={wishlistDecisionSupport.serviceHref}>
                            ייעוץ בחירה
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ) : null}
                  {wishlistItems.map((item) => (
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
                          data-icon-tooltip="הסרה"
                          data-icon-tooltip-placement="top"
                          size="icon"
                          type="submit"
                          variant="ghost"
                        >
                          <Trash2 aria-hidden="true" className="size-4" />
                          <span className="sr-only">הסרה</span>
                        </Button>
                      </form>
                    </div>
                  ))}
                </>
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
                      <Link href="/size-guide">פתיחת מדריך מידות</Link>
                    </Button>
                  }
                />
              ) : (
                <div className="grid gap-2 text-sm">
                  {customer.savedSizes.map((size) => (
                    <div
                      className="glass-inset flex items-center justify-between rounded-md border p-3"
                      key={size.id}
                    >
                      <span>{getSavedSizeLabel(size.kind)}</span>
                      <span className="font-medium">
                        {getSavedSizeValue(size.kind, size.value)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <CustomerSavedSizesForm savedSizes={customer.savedSizes} />
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
                description="אפשר לקבל ייעוץ, עזרה בבחירת מידה ומעקב אחרי הזמנות דרך השירות."
                icon={ShieldCheck}
                title="שירות"
                variant="inset"
                actions={
                  <>
                    <Button asChild variant="outline">
                      <Link href="/faq">שאלות ותשובות</Link>
                    </Button>
                    <Button asChild>
                      <Link href="/service">שירות</Link>
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

function AccountRecoveryShortcuts({
  latestLocalOrderNumber,
  latestSupplierOrderNumber,
}: {
  latestLocalOrderNumber?: string;
  latestSupplierOrderNumber?: string;
}) {
  const shortcuts = [
    {
      description: latestLocalOrderNumber
        ? `נפתח עם ${latestLocalOrderNumber} כבר בשדה ההזמנה.`
        : "נפתח טופס שירות לבירור הזמנה קיימת.",
      href: createAccountServiceHref({
        message: "אשמח לעזרה בבירור סטטוס ההזמנה.",
        orderNumber: latestLocalOrderNumber,
        topic: "order",
      }),
      icon: PackageCheck,
      label: "עזרה בהזמנה",
      testId: "account-recovery-order-help",
    },
    {
      description: latestLocalOrderNumber
        ? "בקשת החלפה או החזרה עם מספר ההזמנה האחרון."
        : "פתיחת פנייה בנושא החלפה, החזרה או זיכוי.",
      href: createAccountServiceHref({
        message: "אשמח לפתוח בקשת החלפה או החזרה.",
        orderNumber: latestLocalOrderNumber,
        topic: "returns",
      }),
      icon: RotateCcw,
      label: "החלפה או החזרה",
      testId: "account-recovery-return-help",
    },
    {
      description: latestSupplierOrderNumber
        ? `תמיכה בהזמנת ספק ${latestSupplierOrderNumber}.`
        : "תמיכה בהזמנת ספק שמטופלת מחוץ לקופה המקומית.",
      href: createAccountServiceHref({
        message: "אשמח לעזרה בהזמנת ספק שמופיעה באזור הלקוח.",
        orderNumber: latestSupplierOrderNumber,
        topic: "order",
      }),
      icon: Truck,
      label: "הזמנת ספק",
      testId: "account-recovery-supplier-help",
    },
    {
      description: "ייצוא נתונים, מחיקה או שאלה בנושא פרטיות ונגישות.",
      href: "#account-privacy",
      icon: LockKeyhole,
      label: "פרטיות ונתונים",
      testId: "account-recovery-privacy-help",
    },
  ];

  return (
    <section
      aria-labelledby="account-recovery-title"
      className="mt-7"
      data-testid="account-recovery-shortcuts"
    >
      <div className="mb-3 flex flex-col gap-1">
        <p className="text-muted-foreground text-xs font-medium tracking-normal uppercase">
          קיצורי שירות
        </p>
        <h2 className="text-xl font-semibold" id="account-recovery-title">
          מה צריך לפתור עכשיו?
        </h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {shortcuts.map((shortcut) => {
          const Icon = shortcut.icon;

          return (
            <Link
              className="brand-surface interactive-lift flex min-h-28 items-start gap-3 rounded-md p-3.5"
              data-testid={shortcut.testId}
              href={shortcut.href}
              key={shortcut.testId}
            >
              <span className="glass-inset grid size-10 shrink-0 place-items-center rounded-full border">
                <Icon aria-hidden="true" className="size-4" />
              </span>
              <span className="min-w-0">
                <span className="block font-semibold">{shortcut.label}</span>
                <span className="text-muted-foreground mt-1 block text-sm leading-6">
                  {shortcut.description}
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function getSavedSizeLabel(kind: string) {
  return isSizeFitKind(kind) ? getSizeKindLabel(kind) : kind;
}

function getSavedSizeValue(kind: string, value: string) {
  return isSizeFitKind(kind) ? formatSavedSize(kind, value) : value;
}

function isSizeFitKind(value: string): value is SizeFitKind {
  return (sizeFitKinds as readonly string[]).includes(value);
}
