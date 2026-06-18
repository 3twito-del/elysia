import { z } from "zod";
import type { Prisma } from "@prisma/client";

import type { ShopifyProduct } from "~/server/adapters/shopify";
import { shopifyDropshipProvider } from "~/server/adapters/shopify";
import { legalPlaceholder } from "~/lib/legal-content";
import { db } from "~/server/db";
import { revalidateCatalogMutation } from "~/server/services/catalog-revalidation";

export type ShopifyDropshipSyncEnv = {
  [key: string]: string | undefined;
  SHOPIFY_DROPSHIP_SYNC_ENABLED?: string | undefined;
};

export type ShopifyDropshipImportProduct = {
  basePrice: number;
  categorySlug: string;
  description: string;
  externalHandle: string;
  externalProductId: string;
  images: Array<{
    altText?: string;
    height?: number;
    url: string;
    width?: number;
  }>;
  materialSlug: string;
  name: string;
  shortDescription: string;
  sku: string;
  supplierKey: string;
  tags: string[];
  variants: Array<{
    compareAt?: number;
    externalVariantId: string;
    name: string;
    price: number;
    sku: string;
  }>;
};

export type ShopifyDropshipImportPlan = {
  products: ShopifyDropshipImportProduct[];
  skipped: Array<{
    externalProductId: string;
    reason: string;
  }>;
};

const syncInputSchema = z.object({
  first: z.number().int().positive().max(50).default(50),
  supplierKey: z.string().trim().min(1).max(80).default("shopify-dropship"),
});

export function isShopifyDropshipSyncEnabled(
  env: ShopifyDropshipSyncEnv = process.env,
) {
  return (
    env.SHOPIFY_DROPSHIP_SYNC_ENABLED === "1" ||
    env.SHOPIFY_DROPSHIP_SYNC_ENABLED?.toLowerCase() === "true"
  );
}

export async function createShopifyDropshipImportPlan(
  input: z.input<typeof syncInputSchema> = {},
) {
  const parsed = syncInputSchema.parse(input);
  const page = await shopifyDropshipProvider.listProducts({
    first: parsed.first,
  });

  return mapShopifyProductsToImportPlan({
    products: page.products,
    supplierKey: parsed.supplierKey,
  });
}

export async function syncShopifyDropshipCatalog(
  input: z.input<typeof syncInputSchema> = {},
  env: ShopifyDropshipSyncEnv = process.env,
) {
  if (!isShopifyDropshipSyncEnabled(env)) {
    return {
      ok: false,
      reason:
        "Shopify dropship sync is disabled. Set SHOPIFY_DROPSHIP_SYNC_ENABLED=true to import supplier products.",
      imported: 0,
      skipped: 0,
    };
  }

  const plan = await createShopifyDropshipImportPlan(input);

  for (const product of plan.products) {
    await upsertShopifyDropshipProduct(product);
  }

  if (plan.products.length > 0) {
    revalidateCatalogMutation(getShopifyDropshipSyncRevalidationInput(plan));
  }

  return {
    ok: true,
    imported: plan.products.length,
    skipped: plan.skipped.length,
  };
}

export function getShopifyDropshipSyncRevalidationInput(
  plan: ShopifyDropshipImportPlan,
) {
  return {
    categorySlugs: plan.products.map((product) => product.categorySlug),
    productSlugs: plan.products.map((product) => product.externalHandle),
  };
}

export function mapShopifyProductsToImportPlan(input: {
  products: ShopifyProduct[];
  supplierKey: string;
}): ShopifyDropshipImportPlan {
  const skipped: ShopifyDropshipImportPlan["skipped"] = [];
  const products = input.products.flatMap((product) => {
    const variants = product.variants
      .filter(
        (variant) =>
          variant.id.trim() &&
          Number.isFinite(variant.priceAmount) &&
          variant.priceAmount > 0,
      )
      .map((variant, index) => ({
        compareAt: variant.compareAtAmount,
        externalVariantId: variant.id,
        name: variant.title.trim() ? variant.title : `Variant ${index + 1}`,
        price: variant.priceAmount,
        sku: variant.sku?.trim() ?? createFallbackSku(product.handle, index),
      }));

    if (variants.length === 0) {
      skipped.push({
        externalProductId: product.id,
        reason: "No priced Shopify variants are available for import.",
      });
      return [];
    }

    const defaultVariant = variants[0];

    if (!defaultVariant) return [];

    const images = normalizeShopifyProductImages(product.images);

    return [
      {
        basePrice: defaultVariant.price,
        categorySlug: toSlug(product.productType ?? "rings"),
        description:
          product.description.trim() ||
          "פריט מתוך עריכת Elysia, עם חומר ומידה לפני הזמנה.",
        externalHandle: product.handle,
        externalProductId: product.id,
        images,
        materialSlug: "selected-finish",
        name: product.title,
        shortDescription:
          product.description.trim().slice(0, 180) ||
          "פריט מתוך עריכת Elysia עם חומר ומידה לפני הזמנה.",
        sku: defaultVariant.sku,
        supplierKey: input.supplierKey,
        tags: product.tags,
        variants,
      },
    ];
  });

  return { products, skipped };
}

