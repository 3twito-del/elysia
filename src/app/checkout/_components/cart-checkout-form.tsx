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
import { Spinner } from "~/components/ui/spinner";
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
import {
  checkoutLegalAgreementText,
  footerBusinessDetails,
  orderLegalLinks,
  vatIncludedNotice,
} from "~/lib/legal-content";
import {
  CheckoutPaymentStatus,
  FieldError,
  ReservationCountdown,
  type CheckoutPaymentStatusKind,
} from "./checkout-status";
import { CheckoutStepBadge } from "./checkout-step-badge";

const checkoutFormId = "cart-checkout-form";
const checkoutLegalAcceptanceErrorId = "checkout-legal-acceptance-error";
const checkoutLegalAcceptanceMessage =
  "יש לאשר את התקנון, מדיניות הפרטיות ומדיניות המשלוחים, הביטולים וההחזרות.";
const checkoutFieldFocusOrder = [
  "name",
  "phone",
  "email",
  "city",
  "street",
] satisfies CheckoutField[];

const checkoutEmptyRecommendedProducts = [
  {
    badge: "נמכר ביותר",
    href: "/product/hera-bracelet",
    image: "/brand/boutique/category-bracelets.avif",
    material: "ציפוי זהב",
    name: "צמיד Hera",
    price: 840,
  },
  {
    badge: "מתנה",
    href: "/product/muse-pearl-earrings",
    image: "/brand/boutique/category-earrings.avif",
    material: "פנינה וציפוי זהב",
    name: "עגילי Muse Pearl",
    price: 690,
  },
  {
    badge: "חדש",
    href: "/product/venus-line-ring",
    image: "/brand/boutique/category-rings.avif",
    material: "זהב ויהלום",
    name: "טבעת Venus Line",
    price: 1290,
  },
] as const;

const checkoutPolicyNotes = [
  "משלוח עד הבית מוצג בסיכום",
  "החלפה או החזרה לפי מדיניות Elysia",
  "אחריות 12 חודשים לפגמי ייצור",
] as const;

const checkoutFulfillmentSummaryIcons = {
  confirmation: ShieldCheck,
  delivery: Truck,
  local: PackageCheck,
  supplier: ShoppingBag,
} as const;

