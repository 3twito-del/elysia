"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type FormEvent,
} from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import {
  CheckCircle2,
  Clock3,
  Gift,
  Minus,
  PackageCheck,
  Plus,
  ShieldCheck,
  Store,
  Trash2,
  Truck,
} from "lucide-react";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { EmptyState } from "~/components/ui/empty-state";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { LoadingState } from "~/components/ui/loading-state";
import { Separator } from "~/components/ui/separator";
import { StatusMessage } from "~/components/ui/status-message";
import { Textarea } from "~/components/ui/textarea";
import {
  dispatchCartUpdated,
  getOrCreateCartSessionKey,
} from "~/lib/cart-session";
import {
  getCheckoutIssueList,
  hasCheckoutErrors,
  validateCheckoutFields,
  type CheckoutField,
} from "~/lib/checkout-validation";
import { formatPrice } from "~/lib/format";
import { api } from "~/trpc/react";
import { CheckoutStepBadge } from "./checkout-step-badge";

type BranchOption = {
  slug: string;
  name: string;
  city: string;
};

type CartCheckoutFormProps = {
  branches: BranchOption[];
};

const checkoutFormId = "cart-checkout-form";

const checkoutTrustItems = [
  {
    detail: "שמירת מלאי זמנית עד אישור ההזמנה",
    icon: Clock3,
    label: "מלאי נשמר",
  },
  {
    detail: "חיוב מתבצע רק לאחר אימות נציג",
    icon: ShieldCheck,
    label: "בדיקה לפני חיוב",
  },
  {
    detail: "אפשר לבחור משלוח או איסוף מסניף",
    icon: Store,
    label: "מסירה גמישה",
  },
] as const;

