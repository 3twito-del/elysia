"use client";

import { useMemo, useState, type FormEvent } from "react";
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

  const createOrder = api.checkout.createManualOrder.useMutation();

  const totals = useMemo(() => {
    const subtotal = product.price * quantity;
    const shipping = fulfillmentMethod === "DELIVERY" ? 29 : 0;
    return {
      subtotal,
      shipping,
      total: subtotal + shipping,
    };
  }, [fulfillmentMethod, product.price, quantity]);

  const canSubmit =
    name.trim().length >= 2 &&
    phone.trim().length >= 7 &&
    email.trim().length > 0 &&
    branchSlug.length > 0 &&
    (fulfillmentMethod === "PICKUP" ||
      (city.trim().length >= 2 && street.trim().length >= 2));

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit) return;

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
              <CheckCircle2 className="size-6" />
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
              <PackageCheck className="size-5" />
              פרטי הזמנה
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <Label htmlFor="name">שם מלא</Label>
                <Input
                  id="name"
                  onChange={(event) => setName(event.currentTarget.value)}
                  placeholder="שם מקבל/ת ההזמנה"
                  required
                  value={name}
                />
              </div>
              <div>
                <Label htmlFor="phone">טלפון</Label>
                <Input
                  id="phone"
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
                <Input
                  id="email"
                  onChange={(event) => setEmail(event.currentTarget.value)}
                  placeholder="name@example.com"
                  required
                  type="email"
                  value={email}
                />
              </div>
              <div>
                <Label htmlFor="quantity">כמות</Label>
                <Input
                  id="quantity"
                  min={1}
                  max={10}
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
              <Truck className="size-5" />
              משלוח או איסוף
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
                משלוח עד הבית
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
                איסוף מסניף
              </Button>
            </div>

            <div>
              <Label htmlFor="branch">סניף מטפל / מקור מלאי</Label>
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
                    id="city"
                    onChange={(event) => setCity(event.currentTarget.value)}
                    required
                    value={city}
                  />
                </div>
                <div>
                  <Label htmlFor="street">רחוב ומספר</Label>
                  <Input
                    id="street"
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
              <CheckoutStepBadge value="3" />
              <Gift className="size-5" />
              אריזת מתנה
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <label className="glass-inset flex min-h-11 items-center gap-3 rounded-md border px-3 text-sm">
              <input
                checked={giftWrap}
                onChange={(event) => setGiftWrap(event.currentTarget.checked)}
                type="checkbox"
              />
              להוסיף אריזת מתנה
            </label>
            <Textarea
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
            <Button
              className="gap-2"
              disabled={!canSubmit || createOrder.isPending}
              size="lg"
              type="submit"
            >
              {createOrder.isPending ? "שומר הזמנה..." : "שליחת בקשת הזמנה"}
              <CreditCard className="size-4" />
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
