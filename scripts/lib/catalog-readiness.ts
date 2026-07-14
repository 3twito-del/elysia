export const CATALOG_READINESS_REQUIRED_MEDIA_ROLES = [
  "primary",
  "alternate",
  "scale",
  "construction",
  "material",
  "context",
] as const;

export type CatalogReadinessMediaRole =
  (typeof CATALOG_READINESS_REQUIRED_MEDIA_ROLES)[number];

export const CATALOG_READINESS_SUPPORTED_MEDIA_FORMATS = {
  image: ["avif", "webp", "jpg", "jpeg", "png"],
  video: ["mp4", "webm"],
} as const;

export const CATALOG_READINESS_MEDIA_LIMITS = {
  /** Minimum shorter-edge pixels for inspection-grade product imagery. */
  minImageEdgePx: 1000,
  /** Maximum long:short edge ratio before framing is flagged. */
  maxImageAspectRatio: 2.5,
} as const;

export type CatalogReadinessSeverity = "blocker" | "high" | "medium" | "info";

export type CatalogReadinessCategory =
  | "data"
  | "media"
  | "policy"
  | "source"
  | "variant";

export type CatalogReadinessMediaProvenance =
  | "AI_GENERATED"
  | "OWNER_UPLOAD"
  | "STOCK_LICENSED"
  | "SUPPLIER_FEED"
  | "UNKNOWN";

export type CatalogReadinessMediaLicenseStatus =
  | "LICENSED"
  | "NEEDS_REVIEW"
  | "OWNED"
  | "SUPPLIER_GRANTED"
  | "UNKNOWN";

export type CatalogReadinessMedia = {
  alt: string;
  /** B-07 asset governance fields — see auditProductMedia's governance checks. */
  approvedAt?: Date | string | null;
  height?: number | null;
  isGenerated?: boolean;
  isPrimary: boolean;
  kind: "IMAGE" | "TRY_ON_REFERENCE" | "VIDEO";
  licenseExpiresAt?: Date | string | null;
  licenseStatus?: CatalogReadinessMediaLicenseStatus | null;
  provenance?: CatalogReadinessMediaProvenance | null;
  role?: CatalogReadinessMediaRole | null;
  sortOrder: number;
  url: string;
  width?: number | null;
};

export type CatalogReadinessPrice = {
  amount: number;
  currency: string;
  validTo?: Date | string | null;
};

export type CatalogReadinessVariant = {
  externalVariantId?: string | null;
  isDefault: boolean;
  metalColor?: string | null;
  name: string;
  prices: CatalogReadinessPrice[];
  size?: string | null;
  sku: string;
  stoneColor?: string | null;
};

export type CatalogReadinessProduct = {
  availabilityMode: string;
  basePrice: number;
  careInstructions?: string | null;
  category: { name: string; slug: string };
  collections: { name: string; slug: string }[];
  commerceHighlights: string[];
  deliveryPromise?: string | null;
  description: string;
  externalHandle?: string | null;
  externalProductId?: string | null;
  externalProvider?: string | null;
  factVerification?: CatalogReadinessVerification | null;
  material: { name: string; slug: string };
  media: CatalogReadinessMedia[];
  name: string;
  returnPolicy?: string | null;
  shortDescription: string;
  sku: string;
  slug: string;
  source: "DROPSHIP_SHOPIFY" | "OWN";
  specifications?: CatalogReadinessSpecifications | null;
  stone?: { name: string; slug: string } | null;
  supplierKey?: string | null;
  tags: string[];
  variants: CatalogReadinessVariant[];
  warranty?: string | null;
  policyVerification?: CatalogReadinessVerification | null;
};

export type CatalogReadinessVerification = {
  sourceReference: string;
  verifiedAt: Date | string;
  verifiedBy: string;
};

export type CatalogReadinessSpecifications = {
  countryOfManufacture: string;
  manufacturerOrImporter: string;
  materialDetails: string;
  measurements: string;
  stoneDetails?: string | null;
};

export type CatalogReadinessMediaFile = {
  exists: boolean;
  sha256?: string;
};

