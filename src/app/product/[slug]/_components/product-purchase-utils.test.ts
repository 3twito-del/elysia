import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  getAddToCartFailureMessage,
  getPurchaseConfidenceItems,
  getVariantButtonLabel,
  getVariantStatusLabel,
  isVariantSelectableForCart,
} from "./product-purchase-utils";

it("maps add-to-cart failures to customer-safe recovery copy", () => {
  expect(
    getAddToCartFailureMessage({
      message: "Inventory reservation failed for variant abc",
    }),
  ).toBe(
    "ההתאמה הזו אינה זמינה כרגע. אפשר לבחור התאמה אחרת או לפנות לשירות האישי.",
  );
  expect(
    getAddToCartFailureMessage({
      message: "Quantity limit exceeded",
    }),
  ).toBe(
    "לא ניתן להוסיף את הכמות הזו לסל. אפשר לנסות כמות אחרת או לפנות לשירות.",
  );
  expect(
    getAddToCartFailureMessage({
      message: "database connection timeout",
    }),
  ).toBe("לא הצלחנו להוסיף לסל כרגע. הבחירה נשארה בעמוד ואפשר לנסות שוב.");
});

const baseVariant = {
  availableBranchCount: 0,
  availableQuantity: 0,
  inventory: {},
  name: "Silver",
  price: 390,
  sku: "SHOPIFY-ELYSIA-HALO-RING-SILVER",
};

describe("product purchase utilities", () => {
  it("treats Shopify dropship variants with external mappings as selectable", () => {
    const variant = {
      ...baseVariant,
      externalVariantId: "gid://shopify/ProductVariant/10",
    };

    expect(
      isVariantSelectableForCart({
        availabilityMode: "READY_TO_ORDER",
        productSource: "DROPSHIP_SHOPIFY",
        variant,
      }),
    ).toBe(true);
    expect(
      getVariantStatusLabel({
        availabilityMode: "READY_TO_ORDER",
        productSource: "DROPSHIP_SHOPIFY",
        variant,
      }),
    ).toBe("זמין דרך Shopify");
    expect(
      getVariantButtonLabel(variant, "READY_TO_ORDER", "DROPSHIP_SHOPIFY"),
    ).toContain("זמין דרך Shopify");
  });

  it("keeps owned zero-stock variants on the service inquiry path", () => {
    const buttonLabel = getVariantButtonLabel(
      baseVariant,
      "READY_TO_ORDER",
      "OWN",
    );

    expect(
      isVariantSelectableForCart({
        availabilityMode: "READY_TO_ORDER",
        productSource: "OWN",
        variant: baseVariant,
      }),
    ).toBe(false);
    expect(buttonLabel).not.toMatch(/\b0\b.*(?:available|stock|inventory)/i);
    expect(buttonLabel).not.toContain("availableQuantity");
    expect(
      getVariantStatusLabel({
        availabilityMode: "READY_TO_ORDER",
        productSource: "OWN",
        variant: baseVariant,
      }),
    ).toBe("בירור התאמה");
  });

  it("keeps unavailable PDP variant controls disabled without exposing stock", () => {
    const panel = readFileSync(
      path.join(
        process.cwd(),
        "src/app/product/[slug]/_components/product-purchase-panel.tsx",
      ),
      "utf8",
    );

    expect(panel).toContain("selectedVariantAvailable");
    expect(panel).toContain("addToCartDisabled");
    expect(panel).toContain("disabled={addToCartDisabled}");
    expect(panel).toContain("!selectedVariantAvailable");
    expect(panel).toContain("variant.availableQuantity <= 0");
    expect(panel).toContain("commerceStatus.ctaLabel");
    expect(panel).not.toContain("selectedVariantQuantity}");
    expect(panel).not.toContain("availableQuantity}");
  });

  it("summarizes Shopify checkout expectations without public stock precision", () => {
    const variant = {
      ...baseVariant,
      availableQuantity: 12,
      externalVariantId: "gid://shopify/ProductVariant/10",
    };
    const items = getPurchaseConfidenceItems({
      availabilityMode: "READY_TO_ORDER",
      deliveryPromise: "מסירה ותשלום יושלמו בקופת הספק.",
      productSource: "DROPSHIP_SHOPIFY",
      returnPolicy: "החזרות והחלפות לפי מדיניות הספק.",
      sizeKind: "ring",
      variant,
      variantStatusLabel: getVariantStatusLabel({
        availabilityMode: "READY_TO_ORDER",
        productSource: "DROPSHIP_SHOPIFY",
        variant,
      }),
    });
    const text = items.map((item) => item.description).join(" ");

    expect(items).toHaveLength(3);
    expect(text).toContain("Shopify");
    expect(text).toContain("קופת הספק");
    expect(text).not.toContain("12");
  });

  it("keeps owned-product purchase confidence tied to verification and service", () => {
    const variant = {
      ...baseVariant,
      availableQuantity: 2,
    };
    const items = getPurchaseConfidenceItems({
      availabilityMode: "READY_TO_ORDER",
      deliveryPromise: "מסירה עד הבית לאחר אישור הפרטים.",
      productSource: "OWN",
      returnPolicy: "החלפה או החזרה בתיאום אישי לפי מדיניות Elysia.",
      sizeKind: "ring",
      variant,
      variantStatusLabel: getVariantStatusLabel({
        availabilityMode: "READY_TO_ORDER",
        productSource: "OWN",
        variant,
      }),
    });
    const checkoutItem = items.find((item) => item.key === "checkout");
    const fitItem = items.find((item) => item.key === "fit");

    expect(checkoutItem?.description).toContain("מאומתים");
    expect(fitItem?.description).toContain("מדריך המידות");
    expect(items.map((item) => item.description).join(" ")).not.toContain("2");
  });

  it("places care and warranty facts in the purchase confidence service item", () => {
    const variant = {
      ...baseVariant,
      availableQuantity: 2,
    };
    const items = getPurchaseConfidenceItems({
      availabilityMode: "READY_TO_ORDER",
      careInstructions: "ניקוי עדין במטלית רכה.",
      deliveryPromise: "מסירה עד הבית לאחר אישור הפרטים.",
      productSource: "OWN",
      returnPolicy: "החלפה או החזרה בתיאום אישי.",
      sizeKind: "ring",
      variant,
      variantStatusLabel: getVariantStatusLabel({
        availabilityMode: "READY_TO_ORDER",
        productSource: "OWN",
        variant,
      }),
      warranty: "אחריות לשנה על פגמי ייצור.",
    });
    const serviceItem = items.find((item) => item.key === "service");

    expect(serviceItem?.title).toBe("מסירה, טיפול ואחריות");
    expect(serviceItem?.description).toContain(
      "אחריות: אחריות לשנה על פגמי ייצור.",
    );
    expect(serviceItem?.description).toContain("טיפול: ניקוי עדין במטלית רכה.");
  });
});
