"use client";

import { useMemo, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  CreditCard,
  Gift,
  PackageCheck,
  Truck,
} from "lucide-react";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Separator } from "~/components/ui/separator";
import { StatusMessage } from "~/components/ui/status-message";
import { Textarea } from "~/components/ui/textarea";
import {
  getCheckoutIssueList,
  hasCheckoutErrors,
  validateCheckoutFields,
  type CheckoutField,
} from "~/lib/checkout-validation";
import { formatPrice } from "~/lib/format";
import { api } from "~/trpc/react";
import { CheckoutStepBadge } from "./checkout-step-badge";

type CheckoutProduct = {
  slug: string;
  name: string;
  shortDescription: string;
  price: number;
  variantName?: string;
  variantSku?: string;
};

type BranchOption = {
  slug: string;
  name: string;
  city: string;
};

type ManualCheckoutFormProps = {
  product: CheckoutProduct;
  branches: BranchOption[];
};

export function ManualCheckoutForm({
  product,
  branches,
}: ManualCheckoutFormProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [fulfillmentMethod, setFulfillmentMethod] = useState<
    "DELIVERY" | "PICKUP"
  >("DELIVERY");
  const [branchSlug, setBranchSlug] = useState(branches[0]?.slug ?? "");
  const [city, setCity] = useState("");
  const [street, setStreet] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [giftWrap, setGiftWrap] = useState(true);
  const [giftMessage, setGiftMessage] = useState("");
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [submitLocked, setSubmitLocked] = useState(false);
  const [touchedFields, setTouchedFields] = useState<Set<CheckoutField>>(
    () => new Set(),
  );
  const submitLockedRef = useRef(false);

  const createOrder = api.checkout.createManualOrder.useMutation({
    onError: () => {
      submitLockedRef.current = false;
      setSubmitLocked(false);
    },
  });

  const totals = useMemo(() => {
    const subtotal = product.price * quantity;
    const shipping = fulfillmentMethod === "DELIVERY" ? 29 : 0;
    return {
      subtotal,
      shipping,
      total: subtotal + shipping,
    };
  }, [fulfillmentMethod, product.price, quantity]);

  const checkoutErrors = validateCheckoutFields({
    branchSlug,
    city,
    email,
    fulfillmentMethod,
    name,
    phone,
    quantity,
    requireQuantity: true,
    street,
  });
  const checkoutIssues = getCheckoutIssueList(checkoutErrors);
  const checkoutLocked = createOrder.isPending || submitLocked;
  const canSubmit = !hasCheckoutErrors(checkoutErrors) && !checkoutLocked;

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

    if (!canSubmit || submitLockedRef.current) return;

    submitLockedRef.current = true;
    setSubmitLocked(true);
    createOrder.mutate({
      productSlug: product.slug,
      variantSku: product.variantSku,
      quantity,
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
            <CardTitle className="text-3xl">בקשת ההזמנה נקלטה</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 leading-7">
            <p className="text-muted-foreground">
              ההזמנה נשמרה במערכת וממתינה לאישור נציג. אין חיוב אונליין בשלב
              הזה; צוות Aphrodite יטפל בהמשך התהליך מתוך מסך האדמין.
            </p>
            <div className="glass-inset rounded-md border p-5">
              <p className="text-muted-foreground text-sm">מספר הזמנה</p>
              <p className="mt-1 text-2xl font-semibold">
                {createOrder.data.orderNumber}
              </p>
              <p className="text-muted-foreground mt-3 text-sm">
                סטטוס: ממתינה לאישור תשלום ידני
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="secondary">
                <Link href="/admin">מעבר לאדמין</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={`/product/${product.slug}`}>חזרה למוצר</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <form
      aria-busy={checkoutLocked}
      className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_380px]"
      onSubmit={handleSubmit}
    >
      <div className="grid gap-6">
        <div>
          <h2 className="text-4xl font-semibold">סל וקופה</h2>
          <p className="text-muted-foreground mt-2">
            בקשת הזמנה פנימית: שמירת מלאי, פתיחת הזמנה, וטיפול ידני של נציג.
          </p>
        </div>

        <Card className="rounded-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckoutStepBadge value="1" />
              <PackageCheck aria-hidden="true" className="size-5" />
              פרטי הזמנה
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <Label htmlFor="name">שם מלא</Label>
                <FieldError
                  id="manual-name-error"
                  message={getVisibleFieldError("name")}
                />
                <Input
                  aria-describedby="manual-name-error"
                  aria-invalid={Boolean(getVisibleFieldError("name"))}
                  disabled={checkoutLocked}
                  id="name"
                  minLength={2}
                  onBlur={() => markFieldTouched("name")}
                  onChange={(event) => setName(event.currentTarget.value)}
                  placeholder="שם מקבל/ת ההזמנה"
                  required
                  value={name}
                />
              </div>
              <div>
                <Label htmlFor="phone">טלפון</Label>
                <FieldError
                  id="manual-phone-error"
                  message={getVisibleFieldError("phone")}
                />
                <Input
                  aria-describedby="manual-phone-error"
                  aria-invalid={Boolean(getVisibleFieldError("phone"))}
                  disabled={checkoutLocked}
                  id="phone"
                  minLength={7}
                  onBlur={() => markFieldTouched("phone")}
                  onChange={(event) => setPhone(event.currentTarget.value)}
                  placeholder="050-0000000"
                  required
                  value={phone}
                />
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-[1fr_120px]">
              <div>
                <Label htmlFor="email">אימייל לזיהוי ההזמנה</Label>
                <FieldError
                  id="manual-email-error"
                  message={getVisibleFieldError("email")}
                />
                <Input
                  aria-describedby="manual-email-error"
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
              <div>
                <Label htmlFor="quantity">כמות</Label>
                <FieldError
                  id="manual-quantity-error"
                  message={getVisibleFieldError("quantity")}
                />
                <Input
                  aria-describedby="manual-quantity-error"
                  aria-invalid={Boolean(getVisibleFieldError("quantity"))}
                  disabled={checkoutLocked}
                  id="quantity"
                  min={1}
                  max={10}
                  onBlur={() => markFieldTouched("quantity")}
                  onChange={(event) =>
                    setQuantity(Math.max(1, Number(event.currentTarget.value)))
                  }
                  required
                  type="number"
                  value={quantity}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckoutStepBadge value="2" />
              <Truck aria-hidden="true" className="size-5" />
              משלוח או איסוף
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
                    כולל כתובת ודמי משלוח
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
                <PackageCheck className="size-4" aria-hidden="true" />
                <span className="grid gap-0.5">
                  <span>איסוף מסניף</span>
                  <span className="text-muted-foreground text-xs font-normal">
                    ללא כתובת משלוח
                  </span>
                </span>
              </Button>
            </div>

            <div>
              <Label htmlFor="branch">סניף מטפל / מקור מלאי</Label>
              <FieldError
                id="manual-branch-error"
                message={getVisibleFieldError("branchSlug")}
              />
              <select
                aria-describedby="manual-branch-error"
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
                    id="manual-city-error"
                    message={getVisibleFieldError("city")}
                  />
                  <Input
                    aria-describedby="manual-city-error"
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
                    id="manual-street-error"
                    message={getVisibleFieldError("street")}
                  />
                  <Input
                    aria-describedby="manual-street-error"
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
              <CheckoutStepBadge value="3" />
              <Gift aria-hidden="true" className="size-5" />
              אריזת מתנה
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <label className="glass-inset flex min-h-11 items-center gap-3 rounded-md border px-3 text-sm">
              <input
                checked={giftWrap}
                disabled={checkoutLocked}
                onChange={(event) => setGiftWrap(event.currentTarget.checked)}
                type="checkbox"
              />
              להוסיף אריזת מתנה
            </label>
            <Textarea
              disabled={checkoutLocked}
              onChange={(event) => setGiftMessage(event.currentTarget.value)}
              placeholder="ברכה אישית שתצורף להזמנה"
              value={giftMessage}
            />
            <Badge className="w-fit" variant="secondary">
              ללא חיוב אונליין בשלב זה
            </Badge>
          </CardContent>
        </Card>
      </div>

      <aside>
        <Card className="sticky top-24 rounded-md">
          <CardHeader>
            <CheckoutStepBadge value="4" />
            <CardTitle>סיכום</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex justify-between gap-4">
              <div>
                <p className="font-medium">{product.name}</p>
                <p className="text-muted-foreground text-sm">
                  {product.variantName
                    ? `${product.variantName} · ${product.shortDescription}`
                    : product.shortDescription}
                </p>
              </div>
              <span>{formatPrice(product.price)}</span>
            </div>
            <Separator />
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span>מוצרים</span>
                <span>{formatPrice(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>משלוח</span>
                <span>{formatPrice(totals.shipping)}</span>
              </div>
              <div className="flex justify-between text-base font-semibold">
                <span>סה״כ</span>
                <span>{formatPrice(totals.total)}</span>
              </div>
            </div>
            {createOrder.error ? (
              <StatusMessage tone="error">
                {createOrder.error.message}
              </StatusMessage>
            ) : null}
            {checkoutIssues.length > 0 ? (
              <div className="glass-inset rounded-md border p-3 text-sm">
                <p className="font-medium">לפני שליחת הבקשה</p>
                <ul className="text-muted-foreground mt-2 grid list-inside list-disc gap-1">
                  {checkoutIssues.map((issue) => (
                    <li key={issue}>{issue}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            <Button
              className="gap-2"
              disabled={!canSubmit}
              size="lg"
              type="submit"
            >
              {checkoutLocked ? "שומר הזמנה..." : "שליחת בקשת הזמנה"}
              <CreditCard aria-hidden="true" className="size-4" />
            </Button>
            <Button asChild variant="outline">
              <Link href={`/product/${product.slug}`}>חזרה למוצר</Link>
            </Button>
          </CardContent>
        </Card>
      </aside>
    </form>
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
