import { z } from "zod";

export const searchCatalogToolInputSchema = z.object({
  query: z.string().trim().max(160).optional(),
  category: z.string().trim().max(80).optional(),
  material: z.string().trim().max(80).optional(),
  stone: z.string().trim().max(80).optional(),
  maxPrice: z.number().positive().max(1_000_000).optional(),
});

export const saveStyleProfileInputSchema = z.object({
  metalColors: z.array(z.string().trim().max(40)).max(12).default([]),
  styles: z.array(z.string().trim().max(80)).max(12).default([]),
  ringSize: z.string().trim().max(40).optional(),
  necklaceFit: z.string().trim().max(80).optional(),
});

export const createTryOnSessionInputSchema = z.object({
  productSlug: z.string().trim().min(1).max(120),
  variantId: z.string().trim().max(128).optional(),
  sourceImageUrl: z.string().url().max(2_048).optional(),
});

export const orderSupportInputSchema = z.object({
  orderNumber: z.string().trim().min(3).max(64),
  email: z.string().trim().email().toLowerCase(),
});