export type CatalogReadinessIssue = {
  category: CatalogReadinessCategory;
  code: string;
  field?: string;
  message: string;
  productSlug?: string;
  severity: CatalogReadinessSeverity;
};

export type CatalogReadinessProductResult = {
  issueCounts: Record<CatalogReadinessSeverity, number>;
  mediaCount: number;
  productSlug: string;
  publishReady: boolean;
  source: CatalogReadinessProduct["source"];
  variantCount: number;
};

export type CatalogReadinessAudit = {
  issueCounts: Record<CatalogReadinessSeverity, number>;
  issues: CatalogReadinessIssue[];
  productCount: number;
  products: CatalogReadinessProductResult[];
  publishReadyCount: number;
  ready: boolean;
};

export type CatalogReadinessOptions = {
  duplicateMediaReferenceProducts?: readonly CatalogReadinessProduct[];
  mediaFiles?: Readonly<Record<string, CatalogReadinessMediaFile>>;
  now?: Date;
};

const severityOrder: Record<CatalogReadinessSeverity, number> = {
  blocker: 0,
  high: 1,
  medium: 2,
  info: 3,
};

const productRequiredTextFields = [
  ["name", "Product name"],
  ["shortDescription", "Short description"],
  ["description", "Description"],
] as const;

const productRequiredPolicyFields = [
  ["deliveryPromise", "Delivery promise"],
  ["returnPolicy", "Return policy"],
  ["careInstructions", "Care instructions"],
  ["warranty", "Warranty"],
] as const;

export function auditCatalogReadiness(
  products: readonly CatalogReadinessProduct[],
  options: CatalogReadinessOptions = {},
): CatalogReadinessAudit {
  const issues: CatalogReadinessIssue[] = [];
  const now = options.now ?? new Date();

  if (products.length === 0) {
    issues.push({
      category: "data",
      code: "CATALOG_EMPTY",
      message: "No active products were available for readiness review.",
      severity: "blocker",
    });
  }

  for (const product of products) {
    auditProduct(product, issues, options.mediaFiles ?? {}, now);
  }

  auditDuplicateMedia(
    options.duplicateMediaReferenceProducts ?? products,
    issues,
    options.mediaFiles ?? {},
    new Set(products.map((product) => product.slug)),
  );

  const sortedIssues = [...issues].sort(compareIssues);
  const productResults = products
    .map((product) => createProductResult(product, sortedIssues))
    .sort((left, right) => left.productSlug.localeCompare(right.productSlug));
  const issueCounts = countIssues(sortedIssues);

  return {
    issueCounts,
    issues: sortedIssues,
    productCount: products.length,
    products: productResults,
    publishReadyCount: productResults.filter((product) => product.publishReady)
      .length,
    ready: issueCounts.blocker === 0 && issueCounts.high === 0,
  };
}

