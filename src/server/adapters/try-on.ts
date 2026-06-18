import { nanoid } from "nanoid";
import { z } from "zod";

export const tryOnInputSchema = z.object({
  productSlug: z.string().trim().min(1).max(120),
  variantId: z.string().trim().max(128).optional(),
  sourceImageUrl: z.string().url().max(2_048).optional(),
});

export type TryOnInput = z.infer<typeof tryOnInputSchema>;

export type TryOnSessionResult = {
  id: string;
  status: "queued" | "ready";
  provider: "internal-webar";
  message: string;
};

export interface TryOnProvider {
  createSession(input: TryOnInput): Promise<TryOnSessionResult>;
}

class InternalTryOnProvider implements TryOnProvider {
  async createSession(input: TryOnInput): Promise<TryOnSessionResult> {
    tryOnInputSchema.parse(input);

    return {
      id: `tryon_${nanoid(10)}`,
      status: "queued",
      provider: "internal-webar",
      message:
        "בקשת המדידה נשמרה. שירות הלקוחות יחזור עם הכוונה למידה ולהתאמה.",
    };
  }
}

export const tryOnProvider: TryOnProvider = new InternalTryOnProvider();
