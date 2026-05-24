import { db } from "~/server/db";

export async function recordProductClickEvent(input: {
  productSlug: string;
  query?: string;
  position?: number;
  sessionKey?: string;
}) {
  const product = await db.product.findUnique({
    where: { slug: input.productSlug },
    select: { id: true },
  });

  if (!product) return false;

  await db.productClickEvent.create({
    data: {
      productId: product.id,
      query: input.query,
      position: input.position,
      sessionKey: input.sessionKey,
    },
  });

  return true;
}

export async function recordProductViewEvent(input: {
  productSlug: string;
  sessionKey?: string;
  customerId?: string;
  path?: string;
}) {
  const product = await db.product.findUnique({
    where: { slug: input.productSlug },
    select: { id: true },
  });

  if (!product) return false;

  await db.productViewEvent.create({
    data: {
      productId: product.id,
      sessionKey: input.sessionKey,
      customerId: input.customerId,
      path: input.path,
    },
  });

  return true;
}