export function formatCatalogReadinessMarkdown(input: {
  audit: CatalogReadinessAudit;
  generatedAt: string;
  scope?: { label: string } | null;
  source: string;
}) {
  const { audit } = input;
  const issueGroups = groupIssues(audit.issues);
  const lines = [
    "# Catalog Readiness Audit",
    "",
    `Generated: ${input.generatedAt}`,
    `Source: ${input.source}`,
    ...(input.scope ? [`Scope: ${input.scope.label}`] : []),
    `Status: ${audit.ready ? "PASS" : "FAIL"}`,
    "",
    "## Summary",
    "",
    "| Metric | Value |",
    "| --- | ---: |",
    `| Active products | ${audit.productCount} |`,
    `| Publish-ready products | ${audit.publishReadyCount} |`,
    `| Blockers | ${audit.issueCounts.blocker} |`,
    `| High-severity gaps | ${audit.issueCounts.high} |`,
    `| Medium-severity gaps | ${audit.issueCounts.medium} |`,
    `| Informational findings | ${audit.issueCounts.info} |`,
    "",
    "A product is publish-ready only when it has no blocker or high-severity finding.",
    "This audit checks repository-verifiable facts. It does not certify that public",
    "product claims, policies, supplier facts, or media accurately represent the",
    "physical product; those still require owner or supplier verification.",
    "",
    "## Finding Types",
    "",
    "| Severity | Category | Code | Findings | Affected products | Examples |",
    "| --- | --- | --- | ---: | ---: | --- |",
    ...issueGroups.map(
      (group) =>
        `| ${group.severity} | ${group.category} | \`${group.code}\` | ${group.count} | ${group.productSlugs.length} | ${
          group.productSlugs
            .slice(0, 5)
            .map((slug) => `\`${slug}\``)
            .join(", ") || "-"
        } |`,
    ),
    "",
    "## Product Matrix",
    "",
    "| Product | Source | Ready | Blocker | High | Medium | Info | Media | Variants |",
    "| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |",
    ...audit.products.map(
      (product) =>
        `| \`${product.productSlug}\` | ${product.source} | ${product.publishReady ? "yes" : "no"} | ${product.issueCounts.blocker} | ${product.issueCounts.high} | ${product.issueCounts.medium} | ${product.issueCounts.info} | ${product.mediaCount} | ${product.variantCount} |`,
    ),
    "",
    "## Detailed Findings",
    "",
    ...(audit.issues.length === 0
      ? ["None."]
      : audit.issues.map(
          (issue) =>
            `- **${issue.severity.toUpperCase()}** \`${issue.code}\`${issue.productSlug ? ` on \`${issue.productSlug}\`` : ""}${issue.field ? ` (\`${issue.field}\`)` : ""}: ${issue.message}`,
        )),
    "",
  ];

  return `${lines.join("\n")}\n`;
}

function auditProduct(
  product: CatalogReadinessProduct,
  issues: CatalogReadinessIssue[],
  mediaFiles: Readonly<Record<string, CatalogReadinessMediaFile>>,
  now: Date,
) {
  for (const [field, label] of productRequiredTextFields) {
    requireText(product[field], field, label, product.slug, "data", issues);
  }

  requireText(
    product.category.slug,
    "category.slug",
    "Category slug",
    product.slug,
    "data",
    issues,
  );
  requireText(
    product.category.name,
    "category.name",
    "Category name",
    product.slug,
    "data",
    issues,
  );
  requireText(
    product.material.slug,
    "material.slug",
    "Material slug",
    product.slug,
    "data",
    issues,
  );
  requireText(
    product.material.name,
    "material.name",
    "Material name",
    product.slug,
    "data",
    issues,
  );

  if (!Number.isFinite(product.basePrice) || product.basePrice <= 0) {
    addProductIssue(issues, product.slug, {
      category: "data",
      code: "BASE_PRICE_INVALID",
      field: "basePrice",
      message: "Base price must be a positive finite amount.",
      severity: "blocker",
    });
  }

  if (product.collections.length === 0) {
    addProductIssue(issues, product.slug, {
      category: "data",
      code: "COLLECTION_MISSING",
      field: "collections",
      message:
        "Published products need an explicit collection or essential classification.",
      severity: "high",
    });
  }

  if (product.tags.length === 0) {
    addProductIssue(issues, product.slug, {
      category: "data",
      code: "TAGS_MISSING",
      field: "tags",
      message: "No governed discovery tags are available.",
      severity: "medium",
    });
  }

  if (product.commerceHighlights.length === 0) {
    addProductIssue(issues, product.slug, {
      category: "policy",
      code: "COMMERCE_HIGHLIGHTS_MISSING",
      field: "commerceHighlights",
      message: "No concise purchase-confidence facts are available.",
      severity: "medium",
    });
  }

  for (const [field, label] of productRequiredPolicyFields) {
    requireText(product[field], field, label, product.slug, "policy", issues);
  }

  auditProductTruth(product, issues, now);
  auditSourceMapping(product, issues);
  auditVariants(product, issues, now);
  auditProductMedia(product, issues, mediaFiles, now);
}

function auditProductTruth(
  product: CatalogReadinessProduct,
  issues: CatalogReadinessIssue[],
  now: Date,
) {
  auditVerificationRecord({
    category: "data",
    code: "FACT_VERIFICATION_MISSING",
    field: "factVerification",
    issues,
    label: "Product fact verification",
    productSlug: product.slug,
    verification: product.factVerification,
    now,
  });
  auditVerificationRecord({
    category: "policy",
    code: "POLICY_VERIFICATION_MISSING",
    field: "policyVerification",
    issues,
    label: "Product policy verification",
    productSlug: product.slug,
    verification: product.policyVerification,
    now,
  });

  if (!product.specifications) {
    addProductIssue(issues, product.slug, {
      category: "data",
      code: "STRUCTURED_SPECIFICATIONS_MISSING",
      field: "specifications",
      message:
        "Country, manufacturer/importer, material detail, and measurements are not available as governed structured facts.",
      severity: "high",
    });
    return;
  }

  const requiredSpecifications = [
    ["countryOfManufacture", "Country of manufacture"],
    ["manufacturerOrImporter", "Manufacturer or importer"],
    ["materialDetails", "Material details"],
    ["measurements", "Measurements"],
  ] as const;

  for (const [field, label] of requiredSpecifications) {
    if (!isMissingText(product.specifications[field])) continue;

    addProductIssue(issues, product.slug, {
      category: "data",
      code: "STRUCTURED_SPECIFICATION_MISSING",
      field: `specifications.${field}`,
      message: `${label} is missing or still contains a placeholder.`,
      severity: "high",
    });
  }

  if (product.stone && isMissingText(product.specifications.stoneDetails)) {
    addProductIssue(issues, product.slug, {
      category: "data",
      code: "STONE_SPECIFICATION_MISSING",
      field: "specifications.stoneDetails",
      message: "Stone-bearing product has no governed stone specification.",
      severity: "high",
    });
  }
}

function auditVerificationRecord(input: {
  category: CatalogReadinessCategory;
  code: string;
  field: string;
  issues: CatalogReadinessIssue[];
  label: string;
  now: Date;
  productSlug: string;
  verification?: CatalogReadinessVerification | null;
}) {
  const verifiedAt = input.verification?.verifiedAt
    ? new Date(input.verification.verifiedAt)
    : null;
  const invalid =
    !input.verification ||
    isMissingText(input.verification.sourceReference) ||
    isMissingText(input.verification.verifiedBy) ||
    !verifiedAt ||
    Number.isNaN(verifiedAt.getTime()) ||
    verifiedAt.getTime() > input.now.getTime();

  if (!invalid) return;

  addProductIssue(input.issues, input.productSlug, {
    category: input.category,
    code: input.code,
    field: input.field,
    message: `${input.label} needs a source reference, verifier, and valid verification date.`,
    severity: "blocker",
  });
}

function auditSourceMapping(
  product: CatalogReadinessProduct,
  issues: CatalogReadinessIssue[],
) {
  if (product.source === "DROPSHIP_SHOPIFY") {
    const required = [
      ["externalProvider", product.externalProvider],
      ["externalProductId", product.externalProductId],
      ["externalHandle", product.externalHandle],
      ["supplierKey", product.supplierKey],
    ] as const;

    for (const [field, value] of required) {
      if (isMissingText(value)) {
        addProductIssue(issues, product.slug, {
          category: "source",
          code: "SHOPIFY_PRODUCT_MAPPING_MISSING",
          field,
          message: `Shopify supplier product is missing ${field}.`,
          severity: "blocker",
        });
      }
    }
  }

  if (
    product.source === "OWN" &&
    [
      product.externalProductId,
      product.externalHandle,
      product.supplierKey,
    ].some((value) => !isMissingText(value))
  ) {
    addProductIssue(issues, product.slug, {
      category: "source",
      code: "OWN_PRODUCT_EXTERNAL_MAPPING_PRESENT",
      message:
        "Own product carries supplier mapping fields; confirm ownership is intentional.",
      severity: "medium",
    });
  }
}

function auditVariants(
  product: CatalogReadinessProduct,
  issues: CatalogReadinessIssue[],
  now: Date,
) {
  if (product.variants.length === 0) {
    addProductIssue(issues, product.slug, {
      category: "variant",
      code: "VARIANTS_MISSING",
      field: "variants",
      message: "Published product has no purchasable variant.",
      severity: "blocker",
    });
    return;
  }

  const defaultCount = product.variants.filter(
    (variant) => variant.isDefault,
  ).length;

  if (defaultCount !== 1) {
    addProductIssue(issues, product.slug, {
      category: "variant",
      code: "DEFAULT_VARIANT_INVALID",
      field: "variants.isDefault",
      message: `Expected exactly one default variant, found ${defaultCount}.`,
      severity: "high",
    });
  }

  const seenSkus = new Set<string>();

  for (const variant of product.variants) {
    if (isMissingText(variant.sku)) {
      addProductIssue(issues, product.slug, {
        category: "variant",
        code: "VARIANT_SKU_MISSING",
        field: "variants.sku",
        message: "Variant SKU is missing.",
        severity: "blocker",
      });
    } else if (seenSkus.has(variant.sku)) {
      addProductIssue(issues, product.slug, {
        category: "variant",
        code: "VARIANT_SKU_DUPLICATE",
        field: "variants.sku",
        message: `Variant SKU ${variant.sku} is repeated within the product.`,
        severity: "blocker",
      });
    } else {
      seenSkus.add(variant.sku);
    }

    if (isMissingText(variant.name)) {
      addProductIssue(issues, product.slug, {
        category: "variant",
        code: "VARIANT_NAME_MISSING",
        field: "variants.name",
        message: `Variant ${variant.sku || "without SKU"} has no public name.`,
        severity: "high",
      });
    }

    const currentPrices = variant.prices.filter(
      (price) =>
        !price.validTo || new Date(price.validTo).getTime() > now.getTime(),
    );

    if (
      currentPrices.length === 0 ||
      currentPrices.every(
        (price) => !Number.isFinite(price.amount) || price.amount <= 0,
      )
    ) {
      addProductIssue(issues, product.slug, {
        category: "variant",
        code: "VARIANT_CURRENT_PRICE_MISSING",
        field: "variants.prices",
        message: `Variant ${variant.sku || "without SKU"} has no current positive price.`,
        severity: "blocker",
      });
    }

    if (
      product.source === "DROPSHIP_SHOPIFY" &&
      isMissingText(variant.externalVariantId)
    ) {
      addProductIssue(issues, product.slug, {
        category: "source",
        code: "SHOPIFY_VARIANT_MAPPING_MISSING",
        field: "variants.externalVariantId",
        message: `Shopify variant ${variant.sku || "without SKU"} has no external variant ID.`,
        severity: "blocker",
      });
    }
  }
}

function auditProductMedia(
  product: CatalogReadinessProduct,
  issues: CatalogReadinessIssue[],
  mediaFiles: Readonly<Record<string, CatalogReadinessMediaFile>>,
  now: Date,
) {
  if (product.media.length === 0) {
    addProductIssue(issues, product.slug, {
      category: "media",
      code: "MEDIA_MISSING",
      field: "media",
      message: "Published product has no media.",
      severity: "blocker",
    });
    return;
  }

  const primaryCount = product.media.filter((media) => media.isPrimary).length;

  if (primaryCount !== 1) {
    addProductIssue(issues, product.slug, {
      category: "media",
      code: "PRIMARY_MEDIA_INVALID",
      field: "media.isPrimary",
      message: `Expected exactly one primary media item, found ${primaryCount}.`,
      severity: "blocker",
    });
  }

  if (product.media.length < CATALOG_READINESS_REQUIRED_MEDIA_ROLES.length) {
    addProductIssue(issues, product.slug, {
      category: "media",
      code: "MEDIA_SET_INCOMPLETE",
      field: "media",
      message: `Expected at least ${CATALOG_READINESS_REQUIRED_MEDIA_ROLES.length} decision-useful media items, found ${product.media.length}.`,
      severity: "high",
    });
  }

  const declaredRoles = new Set(
    product.media
      .map((media) => media.role)
      .filter((role): role is CatalogReadinessMediaRole => Boolean(role)),
  );

  if (declaredRoles.size === 0) {
    addProductIssue(issues, product.slug, {
      category: "media",
      code: "MEDIA_ROLES_UNVERIFIABLE",
      field: "media.role",
      message:
        "Media records do not declare decision roles, so scale, construction, material, and context coverage cannot be proven.",
      severity: "high",
    });
  } else {
    for (const role of CATALOG_READINESS_REQUIRED_MEDIA_ROLES) {
      if (!declaredRoles.has(role)) {
        addProductIssue(issues, product.slug, {
          category: "media",
          code: "MEDIA_ROLE_MISSING",
          field: "media.role",
          message: `Required media role ${role} is missing.`,
          severity: "high",
        });
      }
    }
  }

  const seenUrls = new Set<string>();

  for (const media of product.media) {
    if (isMissingText(media.url)) {
      addProductIssue(issues, product.slug, {
        category: "media",
        code: "MEDIA_URL_MISSING",
        field: "media.url",
        message: "Media URL is missing.",
        severity: "blocker",
      });
      continue;
    }

    if (seenUrls.has(media.url)) {
      addProductIssue(issues, product.slug, {
        category: "media",
        code: "MEDIA_URL_REPEATED_WITHIN_PRODUCT",
        field: "media.url",
        message: `Media URL ${media.url} is repeated within the same product.`,
        severity: "high",
      });
    }
    seenUrls.add(media.url);

    if (isMissingText(media.alt)) {
      addProductIssue(issues, product.slug, {
        category: "media",
        code: "MEDIA_ALT_MISSING",
        field: "media.alt",
        message: `Media ${media.url} has no alternative text decision.`,
        severity: "high",
      });
    }

    const extension = getMediaExtension(media.url);
    if (extension && !isSupportedMediaFormat(media.kind, extension)) {
      addProductIssue(issues, product.slug, {
        category: "media",
        code: "MEDIA_UNSUPPORTED_FORMAT",
        field: "media.url",
        message: `Media ${media.url} uses an unsupported format ".${extension}".`,
        severity: "high",
      });
    }

    if (!media.width || !media.height) {
      addProductIssue(issues, product.slug, {
        category: "media",
        code: "MEDIA_DIMENSIONS_MISSING",
        field: "media.width/media.height",
        message: `Media ${media.url} is missing intrinsic dimensions.`,
        severity: "medium",
      });
    } else if (media.kind === "IMAGE" || media.kind === "TRY_ON_REFERENCE") {
      const shortEdge = Math.min(media.width, media.height);

      if (shortEdge < CATALOG_READINESS_MEDIA_LIMITS.minImageEdgePx) {
        addProductIssue(issues, product.slug, {
          category: "media",
          code: "MEDIA_LOW_RESOLUTION",
          field: "media.width/media.height",
          message: `Media ${media.url} is ${media.width}×${media.height}px, below the ${CATALOG_READINESS_MEDIA_LIMITS.minImageEdgePx}px minimum edge for inspection-grade imagery.`,
          severity: "high",
        });
      }

      const aspectRatio = Math.max(media.width, media.height) / shortEdge;

      if (aspectRatio > CATALOG_READINESS_MEDIA_LIMITS.maxImageAspectRatio) {
        addProductIssue(issues, product.slug, {
          category: "media",
          code: "MEDIA_ASPECT_RATIO_EXTREME",
          field: "media.width/media.height",
          message: `Media ${media.url} aspect ratio ${aspectRatio.toFixed(2)}:1 exceeds the ${CATALOG_READINESS_MEDIA_LIMITS.maxImageAspectRatio}:1 framing limit.`,
          severity: "medium",
        });
      }
    }

    const localFile = mediaFiles[media.url];
    if (localFile && !localFile.exists) {
      addProductIssue(issues, product.slug, {
        category: "media",
        code: "LOCAL_MEDIA_FILE_MISSING",
        field: "media.url",
        message: `Local media file ${media.url} does not exist under public/.`,
        severity: "blocker",
      });
    }

    auditMediaGovernance(product, media, issues, now);
  }
}

// B-07 asset governance (docs/TASKS.md): provenance, license status, and
// generated-asset labeling for a single media item. Kept separate from the
// structural checks above since these are rights/disclosure findings, not
// display-quality findings, even though they share the "media" category.
function auditMediaGovernance(
  product: CatalogReadinessProduct,
  media: CatalogReadinessMedia,
  issues: CatalogReadinessIssue[],
  now: Date,
) {
  if (!media.provenance || media.provenance === "UNKNOWN") {
    addProductIssue(issues, product.slug, {
      category: "media",
      code: "MEDIA_PROVENANCE_UNKNOWN",
      field: "media.provenance",
      message: `Media ${media.url} has no recorded provenance.`,
      severity: "medium",
    });
  }

  if (!media.licenseStatus || media.licenseStatus === "UNKNOWN") {
    addProductIssue(issues, product.slug, {
      category: "media",
      code: "MEDIA_LICENSE_STATUS_UNKNOWN",
      field: "media.licenseStatus",
      message: `Media ${media.url} has no recorded license status.`,
      severity: "medium",
    });
  } else if (media.licenseStatus === "NEEDS_REVIEW") {
    addProductIssue(issues, product.slug, {
      category: "media",
      code: "MEDIA_LICENSE_NEEDS_REVIEW",
      field: "media.licenseStatus",
      message: `Media ${media.url} is flagged NEEDS_REVIEW and cannot be assumed clear for public use.`,
      severity: "high",
    });
  }

  if (
    media.licenseExpiresAt &&
    new Date(media.licenseExpiresAt).getTime() <= now.getTime()
  ) {
    addProductIssue(issues, product.slug, {
      category: "media",
      code: "MEDIA_LICENSE_EXPIRED",
      field: "media.licenseExpiresAt",
      message: `Media ${media.url}'s license expired ${new Date(media.licenseExpiresAt).toISOString()}.`,
      severity: "blocker",
    });
  }

  if (media.isGenerated && !media.approvedAt) {
    addProductIssue(issues, product.slug, {
      category: "media",
      code: "MEDIA_GENERATED_UNAPPROVED",
      field: "media.approvedAt",
      message: `Media ${media.url} is labeled generated but has no explicit approval — it cannot represent this product publicly unlabeled.`,
      severity: "blocker",
    });
  }
}

