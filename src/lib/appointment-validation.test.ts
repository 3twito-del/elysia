import { describe, expect, it } from "vitest";

import {
  createAppointmentInputSchema,
  getAdminAppointmentTransitionError,
  getAllowedAppointmentStatusTransitions,
} from "./appointment-validation";
import { getZodFieldErrors } from "./form-validation";

describe("appointment validation", () => {
  it("accepts a valid branch appointment request", () => {
    const parsed = createAppointmentInputSchema.parse({
      branchSlug: "tel-aviv",
      topic: "מדידת טבעת",
      name: "דנה כהן",
      email: "dana@example.com",
      phone: "0501234567",
      startsAt: new Date("2026-06-01T10:00:00.000Z").toISOString(),
      notes: "",
    });

    expect(parsed).toMatchObject({
      branchSlug: "tel-aviv",
      topic: "מדידת טבעת",
      name: "דנה כהן",
    });
  });

  it("returns field-level Hebrew errors for invalid appointment details", () => {
    const parsed = createAppointmentInputSchema.safeParse({
      branchSlug: "",
      topic: "",
      name: "",
      email: "bad",
      phone: "abc",
      startsAt: "not-a-date",
    });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(getZodFieldErrors(parsed.error)).toMatchObject({
        branchSlug: "יש לבחור אפשרות שירות.",
        email: "יש להזין כתובת אימייל תקינה.",
        name: "יש להזין שם מלא.",
        phone: "יש להזין טלפון תקין.",
        startsAt: "יש לבחור תאריך ושעה תקינים.",
        topic: "יש להזין נושא לפגישה.",
      });
    }
  });

  it("defines admin appointment workflow transitions", () => {
    expect(getAllowedAppointmentStatusTransitions("REQUESTED")).toEqual([
      "CONFIRMED",
      "CANCELLED",
    ]);
    expect(getAllowedAppointmentStatusTransitions("CONFIRMED")).toEqual([
      "COMPLETED",
      "CANCELLED",
    ]);
    expect(getAllowedAppointmentStatusTransitions("COMPLETED")).toEqual([]);
    expect(
      getAdminAppointmentTransitionError({
        from: "COMPLETED",
        to: "CONFIRMED",
      }),
    ).toBe("מעבר סטטוס התור אינו אפשרי מהמצב הנוכחי.");
    expect(
      getAdminAppointmentTransitionError({
        from: "REQUESTED",
        to: "CANCELLED",
      }),
    ).toBeNull();
  });
});
