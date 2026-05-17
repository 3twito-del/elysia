import { z } from "zod";

const phonePattern = /^[\d+\-()\s]{7,20}$/u;

export const createAppointmentInputSchema = z.object({
  branchSlug: z.string().trim().min(1, "יש לבחור אפשרות שירות.").max(80),
  topic: z.string().trim().min(2, "יש להזין נושא לפגישה.").max(120),
  name: z.string().trim().min(2, "יש להזין שם מלא.").max(120),
  email: z.string().trim().email("יש להזין כתובת אימייל תקינה.").optional(),
  phone: z.string().trim().regex(phonePattern, "יש להזין טלפון תקין."),
  startsAt: z.string().datetime({ message: "יש לבחור תאריך ושעה תקינים." }),
  notes: z.string().trim().max(500, "ההערות ארוכות מדי.").optional(),
});
