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
  Gift,
  MessageCircle,
  Minus,
  PackageCheck,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Trash2,
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
  dispatchCartUpdated,
  getOrCreateCartSessionKey,
} from "~/lib/cart-session";
import {
  getClientSnapshot,
  getServerSnapshot,
  subscribeToNoopStore,
} from "~/lib/client-render-snapshot";
import {
  getCheckoutIssueList,
  hasCheckoutErrors,
  validateCheckoutFields,
  type CheckoutField,
} from "~/lib/checkout-validation";
import { formatPrice } from "~/lib/format";
import {
  queueOfflineJsonAction,
  rememberOfflineCartSnapshot,
} from "~/lib/pwa-offline";
import { api } from "~/trpc/react";
import {
  checkoutPricingReviewMessage,
  checkoutPriceReviewLabel,
  checkoutTotalReviewLabel,
  getCheckoutFulfillmentSummaryRows,
  getCheckoutAmountLabel,
  getFriendlyCheckoutErrorMessage,
  hasCheckoutPricingReview,
} from "./checkout-display";
import { FieldError, ReservationCountdown } from "./checkout-status";
import { CheckoutStepBadge } from "./checkout-step-badge";

const checkoutFormId = "cart-checkout-form";
const checkoutFieldFocusOrder = [
  "name",
  "phone",
  "email",
  "city",
  "street",
] satisfies CheckoutField[];

const checkoutEmptyLinks = [
  {
    href: "/category/rings",
    label: "קולקציית טבעות",
    text: "טבעות ליום יום, אירוע או מתנה.",
  },
  {
    href: "/category/necklaces",
    label: "שרשראות עדינות",
    text: "שרשראות לפי אורך, חומר ושימוש.",
  },
  {
    href: "/gifts",
    label: "מתנות",
    text: "בחירות לפי מחיר, אירוע או סגנון.",
  },
  {
    href: "/service",
    label: "לקבלת ייעוץ",
    text: "עזרה בבחירה, מידה או הקדשה.",
  },
] as const;

const checkoutFulfillmentSummaryIcons = {
  confirmation: ShieldCheck,
  delivery: Truck,
  local: PackageCheck,
  supplier: ShoppingBag,
} as const;

const checkoutProgressSteps = [
  {
    detail: "סקירה אחרונה של הבחירה",
    label: "בחירה",
    value: "1",
  },
  {
    detail: "פרטים לאישור אישי",
    label: "פרטים",
    value: "2",
  },
  {
    detail: "כתובת ומסירה",
    label: "מסירה",
    value: "3",
  },
  {
    detail: "הטבה וסיכום",
    label: "סיכום",
    value: "4",
  },
] as const;

