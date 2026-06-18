import { z } from "zod";

export const feedbackInputSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, "יש להזין הודעה.")
    .max(1000, "ההודעה ארוכה מדי (עד 1000 תווים)."),
  email: z
    .string()
    .trim()
    .email("יש להזין כתובת אימייל תקינה.")
    .toLowerCase()
    .optional()
    .or(z.literal("")),
  url: z.string().max(512).optional(),
});