function auditDuplicateMedia(
  products: readonly CatalogReadinessProduct[],
  issues: CatalogReadinessIssue[],
  mediaFiles: Readonly<Record<string, CatalogReadinessMediaFile>>,
  auditedProductSlugs: ReadonlySet<string>,
) {
  const byUrl = new Map<string, Set<string>>();
  const byHash = new Map<string, Set<string>>();

  for (const product of products) {
    for (const media of product.media) {
      if (!isMissingText(media.url)) {
        addToSetMap(byUrl, media.url, product.slug);
      }

      const hash = mediaFiles[media.url]?.sha256;
      if (hash) addToSetMap(byHash, hash, product.slug);
    }
  }

  for (const [url, slugs] of byUrl) {
    if (slugs.size <= 1) continue;

    for (const slug of slugs) {
      if (!auditedProductSlugs.has(slug)) continue;

      addProductIssue(issues, slug, {
        category: "media",
        code: "MEDIA_URL_SHARED_ACROSS_PRODUCTS",
        field: "media.url",
        message: `${url} is shared by ${slugs.size} products: ${[...slugs].join(", ")}.`,
        severity: "high",
      });
    }
  }

  for (const [hash, slugs] of byHash) {
    if (slugs.size <= 1) continue;

    for (const slug of slugs) {
      if (!auditedProductSlugs.has(slug)) continue;

      addProductIssue(issues, slug, {
        category: "media",
        code: "MEDIA_CONTENT_DUPLICATED_ACROSS_PRODUCTS",
        field: "media.url",
        message: `Media content hash ${hash.slice(0, 12)} is shared by ${slugs.size} products: ${[...slugs].join(", ")}.`,
        severity: "high",
      });
    }
  }
}

