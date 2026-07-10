import Image from "next/image";
import Link from "next/link";
import {
  AlertTriangle,
  Heart,
  LogOut,
  Search,
  Trash2,
  UserRound,
} from "lucide-react";

import { AdminSessionActions } from "../account/_components/admin-session-actions";
import { BoutiqueStatePage } from "../account/_components/boutique-state-page";
import { GuestWishlistMergeNotice } from "../account/_components/guest-wishlist-merge-notice";
import { customerWishlistInclude } from "../account/_lib/customer-wishlist-query";
import {
  getWishlistDecisionSupportFromItems,
  getWishlistItemAvailabilityNote,
} from "../account/_lib/wishlist-shortlist";
import {
  customerLogoutAction,
  removeWishlistItemAction,
} from "../account/actions";
import { GuestWishlistProducts } from "./_components/guest-wishlist-products";
import { CompactPageIntro } from "~/components/compact-page-intro";
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
      wishlist: customerWishlistInclude,
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
      <BoutiqueStatePage
        className="wishlist-boutique-page"
        actions={<AdminSessionActions />}
        description="רשימת המועדפים זמינה ללקוחות בלבד ואינה חלק מחשבון הניהול."
        icon={UserRound}
        testId="wishlist-admin-forbidden"
        title="מועדפים זמינים ללקוחות"
      />
    );
  }

  if (isCustomerSession && wishlistLoadFailed) {
    return (
      <BoutiqueStatePage
        className="wishlist-boutique-page"
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
        description="לא הצלחנו לטעון את המועדפים. הפריטים שמורים, ואפשר לנסות שוב בעוד רגע."
        icon={AlertTriangle}
        testId="wishlist-load-error"
        title="לא ניתן לטעון את המועדפים כרגע"
      />
    );
  }

  return (
    <>
      <SiteHeader />
      <main className="elysia-page account-boutique-page wishlist-boutique-page">
        <CompactPageIntro
          className="account-entry-intro account-boutique-hero wishlist-boutique-hero"
          description="כל הפריטים ששמרת, במקום אחד."
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
    </>
  );
}

function CustomerWishlistPanel({ customer }: { customer: CustomerWishlist }) {
  const wishlistItems = customer.wishlist?.items ?? [];
  const wishlistDecisionSupport =
    getWishlistDecisionSupportFromItems(wishlistItems);

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
                    חיפוש תכשיטים
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/account">חזרה לאזור האישי</Link>
                </Button>
              </>
            }
            description="לחצי על סמל הלב בכל מוצר כדי לשמור אותו כאן, לחשבון שלך."
            icon={Heart}
            testId="wishlist-empty-account"
            title="עדיין אין פריטים במועדפים"
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
                    <Link href="/size-guide">מדריך מידות</Link>
                  </Button>
                  <Button asChild size="sm" variant="ghost">
                    <Link href={wishlistDecisionSupport.serviceHref}>
                      ייעוץ אישי
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
  const availabilityNote = getWishlistItemAvailabilityNote({
    availabilityMode: product.availabilityMode,
    inventoryItems: item.variant.inventoryItems,
  });

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
          {availabilityNote ? (
            <span
              className="text-muted-foreground truncate text-xs"
              data-testid="wishlist-item-availability-note"
            >
              {availabilityNote}
            </span>
          ) : null}
        </span>
      </Link>
      <div className="grid shrink-0 content-between justify-items-end gap-2">
        <Badge variant="outline">שמור</Badge>
        <form
          action={removeWishlistItemAction}
          className="wishlist-item-remove"
        >
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
