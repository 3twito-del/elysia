import { db } from "~/server/db";

/**
 * Merchandising banners (CMS-003): scheduled, prioritized banners per storefront
 * placement. `selectActiveBanners` (date-window + priority ordering) is pure so
 * the storefront can pick the right banner deterministically.
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