export function CartCheckoutForm({ branches }: CartCheckoutFormProps) {
  const utils = api.useUtils();
  const canRenderStickyBar = useSyncExternalStore(
    subscribeToNoopStore,
    getClientSnapshot,
    getServerSnapshot,
  );
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
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [submitLocked, setSubmitLocked] = useState(false);
  const [touchedFields, setTouchedFields] = useState<Set<CheckoutField>>(
    () => new Set(),
  );
  const submitLockedRef = useRef(false);

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
    onError: () => {
      submitLockedRef.current = false;
      setSubmitLocked(false);
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
  const checkoutErrors = validateCheckoutFields({
    branchSlug,
    cartItemCount,
    city,
    email,
    fulfillmentMethod,
    name,
    phone,
    requireCart: true,
    sessionReady: Boolean(sessionKey),
    street,
  });
  const checkoutIssues = getCheckoutIssueList(checkoutErrors);
  const checkoutLocked = createOrder.isPending || submitLocked;
  const canSubmit = !hasCheckoutErrors(checkoutErrors) && !checkoutLocked;
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

  const mobileCheckoutBar = (
    <div
      className="public-floating-control glass-chrome fixed inset-x-3 bottom-[calc(var(--floating-stack-bottom,0px)+0.75rem+env(safe-area-inset-bottom))] z-40 rounded-md border p-2.5 shadow-[0_18px_48px_oklch(0_0_0_/_16%)] md:hidden"
      data-public-floating-bar="true"
    >
      <div className="mx-auto grid max-w-md grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="min-w-0">
          <p className="text-muted-foreground truncate text-xs">
            {checkoutIssues.length > 0
              ? `${checkoutIssues.length} פרטים חסרים`
              : "מוכן לשמירת הזמנה"}
          </p>
          <p className="text-lg font-semibold">{formatPrice(orderTotal)}</p>
        </div>
        <Button disabled={!canSubmit} form={checkoutFormId} type="submit">
          {checkoutLocked ? "שומר..." : "שמירה"}
          <PackageCheck aria-hidden="true" className="size-4" />
        </Button>
      </div>
    </div>
  );

  function applyOptions() {
    if (!optionMutationInput) return;
    updateOptions.mutate(optionMutationInput);
  }

  function markFieldTouched(field: CheckoutField) {
    setTouchedFields((current) => {
      if (current.has(field)) return current;

      const next = new Set(current);
      next.add(field);

      return next;
    });
  }

  function getVisibleFieldError(field: CheckoutField) {
    if (!submitAttempted && !touchedFields.has(field)) return undefined;

    return checkoutErrors[field];
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitAttempted(true);

    if (!sessionKey || !canSubmit || submitLockedRef.current) return;

    submitLockedRef.current = true;
    setSubmitLocked(true);
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
              <CheckCircle2 aria-hidden="true" className="size-6" />
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
    <>
      <form
        aria-busy={checkoutLocked}
        className="mx-auto grid max-w-7xl gap-8 px-4 pt-8 pb-28 sm:px-6 sm:pt-10 sm:pb-28 md:pb-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start"
        data-testid="cart-checkout-form"
        id={checkoutFormId}
        onSubmit={handleSubmit}
      >
        <div className="grid gap-6">
          <div>
            <h2 className="text-4xl font-semibold">סל וקופה</h2>
            <p className="text-muted-foreground mt-2">
              סל רב-פריטים עם שמירת מלאי, פרטי מסירה וקופון.
            </p>
          </div>

          <Card className="rounded-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckoutStepBadge value="1" />
                <PackageCheck aria-hidden="true" className="size-5" />
                פריטים בסל
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {cartQuery.isLoading || !sessionKey ? (
                <LoadingState label="טוען סל..." variant="plain" />
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
                    className="glass-inset grid grid-cols-[72px_minmax(0,1fr)] gap-3 rounded-md border p-3 sm:grid-cols-[72px_minmax(0,1fr)_auto] sm:items-center"
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
                    <div className="min-w-0">
                      <Link
                        className="line-clamp-2 font-medium hover:underline"
                        dir="auto"
                        href={`/product/${item.productSlug}`}
                      >
                        {item.productName}
                      </Link>
                      <p className="text-muted-foreground text-sm">
                        {item.variantName} · {formatPrice(item.unitPrice)}
                      </p>
                    </div>
                    <div className="col-span-2 flex items-center justify-end gap-2 sm:col-span-1">
                      <Button
                        aria-label={`הפחתת כמות עבור ${item.productName}`}
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
                        disabled={
                          item.quantity <= 1 ||
                          updateItem.isPending ||
                          checkoutLocked
                        }
                      >
                        <Minus aria-hidden="true" className="size-4" />
                        <span className="sr-only">הפחתה</span>
                      </Button>
                      <span
                        aria-atomic="true"
                        aria-label={`כמות ${item.productName}: ${item.quantity}`}
                        aria-live="polite"
                        className="grid h-10 w-10 place-items-center text-sm font-medium"
                      >
                        {item.quantity}
                      </span>
                      <Button
                        aria-label={`הוספת כמות עבור ${item.productName}`}
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
                        disabled={
                          item.quantity >= 10 ||
                          updateItem.isPending ||
                          checkoutLocked
                        }
                      >
                        <Plus aria-hidden="true" className="size-4" />
                        <span className="sr-only">הוספה</span>
                      </Button>
                      <Button
                        aria-label={`הסרת ${item.productName} מהסל`}
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
                        disabled={removeItem.isPending || checkoutLocked}
                      >
                        <Trash2 aria-hidden="true" className="size-4" />
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
                    <>
                      <Button asChild variant="secondary">
                        <Link href="/category/rings">בחירת תכשיטים</Link>
                      </Button>
                      <Button asChild variant="outline">
                        <Link href="/search">חיפוש בקטלוג</Link>
                      </Button>
                    </>
                  }
                />
              )}
            </CardContent>
          </Card>

          <Card className="rounded-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckoutStepBadge value="2" />
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
                  <FieldError
                    id="name-error"
                    message={getVisibleFieldError("name")}
                  />
                  <Input
                    aria-describedby="name-error"
                    aria-invalid={Boolean(getVisibleFieldError("name"))}
                    disabled={checkoutLocked}
                    id="name"
                    minLength={2}
                    onBlur={() => markFieldTouched("name")}
                    onChange={(event) => setName(event.currentTarget.value)}
                    required
                    value={name}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">טלפון</Label>
                  <FieldError
                    id="phone-error"
                    message={getVisibleFieldError("phone")}
                  />
                  <Input
                    aria-describedby="phone-error"
                    aria-invalid={Boolean(getVisibleFieldError("phone"))}
                    disabled={checkoutLocked}
                    id="phone"
                    minLength={7}
                    onBlur={() => markFieldTouched("phone")}
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
                <FieldError
                  id="email-error"
                  message={getVisibleFieldError("email")}
                />
                <Input
                  aria-describedby="email-error"
                  aria-invalid={Boolean(getVisibleFieldError("email"))}
                  disabled={checkoutLocked}
                  id="email"
                  onBlur={() => markFieldTouched("email")}
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
                <CheckoutStepBadge value="3" />
                <Truck aria-hidden="true" className="size-5" />
                מסירה
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Button
                  aria-pressed={fulfillmentMethod === "DELIVERY"}
                  className="h-auto min-h-16 justify-start p-4 text-right whitespace-normal"
                  disabled={checkoutLocked}
                  onClick={() => setFulfillmentMethod("DELIVERY")}
                  type="button"
                  variant={
                    fulfillmentMethod === "DELIVERY" ? "secondary" : "outline"
                  }
                >
                  <Truck className="size-4" aria-hidden="true" />
                  <span className="grid gap-0.5">
                    <span>משלוח עד הבית</span>
                    <span className="text-muted-foreground text-xs font-normal">
                      כולל עיר, רחוב ודמי משלוח
                    </span>
                  </span>
                </Button>
                <Button
                  aria-pressed={fulfillmentMethod === "PICKUP"}
                  className="h-auto min-h-16 justify-start p-4 text-right whitespace-normal"
                  disabled={checkoutLocked}
                  onClick={() => setFulfillmentMethod("PICKUP")}
                  type="button"
                  variant={
                    fulfillmentMethod === "PICKUP" ? "secondary" : "outline"
                  }
                >
                  <Store className="size-4" aria-hidden="true" />
                  <span className="grid gap-0.5">
                    <span>איסוף מסניף</span>
                    <span className="text-muted-foreground text-xs font-normal">
                      ללא כתובת משלוח וללא דמי משלוח
                    </span>
                  </span>
                </Button>
              </div>
              <div>
                <Label htmlFor="branch">סניף מלאי</Label>
                <FieldError
                  id="branch-error"
                  message={getVisibleFieldError("branchSlug")}
                />
                <select
                  aria-describedby="branch-error"
                  aria-invalid={Boolean(getVisibleFieldError("branchSlug"))}
                  className="glass-control mt-2 h-11 w-full rounded-md border px-3 text-sm outline-none focus-visible:border-[var(--glass-border-strong)] focus-visible:ring-3 focus-visible:ring-[var(--glass-focus)]"
                  disabled={checkoutLocked}
                  id="branch"
                  onBlur={() => markFieldTouched("branchSlug")}
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
                    <FieldError
                      id="city-error"
                      message={getVisibleFieldError("city")}
                    />
                    <Input
                      aria-describedby="city-error"
                      aria-invalid={Boolean(getVisibleFieldError("city"))}
                      disabled={checkoutLocked}
                      id="city"
                      minLength={2}
                      onBlur={() => markFieldTouched("city")}
                      onChange={(event) => setCity(event.currentTarget.value)}
                      required
                      value={city}
                    />
                  </div>
                  <div>
                    <Label htmlFor="street">רחוב ומספר</Label>
                    <FieldError
                      id="street-error"
                      message={getVisibleFieldError("street")}
                    />
                    <Input
                      aria-describedby="street-error"
                      aria-invalid={Boolean(getVisibleFieldError("street"))}
                      disabled={checkoutLocked}
                      id="street"
                      minLength={2}
                      onBlur={() => markFieldTouched("street")}
                      onChange={(event) => setStreet(event.currentTarget.value)}
                      required
                      value={street}
                    />
                  </div>
                  <div>
                    <Label htmlFor="postalCode">מיקוד</Label>
                    <Input
                      disabled={checkoutLocked}
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
                <CheckoutStepBadge value="4" />
                <Gift aria-hidden="true" className="size-5" />
                הטבות ומתנה
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                <div>
                  <Label htmlFor="coupon">קופון</Label>
                  <Input
                    disabled={checkoutLocked}
                    id="coupon"
                    onChange={(event) =>
                      setCouponCode(event.currentTarget.value)
                    }
                    value={couponCode}
                  />
                </div>
                <Button
                  className="self-end"
                  disabled={
                    !optionMutationInput ||
                    updateOptions.isPending ||
                    checkoutLocked
                  }
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
                  disabled={checkoutLocked}
                  onChange={(event) => setGiftWrap(event.currentTarget.checked)}
                  type="checkbox"
                />
                אריזת מתנה
              </label>
              <Textarea
                disabled={checkoutLocked}
                onChange={(event) => setGiftMessage(event.currentTarget.value)}
                placeholder="ברכה אישית"
                value={giftMessage}
              />
            </CardContent>
          </Card>
        </div>

        <aside>
          <Card className="rounded-md lg:sticky lg:top-24">
            <CardHeader>
              <CheckoutStepBadge value="5" />
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
              <div className="grid gap-2 text-xs">
                {checkoutTrustItems.map((item) => (
                  <div
                    className="glass-inset flex items-start gap-2 rounded-md border p-3"
                    key={item.label}
                  >
                    <item.icon
                      aria-hidden="true"
                      className="mt-0.5 size-4 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="font-medium">{item.label}</p>
                      <p className="text-muted-foreground mt-0.5">
                        {item.detail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
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
                <StatusMessage tone="error">
                  {cartMutationError.message}
                </StatusMessage>
              ) : null}
              {createOrder.error ? (
                <StatusMessage tone="error">
                  {createOrder.error.message}
                </StatusMessage>
              ) : null}
              <Button disabled={!canSubmit} size="lg" type="submit">
                {checkoutLocked ? "שומר הזמנה..." : "שמירת הזמנה"}
                <PackageCheck aria-hidden="true" className="size-4" />
              </Button>
            </CardContent>
          </Card>
        </aside>
      </form>
      {canRenderStickyBar && cartItemCount > 0
        ? createPortal(mobileCheckoutBar, document.body)
        : null}
    </>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  return (
    <p
      className="text-destructive min-h-5 text-xs leading-5"
      data-testid={message ? `${id}-visible` : undefined}
      id={id}
      role={message ? "alert" : undefined}
    >
      {message}
    </p>
  );
}

function ReservationCountdown({ expiresAt }: { expiresAt: Date }) {
  const [now, setNow] = useState<number | null>(null);
  const remainingMs =
    now === null ? null : Math.max(0, expiresAt.getTime() - now);
  const remainingMinutes =
    remainingMs === null ? null : Math.floor(remainingMs / 60_000);
  const remainingSeconds =
    remainingMs === null ? null : Math.floor((remainingMs % 60_000) / 1000);
  const countdownText =
    remainingMs === null
      ? "--:--"
      : `${String(remainingMinutes).padStart(2, "0")}:${String(
          remainingSeconds,
        ).padStart(2, "0")}`;

  useEffect(() => {
    function updateNow() {
      setNow(Date.now());
    }

    updateNow();
    const interval = window.setInterval(updateNow, 1000);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="glass-inset rounded-md border p-4">
      <p className="text-muted-foreground text-sm">שמירת מלאי</p>
      <p aria-live="polite" className="mt-1 text-2xl font-semibold">
        {countdownText}
      </p>
    </div>
  );
}

function subscribeToNoopStore() {
  return () => undefined;
}

function getClientSnapshot() {
  return true;
}

function getServerSnapshot() {
  return false;
}
