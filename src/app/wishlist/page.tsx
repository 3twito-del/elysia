import Image from "next/image";
import Link from "next/link";
import {
  AlertTriangle,
  Heart,
  LayoutDashboard,
  LogOut,
  Search,
  Trash2,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";

import { GuestWishlistMergeNotice } from "../account/_components/guest-wishlist-merge-notice";
import { getWishlistDecisionSupport } from "../account/_lib/wishlist-shortlist";
import {
  customerLogoutAction,
  removeWishlistItemAction,
} from "../account/actions";
import { GuestWishlistProducts } from "./_components/guest-wishlist-products";
import { CommercePageHero } from "~/components/commerce-page-hero";
import { RevealGrid, RevealSection } from "~/components/reveal";
import { SiteHeader } from "~/components/site-header";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { EmptyState } from "~/components/ui/empty-state";
import { formatPrice } from "~/lib/format";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { DEFAULT_CATALOG_IMAGE } from "~/server/services/catalog";

export const metadata = {
  title: "מועדפים",
};

export const dynamic = "force-dynamic";

async function loadCustomerWishlist(userId: string) {
  return db.customer.findUnique({
    where: { userId },
    include: {
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
}

type CustomerWishlist = NonNullable<
  Awaited<ReturnType<typeof loadCustomerWishlist>>
>;
type CustomerWishlistItem = NonNullable<
  CustomerWishlist["wishlist"]
>["items"][number];

export default async function WishlistPage() {
  const session = await auth();
  const isCustomerSession = Boolean(
    session?.user?.id && !session.user.adminUserId,
  );
  let wishlistLoadFailed = false;
  const customer =
    isCustomerSession && session?.user?.id
      ? await loadCustomerWishlist(session.user.id).catch((error: unknown) => {
          if (process.env.NODE_ENV === "development") {
            console.error("[wishlist] failed to load customer wishlist", error);
          }

          wishlistLoadFailed = true;
          return null;
        })
      : null;

  if (session?.user?.adminUserId) {
    return (
      <WishlistStatePage
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
        description="מועדפים מוצגים ללקוחות בלבד, כדי להפריד בין חשבון ניהול לבין בחירות אישיות."
        icon={UserRound}
        testId="wishlist-admin-forbidden"
        title="מועדפים זמינים ללקוחות"
      />
    );
  }

  if (isCustomerSession && wishlistLoadFailed) {
    return (
      <WishlistStatePage
        actions={
          <>
            <Button asChild>
              <Link href="/wishlist">ניסיון חוזר</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/account">אזור אישי</Link>
            </Button>
          </>
        }
        description="לא הצלחנו לפתוח את המועדפים כרגע. הנתונים לא נמחקו, ואפשר לנסות שוב בעוד רגע."
        icon={AlertTriangle}
        testId="wishlist-load-error"
        title="המועדפים אינם פתוחים כרגע"
      />
    );
  }

  return (
    <main className="account-boutique-page wishlist-boutique-page">
      <SiteHeader />
      <CommercePageHero
        className="account-entry-intro account-boutique-hero wishlist-boutique-hero"
        description="התכשיטים ששמרת להמשך, עם חזרה מהירה לבחירה וסנכרון לחשבון."
        eyebrow="מועדפים"
        title="מועדפים"
        variant="checkout"
      />
      <RevealSection
        className="account-boutique-section mx-auto max-w-7xl scroll-mt-24 px-[var(--ui-page-x)] py-7 sm:scroll-mt-28 sm:py-10 lg:px-[var(--ui-page-x-wide)]"
        data-testid="wishlist-page-content"
      >
        {customer ? (
          <CustomerWishlistPanel customer={customer} />
        ) : (
          <GuestWishlistProducts />
        )}
      </RevealSection>
    </main>
  );
}

function WishlistStatePage({
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
  const Icon = icon;

  return (
    <main className="account-boutique-page wishlist-boutique-page">
      <SiteHeader />
      <section className="mx-auto flex min-h-[60vh] max-w-3xl items-center px-[var(--ui-page-x)] py-[var(--ui-section-y-wide)] lg:px-[var(--ui-page-x-wide)]">
        <Card className="account-boutique-panel w-full rounded-md">
          <CardContent className="p-4 sm:p-6">
            <EmptyState
              actions={actions}
              description={description}
              icon={Icon}
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

function CustomerWishlistPanel({ customer }: { customer: CustomerWishlist }) {
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

  return (
    <Card
      className="account-boutique-panel wishlist-boutique-panel rounded-md"
      data-testid="wishlist-account-panel"
      size="sm"
    >
      <CardHeader className="account-boutique-card-header">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2">
            <Heart aria-hidden="true" className="size-5" />
            התכשיטים במועדפים
          </CardTitle>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href="/account">אזור אישי</Link>
            </Button>
            <form action={customerLogoutAction}>
              <Button className="gap-2" size="sm" type="submit" variant="ghost">
                <LogOut aria-hidden="true" className="size-4" />
                יציאה
              </Button>
            </form>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-5">
        <GuestWishlistMergeNotice />
        {wishlistItems.length === 0 ? (
          <EmptyState
            actions={
              <>
                <Button asChild>
                  <Link href="/search">
                    <Search aria-hidden="true" className="size-4" />
                    חיפוש במבחר
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/account">חזרה לאזור האישי</Link>
                </Button>
              </>
            }
            description="כשתסמני תכשיט בלב, הוא יופיע כאן וישמר לחשבון שלך."
            icon={Heart}
            testId="wishlist-empty-account"
            title="אין עדיין מועדפים בחשבון."
            variant="inset"
          />
        ) : (
          <>
            {wishlistDecisionSupport ? (
              <div
                className="glass-inset grid gap-3 rounded-md border p-3"
                data-testid="wishlist-decision-support"
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

            <RevealGrid
              className="grid gap-4 md:grid-cols-2"
              data-testid="wishlist-account-items"
              variant="cards"
            >
              {wishlistItems.map((item) => (
                <CustomerWishlistItemCard item={item} key={item.id} />
              ))}
            </RevealGrid>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function CustomerWishlistItemCard({ item }: { item: CustomerWishlistItem }) {
  const product = item.variant.product;
  const image = product.media[0]?.url ?? DEFAULT_CATALOG_IMAGE;
  const details = [
    product.category.name,
    product.material.name,
    product.stone?.name,
  ]
    .filter((detail): detail is string => Boolean(detail))
    .join(" · ");

  return (
    <article className="wishlist-product-card glass-inset flex min-w-0 gap-3 rounded-md border p-3">
      <Link
        className="flex min-w-0 flex-1 gap-3 outline-none focus-visible:ring-3 focus-visible:ring-[var(--glass-focus)]"
        href={`/product/${product.slug}`}
      >
        <span className="wishlist-product-thumb bg-muted relative size-20 shrink-0 overflow-hidden rounded-md border sm:size-24">
          <Image
            alt=""
            className="media-color object-cover"
            fill
            sizes="96px"
            src={image}
          />
        </span>
        <span className="grid min-w-0 content-center gap-1">
          <span className="truncate font-medium">{product.name}</span>
          <span className="text-muted-foreground truncate text-xs">
            {item.variant.name}
          </span>
          <span className="text-muted-foreground truncate text-xs">
            {details}
          </span>
          <span className="text-sm font-medium">
            {formatPrice(
              Number(product.basePrice) + Number(item.variant.priceDelta),
            )}
          </span>
        </span>
      </Link>
      <div className="grid shrink-0 content-between justify-items-end gap-2">
        <Badge variant="outline">שמור</Badge>
        <form action={removeWishlistItemAction}>
          <input name="itemId" type="hidden" value={item.id} />
          <Button
            aria-label={`הסרת ${product.name} מהמועדפים`}
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
    </article>
  );
}