async function upsertShopifyDropshipProduct(
  product: ShopifyDropshipImportProduct,
) {
  await db.$transaction(async (tx) => {
    const primaryImageUrl = product.images[0]?.url;
    const categoryImageData = primaryImageUrl
      ? { imageUrl: primaryImageUrl }
      : {};
    const category = await tx.category.upsert({
      where: { slug: product.categorySlug },
      update: categoryImageData,
      create: {
        slug: product.categorySlug,
        name: toTitle(product.categorySlug),
        description: "בחירות תכשיטים מתוך עריכת Elysia.",
        imageUrl: primaryImageUrl,
      },
    });
    const material = await tx.material.upsert({
      where: { slug: product.materialSlug },
      update: {},
      create: {
        slug: product.materialSlug,
        // TODO: Replace with verified Shopify material before production.
        name: legalPlaceholder,
      },
    });
    const syncedAt = new Date();
    const savedProduct = await tx.product.upsert({
      where: { sku: product.sku },
      update: {
        basePrice: product.basePrice,
        categoryId: category.id,
        description: product.description,
        externalHandle: product.externalHandle,
        externalProductId: product.externalProductId,
        externalProvider: "shopify",
        externalSyncedAt: syncedAt,
        materialId: material.id,
        name: product.name,
        shortDescription: product.shortDescription,
        source: "DROPSHIP_SHOPIFY",
        status: "ACTIVE",
        supplierKey: product.supplierKey,
        tags: product.tags,
      },
      create: {
        slug: product.externalHandle,
        sku: product.sku,
        name: product.name,
        shortDescription: product.shortDescription,
        description: product.description,
        status: "ACTIVE",
        source: "DROPSHIP_SHOPIFY",
        externalProvider: "shopify",
        externalProductId: product.externalProductId,
        externalHandle: product.externalHandle,
        supplierKey: product.supplierKey,
        externalSyncedAt: syncedAt,
        basePrice: product.basePrice,
        categoryId: category.id,
        materialId: material.id,
        tags: product.tags,
      },
      select: { id: true },
    });

    await syncShopifyDropshipProductMedia(tx, {
      product,
      productId: savedProduct.id,
    });

    for (const [index, variant] of product.variants.entries()) {
      const savedVariant = await upsertShopifyDropshipVariant(tx, {
        index,
        productId: savedProduct.id,
        variant,
      });

      await syncShopifyDropshipVariantPrice(tx, {
        compareAt: variant.compareAt,
        price: variant.price,
        variantId: savedVariant.id,
      });
    }
  });
}

async function syncShopifyDropshipProductMedia(
  tx: Prisma.TransactionClient,
  input: {
    product: ShopifyDropshipImportProduct;
    productId: string;
  },
) {
  await tx.productMedia.deleteMany({
    where: {
      productId: input.productId,
      kind: "IMAGE",
    },
  });

  if (input.product.images.length === 0) return;

  await tx.productMedia.createMany({
    data: input.product.images.map((image, index) => ({
      alt: image.altText ?? input.product.name,
      height: image.height ?? null,
      isPrimary: index === 0,
      kind: "IMAGE",
      productId: input.productId,
      sortOrder: index,
      url: image.url,
      width: image.width ?? null,
    })),
  });
}

async function upsertShopifyDropshipVariant(
  tx: Prisma.TransactionClient,
  input: {
    index: number;
    productId: string;
    variant: ShopifyDropshipImportProduct["variants"][number];
  },
) {
  const existing = await tx.productVariant.findFirst({
    where: {
      productId: input.productId,
      OR: [
        { sku: input.variant.sku },
        { externalVariantId: input.variant.externalVariantId },
      ],
    },
  });

  if (existing) {
    return tx.productVariant.update({
      where: { id: existing.id },
      data: {
        externalVariantId: input.variant.externalVariantId,
        isDefault: input.index === 0,
        name: input.variant.name,
        sku: input.variant.sku,
      },
      select: { id: true },
    });
  }

  return tx.productVariant.create({
    data: {
      productId: input.productId,
      sku: input.variant.sku,
      name: input.variant.name,
      externalVariantId: input.variant.externalVariantId,
      isDefault: input.index === 0,
    },
    select: { id: true },
  });
}

async function syncShopifyDropshipVariantPrice(
  tx: Prisma.TransactionClient,
  input: {
    compareAt?: number;
    price: number;
    variantId: string;
  },
) {
  const currentPrice = await tx.price.findFirst({
    where: {
      variantId: input.variantId,
      currency: "ILS",
      validTo: null,
    },
    orderBy: { validFrom: "desc" },
  });

  if (
    currentPrice &&
    Number(currentPrice.amount) === input.price &&
    Number(currentPrice.compareAt ?? 0) === Number(input.compareAt ?? 0)
  ) {
    return;
  }

  const now = new Date();

  if (currentPrice) {
    await tx.price.update({
      where: { id: currentPrice.id },
      data: { validTo: now },
    });
  }

  await tx.price.create({
    data: {
      variantId: input.variantId,
      amount: input.price,
      compareAt: input.compareAt,
      currency: "ILS",
      validFrom: now,
    },
  });
}

function createFallbackSku(handle: string, index: number) {
  return `SHOPIFY-${toSlug(handle).toUpperCase()}-${index + 1}`;
}

function normalizeShopifyProductImages(
  images: ShopifyProduct["images"],
): ShopifyDropshipImportProduct["images"] {
  const seenUrls = new Set<string>();

  return images.flatMap((image) => {
    const url = image.url.trim();

    if (!url || seenUrls.has(url)) return [];

    seenUrls.add(url);

    return [
      {
        altText: normalizeOptionalShopifyText(image.altText),
        height: image.height,
        url,
        width: image.width,
      },
    ];
  });
}

function normalizeOptionalShopifyText(value: string | null | undefined) {
  const trimmed = value?.trim();

  if (trimmed === undefined || trimmed.length === 0) return undefined;

  return trimmed;
}

function toSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-+|-+$/gu, "");
}

function toTitle(value: string) {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