const checkoutProgressSteps = [
  {
    detail: "תכשיטים ומסלול תשלום",
    label: "סקירה",
    value: "1",
  },
  {
    detail: "פרטי קשר, כתובת ומשלוח",
    label: "פרטים",
    value: "2",
  },
  {
    detail: "אריזת מתנה או ברכה קצרה",
    label: "מתנה",
    value: "3",
  },
  {
    detail: "סיכום ותשלום מאובטח",
    label: "תשלום",
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
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [submitLocked, setSubmitLocked] = useState(false);
  const [touchedFields, setTouchedFields] = useState<Set<CheckoutField>>(
    () => new Set(),
  );
  const checkoutFormRef = useRef<HTMLFormElement>(null);
  const checkoutProgressRef = useRef<HTMLDivElement | null>(null);
  const submitLockedRef = useRef(false);
  const [showMobileCheckoutBar, setShowMobileCheckoutBar] = useState(false);

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
  const couponFeedbackMessage = updateOptions.isPending
    ? "בודקים את קוד ההטבה."
    : cart?.couponMessage;
  const couponFeedbackTone =
    cart?.couponStatus === "success"
      ? "success"
      : updateOptions.isPending
        ? "neutral"
        : "error";
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
  const checkoutContactFieldValues: Record<
    "city" | "email" | "name" | "phone" | "street",
    string
  > = {
    name,
    phone,
    email,
    city,
    street,
  };
  const isCheckoutDetailsStepComplete = checkoutFieldFocusOrder.every(
    (field) =>
      Boolean(checkoutContactFieldValues[field].trim()) &&
      !checkoutErrors[field],
  );
  const checkoutStepCompletionByValue: Record<string, boolean> = {
    "1": hasOwnItems,
    "2": isCheckoutDetailsStepComplete,
  };
  const checkoutLegalIssue =
    (hasOwnItems || hasDropshipItems) && !legalAccepted
      ? checkoutLegalAcceptanceMessage
      : null;
  const checkoutIssues = [
    ...getCheckoutIssueList(checkoutErrors),
    ...(checkoutLegalIssue ? [checkoutLegalIssue] : []),
  ];
  const checkoutSubmissionLocked =
    createOrder.isPending || createShopifyCheckout.isPending || submitLocked;
  const checkoutLocked = checkoutSubmissionLocked || isOffline;
  const canSubmit =
    hasOwnItems &&
    !hasCheckoutErrors(checkoutErrors) &&
    legalAccepted &&
    !checkoutLocked &&
    !hasPricingReview;
  const checkoutIntroCopy = hasMixedSourceCart
    ? "הסל מחולק לשני מסלולים: פריטי החנות מסוכמים כאן, ופריטים נפרדים ימשיכו לקופה נפרדת."
    : hasDropshipItems
      ? "הסל ימשיך לקופה נפרדת לתשלום ולמשלוח."
      : "סיכום קצר של הפריטים, המשלוח והתשלום המאובטח.";
  const localCheckoutButtonLabel = hasMixedSourceCart
    ? "המשיכי לתשלום עבור פריטי החנות"
    : "המשיכי לתשלום";
  const supplierCheckoutDescription = hasMixedSourceCart
    ? `${dropshipItems.length} פריטים נפרדים יושלמו בקופה נפרדת מהפריטים המקומיים.`
    : `${dropshipItems.length} פריטים נפרדים יושלמו בקופה נפרדת. פרטי התשלום והמשלוח ייאספו שם.`;
  const checkoutPaymentConfidenceCopy = hasMixedSourceCart
    ? "הסכום המקומי מוצג כאן; הפריטים הנפרדים ישולמו בקופה נפרדת."
    : hasDropshipItems && !hasOwnItems
      ? "התשלום, המשלוח וסיכום ההזמנה יתבצעו בקופה נפרדת. לא נוצרת כאן הזמנה מקומית."
      : "הסיכום מוצג לפני המעבר לתשלום. אין חיוב בשלב זה.";
  const checkoutQuantityRecoveryCopy = isOffline
    ? "שינויי כמות והסרה נשמרים במכשיר ויסתנכרנו כשהחיבור יחזור. המשיכי לתשלום כשיש חיבור פעיל."
    : updateItem.isPending || removeItem.isPending
      ? "מעדכנים את הכמות ואת הסיכום לפני המעבר לתשלום."
      : "שינויי כמות מתעדכנים בסיכום לפני המעבר לתשלום; מגבלת הכמות נשמרת לכל פריט.";
  const mobileCheckoutSummaryCopy = hasMixedSourceCart
    ? `${totalItemQuantity} תכשיטי חנות · ${dropshipTotalQuantity} פריטים בנפרד`
    : hasDropshipItems && !hasOwnItems
      ? `${dropshipTotalQuantity} פריטים ימשיכו לקופה נפרדת`
      : `${totalItemQuantity} תכשיטים בקופה המקומית`;
  const checkoutReadinessSummaryItems = [
    {
      detail:
        checkoutIssues.length > 0
          ? "נציג כאן את הפרטים שחסרים לפני המשך."
          : "הפרטים הדרושים לשלב הבא מופיעים בטופס.",
      icon: PackageCheck,
      key: "review",
      label: "בדיקת פרטים",
      value:
        checkoutIssues.length > 0
          ? `${checkoutIssues.length} פרטים להשלמה`
          : hasOwnItems
            ? "מוכן לתשלום"
            : "מוכן לקופה נפרדת",
    },
    {
      detail: hasOwnItems
        ? "הכתובת שתמסרי תשמש למשלוח."
        : "פרטי המשלוח ייקלטו בקופה הנפרדת.",
      icon: Truck,
      key: "delivery",
      label: "משלוח",
      value: hasMixedSourceCart
        ? "מסלולים נפרדים"
        : hasOwnItems
          ? shippingLabel
          : "בקופה נפרדת",
    },
    {
      detail: hasMixedSourceCart
        ? "פריטי החנות ופריטים נפרדים אינם מחויבים יחד."
        : hasDropshipItems && !hasOwnItems
          ? "התשלום מתבצע מחוץ לקופה המקומית."
          : "המשיכי לתשלום אחרי בדיקה קצרה של הסיכום.",
      icon: ShieldCheck,
      key: "payment",
      label: "תשלום",
      value: hasPricingReview
        ? checkoutTotalReviewLabel
        : hasDropshipItems && !hasOwnItems
          ? "קופה נפרדת"
          : "אין חיוב עכשיו",
    },
    {
      detail: "אפשר לפתוח פנייה לפני התשלום או אחרי שמירת ההזמנה.",
      icon: MessageCircle,
      key: "service",
      label: "שירות",
      value: "לפני ואחרי",
    },
  ];
  const cartMutationError =
    updateItem.error ?? removeItem.error ?? updateOptions.error;
  const cartMutationErrorMessage = cartMutationError
    ? getFriendlyCheckoutErrorMessage(
        cartMutationError,
        "לא הצלחנו לעדכן את הסל כרגע. נסי שוב בעוד רגע.",
      )
    : null;
  const createOrderErrorMessage = createOrder.error
    ? getFriendlyCheckoutErrorMessage(
        createOrder.error,
        "לא הצלחנו לשמור את ההזמנה. בדקי את הפרטים ונסי שוב.",
      )
    : null;
  const createShopifyCheckoutErrorMessage = createShopifyCheckout.error
    ? getFriendlyCheckoutErrorMessage(
        createShopifyCheckout.error,
        "לא הצלחנו לפתוח את הקופה הנפרדת. נסי שוב.",
      )
    : null;
  const checkoutPaymentStatusKind: CheckoutPaymentStatusKind = isOffline
    ? "unavailable"
    : createOrder.isPending || createShopifyCheckout.isPending
      ? "loading"
      : createOrderErrorMessage || createShopifyCheckoutErrorMessage
        ? "retry"
        : "ready";
  const checkoutDisplayGroups = [
    {
      description: "פריטים שממשיכים לקופה המקומית באתר.",
      items: ownItems,
      label: "פריטים מהחנות",
      source: "OWN",
      subtotal: ownSubtotal,
    },
    {
      description: "פריטים שיושלמו בקופה נפרדת.",
      items: dropshipItems,
      label: "פריטים נפרדים",
      source: "DROPSHIP_SHOPIFY",
      subtotal: dropshipSubtotal,
    },
  ].filter((group) => group.items.length > 0);

  useEffect(() => {
    if (!canRenderStickyBar || !hasOwnItems) {
      const frame = window.requestAnimationFrame(() =>
        setShowMobileCheckoutBar(false),
      );

      return () => window.cancelAnimationFrame(frame);
    }

    const checkoutProgress = checkoutProgressRef.current;
    if (!checkoutProgress) {
      const frame = window.requestAnimationFrame(() =>
        setShowMobileCheckoutBar(false),
      );

      return () => window.cancelAnimationFrame(frame);
    }

    const syncMobileCheckoutBar = () => {
      const rect = checkoutProgress.getBoundingClientRect();

      setShowMobileCheckoutBar(rect.bottom <= 0);
    };

    const initialFrame = window.requestAnimationFrame(syncMobileCheckoutBar);

    if (typeof IntersectionObserver !== "undefined") {
      const observer = new IntersectionObserver(() => syncMobileCheckoutBar(), {
        rootMargin: "0px",
        threshold: [0, 1],
      });

      observer.observe(checkoutProgress);
      window.addEventListener("resize", syncMobileCheckoutBar);
      window.addEventListener("scroll", syncMobileCheckoutBar, {
        passive: true,
      });

      return () => {
        window.cancelAnimationFrame(initialFrame);
        observer.disconnect();
        window.removeEventListener("resize", syncMobileCheckoutBar);
        window.removeEventListener("scroll", syncMobileCheckoutBar);
      };
    }

    window.addEventListener("resize", syncMobileCheckoutBar);
    window.addEventListener("scroll", syncMobileCheckoutBar, {
      passive: true,
    });

    return () => {
      window.cancelAnimationFrame(initialFrame);
      window.removeEventListener("resize", syncMobileCheckoutBar);
      window.removeEventListener("scroll", syncMobileCheckoutBar);
    };
  }, [canRenderStickyBar, hasOwnItems]);
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
      data-public-floating-bar-kind="checkout-summary"
      data-public-floating-avoid="true"
      data-testid="mobile-checkout-summary"
    >
      <div className="mx-auto grid max-w-md grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="min-w-0">
          <p
            className="text-muted-foreground truncate text-xs"
            data-testid="mobile-checkout-source-context"
          >
            {mobileCheckoutSummaryCopy}
          </p>
          <p className="text-lg font-semibold">{orderTotalLabel}</p>
        </div>
        <Button disabled={!canSubmit} form={checkoutFormId} type="submit">
          המשיכי
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

    if (!firstInvalidField) {
      if (!legalAccepted) {
        const legalCheckbox =
          checkoutFormRef.current?.elements.namedItem("legalAccepted");

        if (legalCheckbox instanceof HTMLElement) {
          legalCheckbox.focus();
        }
      }

      return;
    }

    const field =
      checkoutFormRef.current?.elements.namedItem(firstInvalidField);

    if (field instanceof HTMLElement) {
      field.focus();
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitAttempted(true);

    if (hasCheckoutErrors(checkoutErrors) || !legalAccepted) {
      window.requestAnimationFrame(focusFirstCheckoutError);
      return;
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
    setSubmitAttempted(true);

    if (!legalAccepted) {
      window.requestAnimationFrame(focusFirstCheckoutError);
      return;
    }

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
      <section className="mx-auto max-w-3xl px-[var(--ui-page-x)] py-[var(--ui-section-y-wide)] lg:px-[var(--ui-page-x-wide)]">
        <Card className="checkout-boutique-panel rounded-md">
          <CardHeader>
            <div className="glass-inset mb-4 grid size-12 place-items-center rounded-full border">
              <CheckCircle2 aria-hidden="true" className="size-6" />
            </div>
            <CardTitle className="text-3xl">ההזמנה נשמרה</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 leading-7">
            <p className="text-muted-foreground">
              מספר ההזמנה הוא {createOrder.data.orderNumber}. התכשיטים נשמרו עד
              לסיום חלון התשלום.
            </p>
            <div className="glass-inset rounded-md border p-4 text-sm">
              <p className="font-medium">פרטי העסק</p>
              <p className="text-muted-foreground mt-1">
                {footerBusinessDetails}
              </p>
            </div>
            <ReservationCountdown
              expiresAt={createOrder.data.reservationExpiresAt}
            />
            <div className="glass-inset rounded-md border p-5">
              <p className="text-muted-foreground text-sm">פרטי המוצרים</p>
              <div className="mt-3 grid gap-3">
                {createOrder.data.items.map((item) => (
                  <div
                    className="grid gap-1 border-b border-[var(--glass-border)] pb-3 last:border-b-0 last:pb-0"
                    key={item.sku}
                  >
                    <p className="font-medium">{item.name}</p>
                    <p className="text-muted-foreground text-sm">
                      מק״ט: {item.sku} · כמות: {item.quantity} · מחיר ליחידה:{" "}
                      {formatPrice(item.unitPrice)}
                    </p>
                    <p className="text-sm font-medium">
                      סה״כ לפריט: {formatPrice(item.lineTotal)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className="glass-inset rounded-md border p-5">
              <p className="text-muted-foreground text-sm">סיכום</p>
              <dl className="mt-3 grid gap-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt>מוצרים</dt>
                  <dd>{formatPrice(createOrder.data.totals.subtotal)}</dd>
                </div>
                {createOrder.data.totals.discount > 0 ? (
                  <div className="flex justify-between gap-4">
                    <dt>הטבה</dt>
                    <dd>{formatPrice(createOrder.data.totals.discount)}</dd>
                  </div>
                ) : null}
                <div className="flex justify-between gap-4">
                  <dt>משלוח</dt>
                  <dd>{formatPrice(createOrder.data.totals.shipping)}</dd>
                </div>
                <Separator />
                <div className="flex justify-between gap-4 text-base font-semibold">
                  <dt>סה״כ לתשלום</dt>
                  <dd>{formatPrice(createOrder.data.totals.total)}</dd>
                </div>
              </dl>
              <p className="text-muted-foreground mt-3 text-sm">
                {vatIncludedNotice}
              </p>
              <p className="text-muted-foreground mt-2 text-sm">
                {createOrder.data.itemCount} תכשיטים ·{" "}
                {createOrder.data.estimatedDelivery}
              </p>
            </div>
            <nav
              aria-label="קישורי מדיניות להזמנה"
              className="grid gap-2 sm:grid-cols-2"
            >
              {orderLegalLinks.map((item) => (
                <Link
                  className="glass-inset hover:text-foreground rounded-md border p-3 text-sm font-medium transition"
                  href={item.href}
                  key={item.href}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/account">אזור אישי</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link
                  href={createOrderServiceHref(createOrder.data.orderNumber)}
                >
                  יצירת קשר עם שירות הלקוחות
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/">המשך לקולקציה</Link>
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
        className="checkout-boutique-form mx-auto grid max-w-7xl gap-5 px-[var(--ui-page-x)] pt-[var(--ui-section-y-tight)] pb-[var(--ui-section-y)] lg:grid-cols-[minmax(0,1fr)_minmax(19rem,24rem)] lg:items-start lg:px-[var(--ui-page-x-wide)]"
        data-testid="cart-checkout-form"
        id={checkoutFormId}
        onSubmit={handleSubmit}
        ref={checkoutFormRef}
      >
        <div className="grid gap-4">
          <div>
            <h2 className="text-xl font-semibold sm:text-2xl">סל קניות</h2>
            <p className="text-muted-foreground mt-1.5 max-w-3xl text-sm leading-6 sm:text-base">
              {checkoutIntroCopy}
            </p>
          </div>

          {hasOwnItems ? (
            <div
              aria-label="שלבי סיום ההזמנה"
              className="checkout-progress-panel glass-panel grid gap-2 rounded-md border p-3 text-sm sm:grid-cols-4"
              data-testid="checkout-progress-steps"
              ref={checkoutProgressRef}
            >
              {checkoutProgressSteps.map((step) => (
                <div
                  className="checkout-progress-step glass-inset grid gap-1 rounded-md border p-3"
                  key={step.value}
                >
                  <div className="flex items-center gap-2">
                    <CheckoutStepBadge
                      isComplete={
                        checkoutStepCompletionByValue[step.value] ?? false
                      }
                      value={step.value}
                    />
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
              אין צורך בפרטי משלוח באתר עבור פריטים אלה. המעבר לקופה נפרדת
              יפתח תשלום מאובטח ומשלוח.
            </StatusMessage>
          )}

          <Card className="checkout-boutique-panel rounded-md" size="sm">
            <CardHeader className="checkout-boutique-card-header">
              <CardTitle className="flex items-center gap-2">
                <CheckoutStepBadge value="1" />
                <PackageCheck aria-hidden="true" className="size-5" />
                הפריטים בסל
              </CardTitle>
            </CardHeader>
            <CardContent className="grid min-h-72 gap-4">
              <div
                className="checkout-source-overview grid gap-2 sm:grid-cols-2"
                data-testid="checkout-source-groups"
              >
                {checkoutDisplayGroups.map((group) => (
                  <div
                    className="checkout-source-card glass-inset grid gap-3 rounded-md border p-3"
                    data-testid={`checkout-source-group-${group.source.toLowerCase()}`}
                    key={group.source}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-muted-foreground text-xs font-medium">
                          {group.source === "OWN" ? "מסלול באתר" : "מסלול נפרד"}
                        </p>
                        <p className="font-medium">{group.label}</p>
                      </div>
                      <Badge variant="secondary">
                        {formatPrice(group.subtotal)}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground mt-1 text-xs leading-5">
                      {group.description}
                    </p>
                    <p className="text-xs font-medium">
                      {group.source === "OWN"
                        ? "הסכום, הכמות והמשלוח מוצגים כאן לפני התשלום."
                        : "התשלום והמשלוח יושלמו בקופה נפרדת."}
                    </p>
                  </div>
                ))}
              </div>
              {cart.items.map((item) => (
                <div
                  className="checkout-boutique-item-card bg-background grid grid-cols-[68px_minmax(0,1fr)] gap-3 rounded-md border p-3 sm:grid-cols-[68px_minmax(0,1fr)_auto] sm:items-center"
                  key={item.id}
                >
                  <Link
                    aria-label={`צפייה בתכשיט ${item.productName}`}
                    className="checkout-boutique-thumb bg-muted relative size-[68px] overflow-hidden rounded-md border border-[var(--glass-border)]"
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
                        ? "פריט נפרד"
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
                      className="text-foreground mt-1 flex items-baseline justify-between gap-2 text-sm font-semibold"
                      data-testid="checkout-line-total"
                    >
                      <span>סה״כ</span>
                      <span data-testid="checkout-line-total-amount">
                        {getCheckoutAmountLabel(item.lineTotal, {
                          requiresPositive: true,
                          reviewLabel: checkoutPriceReviewLabel,
                        })}
                      </span>
                    </p>
                    <p className="text-muted-foreground mt-1 text-xs leading-5">
                      שירות זמין לפני ההזמנה ולאחריה.
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
                      aria-label={`הסרת ${item.productName} מהסל`}
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
              <Card className="checkout-boutique-panel rounded-md" size="sm">
                <CardHeader className="checkout-boutique-card-header">
                  <CardTitle className="flex items-center gap-2">
                    <CheckoutStepBadge value="2" />
                    פרטים ומשלוח
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <p className="text-muted-foreground text-sm">
                    פרטי הקשר והכתובת נשמרים באותו שלב כדי לקצר את הטופס.
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="name" required>
                        שם מלא
                      </Label>
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
                      <Label htmlFor="phone" required>
                        טלפון
                      </Label>
                      <FieldError
                        id="phone-error"
                        message={getVisibleFieldError("phone")}
                      />
                      <Input
                        aria-describedby="phone-error"
                        aria-invalid={Boolean(getVisibleFieldError("phone"))}
                        autoComplete="tel"
                        dir="ltr"
                        disabled={checkoutLocked}
                        id="phone"
                        inputMode="tel"
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
                    <Label htmlFor="email" required>
                      אימייל
                    </Label>
                    <FieldError
                      id="email-error"
                      message={getVisibleFieldError("email")}
                    />
                    <Input
                      aria-describedby="email-error"
                      aria-invalid={Boolean(getVisibleFieldError("email"))}
                      autoComplete="email"
                      dir="ltr"
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
                  <div
                    className="checkout-delivery-fields grid gap-4"
                    data-testid="checkout-delivery-fields"
                  >
                    <div className="checkout-service-note bg-background flex items-start gap-3 rounded-md border p-3.5 text-sm">
                      <Truck
                        className="mt-0.5 size-4 shrink-0"
                        aria-hidden="true"
                      />
                      <div>
                        <p className="font-medium">משלוח עד הבית</p>
                        <p className="text-muted-foreground mt-1">
                          המשלוח יתואם לפי הכתובת שתמסרי.
                        </p>
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="city" required>
                          עיר
                        </Label>
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
                          onChange={(event) =>
                            setCity(event.currentTarget.value)
                          }
                          required
                          value={city}
                        />
                      </div>
                      <div>
                        <Label htmlFor="street" required>
                          רחוב ומספר
                        </Label>
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
                          dir="ltr"
                          disabled={checkoutLocked}
                          id="postalCode"
                          inputMode="numeric"
                          onChange={(event) =>
                            setPostalCode(event.currentTarget.value)
                          }
                          value={postalCode}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="checkout-boutique-panel rounded-md" size="sm">
                <CardHeader className="checkout-boutique-card-header">
                  <CardTitle className="flex items-center gap-2">
                    <CheckoutStepBadge value="3" />
                    <Gift aria-hidden="true" className="size-5" />
                    הטבות ומתנה
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3">
                  <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                    <div>
                      <Label htmlFor="coupon">קוד הטבה</Label>
                      <Input
                        aria-describedby={
                          couponFeedbackMessage
                            ? "checkout-coupon-status"
                            : undefined
                        }
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
                      החילי
                    </Button>
                  </div>
                  {couponFeedbackMessage ? (
                    <StatusMessage
                      id="checkout-coupon-status"
                      role={couponFeedbackTone === "error" ? "alert" : "status"}
                      testId="checkout-coupon-status"
                      tone={couponFeedbackTone}
                      variant="plain"
                    >
                      {couponFeedbackMessage}
                    </StatusMessage>
                  ) : null}
                  <label
                    className="glass-inset flex min-h-11 items-center gap-3 rounded-md border px-3 text-sm"
                    data-testid="checkout-gift-wrap-upsell"
                  >
                    <input
                      checked={giftWrap}
                      disabled={checkoutLocked}
                      onChange={(event) =>
                        setGiftWrap(event.currentTarget.checked)
                      }
                      type="checkbox"
                    />
                    <span>
                      <span className="block font-medium">
                        הוסיפי אריזת מתנה
                      </span>
                      <span className="text-muted-foreground block text-xs">
                        נצרף אריזה נקייה וברכה קצרה אם תרצי.
                      </span>
                    </span>
                  </label>
                  <Textarea
                    aria-describedby="checkout-order-note-hint"
                    disabled={checkoutLocked}
                    onChange={(event) =>
                      setGiftMessage(event.currentTarget.value)
                    }
                    placeholder="ברכה"
                    value={giftMessage}
                  />
                  <p
                    className="text-muted-foreground text-xs leading-5"
                    data-testid="checkout-order-note-hint"
                    id="checkout-order-note-hint"
                  >
                    אפשר לציין ברכה, אריזה או העדפת משלוח. אין לכתוב פרטי
                    אשראי, סיסמאות או מידע רגיש.
                  </p>
                </CardContent>
              </Card>
            </>
          ) : null}
        </div>

        <aside>
          <Card
            className="checkout-boutique-panel checkout-boutique-summary rounded-md lg:sticky lg:top-24"
            size="sm"
          >
            <CardHeader className="checkout-boutique-card-header">
              <CheckoutStepBadge value="4" />
              <CardTitle>
                {hasOwnItems ? "סיכום הזמנה" : "סיכום פריטים נפרדים"}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              {hasOwnItems ? (
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <span>מוצר</span>
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
                    <span>מחיר</span>
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
                    <span>משלוח</span>
                    <span data-testid="checkout-shipping">{shippingLabel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>לאחר הטבה</span>
                    <span data-testid="checkout-subtotal">
                      {postDiscountSubtotalLabel}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-base font-semibold">
                    <span>סה״כ</span>
                    <span data-testid="checkout-order-total">
                      {orderTotalLabel}
                    </span>
                  </div>
                  <p
                    className="text-muted-foreground text-xs leading-5"
                    data-testid="checkout-vat-inclusion"
                  >
                    {vatIncludedNotice}
                  </p>
                  <p className="text-muted-foreground text-xs leading-5">
                    {hasMixedSourceCart
                      ? "הסכום כולל רק פריטי חנות. פריטים נפרדים יושלמו בקופה נפרדת."
                      : "הסיכום נשמר ואז תמשיכי לתשלום מאובטח."}
                  </p>
                </div>
              ) : (
                <div
                  className="grid gap-2 text-sm"
                  data-testid="checkout-dropship-only-summary"
                >
                  <div className="flex justify-between">
                    <span>מוצר</span>
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
                    <span>מחיר</span>
                    <span data-testid="checkout-dropship-subtotal">
                      {dropshipSubtotalLabel}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>משלוח</span>
                    <span>יחושב בקופה נפרדת</span>
                  </div>
                  <div className="flex justify-between">
                    <span>סכום סופי</span>
                    <span>יוצג בקופה נפרדת</span>
                  </div>
                  <p
                    className="text-muted-foreground text-xs leading-5"
                    data-testid="checkout-dropship-vat-inclusion"
                  >
                    {vatIncludedNotice}
                  </p>
                  <p className="text-muted-foreground text-xs leading-5">
                    התשלום, המשלוח וסיכום ההזמנה יושלמו בקופה נפרדת. לא נוצרת
                    כאן הזמנה מקומית.
                  </p>
                </div>
              )}
              {hasOwnItems && cart.couponCode ? (
                <Badge className="w-fit" variant="secondary">
                  {cart.couponCode}
                </Badge>
              ) : null}
              <section
                aria-labelledby="checkout-readiness-summary-title"
                className="border-y border-[var(--glass-border)] py-3"
                data-checkout-ready={
                  checkoutIssues.length === 0 && !hasPricingReview && !isOffline
                    ? "true"
                    : "false"
                }
                data-testid="checkout-readiness-summary"
              >
                <div className="flex items-start gap-2">
                  <ShieldCheck
                    aria-hidden="true"
                    className="mt-1 size-4 shrink-0"
                  />
                  <div className="min-w-0">
                    <h2
                      className="text-sm font-semibold"
                      id="checkout-readiness-summary-title"
                    >
                      בדיקת הזמנה לפני תשלום
                    </h2>
                    <p className="text-muted-foreground mt-1 text-xs leading-5">
                      הסיכום, המשלוח והתשלום מרוכזים כאן לפני המעבר לשלב הבא.
                    </p>
                  </div>
                </div>
                <dl className="mt-3 grid gap-2">
                  {checkoutReadinessSummaryItems.map((item) => {
                    const SummaryIcon = item.icon;

                    return (
                      <div
                        className="grid grid-cols-[auto_minmax(0,1fr)] gap-2 text-xs"
                        data-testid={`checkout-readiness-${item.key}`}
                        key={item.key}
                      >
                        <SummaryIcon
                          aria-hidden="true"
                          className="mt-1 size-3.5 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="flex items-baseline justify-between gap-3">
                            <dt className="text-muted-foreground">
                              {item.label}
                            </dt>
                            <dd className="text-end font-medium">
                              {item.value}
                            </dd>
                          </div>
                          <p className="text-muted-foreground mt-0.5 leading-5">
                            {item.detail}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </dl>
              </section>
              {checkoutFulfillmentSummaryRows.length > 0 ? (
                <div
                  className="grid gap-2 text-xs"
                  data-testid="checkout-delivery-confidence-summary"
                >
                  <p className="text-sm font-medium">משלוח, החזרה ואחריות</p>
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
              <div
                className="checkout-policy-notes grid gap-2 text-xs"
                data-testid="checkout-policy-notes"
              >
                {checkoutPolicyNotes.map((note) => (
                  <div
                    className="glass-inset flex items-center gap-2 rounded-md border px-3 py-2"
                    key={note}
                  >
                    <CheckCircle2
                      aria-hidden="true"
                      className="size-3.5 shrink-0"
                    />
                    <span>{note}</span>
                  </div>
                ))}
              </div>
              {hasOwnItems && checkoutIssues.length > 0 ? (
                <div
                  className="glass-inset rounded-md border p-3 text-sm"
                  data-testid="checkout-validation-summary"
                  id="checkout-issue-list"
                  role="status"
                  aria-live="polite"
                >
                  <p className="font-medium">לפני שתמשיכי לתשלום</p>
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
                  סיום הזמנה דורש חיבור. פעולות נתמכות יסתנכרנו כשהחיבור יחזור.
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
              {(hasOwnItems || hasDropshipItems) && (
                <CheckoutPaymentStatus status={checkoutPaymentStatusKind} />
              )}
              {(hasOwnItems || hasDropshipItems) && (
                <div
                  className="glass-inset grid gap-3 rounded-md border p-3 text-sm"
                  data-testid="checkout-legal-acceptance"
                >
                  <label className="flex items-start gap-2 leading-6">
                    <input
                      aria-describedby={`checkout-policy-links ${checkoutLegalAcceptanceErrorId}`}
                      aria-invalid={Boolean(submitAttempted && !legalAccepted)}
                      checked={legalAccepted}
                      className="mt-1"
                      disabled={checkoutLocked}
                      id="checkout-legal-acceptance"
                      name="legalAccepted"
                      onChange={(event) =>
                        setLegalAccepted(event.currentTarget.checked)
                      }
                      required={hasOwnItems}
                      type="checkbox"
                    />
                    <span>{checkoutLegalAgreementText}</span>
                  </label>
                  <nav
                    aria-label="קישורי מדיניות לפני תשלום"
                    className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-xs"
                    data-testid="checkout-policy-links"
                    id="checkout-policy-links"
                  >
                    <Link
                      className="underline underline-offset-4"
                      href="/terms"
                    >
                      תקנון האתר
                    </Link>
                    <Link
                      className="underline underline-offset-4"
                      href="/privacy"
                    >
                      מדיניות פרטיות
                    </Link>
                    <Link
                      className="underline underline-offset-4"
                      href="/shipping-returns"
                    >
                      משלוחים, ביטולים והחזרות
                    </Link>
                  </nav>
                  <p
                    className="text-destructive min-h-5 text-xs leading-5"
                    id={checkoutLegalAcceptanceErrorId}
                    role={
                      submitAttempted && !legalAccepted ? "alert" : undefined
                    }
                  >
                    {submitAttempted && !legalAccepted
                      ? checkoutLegalAcceptanceMessage
                      : null}
                  </p>
                </div>
              )}
              <div
                className="checkout-action-stack grid gap-3"
                data-testid="checkout-action-stack"
              >
                {hasOwnItems ? (
                  <div
                    className="checkout-action-panel checkout-local-action-panel glass-inset rounded-md border p-3 text-sm"
                    data-testid="checkout-local-action-panel"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium">תשלום באתר Elysia</p>
                      <Badge
                        className="gap-1"
                        data-testid="checkout-secure-payment-badge"
                        variant="secondary"
                      >
                        <ShieldCheck aria-hidden="true" className="size-3.5" />
                        תשלום מאובטח
                      </Badge>
                    </div>
                    <p className="text-muted-foreground mt-1 leading-6">
                      {hasMixedSourceCart
                        ? "הפעולה הזו ממשיכה עם פריטי החנות ומשאירה את הפריטים הנפרדים במסלול שלהם."
                        : "הפעולה הזו שומרת את הסיכום וממשיכה לתשלום."}
                    </p>
                    <Button
                      className="mt-3 w-full"
                      data-testid="local-checkout-submit-button"
                      disabled={!canSubmit}
                      size="lg"
                      type="submit"
                    >
                      {createOrder.isPending ? "שולחים הזמנה" : localCheckoutButtonLabel}
                      {createOrder.isPending ? (
                        <Spinner aria-hidden="true" role="presentation" />
                      ) : (
                        <PackageCheck aria-hidden="true" className="size-4" />
                      )}
                    </Button>
                  </div>
                ) : null}
                {hasDropshipItems ? (
                  <div
                    className="checkout-action-panel checkout-supplier-action-panel glass-inset rounded-md border p-3 text-sm"
                    data-testid="checkout-supplier-action-panel"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium">קופה נפרדת</p>
                      <Badge className="gap-1" variant="secondary">
                        <ShieldCheck aria-hidden="true" className="size-3.5" />
                        תשלום מאובטח
                      </Badge>
                    </div>
                    <p className="text-muted-foreground mt-1 leading-6">
                      {supplierCheckoutDescription}
                    </p>
                    <Button
                      className="mt-3 w-full"
                      data-testid="shopify-dropship-checkout-button"
                      disabled={
                        isOffline ||
                        createShopifyCheckout.isPending ||
                        !legalAccepted
                      }
                      onClick={handleShopifyCheckout}
                      type="button"
                      variant="outline"
                    >
                      המשיכי לתשלום
                      <ShoppingBag aria-hidden="true" className="size-4" />
                    </Button>
                  </div>
                ) : null}
                <Button asChild variant="outline">
                  <Link href="/search">המשך לקולקציות</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </aside>
      </form>
      {canRenderStickyBar && hasOwnItems && showMobileCheckoutBar
        ? createPortal(mobileCheckoutBar, document.body)
        : null}
    </>
  );
}

function CheckoutEmptyCartState() {
  return (
    <section
      className="checkout-empty-section mx-auto max-w-6xl px-[var(--ui-page-x)] py-[var(--ui-section-y)] lg:px-[var(--ui-page-x-wide)]"
      data-testid="cart-checkout-form"
    >
      <div
        className="checkout-empty-panel glass-panel grid gap-6 rounded-md border p-6 sm:p-8 lg:min-h-[22rem] lg:grid-cols-[minmax(0,1.12fr)_minmax(18rem,0.88fr)] lg:items-center lg:p-10"
        data-testid="checkout-empty-cart"
      >
        <div className="max-w-2xl">
          <div className="checkout-empty-icon glass-inset mb-5 grid size-12 place-items-center rounded-full border">
            <ShoppingBag aria-hidden="true" className="size-5" />
          </div>
          <p className="text-muted-foreground text-xs font-medium">
            סל הקניות
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-normal sm:text-3xl">
            התחילי מהנמכרים ביותר
          </h2>
          <p className="text-muted-foreground mt-4 max-w-xl text-sm leading-7 sm:text-base">
            שלושה תכשיטים שנבחרים שוב ושוב.
          </p>
          <div className="mt-7 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button asChild>
              <Link href="/search">
                התחילי מהנמכרים ביותר
                <ShoppingBag aria-hidden="true" className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/gifts">מצאי מתנה</Link>
            </Button>
          </div>
        </div>

        <div
          aria-label="מוצרים מומלצים לסל ריק"
          className="grid gap-3 text-sm lg:ps-2"
          data-testid="checkout-empty-actions"
        >
          {checkoutEmptyRecommendedProducts.map((item) => (
            <Link
              className="glass-inset group grid grid-cols-[5.25rem_minmax(0,1fr)] gap-3 rounded-md border p-3 transition hover:border-[var(--glass-border-strong)]"
              data-testid="checkout-empty-recommended-product"
              href={item.href}
              key={item.href}
            >
              <span className="bg-muted relative aspect-square overflow-hidden rounded-md border border-[var(--glass-border)]">
                <Image
                  alt=""
                  className="media-color object-cover"
                  fill
                  sizes="84px"
                  src={item.image}
                />
              </span>
              <span className="grid min-w-0 gap-1">
                <span className="text-muted-foreground text-xs">
                  {item.badge}
                </span>
                <span className="font-medium transition group-hover:underline">
                  {item.name}
                </span>
                <span className="text-muted-foreground text-xs">
                  {item.material}
                </span>
                <span className="font-semibold">{formatPrice(item.price)}</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function createOrderServiceHref(orderNumber: string) {
  const params = new URLSearchParams({
    orderNumber,
    topic: "order",
  });

  return `/service?${params.toString()}`;
}
