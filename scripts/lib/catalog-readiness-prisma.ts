// Shared mapping from a Prisma product row to the pure CatalogReadinessProduct
// shape consumed by auditCatalogReadiness. Extracted so both the offline
// `pnpm catalog:readiness` script and the live admin catalog-quality surface
// load the exact same fields and audit identically. It invents no facts; it
// only reshapes governed database columns.

import { type Prisma, type ProductMediaRole } from "@prisma/client";

import {
  type CatalogReadinessMediaRole,
  type CatalogReadinessProduct,
} from "./catalog-readiness";

export const catalogReadinessProductInclude = {
  category: true,
  collections: true,
  material: true,
  media: { orderBy: [{ sortOrder: "asc" }] },
  stone: true,
  variants: {
    include: { prices: true },
    orderBy: [{ sku: "asc" }],
  },
} satisfies Prisma.ProductInclude;

export type CatalogReadinessPrismaProduct = Prisma.ProductGetPayload<{
  include: typeof catalogReadinessProductInclude;
}>;

export function mapPrismaProductToCatalogReadiness(
  product: CatalogReadinessPrismaProduct,
): CatalogReadinessProduct {
  return {
    availabilityMode: product.availabilityMode,
    basePrice: Number(product.basePrice),
    careInstructions: product.careInstructions,
    category: {
      name: product.category.name,
      slug: product.category.slug,
    },
    collections: product.collections.map((collection) => ({
      name: collection.name,
      slug: collection.slug,
    })),
    commerceHighlights: product.commerceHighlights,
    deliveryPromise: product.deliveryPromise,
    description: product.description,
    externalHandle: product.externalHandle,
    externalProductId: product.externalProductId,
    externalProvider: product.externalProvider,
    factVerification: hasVerificationData({
      sourceReference: product.factSourceReference,
      verifiedAt: product.factVerifiedAt,
      verifiedBy: product.factVerifiedBy,
    })
      ? {
          sourceReference: product.factSourceReference ?? "",
          verifiedAt: product.factVerifiedAt ?? "",
          verifiedBy: product.factVerifiedBy ?? "",
        }
      : null,
    material: {
      name: product.material.name,
      slug: product.material.slug,
    },
    media: product.media.map((media) => ({
      alt: media.alt,
      height: media.height,
      isPrimary: media.isPrimary,
      kind: media.kind,
      role: toCatalogMediaRole(media.role),
      sortOrder: media.sortOrder,
      url: media.url,
      width: media.width,
    })),
    name: product.name,
    returnPolicy: product.returnPolicy,
    shortDescription: product.shortDescription,
    sku: product.sku,
    slug: product.slug,
    source: product.source,
    specifications: hasSpecificationData(product)
      ? {
          countryOfManufacture: product.countryOfManufacture ?? "",
          manufacturerOrImporter: product.manufacturerOrImporter ?? "",
          materialDetails: product.materialDetails ?? "",
          measurements: product.measurements ?? "",
          stoneDetails: product.stoneDetails,
        }
      : null,
    stone: product.stone
      ? { name: product.stone.name, slug: product.stone.slug }
      : null,
    supplierKey: product.supplierKey,
    tags: product.tags,
    variants: product.variants.map((variant) => ({
      externalVariantId: variant.externalVariantId,
      isDefault: variant.isDefault,
      metalColor: variant.metalColor,
      name: variant.name,
      prices: variant.prices.map((price) => ({
        amount: Number(price.amount),
        currency: price.currency,
        validTo: price.validTo,
      })),
      size: variant.size,
      sku: variant.sku,
      stoneColor: variant.stoneColor,
    })),
    warranty: product.warranty,
    policyVerification: hasVerificationData({
      sourceReference: product.policySourceReference,
      verifiedAt: product.policyVerifiedAt,
      verifiedBy: product.policyVerifiedBy,
    })
      ? {
          sourceReference: product.policySourceReference ?? "",
          verifiedAt: product.policyVerifiedAt ?? "",
          verifiedBy: product.policyVerifiedBy ?? "",
        }
      : null,
  };
}

export function hasVerificationData(input: {
  sourceReference: string | null;
  verifiedAt: Date | null;
  verifiedBy: string | null;
}) {
  return [input.sourceReference, input.verifiedAt, input.verifiedBy].some(
    (value) => value != null && value !== "",
  );
}

export function hasSpecificationData(input: {
  countryOfManufacture: string | null;
  manufacturerOrImporter: string | null;
  materialDetails: string | null;
  measurements: string | null;
  stoneDetails: string | null;
}) {
  return [
    input.countryOfManufacture,
    input.manufacturerOrImporter,
    input.materialDetails,
    input.measurements,
    input.stoneDetails,
  ].some((value) => value != null && value !== "");
}

export function toCatalogMediaRole(
  role: ProductMediaRole | null,
): CatalogReadinessMediaRole | null {
  return role?.toLowerCase() as CatalogReadinessMediaRole | null;
}
