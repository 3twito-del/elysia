import { db } from "~/server/db";
import { revalidateCatalogMutation } from "~/server/services/catalog-revalidation";

/**
 * Merchandising (CMS-003): scheduled/prioritized banners per storefront
 * placement, admin-controlled category display order, and per-product
 * pin-boost within a category's default listing. `selectActiveBanners`
 * (date-window + priority ordering) is pure so the storefront can pick the
 * right banner deterministically.
 */

export const BANNER_PLACEMENTS = [
  "HOME_HERO",
  "HOME_STRIP",
  "CATEGORY_TOP",
  "CHECKOUT",
] as const;
export type BannerPlacement = (typeof BANNER_PLACEMENTS)[number];

export type BannerRule = {
  id: string;
  title: string;
  placement: string;
  imageUrl: string | null;
  linkUrl: string | null;
  priority: number;
  isActive: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
};

/** Active banners for a placement, ordered by priority (lowest first). Pure. */
export function selectActiveBanners(
  banners: BannerRule[],
  placement: string,
  now: Date = new Date(),
): BannerRule[] {
  return banners
    .filter(
      (banner) =>
        banner.placement === placement &&
        banner.isActive &&
        (banner.startsAt === null || banner.startsAt.getTime() <= now.getTime()) &&
        (banner.endsAt === null || banner.endsAt.getTime() > now.getTime()),
    )
    .sort((a, b) => a.priority - b.priority);
}

function normalizePlacement(value: string | undefined): BannerPlacement {
  return value && (BANNER_PLACEMENTS as readonly string[]).includes(value)
    ? (value as BannerPlacement)
    : "HOME_HERO";
}

export async function createBanner(input: {
  title: string;
  placement?: string;
  imageUrl?: string;
  linkUrl?: string;
  priority?: number;
  startsAt?: Date;
  endsAt?: Date;
}) {
  if (!input.title.trim()) throw new Error("כותרת הבאנר היא שדה חובה.");
  return db.banner.create({
    data: {
      title: input.title.trim(),
      placement: normalizePlacement(input.placement),
      imageUrl: input.imageUrl,
      linkUrl: input.linkUrl,
      priority: Math.trunc(input.priority ?? 100),
      startsAt: input.startsAt,
      endsAt: input.endsAt,
    },
  });
}

export async function setBannerActive(input: {
  bannerId: string;
  isActive: boolean;
}) {
  return db.banner.update({
    where: { id: input.bannerId },
    data: { isActive: input.isActive },
  });
}

export async function deleteBanner(input: { bannerId: string }) {
  return db.banner.delete({ where: { id: input.bannerId } });
}

function mapBanner(banner: {
  id: string;
  title: string;
  placement: string;
  imageUrl: string | null;
  linkUrl: string | null;
  priority: number;
  isActive: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
}): BannerRule {
  return { ...banner };
}

export async function listBanners(limit = 50): Promise<BannerRule[]> {
  const banners = await db.banner.findMany({
    orderBy: [{ placement: "asc" }, { priority: "asc" }],
    take: limit,
  });
  return banners.map(mapBanner);
}

/** Active banners for a storefront placement (DB-backed convenience). */
export async function getActiveBannersFor(placement: string) {
  const banners = await db.banner.findMany({ where: { placement, isActive: true } });
  return selectActiveBanners(banners.map(mapBanner), placement);
}

export async function getBannersSummary() {
  const [total, active] = await Promise.all([
    db.banner.count(),
    db.banner.count({ where: { isActive: true } }),
  ]);
  return { total, active };
}

// ---- category display order ----

/** Every category with its current display-order rank, for the admin editor. */
export async function listCategoriesForMerchandising() {
  return db.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, slug: true, name: true, sortOrder: true },
  });
}

/** Sets a category's display-order rank (lower sorts first storefront-wide). */
export async function updateCategorySortOrder(input: {
  categoryId: string;
  sortOrder: number;
}) {
  if (!Number.isInteger(input.sortOrder)) {
    throw new Error("סדר הצגה חייב להיות מספר שלם.");
  }

  const category = await db.category.update({
    where: { id: input.categoryId },
    data: { sortOrder: input.sortOrder },
  });

  revalidateCatalogMutation({ categorySlugs: [category.slug] });

  return category;
}

// ---- product pin-boost ----

/** Products currently pinned within their category's default listing. */
export async function listPinnedProducts() {
  const products = await db.product.findMany({
    where: { merchandisingPinRank: { not: null } },
    orderBy: { merchandisingPinRank: "asc" },
    select: {
      id: true,
      sku: true,
      name: true,
      merchandisingPinRank: true,
      category: { select: { name: true, slug: true } },
    },
  });

  return products.map((product) => ({
    id: product.id,
    sku: product.sku,
    name: product.name,
    categoryName: product.category.name,
    pinRank: product.merchandisingPinRank!,
  }));
}

/** Active products for the "pin a product" select. */
export async function listProductsForMerchandisingSelect(limit = 500) {
  const products = await db.product.findMany({
    where: { status: "ACTIVE" },
    orderBy: [{ category: { name: "asc" } }, { name: "asc" }],
    take: limit,
    select: {
      id: true,
      sku: true,
      name: true,
      category: { select: { name: true } },
    },
  });

  return products.map((product) => ({
    id: product.id,
    sku: product.sku,
    name: product.name,
    categoryName: product.category.name,
  }));
}

/** Sets (or clears, with `pinRank: null`) a product's pin-boost rank. */
export async function setProductMerchandisingPin(input: {
  productId: string;
  pinRank: number | null;
}) {
  if (input.pinRank !== null) {
    if (!Number.isInteger(input.pinRank) || input.pinRank <= 0) {
      throw new Error("דירוג קיבוע חייב להיות מספר שלם חיובי.");
    }
  }

  const product = await db.product.update({
    where: { id: input.productId },
    data: { merchandisingPinRank: input.pinRank },
    include: { category: true },
  });

  revalidateCatalogMutation({
    productSlugs: [product.slug],
    categorySlugs: [product.category.slug],
  });

  return product;
}