export function CartCheckoutForm() {
  const utils = api.useUtils();
  const canRenderStickyBar = useSyncExternalStore(
    subscribeToNoopStore,
    getClientSnapshot,
    getServerSnapshot,
  );
  const [sessionKey, setSessionKey] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const fulfillmentMethod = "DELIVERY" as const;
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
  const checkoutFormRef = useRef<HTMLFormElement>(null);
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
  const createShopifyCheckout =
    api.checkout.createShopifyDropshipCheckout.useMutation({
      onSuccess: (checkout) => {
        window.location.href = checkout.checkoutUrl;
      },
    });

  useEffect(() => {
    const frame = window.requestAnimationFrame(() =>
      setSessionKey(getOrCreateCartSessionKey()),
    );

    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const syncOnlineState = () => setIsOffline(!navigator.onLine);

    syncOnlineState();
    window.addEventListener("online", syncOnlineState);
    window.addEventListener("offline", syncOnlineState);

    return () => {
      window.removeEventListener("online", syncOnlineState);
      window.removeEventListener("offline", syncOnlineState);
    };
  }, []);

  useEffect(() => {
    if (!sessionKey || !cartQuery.data) return;

    void rememberOfflineCartSnapshot({
      itemCount: cartQuery.data.itemCount,
      sessionKey,
      updatedAt: new Date().toISOString(),
    }).catch(() => undefined);
  }, [cartQuery.data, sessionKey]);

  const cart = cartQuery.data;
  const ownItems = useMemo(
    () => cart?.items.filter((item) => item.source === "OWN") ?? [],
    [cart?.items],
  );
  const dropshipItems = useMemo(
    () =>
      cart?.items.filter((item) => item.source === "DROPSHIP_SHOPIFY") ?? [],
    [cart?.items],
  );
  const localCartItemCount = ownItems.length;
  const hasOwnItems = ownItems.length > 0;
  const hasDropshipItems = dropshipItems.length > 0;
  const hasMixedSourceCart = hasOwnItems && hasDropshipItems;
  const ownSubtotal = ownItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const dropshipSubtotal = dropshipItems.reduce(
    (sum, item) => sum + item.lineTotal,
    0,
  );
  const dropshipTotalQuantity = dropshipItems.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );
  const dropshipSubtotalLabel = getCheckoutAmountLabel(dropshipSubtotal, {
    requiresPositive: hasDropshipItems,
    reviewLabel: checkoutTotalReviewLabel,
  });
  const localCheckoutTotals = cart?.groups.own;
  const isCartLoading = Boolean(sessionKey) && cartQuery.isLoading;
  const shouldShowEmptyCartState =
    !isCartLoading && (Boolean(cartQuery.error) || !cart?.items.length);
  const subtotal = localCheckoutTotals?.subtotal ?? 0;
  const discount = localCheckoutTotals?.discount ?? 0;
  const shippingAmount = localCheckoutTotals?.shipping ?? 0;
  const totalItemQuantity = ownItems.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );
  const orderTotal = localCheckoutTotals?.total ?? 0;
  const postDiscountSubtotal = Math.max(0, subtotal - discount);
  const hasPricingReview = Boolean(
    ownItems.length &&
    hasCheckoutPricingReview({
      items: ownItems,
      subtotal,
      total: orderTotal,
    }),
  );
  const subtotalLabel = getCheckoutAmountLabel(subtotal, {
    requiresPositive: localCartItemCount > 0,
    reviewLabel: checkoutTotalReviewLabel,
  });
  const orderTotalLabel = hasPricingReview
    ? checkoutTotalReviewLabel
    : getCheckoutAmountLabel(orderTotal, {
        requiresPositive: localCartItemCount > 0,
        reviewLabel: checkoutTotalReviewLabel,
      });
  const postDiscountSubtotalLabel = hasPricingReview
    ? checkoutTotalReviewLabel
    : getCheckoutAmountLabel(postDiscountSubtotal, {
        requiresPositive: localCartItemCount > 0,
        reviewLabel: checkoutTotalReviewLabel,
      });
  const shippingLabel =
    localCartItemCount > 0 && shippingAmount <= 0
      ? "כלול"
      : formatPrice(shippingAmount);
  const checkoutFulfillmentSummaryRows = getCheckoutFulfillmentSummaryRows({
    dropshipItemCount: dropshipItems.length,
    hasDropshipItems,
    hasOwnItems,
    localItemCount: localCartItemCount,
    shippingLabel,
  });
  const checkoutErrors = validateCheckoutFields({
    cartItemCount: localCartItemCount,
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
  const checkoutSubmissionLocked =
    createOrder.isPending || createShopifyCheckout.isPending || submitLocked;
  const checkoutLocked = checkoutSubmissionLocked || isOffline;
  const canSubmit =
    hasOwnItems &&
    !hasCheckoutErrors(checkoutErrors) &&
    !checkoutLocked &&
    !hasPricingReview;
  const checkoutIntroCopy = hasMixedSourceCart
    ? "הבחירה מחולקת לשני מסלולים: פריטי החנות יאושרו כאן, ופריטי הספק יושלמו בקופה נפרדת."
    : hasDropshipItems
      ? "הבחירה כוללת פריטי ספק בלבד. הסיום ייפתח בקופת Shopify מאובטחת, ללא מילוי פרטי מסירה באתר."
      : "סיכום תכשיטים שנבחרו, פרטי מסירה והטבה.";
  const localCheckoutButtonLabel = hasMixedSourceCart
    ? "אישור פריטי החנות"
    : "אישור הבחירה";
  const supplierCheckoutDescription = hasMixedSourceCart
    ? `${dropshipItems.length} פריטי ספק יושלמו בקופת Shopify מאובטחת, בנפרד מהפריטים המקומיים.`
    : `${dropshipItems.length} פריטי ספק יושלמו בקופת Shopify מאובטחת. פרטי התשלום והמסירה ייאספו שם.`;
  const checkoutPaymentConfidenceCopy = hasMixedSourceCart
    ? "הסכום המקומי יאושר כאן לפני המשך התשלום; פריטי הספק ישולמו בקופת Shopify נפרדת."
    : hasDropshipItems && !hasOwnItems
      ? "התשלום, פרטי המסירה ואישור ההזמנה יתבצעו בקופת Shopify. לא נוצרת כאן הזמנה מקומית עבור פריטי ספק בלבד."
      : "הפרטים והסכום יאומתו לפני שמירת הבחירה; התשלום לא נגבה בשלב זה.";
  const checkoutQuantityRecoveryCopy = isOffline
    ? "שינויי כמות והסרה נשמרים במכשיר ויסתנכרנו כשהחיבור יחזור. סיום הזמנה עדיין דורש חיבור פעיל."
    : updateItem.isPending || removeItem.isPending
      ? "מעדכנים את הכמות ואת הסיכום לפני אישור הבחירה."
      : "שינויי כמות מתעדכנים בסיכום לפני אישור הבחירה; מגבלת הכמות נשמרת לכל פריט.";
  const mobileCheckoutSummaryCopy = hasMixedSourceCart
    ? `${totalItemQuantity} תכשיטי חנות · ${dropshipTotalQuantity} פריטי ספק בנפרד`
    : hasDropshipItems && !hasOwnItems
      ? `${dropshipTotalQuantity} פריטי ספק ימשיכו לקופת Shopify`
      : `${totalItemQuantity} תכשיטים בקופה המקומית`;
  const cartMutationError =
    updateItem.error ?? removeItem.error ?? updateOptions.error;
  const cartMutationErrorMessage = cartMutationError
    ? getFriendlyCheckoutErrorMessage(
        cartMutationError,
        "לא הצלחנו לעדכן את הבחירה כרגע. נסו שוב בעוד רגע.",
      )
    : null;
  const createOrderErrorMessage = createOrder.error
    ? getFriendlyCheckoutErrorMessage(
        createOrder.error,
        "לא הצלחנו לשמור את הבחירה כרגע. בדקו שהפרטים מולאו ונסו שוב.",
      )
    : null;
  const createShopifyCheckoutErrorMessage = createShopifyCheckout.error
    ? getFriendlyCheckoutErrorMessage(
        createShopifyCheckout.error,
        "לא הצלחנו לפתוח את קופת הספק כרגע. נסו שוב בעוד רגע.",
      )
    : null;
  const checkoutDisplayGroups = [
    {
      description: "פריטים שממשיכים לקופה המקומית באתר.",
      items: ownItems,
      label: "פריטים מהחנות",
      source: "OWN",
      subtotal: ownSubtotal,
    },
    {
      description: "פריטי ספק שיושלמו בקופת Shopify נפרדת.",
      items: dropshipItems,
      label: "פריטים מהספק",
      source: "DROPSHIP_SHOPIFY",
      subtotal: dropshipSubtotal,
    },
  ].filter((group) => group.items.length > 0);
  const optionMutationInput = useMemo(
    () =>
      sessionKey
        ? {
            sessionKey,
            giftWrap,
            giftMessage: giftMessage || undefined,
            couponCode: couponCode || undefined,
            fulfillmentMethod: "DELIVERY" as const,
          }
        : null,
    [couponCode, giftMessage, giftWrap, sessionKey],
  );

  const mobileCheckoutBar = (
    <div
      className="public-floating-control glass-chrome fixed inset-x-3 bottom-[calc(var(--floating-stack-bottom,0px)+0.75rem+env(safe-area-inset-bottom))] z-40 rounded-md border p-2 shadow-none md:hidden"
      data-public-floating-bar="true"
      data-public-floating-avoid="true"
      data-testid="mobile-checkout-summary"
    >
      <div className="mx-auto grid max-w-md grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="min-w-0">
          <p className="text-muted-foreground truncate text-xs">
            {checkoutIssues.length > 0
              ? `${checkoutIssues.length} פרטים חסרים`
              : hasMixedSourceCart
                ? "מוכן לאישור פריטי החנות"
                : "מוכן לאישור הבחירה"}
          </p>
          <p className="text-lg font-semibold">{orderTotalLabel}</p>
          <p
            className="text-muted-foreground truncate text-xs"
            data-testid="mobile-checkout-source-context"
          >
            {mobileCheckoutSummaryCopy}
          </p>
          {hasPricingReview ? (
            <p className="text-muted-foreground truncate text-xs">
              נדרש אישור פרטים
            </p>
          ) : null}
        </div>
        <Button disabled={!canSubmit} form={checkoutFormId} type="submit">
          אישור
          <PackageCheck aria-hidden="true" className="size-4" />
        </Button>
      </div>
    </div>
  );

  function applyOptions() {
    if (!optionMutationInput) return;

    if (isOffline) {
      void queueOfflineJsonAction("cart.updateOptions", optionMutationInput);
      return;
    }

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

  function focusFirstCheckoutError() {
    const firstInvalidField = checkoutFieldFocusOrder.find((field) =>
      Boolean(checkoutErrors[field]),
    );

    if (!firstInvalidField) return;

    const field =
      checkoutFormRef.current?.elements.namedItem(firstInvalidField);

    if (field instanceof HTMLElement) {
      field.focus();
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitAttempted(true);

    if (hasCheckoutErrors(checkoutErrors)) {
      window.requestAnimationFrame(focusFirstCheckoutError);
    }

    if (isOffline || !sessionKey || !canSubmit || submitLockedRef.current) {
      return;
    }

    submitLockedRef.current = true;
    setSubmitLocked(true);
    createOrder.mutate({
      sessionKey,
      fulfillmentMethod: "DELIVERY",
      customer: {
        name,
        phone,
        email,
      },
      shippingAddress: {
        city,
        street,
        postalCode: postalCode || undefined,
      },
      giftWrap,
      giftMessage: giftMessage || undefined,
      couponCode: couponCode || undefined,
    });
  }

  function handleShopifyCheckout() {
    if (isOffline || !sessionKey || !hasDropshipItems) return;

    createShopifyCheckout.mutate({ sessionKey });
  }

  function queueOfflineCartMutation(
    kind: "cart.removeItem" | "cart.updateItem",
    payload: Record<string, unknown>,
  ) {
    if (!sessionKey) return;

    void queueOfflineJsonAction(kind, {
      sessionKey,
      ...payload,
    }).then(dispatchCartUpdated);
  }

  if (createOrder.data) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <Card className="rounded-md">
          <CardHeader>
            <div className="glass-inset mb-4 grid size-12 place-items-center rounded-full border">
              <CheckCircle2 aria-hidden="true" className="size-6" />
            </div>
            <CardTitle className="text-3xl">הבחירה נשמרה</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 leading-7">
            <p className="text-muted-foreground">
              מספר ההזמנה הוא {createOrder.data.orderNumber}. התכשיטים נשמרו
              עבורך עד לסיום חלון התשלום.
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
                {createOrder.data.itemCount} תכשיטים
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/account">אזור אישי</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/">המשך בחירה</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  if (isCartLoading) {
    return <CheckoutEmptyCartState />;
  }

  if (shouldShowEmptyCartState || !cart?.items.length) {
    return <CheckoutEmptyCartState />;
  }

  return (
    <>
      <form
        aria-busy={checkoutLocked}
        className="mx-auto grid max-w-7xl gap-5 px-[var(--ui-page-x)] pt-[var(--ui-section-y-tight)] pb-[var(--ui-section-y)] lg:grid-cols-[minmax(0,1fr)_352px] lg:items-start lg:px-[var(--ui-page-x-wide)]"
        data-testid="cart-checkout-form"
        id={checkoutFormId}
        onSubmit={handleSubmit}
        ref={checkoutFormRef}
      >
        <div className="grid gap-4">
          <div>
            <h2 className="text-xl font-semibold sm:text-2xl">הבחירה שלי</h2>
            <p className="text-muted-foreground mt-1.5 max-w-3xl text-sm leading-6 sm:text-base">
              {checkoutIntroCopy}
            </p>
          </div>

          {hasOwnItems ? (
            <div
              aria-label="שלבי סיום ההזמנה"
              className="glass-panel grid gap-2 rounded-md border p-3 text-sm sm:grid-cols-4"
              data-testid="checkout-progress-steps"
            >
              {checkoutProgressSteps.map((step) => (
                <div
                  className="glass-inset grid gap-1 rounded-md border p-3"
                  key={step.value}
                >
                  <div className="flex items-center gap-2">
                    <CheckoutStepBadge value={step.value} />
                    <p className="font-medium">{step.label}</p>
                  </div>
                  <p className="text-muted-foreground text-xs leading-5">
                    {step.detail}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <StatusMessage testId="checkout-supplier-only-message">
              אין צורך למלא פרטי מסירה באתר עבור בחירה שמכילה פריטי ספק בלבד.
              המעבר לקופה המאובטחת של הספק יפתח את מסלול התשלום והמסירה.
            </StatusMessage>
          )}

          <Card className="rounded-md" size="sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckoutStepBadge value="1" />
                <PackageCheck aria-hidden="true" className="size-5" />
                התכשיטים שנבחרו
              </CardTitle>
            </CardHeader>
            <CardContent className="grid min-h-72 gap-4">
              <div
                className="grid gap-2 sm:grid-cols-2"
                data-testid="checkout-source-groups"
              >
                {checkoutDisplayGroups.map((group) => (
                  <div
                    className="glass-inset rounded-md border p-3"
                    data-testid={`checkout-source-group-${group.source.toLowerCase()}`}
                    key={group.source}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium">{group.label}</p>
                      <Badge variant="secondary">
                        {formatPrice(group.subtotal)}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground mt-1 text-xs leading-5">
                      {group.description}
                    </p>
                  </div>
                ))}
              </div>
              {cart.items.map((item) => (
                <div
                  className="bg-background grid grid-cols-[68px_minmax(0,1fr)] gap-3 rounded-md border p-3 sm:grid-cols-[68px_minmax(0,1fr)_auto] sm:items-center"
                  key={item.id}
                >
                  <Link
                    aria-label={`צפייה בתכשיט ${item.productName}`}
                    className="bg-muted relative size-[68px] overflow-hidden rounded-md border border-[var(--glass-border)]"
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
                    <Badge className="mt-1 w-fit" variant="outline">
                      {item.source === "DROPSHIP_SHOPIFY"
                        ? "פריט ספק"
                        : "פריט מהחנות"}
                    </Badge>
                    <p className="text-muted-foreground text-sm">
                      {item.variantName} ·{" "}
                      {getCheckoutAmountLabel(item.unitPrice, {
                        requiresPositive: true,
                        reviewLabel: checkoutPriceReviewLabel,
                      })}
                    </p>
                    <p
                      className="text-foreground mt-1 text-sm font-semibold"
                      data-testid="checkout-line-total"
                    >
                      סה״כ:{" "}
                      <span data-testid="checkout-line-total-amount">
                        {getCheckoutAmountLabel(item.lineTotal, {
                          requiresPositive: true,
                          reviewLabel: checkoutPriceReviewLabel,
                        })}
                      </span>
                    </p>
                  </div>
                  <div className="col-span-2 flex items-center justify-end gap-2 sm:col-span-1">
                    <Button
                      aria-label={`הפחתת כמות עבור ${item.productName}`}
                      data-icon-tooltip="הפחתה"
                      data-icon-tooltip-placement="top"
                      onClick={() => {
                        if (!sessionKey) return;
                        const payload = {
                          itemId: item.id,
                          quantity: item.quantity - 1,
                        };

                        if (isOffline) {
                          queueOfflineCartMutation("cart.updateItem", payload);
                          return;
                        }

                        updateItem.mutate({ sessionKey, ...payload });
                      }}
                      size="icon"
                      type="button"
                      variant="outline"
                      disabled={
                        item.quantity <= 1 ||
                        updateItem.isPending ||
                        checkoutSubmissionLocked
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
                      data-icon-tooltip="הוספה"
                      data-icon-tooltip-placement="top"
                      onClick={() => {
                        if (!sessionKey) return;
                        const payload = {
                          itemId: item.id,
                          quantity: item.quantity + 1,
                        };

                        if (isOffline) {
                          queueOfflineCartMutation("cart.updateItem", payload);
                          return;
                        }

                        updateItem.mutate({ sessionKey, ...payload });
                      }}
                      size="icon"
                      type="button"
                      variant="outline"
                      disabled={
                        item.quantity >= 10 ||
                        updateItem.isPending ||
                        checkoutSubmissionLocked
                      }
                    >
                      <Plus aria-hidden="true" className="size-4" />
                      <span className="sr-only">הוספה</span>
                    </Button>
                    <Button
                      aria-label={`הסרת ${item.productName} מהבחירה`}
                      data-icon-tooltip="הסרה"
                      data-icon-tooltip-placement="top"
                      onClick={() => {
                        if (!sessionKey) return;
                        const payload = { itemId: item.id };

                        if (isOffline) {
                          queueOfflineCartMutation("cart.removeItem", payload);
                          return;
                        }

                        removeItem.mutate({ sessionKey, ...payload });
                      }}
                      size="icon"
                      type="button"
                      variant="ghost"
                      disabled={
                        removeItem.isPending || checkoutSubmissionLocked
                      }
                    >
                      <Trash2 aria-hidden="true" className="size-4" />
                      <span className="sr-only">הסרה</span>
                    </Button>
                  </div>
                </div>
              ))}
              <div
                className="glass-inset flex items-start gap-2 rounded-md border p-3 text-sm"
                data-testid="checkout-quantity-recovery"
              >
                <PackageCheck
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0"
                />
                <p className="text-muted-foreground leading-6">
                  {checkoutQuantityRecoveryCopy}
                </p>
              </div>
            </CardContent>
          </Card>

          {hasOwnItems ? (
            <>
              <Card className="rounded-md" size="sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckoutStepBadge value="2" />
                    פרטים לאישור
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <p className="text-muted-foreground text-sm">
                    הפרטים יאפשרו לנו לאשר את ההזמנה ולתאם מסירה. הם יאומתו לפני
                    השלמת ההזמנה.
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
                        autoComplete="name"
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
                        autoComplete="tel"
                        disabled={checkoutLocked}
                        id="phone"
                        minLength={7}
                        onBlur={() => markFieldTouched("phone")}
                        onChange={(event) =>
                          setPhone(event.currentTarget.value)
                        }
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
                      autoComplete="email"
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

              <Card className="rounded-md" size="sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckoutStepBadge value="3" />
                    <Truck aria-hidden="true" className="size-5" />
                    מסירה
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="bg-background flex items-start gap-3 rounded-md border p-3.5 text-sm">
                    <Truck
                      className="mt-0.5 size-4 shrink-0"
                      aria-hidden="true"
                    />
                    <div>
                      <p className="font-medium">מסירה עד הבית</p>
                      <p className="text-muted-foreground mt-1">
                        המסירה תתואם לפי הכתובת שתבחרו.
                      </p>
                    </div>
                  </div>
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
                        autoComplete="address-level2"
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
                        autoComplete="street-address"
                        disabled={checkoutLocked}
                        id="street"
                        minLength={2}
                        onBlur={() => markFieldTouched("street")}
                        onChange={(event) =>
                          setStreet(event.currentTarget.value)
                        }
                        required
                        value={street}
                      />
                    </div>
                    <div>
                      <Label htmlFor="postalCode">מיקוד</Label>
                      <Input
                        autoComplete="postal-code"
                        disabled={checkoutLocked}
                        id="postalCode"
                        onChange={(event) =>
                          setPostalCode(event.currentTarget.value)
                        }
                        value={postalCode}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-md" size="sm">
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
                      <Label htmlFor="coupon">קוד הטבה</Label>
                      <Input
                        autoComplete="off"
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
                        checkoutSubmissionLocked
                      }
                      onClick={applyOptions}
                      type="button"
                      variant="secondary"
                    >
                      אישור
                    </Button>
                  </div>
                  <label className="glass-inset flex min-h-11 items-center gap-3 rounded-md border px-3 text-sm">
                    <input
                      checked={giftWrap}
                      disabled={checkoutLocked}
                      onChange={(event) =>
                        setGiftWrap(event.currentTarget.checked)
                      }
                      type="checkbox"
                    />
                    אריזת מתנה
                  </label>
                  <Textarea
                    aria-describedby="checkout-order-note-hint"
                    disabled={checkoutLocked}
                    onChange={(event) =>
                      setGiftMessage(event.currentTarget.value)
                    }
                    placeholder="ברכה אישית"
                    value={giftMessage}
                  />
                  <p
                    className="text-muted-foreground text-xs leading-5"
                    data-testid="checkout-order-note-hint"
                    id="checkout-order-note-hint"
                  >
                    אפשר לציין ברכה, העדפת אריזה או העדפת מסירה. אין לכתוב מספרי
                    אשראי, סיסמאות או מידע רגיש.
                  </p>
                </CardContent>
              </Card>
            </>
          ) : null}
        </div>

        <aside>
          <Card className="rounded-md lg:sticky lg:top-24" size="sm">
            <CardHeader>
              <CheckoutStepBadge value="5" />
              <CardTitle>
                {hasOwnItems
                  ? hasMixedSourceCart
                    ? "סיכום פריטי החנות"
                    : "סיכום"
                  : "סיכום פריטי הספק"}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              {hasOwnItems ? (
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <span>תכשיטים</span>
                    <span data-testid="checkout-item-count">
                      {localCartItemCount}{" "}
                      {localCartItemCount === 1 ? "סוג תכשיט" : "סוגי תכשיטים"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>כמות</span>
                    <span data-testid="checkout-item-quantity">
                      {totalItemQuantity}{" "}
                      {totalItemQuantity === 1 ? "תכשיט" : "תכשיטים"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>סכום התכשיטים</span>
                    <span data-testid="checkout-items-price">
                      {subtotalLabel}
                    </span>
                  </div>
                  {discount > 0 ? (
                    <div className="flex justify-between">
                      <span>הטבה</span>
                      <span>{formatPrice(discount)}</span>
                    </div>
                  ) : null}
                  <div className="flex justify-between">
                    <span>מסירה</span>
                    <span data-testid="checkout-shipping">{shippingLabel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>סכום ביניים</span>
                    <span data-testid="checkout-subtotal">
                      {postDiscountSubtotalLabel}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-base font-semibold">
                    <span>סך הכל</span>
                    <span data-testid="checkout-order-total">
                      {orderTotalLabel}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-xs leading-5">
                    {hasMixedSourceCart
                      ? "הסכום הזה כולל רק את פריטי החנות. פריטי הספק יושלמו וישולמו בקופה נפרדת."
                      : "ההזמנה תושלם רק לאחר אישור הפרטים והסכום."}
                  </p>
                </div>
              ) : (
                <div
                  className="grid gap-2 text-sm"
                  data-testid="checkout-dropship-only-summary"
                >
                  <div className="flex justify-between">
                    <span>פריטי ספק</span>
                    <span data-testid="checkout-dropship-item-count">
                      {dropshipItems.length}{" "}
                      {dropshipItems.length === 1
                        ? "סוג תכשיט"
                        : "סוגי תכשיטים"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>כמות</span>
                    <span data-testid="checkout-dropship-item-quantity">
                      {dropshipTotalQuantity}{" "}
                      {dropshipTotalQuantity === 1 ? "תכשיט" : "תכשיטים"}
                    </span>
                  </div>
                  <div className="flex justify-between text-base font-semibold">
                    <span>סכום פריטי הספק</span>
                    <span data-testid="checkout-dropship-subtotal">
                      {dropshipSubtotalLabel}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-xs leading-5">
                    התשלום, פרטי המסירה ואישור ההזמנה יושלמו בקופת הספק
                    המאובטחת. לא נוצרת כאן הזמנה מקומית עבור פריטי ספק בלבד.
                  </p>
                </div>
              )}
              {hasOwnItems && cart.couponCode ? (
                <Badge className="w-fit" variant="secondary">
                  {cart.couponCode}
                </Badge>
              ) : null}
              {checkoutFulfillmentSummaryRows.length > 0 ? (
                <div
                  className="grid gap-2 text-xs"
                  data-testid="checkout-delivery-confidence-summary"
                >
                  <p className="text-sm font-medium">מסירה ואישור</p>
                  {checkoutFulfillmentSummaryRows.map((item) => {
                    const SummaryIcon =
                      checkoutFulfillmentSummaryIcons[item.key];

                    return (
                      <div
                        className="glass-inset flex items-start gap-2 rounded-md border p-3"
                        data-testid={`checkout-delivery-confidence-${item.key}`}
                        key={item.key}
                      >
                        <SummaryIcon
                          aria-hidden="true"
                          className="mt-0.5 size-4 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-medium">{item.label}</p>
                          <p className="text-muted-foreground mt-0.5 leading-5">
                            {item.detail}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}
              {hasOwnItems && checkoutIssues.length > 0 ? (
                <div
                  className="glass-inset rounded-md border p-3 text-sm"
                  data-testid="checkout-validation-summary"
                  id="checkout-issue-list"
                  role="status"
                  aria-live="polite"
                >
                  <p className="font-medium">לפני אישור הבחירה</p>
                  <ul className="text-muted-foreground mt-2 grid list-inside list-disc gap-1">
                    {checkoutIssues.map((issue) => (
                      <li key={issue}>{issue}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {hasOwnItems && hasPricingReview ? (
                <StatusMessage tone="error">
                  {checkoutPricingReviewMessage}
                </StatusMessage>
              ) : null}
              {cartMutationErrorMessage ? (
                <StatusMessage tone="error">
                  {cartMutationErrorMessage}
                </StatusMessage>
              ) : null}
              {isOffline ? (
                <StatusMessage tone="error">
                  סיום ההזמנה דורש חיבור פעיל. פעולות בחירה נתמכות יישמרו
                  ויסתנכרנו כשהחיבור יחזור.
                </StatusMessage>
              ) : null}
              {hasOwnItems && createOrderErrorMessage ? (
                <StatusMessage tone="error">
                  {createOrderErrorMessage}
                </StatusMessage>
              ) : null}
              {createShopifyCheckoutErrorMessage ? (
                <StatusMessage tone="error">
                  {createShopifyCheckoutErrorMessage}
                </StatusMessage>
              ) : null}
              {(hasOwnItems || hasDropshipItems) && (
                <div
                  className="glass-inset flex items-start gap-2 rounded-md border p-3 text-sm"
                  data-testid="checkout-payment-confidence"
                >
                  <ShieldCheck
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0"
                  />
                  <p className="text-muted-foreground leading-6">
                    {checkoutPaymentConfidenceCopy}
                  </p>
                </div>
              )}
              {hasDropshipItems ? (
                <div className="glass-inset rounded-md border p-3 text-sm">
                  <p className="font-medium">קופת ספק נפרדת</p>
                  <p className="text-muted-foreground mt-1 leading-6">
                    {supplierCheckoutDescription}
                  </p>
                  <Button
                    className="mt-3 w-full"
                    data-testid="shopify-dropship-checkout-button"
                    disabled={isOffline || createShopifyCheckout.isPending}
                    onClick={handleShopifyCheckout}
                    type="button"
                    variant="outline"
                  >
                    מעבר לקופת הספק
                    <ShoppingBag aria-hidden="true" className="size-4" />
                  </Button>
                </div>
              ) : null}
              {hasOwnItems ? (
                <Button
                  data-testid="local-checkout-submit-button"
                  disabled={!canSubmit}
                  size="lg"
                  type="submit"
                >
                  {localCheckoutButtonLabel}
                  <PackageCheck aria-hidden="true" className="size-4" />
                </Button>
              ) : null}
            </CardContent>
          </Card>
        </aside>
      </form>
      {canRenderStickyBar && hasOwnItems
        ? createPortal(mobileCheckoutBar, document.body)
        : null}
    </>
  );
}

function CheckoutEmptyCartState() {
  return (
    <section
      className="mx-auto max-w-6xl px-[var(--ui-page-x)] py-[var(--ui-section-y)] sm:px-6"
      data-testid="cart-checkout-form"
    >
      <div
        className="glass-panel grid min-h-[30rem] gap-8 rounded-md border p-6 sm:p-10 lg:grid-cols-[minmax(0,1.12fr)_minmax(18rem,0.88fr)] lg:items-center lg:p-12"
        data-testid="checkout-empty-cart"
      >
        <div className="max-w-2xl">
          <div className="glass-inset mb-5 grid size-12 place-items-center rounded-full border">
            <ShoppingBag aria-hidden="true" className="size-5" />
          </div>
          <p className="text-muted-foreground text-xs font-medium">
            הבחירה שלי
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-normal sm:text-3xl">
            הבחירה שלך ממתינה לתכשיט הראשון
          </h2>
          <p className="text-muted-foreground mt-4 max-w-xl text-sm leading-7 sm:text-base">
            חזרי לקולקציה ובחרי תכשיט. הסיכום ימתין כאן עם פירוט הפריטים, שמירה
            לבחירה ושירות לפני אישור.
          </p>
          <div className="mt-7 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button asChild>
              <Link href="/search">
                חזרה לקולקציה
                <ShoppingBag aria-hidden="true" className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/service">
                לקבלת ייעוץ
                <MessageCircle aria-hidden="true" className="size-4" />
              </Link>
            </Button>
          </div>
        </div>

        <div
          aria-label="אפשרויות המשך"
          className="grid gap-3 text-sm lg:ps-2"
          data-testid="checkout-empty-actions"
        >
          {checkoutEmptyLinks.map((item) => (
            <Link
              className="glass-inset group grid gap-1 rounded-md border p-4 transition hover:border-[var(--glass-border-strong)]"
              href={item.href}
              key={item.href}
            >
              <span className="font-medium transition group-hover:underline">
                {item.label}
              </span>
              <span className="text-muted-foreground leading-6">
                {item.text}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
