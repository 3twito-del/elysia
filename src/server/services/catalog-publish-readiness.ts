export const PRODUCT_PUBLISH_BLOCKER_LABELS = {
  BASE_PRICE_INVALID: "מחיר בסיס תקין",
  CARE_INSTRUCTIONS_MISSING: "הנחיות טיפול",
  COUNTRY_OF_MANUFACTURE_MISSING: "מדינת ייצור",
  DELIVERY_PROMISE_MISSING: "הבטחת משלוח",
  FACT_VERIFICATION_MISSING: "אימות עובדות ואסמכתה",
  MANUFACTURER_OR_IMPORTER_MISSING: "יצרן או יבואן",
  MATERIAL_DETAILS_MISSING: "פרטי חומר",
  MEASUREMENTS_MISSING: "מידות מוצר",
  POLICY_VERIFICATION_MISSING: "אימות מדיניות ואסמכתה",
  PRIMARY_MEDIA_MISSING: "מדיה ראשית עם טקסט חלופי",
  RETURN_POLICY_MISSING: "מדיניות החזרה",
  SHOPIFY_MAPPING_MISSING: "מיפוי מלא למוצר הספק",
  STONE_DETAILS_MISSING: "פרטי אבן",
  VARIANT_PRICE_MISSING: "וריאציה עם מחיר פעיל",
  WARRANTY_MISSING: "אחריות",
} as const;

export type ProductPublishBlocker = keyof typeof PRODUCT_PUBLISH_BLOCKER_LABELS;

type PublishReadinessProduct = {
  basePrice: number;
  careInstructions?: string | null;
  countryOfManufacture?: string | null;
  deliveryPromise?: string | null;
  externalHandle?: string | null;
  externalProductId?: string | null;
  externalProvider?: string | null;
  factSourceReference?: string | null;
  factVerifiedAt?: Date | null;
  factVerifiedBy?: string | null;
  manufacturerOrImporter?: string | null;
  materialDetails?: string | null;
  measurements?: string | null;
  media: Array<{
    alt: string;
    isPrimary: boolean;
    role?: string | null;
    url: string;
  }>;
  policySourceReference?: string | null;
  policyVerifiedAt?: Date | null;
  policyVerifiedBy?: string | null;
  returnPolicy?: string | null;
  source: "DROPSHIP_SHOPIFY" | "OWN";
  stoneId?: string | null;
  stoneDetails?: string | null;
  supplierKey?: string | null;
  variants: Array<{ prices: Array<{ amount: number; validTo?: Date | null }> }>;
  warranty?: string | null;
};

export function getProductPublishBlockers(
  product: PublishReadinessProduct,
  now = new Date(),
): ProductPublishBlocker[] {
  const blockers: ProductPublishBlocker[] = [];

  requireValue(product.countryOfManufacture, "COUNTRY_OF_MANUFACTURE_MISSING");
  requireValue(
    product.manufacturerOrImporter,
    "MANUFACTURER_OR_IMPORTER_MISSING",
  );
  requireValue(product.materialDetails, "MATERIAL_DETAILS_MISSING");
  requireValue(product.measurements, "MEASUREMENTS_MISSING");
  requireValue(product.deliveryPromise, "DELIVERY_PROMISE_MISSING");
  requireValue(product.returnPolicy, "RETURN_POLICY_MISSING");
  requireValue(product.careInstructions, "CARE_INSTRUCTIONS_MISSING");
  requireValue(product.warranty, "WARRANTY_MISSING");

  if (product.stoneId && isBlank(product.stoneDetails)) {
    blockers.push("STONE_DETAILS_MISSING");
  }

  if (
    !isValidVerification(
      product.factSourceReference,
      product.factVerifiedAt,
      product.factVerifiedBy,
      now,
    )
  ) {
    blockers.push("FACT_VERIFICATION_MISSING");
  }

  if (
    !isValidVerification(
      product.policySourceReference,
      product.policyVerifiedAt,
      product.policyVerifiedBy,
      now,
    )
  ) {
    blockers.push("POLICY_VERIFICATION_MISSING");
  }

  if (
    !product.media.some(
      (media) =>
        (media.role === "PRIMARY" || media.isPrimary) &&
        !isBlank(media.url) &&
        !isBlank(media.alt),
    )
  ) {
    blockers.push("PRIMARY_MEDIA_MISSING");
  }

  const hasActiveVariantPrice = product.variants.some((variant) =>
    variant.prices.some(
      (price) =>
        Number.isFinite(price.amount) &&
        price.amount > 0 &&
        (!price.validTo || price.validTo.getTime() > now.getTime()),
    ),
  );

  if (!hasActiveVariantPrice) blockers.push("VARIANT_PRICE_MISSING");
  if (!Number.isFinite(product.basePrice) || product.basePrice <= 0) {
    blockers.push("BASE_PRICE_INVALID");
  }

  if (
    product.source === "DROPSHIP_SHOPIFY" &&
    [
      product.externalProvider,
      product.externalProductId,
      product.externalHandle,
      product.supplierKey,
    ].some(isBlank)
  ) {
    blockers.push("SHOPIFY_MAPPING_MISSING");
  }

  return blockers;

  function requireValue(
    value: string | null | undefined,
    blocker: ProductPublishBlocker,
  ) {
    if (isBlank(value)) blockers.push(blocker);
  }
}

export function formatProductPublishBlockers(
  blockers: readonly ProductPublishBlocker[],
) {
  return blockers.map((blocker) => PRODUCT_PUBLISH_BLOCKER_LABELS[blocker]);
}

function isBlank(value: string | null | undefined) {
  return !value?.trim();
}

function isValidVerification(
  sourceReference: string | null | undefined,
  verifiedAt: Date | null | undefined,
  verifiedBy: string | null | undefined,
  now: Date,
) {
  return Boolean(
    !isBlank(sourceReference) &&
    !isBlank(verifiedBy) &&
    verifiedAt &&
    !Number.isNaN(verifiedAt.getTime()) &&
    verifiedAt.getTime() <= now.getTime(),
  );
}
