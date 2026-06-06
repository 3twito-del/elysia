import Link from "next/link";
import Image from "next/image";
import {
  AlertTriangle,
  ChevronLeft,
  FileText,
  Heart,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  Mail,
  MapPin,
  MessageCircle,
  PackageCheck,
  Phone,
  RotateCcw,
  Ruler,
  ShieldCheck,
  Sparkles,
  Trash2,
  Truck,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";

import { CustomerOtpForm } from "./_components/customer-otp-form";
import { CustomerAddressForm } from "./_components/customer-address-form";
import { GuestWishlistMergeNotice } from "./_components/guest-wishlist-merge-notice";
import { CustomerPrivacyActions } from "./_components/customer-privacy-actions";
import { CustomerSavedSizesForm } from "./_components/customer-saved-sizes-form";
import { createAccountServiceHref } from "./_lib/account-recovery";
import {
  createAccountOrderTimeline,
  getCurrentOrderTimelineEvent,
} from "./_lib/order-timeline";
import { getWishlistDecisionSupport } from "./_lib/wishlist-shortlist";
import { customerLogoutAction, removeWishlistItemAction } from "./actions";
import { RevealSection } from "~/components/reveal";
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

const guestAccountBenefitItems = [
  {
    description: "גישה מהירה לכל תכשיט שסימנת בלב.",
    icon: Heart,
    label: "שמירת תכשיטים מועדפים",
  },
  {
    description: "סטטוס, פרטי מסירה וחשבוניות יופיעו לאחר רכישה.",
    icon: PackageCheck,
    label: "מעקב אחר הזמנות וחשבוניות",
  },
  {
    description: "מידות לטבעות, שרשראות וצמידים נשמרות לבחירה מדויקת.",
    icon: Ruler,
    label: "שמירת מידות אישיות",
  },
  {
    description: "קישורי שירות וייעוץ נשארים קרובים לכל שלב.",
    icon: MessageCircle,
    label: "גישה מהירה לשירות אישי",
  },
] as const;

const accountServiceStripItems = [
  {
    description: "עזרה בבחירת תכשיט, מידה או מתנה.",
    icon: Sparkles,
    label: "ייעוץ לפני רכישה",
  },
  {
    description: "עדכונים לאחר רכישה במקום אחד.",
    icon: PackageCheck,
    label: "מעקב הזמנה",
  },
  {
    description: "כניסה להזמנות, מועדפים, מידות ופרטי חשבון.",
    icon: Ruler,
    label: "מידות שמורות",
  },
  {
    description: "פנייה מהירה לשירות ולתיאום.",
    icon: ShieldCheck,
    label: "שירות לאחר קנייה",
  },
] as const;

const accountNavigationItems = [
  { href: "#account-overview", label: "סקירה כללית" },
  { href: "#account-orders", label: "הזמנות" },
  { href: "#account-wishlist", label: "מועדפים" },
  { href: "#account-addresses", label: "כתובות" },
  { href: "#account-sizes", label: "מידות" },
  { href: "#account-profile", label: "פרופיל" },
  { href: "#account-service", label: "שירות" },
  { href: "#account-privacy", label: "פרטיות" },
] as const;

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
    <>
      <SiteHeader />
      <main className="account-boutique-page">
        <section className="mx-auto flex min-h-[60vh] max-w-3xl items-center px-[var(--ui-page-x)] py-[var(--ui-section-y-wide)] lg:px-[var(--ui-page-x-wide)]">
          <Card className="account-boutique-panel w-full rounded-md">
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
    </>
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
      <>
        <SiteHeader />
        <main className="account-boutique-page account-client-page" dir="rtl">
          <AccountPageHeader
            description="כניסה להזמנות, מועדפים, מידות ושירות."
            eyebrow="אזור אישי"
            title="החשבון שלך ב־Elysia"
          />
          <RevealSection
            aria-label="כניסה לאזור אישי"
            className="account-boutique-section account-entry-section mx-auto max-w-6xl scroll-mt-24 px-[var(--ui-page-x)] pt-1 pb-10 sm:scroll-mt-28 sm:pt-3 sm:pb-12 lg:px-[var(--ui-page-x-wide)]"
            id="account-login"
          >
          <div className="account-entry-layout grid gap-5 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:items-start">
            <Card
              className="account-boutique-panel account-entry-card account-login-panel rounded-md"
              size="sm"
            >
              <CardHeader className="account-boutique-card-header">
                <p className="account-card-kicker">כניסה מאובטחת</p>
                <CardTitle>כניסת לקוח</CardTitle>
                <p className="text-muted-foreground text-sm leading-7">
                  הזיני אימייל או מספר נייד ונשלח אלייך קוד חד־פעמי לכניסה
                  מאובטחת.
                </p>
              </CardHeader>
              <CardContent className="grid gap-5">
                <CustomerOtpForm />
                <nav
                  aria-label="קישורי עזרה בכניסה"
                  className="account-entry-micro-links"
                >
                  <Link
                    href={createAccountServiceHref({
                      message: "אשמח לעזרה במעקב אחר הזמנה.",
                      topic: "order",
                    })}
                  >
                    מעקב אחר הזמנה
                  </Link>
                  <Link href="/service">שירות לקוחות</Link>
                  <Link href="/faq">שאלות נפוצות</Link>
                </nav>
              </CardContent>
            </Card>
            <Card
              className="account-boutique-panel account-entry-card account-benefits-panel rounded-md"
              id="account-benefits"
              size="sm"
            >
              <CardHeader className="account-boutique-card-header">
                <p className="account-card-kicker">חשבון לקוחה</p>
                <CardTitle>חדשה ב־Elysia?</CardTitle>
                <p className="text-muted-foreground text-sm leading-7">
                  חשבון אישי מאפשר לשמור תכשיטים, לעקוב אחר הזמנות, לנהל מידות
                  ולקבל שירות מדויק יותר לפני ואחרי רכישה.
                </p>
              </CardHeader>
              <CardContent className="grid gap-5">
                <div className="grid gap-3">
                  {guestAccountBenefitItems.map((item) => (
                    <AccountFeatureRow
                      description={item.description}
                      icon={item.icon}
                      key={item.label}
                      label={item.label}
                    />
                  ))}
                </div>
                <p className="account-entry-note">אפשר לקבל עזרה לפני בחירה או אחרי הזמנה.</p>
              </CardContent>
            </Card>
          </div>
          <AccountServiceStrip />
          </RevealSection>
        </main>
      </>
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
  const accountTitle = getCustomerGreetingTitle(customer);

  return (
    <>
      <SiteHeader />
      <main className="account-boutique-page account-client-page" dir="rtl">
        <AccountPageHeader
          description="הזמנות, מועדפים, מידות ושירות - מרוכזים עבורך במקום אחד."
          eyebrow="אזור אישי"
          note="כניסה מאובטחת באמצעות קוד חד־פעמי."
          title={accountTitle}
        />
        <RevealSection
          className="account-boutique-section account-client-section mx-auto max-w-6xl scroll-mt-24 px-[var(--ui-page-x)] py-7 sm:scroll-mt-28 sm:py-10 lg:px-[var(--ui-page-x-wide)]"
          id="account-overview"
        >
        <div className="account-client-shell grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)] lg:items-start">
          <AccountSidebar />
          <div className="account-client-main min-w-0">
            <AccountSummaryPanel
              orderCount={accountOrderCount}
              savedSizeCount={customer.savedSizes.length}
              wishlistCount={wishlistItems.length}
            />
            <AccountRecoveryShortcuts
              latestLocalOrderNumber={latestLocalOrderNumber}
              latestSupplierOrderNumber={latestSupplierOrderNumber}
            />
            <GuestWishlistMergeNotice />

            <div className="account-section-stack mt-7 grid gap-5">
              <Card
                className="account-boutique-panel account-client-card scroll-mt-24 rounded-md sm:scroll-mt-28"
                id="account-profile"
                size="sm"
              >
                <CardHeader className="account-boutique-card-header">
                  <CardTitle className="flex items-center gap-2">
                    <UserRound aria-hidden="true" className="size-5" />
                    פרטים אישיים
                  </CardTitle>
                  <p className="text-muted-foreground text-sm leading-7">
                    פרטי קשר בסיסיים המשמשים לכניסה, שירות ומעקב אחרי הזמנות.
                  </p>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-3">
                  <AccountProfileField
                    icon={UserRound}
                    label="שם"
                    value={formatCustomerName(customer)}
                  />
                  <AccountProfileField
                    icon={Mail}
                    label="אימייל"
                    value={customer.email ?? "לא נשמר"}
                  />
                  <AccountProfileField
                    icon={Phone}
                    label="טלפון"
                    value={customer.phone ?? "לא נשמר"}
                  />
                </CardContent>
              </Card>

              <Card
                className="account-boutique-panel account-client-card scroll-mt-24 rounded-md sm:scroll-mt-28"
                id="account-orders"
                size="sm"
              >
                <CardHeader className="account-boutique-card-header">
                  <CardTitle>הזמנות</CardTitle>
                  <p className="text-muted-foreground text-sm leading-7">
                    סטטוס הזמנה, מקור הזמנה ופרטי מסירה לאחר רכישה.
                  </p>
                </CardHeader>
                <CardContent className="grid gap-3">
                  {accountOrderCount === 0 ? (
                    <EmptyState
                      description="ניתן לשמור כתובת למסירה מהירה."
                      icon={PackageCheck}
                      testId="account-empty-orders"
                      title="עדיין אין הזמנות בחשבון זה."
                      variant="inset"
                      actions={
                        <>
                          <Button asChild variant="outline">
                            <Link href="/search">המשך לקולקציות</Link>
                          </Button>
                        </>
                      }
                    />
                  ) : (
                    <>
                      {customer.orders.map((order) => {
                        const currentTimelineEvent =
                          getCurrentOrderTimelineEvent(
                            createAccountOrderTimeline(order),
                          );

                        return (
                          <Link
                            className="account-record-row flex min-w-0 items-center justify-between gap-4 rounded-md border p-3"
                            data-testid="account-local-order"
                            href={`/account/orders/${order.id}`}
                            key={order.id}
                          >
                            <div className="min-w-0">
                              <p className="font-medium">{order.orderNumber}</p>
                              <p className="text-muted-foreground mt-1 text-xs">
                                {formatAccountDate(order.createdAt)}
                              </p>
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
                          className="account-record-row flex min-w-0 items-center justify-between gap-4 rounded-md border p-3"
                          data-testid="account-shopify-mirror-order"
                          key={order.id}
                        >
                          <div className="min-w-0">
                            <p className="font-medium">
                              {order.shopifyOrderName ?? order.shopifyOrderId}
                            </p>
                            <p className="text-muted-foreground mt-1 text-xs">
                              {formatAccountDate(order.createdAt)}
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
                                  "אבקש עזרה בהזמנה שמופיעה באזור הלקוח.",
                                orderNumber:
                                  order.shopifyOrderName ??
                                  order.shopifyOrderId,
                                topic: "order",
                              })}
                            >פנייה לשירות</Link>
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
                className="account-boutique-panel account-client-card scroll-mt-24 rounded-md sm:scroll-mt-28"
                id="account-wishlist"
                size="sm"
              >
                <CardHeader className="account-boutique-card-header">
                  <CardTitle>מועדפים</CardTitle>
                  <p className="text-muted-foreground text-sm leading-7">
                    תכשיטים שנשמרו לגישה מהירה לפני בחירה או התייעצות.
                  </p>
                </CardHeader>
                <CardContent className="grid gap-3">
                  {wishlistItems.length === 0 ? (
                    <EmptyState
                      description="כשפריט יישמר, הוא יופיע כאן לגישה מהירה."
                      icon={Heart}
                      title="עדיין לא נשמרו תכשיטים."
                      variant="inset"
                      actions={
                        <Button asChild variant="outline">
                          <Link href="/search">צפייה בקולקציות</Link>
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
                          className="account-record-row flex items-center justify-between gap-4 rounded-md border p-3"
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
                            <input
                              name="itemId"
                              type="hidden"
                              value={item.id}
                            />
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
                className="account-boutique-panel account-client-card scroll-mt-24 rounded-md sm:scroll-mt-28"
                id="account-addresses"
                size="sm"
              >
                <CardHeader className="account-boutique-card-header">
                  <CardTitle>כתובות</CardTitle>
                  <p className="text-muted-foreground text-sm leading-7">
                    כתובות למשלוחים עתידיים ולשירות מהיר יותר לאחר רכישה.
                  </p>
                </CardHeader>
                <CardContent className="grid gap-4">
                  {customer.addresses.length === 0 ? (
                    <EmptyState
                      description="ניתן לשמור כתובת למשלוחים עתידיים לאחר רכישה או מתוך החשבון."
                      icon={MapPin}
                      title="אין כתובות שמורות"
                      variant="inset"
                    />
                  ) : (
                    customer.addresses.map((address) => (
                      <div
                        className="account-record-row rounded-md border p-3"
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
                className="account-boutique-panel account-client-card scroll-mt-24 rounded-md sm:scroll-mt-28"
                id="account-sizes"
                size="sm"
              >
                <CardHeader className="account-boutique-card-header">
                  <CardTitle>מידות</CardTitle>
                  <p className="text-muted-foreground text-sm leading-7">
                    שמרי מידות לטבעות, שרשראות וצמידים כדי להפוך בחירה עתידית
                    למהירה ומדויקת יותר.
                  </p>
                </CardHeader>
                <CardContent className="grid gap-3">
                  {customer.savedSizes.length === 0 ? (
                    <EmptyState
                      description="עד אז, ניתן להיעזר במדריך המידות או לפנות לשירות."
                      icon={Ruler}
                      title="פרופיל מידות יתווסף כאן בהמשך."
                      variant="inset"
                      actions={
                        <>
                          <Button asChild variant="outline">
                            <Link href="/size-guide">מה נדרש עכשיו?</Link>
                          </Button>
                          <Button asChild>
                            <Link href="/service?topic=sizing">ייעוץ אישי</Link>
                          </Button>
                        </>
                      }
                    />
                  ) : (
                    <div className="grid gap-2 text-sm">
                      {customer.savedSizes.map((size) => (
                        <div
                          className="account-record-row flex items-center justify-between rounded-md border p-3"
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
                className="account-boutique-panel account-client-card scroll-mt-24 rounded-md sm:scroll-mt-28"
                id="account-service"
                size="sm"
              >
                <CardHeader className="account-boutique-card-header">
                  <CardTitle>שירות אישי</CardTitle>
                  <p className="text-muted-foreground text-sm leading-7">
                    צריכה עזרה בבחירת תכשיט, התאמת מידה, מתנה או מעקב אחרי
                    הזמנה?
                  </p>
                </CardHeader>
                <CardContent className="grid gap-3">
                  <EmptyState
                    description="צוות השירות זמין לפנייה מסודרת לפני בחירה ולאחר רכישה."
                    icon={ShieldCheck}
                    title="שירות אישי"
                    variant="inset"
                    actions={
                      <>
                        <Button asChild variant="outline">
                          <Link href="/faq">שאלות נפוצות</Link>
                        </Button>
                        <Button asChild variant="outline">
                          <Link href="/stylist">ייעוץ אישי</Link>
                        </Button>
                        <Button asChild>
                          <Link href="/service">פנייה לשירות</Link>
                        </Button>
                      </>
                    }
                  />
                </CardContent>
              </Card>

              <Card
                className="account-boutique-panel account-client-card scroll-mt-24 rounded-md sm:scroll-mt-28"
                id="account-privacy"
                size="sm"
              >
                <CardHeader className="account-boutique-card-header">
                  <CardTitle className="flex items-center gap-2">
                    <ShieldCheck aria-hidden="true" className="size-5" />
                    פרטיות ואבטחה
                  </CardTitle>
                  <p className="text-muted-foreground text-sm leading-7">
                    ניהול פרטי החשבון, כניסה מאובטחת והעדפות פרטיות.
                  </p>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="account-record-row grid gap-2 rounded-md border p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium">שיטת כניסה</span>
                      <Badge variant="outline">קוד חד־פעמי</Badge>
                    </div>
                    <p className="text-muted-foreground text-sm leading-6">
                      הכניסה לחשבון מתבצעת באמצעות קוד חד־פעמי הנשלח לאימייל או
                      לנייד.
                    </p>
                    <Link className="account-text-link w-fit" href="/privacy">
                      מדיניות פרטיות
                    </Link>
                  </div>
                  <CustomerPrivacyActions />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
        </RevealSection>
      </main>
    </>
  );
}

function AccountPageHeader({
  description,
  eyebrow,
  note,
  title,
}: {
  description: string;
  eyebrow: string;
  note?: string;
  title: ReactNode;
}) {
  return (
    <section
      aria-labelledby="account-page-title"
      className="account-client-hero px-[var(--ui-page-x)] lg:px-[var(--ui-page-x-wide)]"
    >
      <div className="mx-auto grid max-w-3xl justify-items-center text-center">
        <p className="account-client-eyebrow">{eyebrow}</p>
        <h1
          className="account-client-title text-balance"
          id="account-page-title"
        >
          {title}
        </h1>
        <p className="account-client-description text-balance">{description}</p>
        {note ? <p className="account-client-secure-note">{note}</p> : null}
      </div>
    </section>
  );
}

function AccountFeatureRow({
  description,
  icon: Icon,
  label,
}: {
  description: string;
  icon: LucideIcon;
  label: string;
}) {
  return (
    <div className="account-feature-row">
      <span className="account-feature-icon">
        <Icon aria-hidden="true" className="size-4" />
      </span>
      <span className="min-w-0">
        <span className="block font-medium">{label}</span>
        <span className="text-muted-foreground mt-1 block text-sm leading-6">
          {description}
        </span>
      </span>
    </div>
  );
}

function AccountServiceStrip() {
  return (
    <section
      aria-label="שירותים בחשבון"
      className="account-service-strip"
      data-testid="account-service-strip"
    >
      {accountServiceStripItems.map((item) => (
        <AccountServiceStripItem
          description={item.description}
          icon={item.icon}
          key={item.label}
          label={item.label}
        />
      ))}
    </section>
  );
}

function AccountServiceStripItem({
  description,
  icon: Icon,
  label,
}: {
  description: string;
  icon: LucideIcon;
  label: string;
}) {
  return (
    <div className="account-service-strip-item">
      <Icon aria-hidden="true" className="size-4" />
      <div className="min-w-0">
        <p className="font-medium">{label}</p>
        <p className="text-muted-foreground mt-1 text-sm leading-6">
          {description}
        </p>
      </div>
    </div>
  );
}

function AccountSidebar() {
  return (
    <aside
      aria-label="ניווט אזור אישי"
      className="account-sidebar account-boutique-panel rounded-md"
    >
      <nav className="account-sidebar-nav">
        {accountNavigationItems.map((item, index) => (
          <Link
            aria-current={index === 0 ? "page" : undefined}
            className="account-sidebar-link"
            href={item.href}
            key={item.href}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <form action={customerLogoutAction}>
        <Button
          className="account-sidebar-logout"
          type="submit"
          variant="ghost"
        >
          <LogOut aria-hidden="true" className="size-4" />
          יציאה מהחשבון
        </Button>
      </form>
    </aside>
  );
}

function AccountSummaryPanel({
  orderCount,
  savedSizeCount,
  wishlistCount,
}: {
  orderCount: number;
  savedSizeCount: number;
  wishlistCount: number;
}) {
  const rows = [
    {
      action: "צפייה",
      detail:
        orderCount > 0
          ? `${orderCount} הזמנות משויכות לחשבון.`
          : "עדיין אין הזמנות בחשבון זה.",
      href: "#account-orders",
      icon: FileText,
      label: "הזמנות אחרונות",
      value: String(orderCount),
    },
    {
      action: "ניהול",
      detail:
        wishlistCount > 0
          ? `${wishlistCount} תכשיטים במועדפים לגישה מהירה.`
          : "עדיין לא נשמרו תכשיטים.",
      href: "#account-wishlist",
      icon: Heart,
      label: "מועדפים",
      value: String(wishlistCount),
    },
    {
      action: "עדכון",
      detail:
        savedSizeCount > 0
          ? `${savedSizeCount} מידות שמורות בפרופיל.`
          : "אפשר לשמור מידות לבחירה מדויקת יותר.",
      href: "#account-sizes",
      icon: Ruler,
      label: "מידות שמורות",
      value: String(savedSizeCount),
    },
    {
      action: "פנייה",
      detail: "שירות אישי זמין לבחירה, מידה, מתנה ומעקב הזמנה.",
      href: "#account-service",
      icon: MessageCircle,
      label: "פניות שירות",
      value: "פתוח",
    },
  ] as const;

  return (
    <section
      aria-labelledby="account-summary-title"
      className="account-summary-panel account-boutique-panel rounded-md"
      data-testid="account-summary-panel"
    >
      <div className="account-summary-heading">
        <p className="account-card-kicker">מרכז לקוחה</p>
        <h2 id="account-summary-title">סקירת חשבון</h2>
      </div>
      <div className="account-summary-rows">
        {rows.map((row) => (
          <AccountSummaryRow
            action={row.action}
            detail={row.detail}
            href={row.href}
            icon={row.icon}
            key={row.label}
            label={row.label}
            value={row.value}
          />
        ))}
      </div>
    </section>
  );
}

function AccountSummaryRow({
  action,
  detail,
  href,
  icon: Icon,
  label,
  value,
}: {
  action: string;
  detail: string;
  href: string;
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <Link className="account-summary-row" href={href}>
      <span className="account-summary-icon">
        <Icon aria-hidden="true" className="size-4" />
      </span>
      <span className="min-w-0">
        <span className="account-summary-label">{label}</span>
        <span className="account-summary-detail">{detail}</span>
      </span>
      <span className="account-summary-value">{value}</span>
      <span className="account-summary-action">
        {action}
        <ChevronLeft aria-hidden="true" className="size-4" />
      </span>
    </Link>
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
        message: "אבקש עזרה בבירור סטטוס ההזמנה.",
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
        ? `תמיכה בהזמנה נפרדת ${latestSupplierOrderNumber}.`
        : "תמיכה בהזמנה נפרדת שמטופלת מחוץ לקופה המקומית.",
      href: createAccountServiceHref({
        message: "אבקש עזרה בהזמנה שמופיעה באזור הלקוח.",
        orderNumber: latestSupplierOrderNumber,
        topic: "order",
      }),
      icon: Truck,
      label: "הזמנה נפרדת",
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
      className="account-support-shortcuts mt-7"
      data-testid="account-recovery-shortcuts"
    >
      <div className="mb-3 flex flex-col gap-1">
        <p className="text-muted-foreground text-xs font-medium tracking-normal uppercase">
          שירות לקוחות
        </p>
        <h2 className="text-xl font-semibold" id="account-recovery-title">
          שירות מהיר לחשבון
        </h2>
      </div>
      <div className="account-support-grid grid gap-0 sm:grid-cols-2 xl:grid-cols-4">
        {shortcuts.map((shortcut) => {
          const Icon = shortcut.icon;

          return (
            <Link
              className="account-support-link flex min-h-28 items-start gap-3 p-3.5"
              data-testid={shortcut.testId}
              href={shortcut.href}
              key={shortcut.testId}
            >
              <span className="account-support-icon grid size-10 shrink-0 place-items-center rounded-full border">
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

function AccountProfileField({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="account-profile-field glass-inset rounded-md border p-4">
      <span className="account-profile-field-icon">
        <Icon aria-hidden="true" className="size-4" />
      </span>
      <span className="min-w-0">
        <span className="text-muted-foreground block text-xs">{label}</span>
        <span className="mt-1 block truncate font-medium" dir="auto">
          {value}
        </span>
      </span>
    </div>
  );
}

function formatCustomerName(customer: {
  firstName: string | null;
  lastName: string | null;
}) {
  const fullName = [customer.firstName, customer.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName || "לא נשמר";
}

function getCustomerGreetingTitle(customer: {
  firstName: string | null;
  lastName: string | null;
}) {
  const fullName = [customer.firstName, customer.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName ? `שלום, ${fullName}` : "החשבון שלך";
}

function formatAccountDate(value: Date | string) {
  return new Intl.DateTimeFormat("he-IL", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
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
