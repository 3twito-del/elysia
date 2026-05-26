import { z } from "zod";

export const newsletterInputSchema = z.object({
  email: z.string().trim().email("יש להזין כתובת אימייל תקינה.").toLowerCase(),
});

export const wishlistInputSchema = z.object({
  productSlug: z.string().trim().min(1, "לא נמצאה בחירה לשמירה."),
});

export const adminLoginInputSchema = z.object({
  email: z.string().trim().email("יש להזין אימייל אדמין תקין.").toLowerCase(),
  password: z.string().min(12, "יש להזין סיסמת אדמין תקינה."),
  next: z.string().max(256, "כתובת ההפניה ארוכה מדי.").optional(),
});
