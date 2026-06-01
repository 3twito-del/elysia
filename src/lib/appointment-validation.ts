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

export type AppointmentWorkflowStatus =
  | "REQUESTED"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED";

const appointmentWorkflowTransitions = {
  CANCELLED: [],
  COMPLETED: [],
  CONFIRMED: ["COMPLETED", "CANCELLED"],
  REQUESTED: ["CONFIRMED", "CANCELLED"],
} as const satisfies Record<
  AppointmentWorkflowStatus,
  readonly AppointmentWorkflowStatus[]
>;

export function getAllowedAppointmentStatusTransitions(
  status: AppointmentWorkflowStatus,
) {
  return appointmentWorkflowTransitions[status];
}

export function getAdminAppointmentTransitionError(input: {
  from: string;
  to: string;
}) {
  if (!isAppointmentWorkflowStatus(input.from)) {
    return "סטטוס התור הנוכחי אינו מוכר.";
  }

  if (!isAppointmentWorkflowStatus(input.to)) {
    return "סטטוס התור המבוקש אינו מוכר.";
  }

  if (input.from === input.to) return null;

  const allowedTransitions = appointmentWorkflowTransitions[
    input.from
  ] as readonly string[];

  return allowedTransitions.includes(input.to)
    ? null
    : "מעבר סטטוס התור אינו אפשרי מהמצב הנוכחי.";
}

function isAppointmentWorkflowStatus(
  status: string,
): status is AppointmentWorkflowStatus {
  return Object.hasOwn(appointmentWorkflowTransitions, status);
}