function requireText(
  value: string | null | undefined,
  field: string,
  label: string,
  productSlug: string,
  category: CatalogReadinessCategory,
  issues: CatalogReadinessIssue[],
) {
  if (!isMissingText(value)) return;

  addProductIssue(issues, productSlug, {
    category,
    code: isPlaceholderText(value)
      ? "PLACEHOLDER_VALUE"
      : "REQUIRED_TEXT_MISSING",
    field,
    message: `${label} is missing or still contains a placeholder.`,
    severity: "blocker",
  });
}

function isMissingText(value: string | null | undefined) {
  return !value?.trim() || isPlaceholderText(value);
}

function getMediaExtension(url: string | null | undefined): string | null {
  if (!url) return null;

  const withoutQuery = url.split(/[?#]/u)[0] ?? "";
  const lastSegment = withoutQuery.split("/").pop() ?? "";
  const dotIndex = lastSegment.lastIndexOf(".");

  if (dotIndex <= 0 || dotIndex === lastSegment.length - 1) return null;

  return lastSegment.slice(dotIndex + 1).toLowerCase();
}

function isSupportedMediaFormat(
  kind: CatalogReadinessMedia["kind"],
  extension: string,
) {
  const allowed =
    kind === "VIDEO"
      ? CATALOG_READINESS_SUPPORTED_MEDIA_FORMATS.video
      : CATALOG_READINESS_SUPPORTED_MEDIA_FORMATS.image;

  return (allowed as readonly string[]).includes(extension);
}

function isPlaceholderText(value: string | null | undefined) {
  if (!value) return false;

  return /\[\s*(?:להשלמה|שם משפטי להשלמה)|legalPlaceholder|placeholder|todo|tbd/i.test(
    value,
  );
}

function addProductIssue(
  issues: CatalogReadinessIssue[],
  productSlug: string,
  issue: Omit<CatalogReadinessIssue, "productSlug">,
) {
  issues.push({ ...issue, productSlug });
}

function addToSetMap(
  map: Map<string, Set<string>>,
  key: string,
  value: string,
) {
  const values = map.get(key) ?? new Set<string>();
  values.add(value);
  map.set(key, values);
}

function createProductResult(
  product: CatalogReadinessProduct,
  issues: readonly CatalogReadinessIssue[],
): CatalogReadinessProductResult {
  const productIssues = issues.filter(
    (issue) => issue.productSlug === product.slug,
  );
  const issueCounts = countIssues(productIssues);

  return {
    issueCounts,
    mediaCount: product.media.length,
    productSlug: product.slug,
    publishReady: issueCounts.blocker === 0 && issueCounts.high === 0,
    source: product.source,
    variantCount: product.variants.length,
  };
}

function countIssues(issues: readonly CatalogReadinessIssue[]) {
  const counts: Record<CatalogReadinessSeverity, number> = {
    blocker: 0,
    high: 0,
    medium: 0,
    info: 0,
  };

  for (const issue of issues) counts[issue.severity] += 1;

  return counts;
}

function compareIssues(
  left: CatalogReadinessIssue,
  right: CatalogReadinessIssue,
) {
  return (
    severityOrder[left.severity] - severityOrder[right.severity] ||
    (left.productSlug ?? "").localeCompare(right.productSlug ?? "") ||
    left.code.localeCompare(right.code) ||
    (left.field ?? "").localeCompare(right.field ?? "")
  );
}

function groupIssues(issues: readonly CatalogReadinessIssue[]) {
  const groups = new Map<
    string,
    {
      category: CatalogReadinessCategory;
      code: string;
      count: number;
      productSlugs: string[];
      severity: CatalogReadinessSeverity;
    }
  >();

  for (const issue of issues) {
    const key = `${issue.severity}:${issue.category}:${issue.code}`;
    const group = groups.get(key) ?? {
      category: issue.category,
      code: issue.code,
      count: 0,
      productSlugs: [],
      severity: issue.severity,
    };
    group.count += 1;
    if (issue.productSlug && !group.productSlugs.includes(issue.productSlug)) {
      group.productSlugs.push(issue.productSlug);
    }
    groups.set(key, group);
  }

  return [...groups.values()].sort(
    (left, right) =>
      severityOrder[left.severity] - severityOrder[right.severity] ||
      left.code.localeCompare(right.code),
  );
}
