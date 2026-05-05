"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  CheckCircle2,
  Gift,
  Minus,
  PackageCheck,
  Plus,
  Trash2,
  Truck,
} from "lucide-react";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { EmptyState } from "~/components/ui/empty-state";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Separator } from "~/components/ui/separator";
import { Textarea } from "~/components/ui/textarea";
import {
  dispatchCartUpdated,
  getOrCreateCartSessionKey,
} from "~/lib/cart-session";
import { formatPrice } from "~/lib/format";
import { api } from "~/trpc/react";

type BranchOption = {
  slug: string;
  name: string;
  city: string;
};

type CartCheckoutFormProps = {
  branches: BranchOption[];
};

function StepBadge({ value }: { value: string }) {
  return (
    <span className="glass-inset grid size-7 place-items-center rounded-full border text-xs font-semibold">
      {value}
    </span>
  );
}

export function CartCheckoutForm({ branches }: CartCheckoutFormProps) {
  const utils = api.useUtils();
  const [sessionKey, setSessionKey] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [fulfillmentMethod, setFulfillmentMethod] = useState<
    "DELIVERY" | "PICKUP"
  >("DELIVERY");
  const [branchSlug, setBranchSlug] = useState(branches[0]?.slug ?? "");
  const [city, setCity] = useState("");
  const [street, setStreet] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [giftWrap, setGiftWrap] = useState(false);
  const [giftMessage, setGiftMessage] = useState("");
  const [couponCode, setCouponCode] = useState("");

  const cartQuery = api.cart.get.useQuery(
    { sessionKey: sessionKey ?? "" },
    { enabled: Boolean(sessionKey) },
  );
  const updateItem = api.cart.updateItem.useMutation({
    onSuccess: async () => {
      if (sessionKey) await utils.cart.get.invalidate({ sessionKey });
      dispatchCartUpdated();
    },
  });
  const removeItem = api.cart.removeItem.useMutation({
    onSuccess: async () => {
      if (sessionKey) await utils.cart.get.invalidate({ sessionKey });
      dispatchCartUpdated();
    },
  });
  const updateOptions = api.cart.updateOptions.useMutation({
    onSuccess: async () => {
      if (sessionKey) await utils.cart.get.invalidate({ sessionKey });
    },
  });
  const createOrder = api.checkout.createCartOrder.useMutation({
    onSuccess: async () => {
      if (sessionKey) await utils.cart.get.invalidate({ sessionKey });
      dispatchCartUpdated();
    },
  });

  useEffect(() => {
    const frame = window.requestAnimationFrame(() =>
      setSessionKey(getOrCreateCartSessionKey()),
    );

    return () => window.cancelAnimationFrame(frame);
  }, []);

  const cart = cartQuery.data;
  const cartItemCount = cart?.items.length ?? 0;
  const subtotal = cart?.totals.subtotal ?? 0;
  const discount = cart?.totals.discount ?? 0;
  const shippingAmount =
    cartItemCount > 0 && fulfillmentMethod === "DELIVERY" ? 29 : 0;
  const orderTotal = Math.max(0, subtotal - discount + shippingAmount);
  const checkoutIssues = getCheckoutIssues({
    branchSlug,
    cartItemCount,
    city,
    email,
    fulfillmentMethod,
    name,
    phone,
    sessionKey,
    street,
  });
  const canSubmit = checkoutIssues.length === 0 && !createOrder.isPending;
  const cartMutationError =
    updateItem.error ?? removeItem.error ?? updateOptions.error;
  const optionMutationInput = useMemo(
    () =>
      sessionKey
        ? {
            sessionKey,
            giftWrap,
            giftMessage: giftMessage || undefined,
            couponCode: couponCode || undefined,
            fulfillmentMethod,
          }
        : null,
    [couponCode, fulfillmentMethod, giftMessage, giftWrap, sessionKey],
  );

  function applyOptions() {
    if (!optionMutationInput) return;
    updateOptions.mutate(optionMutationInput);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!sessionKey || !canSubmit || createOrder.isPending) return;

    createOrder.mutate({
      sessionKey,
      fulfillmentMethod,
      branchSlug,
      customer: {
        name,
        phone,
        email,
      },
      shippingAddress:
        fulfillmentMethod === "DELIVERY"
          ? {
              city,
              street,
              postalCode: postalCode || undefined,
            }
          : undefined,
      giftWrap,
      giftMessage: giftMessage || undefined,
      couponCode: couponCode || undefined,
    });
  }

  if (createOrder.data) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <Card className="rounded-md">
          <CardHeader>
            <div className="glass-inset mb-4 grid size-12 place-items-center rounded-full border">
              <CheckCircle2 className="size-6" />
            </div>
            <CardTitle className="text-3xl">ההזמנה נשמרה</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 leading-7">
            <p className="text-muted-foreground">
              מספר ההזמנה הוא {createOrder.data.orderNumber}. המלאי נשמר עד
              לסיום חלון התשלום.
            </p>
            <ReservationCountdown
              expiresAt={createOrder.data.reservationExpiresAt}
            />
            <div className="glass-inset rounded-md border p-5">
              <p className="text-muted-foreground text-sm">סיכום</p>
              <p className="mt-1 text-2xl font-semibold">
                {formatPrice(createOrder.data.totals.total)}
              </p>
              <p className="text-muted-foreground mt-2 text-sm">
                {createOrder.data.itemCount} פריטים
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/account">אזור לקוח</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/">המשך קנייה</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <form
      className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_380px]"
      data-testid="cart-checkout-form"
      onSubmit={handleSubmit}
    >
      <div className="grid gap-6">
        <div>
          <h1 className="text-4xl font-semibold">סל וקופה</h1>
          <p className="text-muted-foreground mt-2">
            סל רב-פריטים עם שמירת מלאי, פרטי מסירה וקופון.
          </p>
        </div>

        <Card className="rounded-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <StepBadge value="1" />
              <PackageCheck className="size-5" />
              פריטים בסל
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {cartQuery.isLoading || !sessionKey ? (
              <p className="text-muted-foreground text-sm">טוען סל...</p>
            ) : cartQuery.error ? (
              <div className="glass-inset grid gap-3 rounded-md border p-4 text-sm">
                <p className="font-medium">לא הצלחנו לטעון את הסל.</p>
                <p className="text-muted-foreground">
                  אפשר לנסות שוב או להמשיך לבחור פריטים מהקטלוג.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => void cartQuery.refetch()}
                    type="button"
                    variant="secondary"
                  >
                    טעינה מחדש
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/category/rings">חזרה לקטלוג</Link>
                  </Button>
                </div>
              </div>
            ) : cart?.items.length ? (
              cart.items.map((item) => (
                <div
                  className="glass-inset grid gap-3 rounded-md border p-3 sm:grid-cols-[72px_1fr_auto] sm:items-center"
                  key={item.id}
                >
                  <Link
                    aria-label={`צפייה במוצר ${item.productName}`}
                    className="bg-muted relative size-[72px] overflow-hidden rounded-md border border-[var(--glass-border)]"
                    href={`/product/${item.productSlug}`}
                  >
                    <Image
                      alt=""
                      className="media-color object-cover"
                      fill
                      sizes="72px"
                      src={item.productImage}
                    />
                  </Link>
                  <div>
                    <Link
                      className="font-medium hover:underline"
                      href={`/product/${item.productSlug}`}
                    >
                      {item.productName}
                    </Link>
                    <p className="text-muted-foreground text-sm">
                      {item.variantName} · {formatPrice(item.unitPrice)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      disabled={item.quantity <= 1 || updateItem.isPending}
                      onClick={() =>
                        sessionKey &&
                        updateItem.mutate({
                          sessionKey,
                          itemId: item.id,
                          quantity: item.quantity - 1,
                        })
                      }
                      size="icon"
                      type="button"
                      variant="outline"
                    >
                      <Minus className="size-4" />
                      <span className="sr-only">הפחתה</span>
                    </Button>
                    <span className="grid h-10 w-10 place-items-center text-sm font-medium">
                      {item.quantity}
                    </span>
                    <Button
                      disabled={item.quantity >= 10 || updateItem.isPending}
                      onClick={() =>
                        sessionKey &&
                        updateItem.mutate({
                          sessionKey,
                          itemId: item.id,
                          quantity: item.quantity + 1,
                        })
                      }
                      size="icon"
                      type="button"
                      variant="outline"
                    >
                      <Plus className="size-4" />
                      <span className="sr-only">הוספה</span>
                    </Button>
                    <Button
                      disabled={removeItem.isPending}
                      onClick={() =>
                        sessionKey &&
                        removeItem.mutate({
                          sessionKey,
                          itemId: item.id,
                        })
                      }
                      size="icon"
                      type="button"
                      variant="ghost"
                    >
                      <Trash2 className="size-4" />
                      <span className="sr-only">הסרה</span>
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                className="min-h-52"
                description="הסל ריק. אפשר לחזור לקטלוג ולבחור תכשיט לפני שמירת הזמנה."
                icon={PackageCheck}
                testId="checkout-empty-cart"
                title="אין פריטים בסל"
                variant="inset"
                actions={
                  <Button asChild variant="secondary">
                    <Link href="/category/rings">בחירת תכשיטים</Link>
                  </Button>
                }
              />
            )}
          </CardContent>
        </Card>

        <Card className="rounded-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <StepBadge value="2" />
              פרטי לקוח
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <p className="text-muted-foreground text-sm">
              הפרטים משמשים לאישור ההזמנה ולתיאום מסירה. נציג יאמת את הפרטים
              לפני חיוב.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="name">שם מלא</Label>
                <Input
                  aria-invalid={name.length > 0 && name.trim().length < 2}
                  id="name"
                  minLength={2}
                  onChange={(event) => setName(event.currentTarget.value)}
                  required
                  value={name}
                />
              </div>
              <div>
                <Label htmlFor="phone">טלפון</Label>
                <Input
                  aria-invalid={phone.length > 0 && phone.trim().length < 7}
                  id="phone"
                  minLength={7}
                  onChange={(event) => setPhone(event.currentTarget.value)}
                  placeholder="05X-XXXXXXX"
                  required
                  type="tel"
                  value={phone}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="email">אימייל</Label>
              <Input
                id="email"
                onChange={(event) => setEmail(event.currentTarget.value)}
                placeholder="name@example.com"
                required
                type="email"
                value={email}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <StepBadge value="3" />
              <Truck className="size-5" />
              מסירה
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Button
                aria-pressed={fulfillmentMethod === "DELIVERY"}
                className="min-h-14 justify-start p-4"
                onClick={() => setFulfillmentMethod("DELIVERY")}
                type="button"
                variant={
                  fulfillmentMethod === "DELIVERY" ? "secondary" : "outline"
                }
              >
                משלוח
              </Button>
              <Button
                aria-pressed={fulfillmentMethod === "PICKUP"}
                className="min-h-14 justify-start p-4"
                onClick={() => setFulfillmentMethod("PICKUP")}
                type="button"
                variant={
                  fulfillmentMethod === "PICKUP" ? "secondary" : "outline"
                }
              >
                איסוף
              </Button>
            </div>
            <div>
              <Label htmlFor="branch">סניף מלאי</Label>
              <select
                className="glass-control mt-2 h-11 w-full rounded-md border px-3 text-sm outline-none focus-visible:border-[var(--glass-border-strong)] focus-visible:ring-3 focus-visible:ring-[var(--glass-focus)]"
                id="branch"
                onChange={(event) => setBranchSlug(event.currentTarget.value)}
                required
                value={branchSlug}
              >
                {branches.map((branch) => (
                  <option key={branch.slug} value={branch.slug}>
                    {branch.name} - {branch.city}
                  </option>
                ))}
              </select>
            </div>
            {fulfillmentMethod === "DELIVERY" ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="city">עיר</Label>
                  <Input
                    aria-invalid={city.length > 0 && city.trim().length < 2}
                    id="city"
                    minLength={2}
                    onChange={(event) => setCity(event.currentTarget.value)}
                    required
                    value={city}
                  />
                </div>
                <div>
                  <Label htmlFor="street">רחוב ומספר</Label>
                  <Input
                    aria-invalid={street.length > 0 && street.trim().length < 2}
                    id="street"
                    minLength={2}
                    onChange={(event) => setStreet(event.currentTarget.value)}
                    required
                    value={street}
                  />
                </div>
                <div>
                  <Label htmlFor="postalCode">מיקוד</Label>
                  <Input
                    id="postalCode"
                    onChange={(event) =>
                      setPostalCode(event.currentTarget.value)
                    }
                    value={postalCode}
                  />
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="rounded-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <StepBadge value="4" />
              <Gift className="size-5" />
              הטבות ומתנה
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <div>
                <Label htmlFor="coupon">קופון</Label>
                <Input
                  id="coupon"
                  onChange={(event) => setCouponCode(event.currentTarget.value)}
                  value={couponCode}
                />
              </div>
              <Button
                className="self-end"
                disabled={!optionMutationInput || updateOptions.isPending}
                onClick={applyOptions}
                type="button"
                variant="secondary"
              >
                החלה
              </Button>
            </div>
            <label className="glass-inset flex min-h-11 items-center gap-3 rounded-md border px-3 text-sm">
              <input
                checked={giftWrap}
                onChange={(event) => setGiftWrap(event.currentTarget.checked)}
                type="checkbox"
              />
              אריזת מתנה
            </label>
            <Textarea
              onChange={(event) => setGiftMessage(event.currentTarget.value)}
              placeholder="ברכה אישית"
              value={giftMessage}
            />
          </CardContent>
        </Card>
      </div>

      <aside>
        <Card className="sticky top-24 rounded-md">
          <CardHeader>
            <StepBadge value="5" />
            <CardTitle>סיכום</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span>פריטים</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>הנחה</span>
                <span>{formatPrice(discount)}</span>
              </div>
              <div className="flex justify-between">
                <span>משלוח</span>
                <span>{formatPrice(shippingAmount)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-base font-semibold">
                <span>סך הכל</span>
                <span>{formatPrice(orderTotal)}</span>
              </div>
            </div>
            {cart?.couponCode ? (
              <Badge className="w-fit" variant="secondary">
                {cart.couponCode}
              </Badge>
            ) : null}
            {checkoutIssues.length > 0 ? (
              <div className="glass-inset rounded-md border p-3 text-sm">
                <p className="font-medium">לפני שמירת ההזמנה</p>
                <ul className="text-muted-foreground mt-2 grid list-inside list-disc gap-1">
                  {checkoutIssues.map((issue) => (
                    <li key={issue}>{issue}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {cartMutationError ? (
              <p className="glass-inset rounded-md border p-3 text-sm text-red-700">
                {cartMutationError.message}
              </p>
            ) : null}
            {createOrder.error ? (
              <p className="glass-inset rounded-md border p-3 text-sm text-red-700">
                {createOrder.error.message}
              </p>
            ) : null}
            <Button
              disabled={!canSubmit || createOrder.isPending}
              size="lg"
              type="submit"
            >
              {createOrder.isPending ? "שומר הזמנה..." : "שמירת הזמנה"}
              <PackageCheck className="size-4" />
            </Button>
          </CardContent>
        </Card>
      </aside>
    </form>
  );
}

function getCheckoutIssues({
  branchSlug,
  cartItemCount,
  city,
  email,
  fulfillmentMethod,
  name,
  phone,
  sessionKey,
  street,
}: {
  branchSlug: string;
  cartItemCount: number;
  city: string;
  email: string;
  fulfillmentMethod: "DELIVERY" | "PICKUP";
  name: string;
  phone: string;
  sessionKey: string | null;
  street: string;
}) {
  const issues: string[] = [];

  if (!sessionKey) issues.push("יצירת סל מקומי עדיין בטעינה.");
  if (cartItemCount < 1) issues.push("הסל ריק.");
  if (name.trim().length < 2) issues.push("יש להזין שם מלא.");
  if (phone.trim().length < 7) issues.push("יש להזין טלפון תקין.");
  if (!email.trim()) issues.push("יש להזין אימייל.");
  if (!branchSlug) issues.push("יש לבחור סניף מלאי.");

  if (fulfillmentMethod === "DELIVERY") {
    if (city.trim().length < 2) issues.push("יש להזין עיר למשלוח.");
    if (street.trim().length < 2) issues.push("יש להזין רחוב ומספר.");
  }

  return issues;
}

function ReservationCountdown({ expiresAt }: { expiresAt: Date }) {
  const [now, setNow] = useState(() => Date.now());
  const remainingMs = Math.max(0, expiresAt.getTime() - now);
  const remainingMinutes = Math.floor(remainingMs / 60_000);
  const remainingSeconds = Math.floor((remainingMs % 60_000) / 1000);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="glass-inset rounded-md border p-4">
      <p className="text-muted-foreground text-sm">שמירת מלאי</p>
      <p className="mt-1 text-2xl font-semibold">
        {String(remainingMinutes).padStart(2, "0")}:
        {String(remainingSeconds).padStart(2, "0")}
      </p>
    </div>
  );
}
