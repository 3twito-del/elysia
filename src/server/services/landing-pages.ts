import { db } from "~/server/db";

/**
 * No-code landing page builder (CMS-001): pages composed of ordered content
 * blocks (HERO/TEXT/IMAGE/CTA), publishable to a public slug. slugify + block
 * ordering are pure + unit-tested.
 */

export const BLOCK_TYPES = ["HERO", "TEXT", "IMAGE", "CTA"] as const;
export type BlockType = (typeof BLOCK_TYPES)[number];

export type PageBlockRow = {
  id: string;
  type: string;
  heading: string | null;
  body: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
  sortOrder: number;
};

/** URL-safe slug (keeps Hebrew letters). Pure. */
export function slugifyPage(input: string): string {
  const base = input
    .trim()
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
  return base || "page";
}

/** Blocks in render order. Pure. */
export function orderBlocks(blocks: PageBlockRow[]): PageBlockRow[] {
  return [...blocks].sort((a, b) => a.sortOrder - b.sortOrder);
}

function normalizeType(value: string | undefined): BlockType {
  return value && (BLOCK_TYPES as readonly string[]).includes(value)
    ? (value as BlockType)
    : "TEXT";
}

export async function createLandingPage(input: { title: string }) {
  if (!input.title.trim()) throw new Error("כותרת העמוד היא שדה חובה.");
  const base = slugifyPage(input.title);
  let slug = base;
  let suffix = 1;
  while (await db.landingPage.findUnique({ where: { slug } })) {
    suffix += 1;
    slug = `${base}-${suffix}`;
  }
  return db.landingPage.create({ data: { title: input.title.trim(), slug } });
}

export async function setPageStatus(input: { pageId: string; status: string }) {
  return db.landingPage.update({
    where: { id: input.pageId },
    data: { status: input.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT" },
  });
}

export async function addBlock(input: {
  pageId: string;
  type?: string;
  heading?: string;
  body?: string;
  imageUrl?: string;
  linkUrl?: string;
}) {
  const last = await db.pageBlock.findFirst({
    where: { pageId: input.pageId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });
  return db.pageBlock.create({
    data: {
      pageId: input.pageId,
      type: normalizeType(input.type),
      heading: input.heading,
      body: input.body,
      imageUrl: input.imageUrl,
      linkUrl: input.linkUrl,
      sortOrder: (last?.sortOrder ?? 0) + 10,
    },
  });
}

export async function deleteBlock(input: { blockId: string }) {
  return db.pageBlock.delete({ where: { id: input.blockId } });
}

/** Moves a block up or down by swapping sortOrder with its neighbour. */
export async function moveBlock(input: {
  blockId: string;
  direction: "up" | "down";
}) {
  const block = await db.pageBlock.findUnique({
    where: { id: input.blockId },
    select: { id: true, pageId: true, sortOrder: true },
  });
  if (!block) throw new Error("בלוק לא נמצא.");

  const neighbour = await db.pageBlock.findFirst({
    where: {
      pageId: block.pageId,
      sortOrder:
        input.direction === "up"
          ? { lt: block.sortOrder }
          : { gt: block.sortOrder },
    },
    orderBy: { sortOrder: input.direction === "up" ? "desc" : "asc" },
    select: { id: true, sortOrder: true },
  });
  if (!neighbour) return block;

  await db.$transaction([
    db.pageBlock.update({ where: { id: block.id }, data: { sortOrder: neighbour.sortOrder } }),
    db.pageBlock.update({ where: { id: neighbour.id }, data: { sortOrder: block.sortOrder } }),
  ]);
  return block;
}

export async function listLandingPages(limit = 40) {
  const pages = await db.landingPage.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      slug: true,
      title: true,
      status: true,
      _count: { select: { blocks: true } },
    },
  });
  return pages.map((page) => ({
    id: page.id,
    slug: page.slug,
    title: page.title,
    status: page.status,
    blockCount: page._count.blocks,
  }));
}

export async function getPageBlocks(pageId: string) {
  const blocks = await db.pageBlock.findMany({
    where: { pageId },
    orderBy: { sortOrder: "asc" },
  });
  return orderBlocks(blocks);
}

/** A published page + its ordered blocks for the public renderer, or null. */
export async function getPublishedPageBySlug(slug: string) {
  const page = await db.landingPage.findUnique({
    where: { slug },
    include: { blocks: true },
  });
  if (page?.status !== "PUBLISHED") return null;
  return {
    title: page.title,
    slug: page.slug,
    blocks: orderBlocks(page.blocks),
  };
}

export async function getLandingPagesSummary() {
  const [total, published] = await Promise.all([
    db.landingPage.count(),
    db.landingPage.count({ where: { status: "PUBLISHED" } }),
  ]);
  return { total, published };
}
