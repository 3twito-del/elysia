"use client";

import { useActionState, useEffect, useState } from "react";
import { Heart, PackageSearch, Ruler, UserRound } from "lucide-react";

import {
  requestGuestOrderAccessAction,
  verifyGuestOrderAccessAction,
  type GuestOrderAccessState,
} from "../actions";
import { CustomerOtpForm } from "./customer-otp-form";
import { GuestWishlistProducts } from "~/app/wishlist/_components/guest-wishlist-products";
import { RecentlyViewedProducts } from "~/app/product/[slug]/_components/recently-viewed-products";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { StatusMessage } from "~/components/ui/status-message";
import { formatPrice } from "~/lib/format";
import { getOrderStatusLabel } from "~/lib/commerce-labels";
import {
  getAllSavedSizes,
  subscribeToSavedSizeUpdates,
} from "~/lib/size-fit-storage";
import {
  formatSavedSize,
  getSizeKindLabel,
  sizeFitKinds,
} from "~/lib/size-fit";

type GuestOrderSummary = {
  orderNumber: string;
  status: string;
  total: number;
  itemCount: number;
  tracking: string | null;
  updatedAt: string;
} | null;

const initialOrderState: GuestOrderAccessState = {};

export function GuestAccountCenter({ order }: { order: GuestOrderSummary }) {
  const [savedSizes, setSavedSizes] = useState<
    ReturnType<typeof getAllSavedSizes>
  >({});
  useEffect(() => {
    const sync = () => setSavedSizes(getAllSavedSizes());
    sync();
    return subscribeToSavedSizeUpdates(sync);
  }, []);
  const [requestState, requestAction] = useActionState(
    requestGuestOrderAccessAction,
    initialOrderState,
  );
  const [verifyState, verifyAction] = useActionState(
    verifyGuestOrderAccessAction,
    initialOrderState,
  );

  return (
    <div className="grid gap-7" data-testid="guest-account-center">
      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="rounded-md" size="sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ruler aria-hidden="true" className="size-5" />
              המידות שלי
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2">
              {sizeFitKinds.map((kind) => (
                <div className="glass-inset rounded-md border p-3" key={kind}>
                  <p className="text-muted-foreground text-xs">
                    {getSizeKindLabel(kind)}
                  </p>
                  <p className="mt-1 text-sm font-medium">
                    {savedSizes[kind]
                      ? formatSavedSize(kind, savedSizes[kind])
                      : "טרם נשמרה מידה"}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-md" id="guest-order" size="sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PackageSearch aria-hidden="true" className="size-5" />
              מעקב הזמנה
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {order ? (
              <div className="grid gap-3" data-testid="guest-order-summary">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-medium" dir="ltr">
                    {order.orderNumber}
                  </p>
                  <p className="text-sm font-semibold">
                    {formatPrice(order.total)}
                  </p>
                </div>
                <p className="text-muted-foreground text-sm">
                  סטטוס: {getOrderStatusLabel(order.status)} · {order.itemCount}{" "}
                  פריטים
                </p>
                {order.tracking ? (
                  <p className="text-sm">
                    מספר מעקב: <span dir="ltr">{order.tracking}</span>
                  </p>
                ) : null}
              </div>
            ) : (
              <>
                <form action={requestAction} className="grid gap-3">
                  <div>
                    <Label htmlFor="guest-order-number">מספר הזמנה</Label>
                    <Input
                      id="guest-order-number"
                      name="orderNumber"
                      required
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <Label htmlFor="guest-order-identifier">
                      אימייל או טלפון מההזמנה
                    </Label>
                    <Input
                      id="guest-order-identifier"
                      name="identifier"
                      required
                      dir="auto"
                    />
                  </div>
                  <Button type="submit">שליחת קוד מאובטח</Button>
                </form>
                {requestState.message ? (
                  <StatusMessage tone={requestState.ok ? "success" : "error"}>
                    {requestState.message}
                  </StatusMessage>
                ) : null}
                {requestState.developmentCode ? (
                  <p className="glass-inset rounded-md border p-3 text-xs">
                    קוד פיתוח:{" "}
                    <span dir="ltr">{requestState.developmentCode}</span>
                  </p>
                ) : null}
                {requestState.ok && requestState.challengeId ? (
                  <form action={verifyAction} className="grid gap-3">
                    <input
                      name="challengeId"
                      type="hidden"
                      value={requestState.challengeId}
                    />
                    <div>
                      <Label htmlFor="guest-order-code">קוד בן שש ספרות</Label>
                      <Input
                        id="guest-order-code"
                        inputMode="numeric"
                        maxLength={6}
                        name="code"
                        required
                        dir="ltr"
                      />
                    </div>
                    <Button type="submit" variant="secondary">
                      אימות והצגת ההזמנה
                    </Button>
                    {verifyState.message ? (
                      <StatusMessage tone="error">
                        {verifyState.message}
                      </StatusMessage>
                    ) : null}
                  </form>
                ) : null}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <section aria-labelledby="guest-wishlist-title">
        <h2
          className="flex items-center gap-2 text-xl font-semibold"
          id="guest-wishlist-title"
        >
          <Heart aria-hidden="true" className="size-5" />
          המועדפים שלי
        </h2>
        <div className="mt-4">
          <GuestWishlistProducts />
        </div>
      </section>

      <RecentlyViewedProducts
        className="border-y border-[var(--glass-border)] py-7"
        gridClassName="mt-5"
        heading="נצפו לאחרונה"
        limit={8}
      />

      <details className="border-y border-[var(--glass-border)] py-4">
        <summary className="flex cursor-pointer items-center gap-2 font-medium">
          <UserRound aria-hidden="true" className="size-4" />
          סנכרון אופציונלי בין מכשירים
        </summary>
        <div className="mt-5 max-w-xl">
          <p className="text-muted-foreground mb-4 text-sm leading-6">
            אפשר להמשיך כאורחת. כניסה בקוד חד־פעמי נדרשת רק אם תרצי לסנכרן מידע
            בין מכשירים.
          </p>
          <CustomerOtpForm />
        </div>
      </details>
    </div>
  );
}
