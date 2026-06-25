import { db } from "~/server/db";

/**
 * Resource scheduling / booking (CAL, Phase 7).
 *
 * Resources (rooms, equipment, staff) are booked for time windows; overlapping
 * bookings on the same resource are rejected. The overlap test is pure and
 * exported for unit testing.
 */

export type BookingWindow = { startsAt: Date; endsAt: Date };

/** Whether `candidate` overlaps any of the existing windows. Pure. */
export function hasBookingConflict(
  existing: BookingWindow[],
  candidate: BookingWindow,
): boolean {
  return existing.some(
    (booking) =>
      candidate.startsAt.getTime() < booking.endsAt.getTime() &&
      candidate.endsAt.getTime() > booking.startsAt.getTime(),
  );
}

/** Throws unless the booking window is valid (end strictly after start). */
export function assertValidWindow(window: BookingWindow) {
  if (Number.isNaN(window.startsAt.getTime()) || Number.isNaN(window.endsAt.getTime())) {
    throw new Error("תאריכי השיבוץ אינם תקינים.");
  }
  if (window.endsAt.getTime() <= window.startsAt.getTime()) {
    throw new Error("שעת הסיום חייבת להיות אחרי שעת ההתחלה.");
  }
}

/** Creates a bookable resource. */
export async function createResource(input: {
  name: string;
  kind?: "ROOM" | "EQUIPMENT" | "STAFF";
}) {
  if (!input.name.trim()) throw new Error("שם המשאב הוא שדה חובה.");

  return db.resource.create({
    data: { name: input.name.trim(), kind: input.kind ?? "ROOM" },
  });
}

/** Books a resource for a window, rejecting overlaps with active bookings. */
export async function createBooking(input: {
  resourceId: string;
  title: string;
  startsAt: Date;
  endsAt: Date;
  bookedById?: string;
}) {
  assertValidWindow(input);

  return db.$transaction(async (tx) => {
    const overlapping = await tx.resourceBooking.findMany({
      where: {
        resourceId: input.resourceId,
        status: "BOOKED",
        startsAt: { lt: input.endsAt },
        endsAt: { gt: input.startsAt },
      },
      select: { startsAt: true, endsAt: true },
    });

    if (hasBookingConflict(overlapping, input)) {
      throw new Error("המשאב כבר משובץ בחלון הזמן הזה.");
    }

    return tx.resourceBooking.create({
      data: {
        resourceId: input.resourceId,
        title: input.title,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        bookedById: input.bookedById,
      },
    });
  });
}

/** Cancels a booking. */
export async function cancelBooking(input: { bookingId: string }) {
  return db.resourceBooking.update({
    where: { id: input.bookingId },
    data: { status: "CANCELLED" },
  });
}

/** Active resources for the booking selects. */
export async function listResources() {
  return db.resource.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, kind: true },
  });
}

/** Upcoming booked windows with their resource name. */
export async function listUpcomingBookings(limit = 20) {
  const bookings = await db.resourceBooking.findMany({
    where: { status: "BOOKED", endsAt: { gte: new Date() } },
    orderBy: { startsAt: "asc" },
    take: limit,
    select: {
      id: true,
      title: true,
      startsAt: true,
      endsAt: true,
      resource: { select: { name: true } },
    },
  });

  return bookings.map((booking) => ({
    id: booking.id,
    title: booking.title,
    startsAt: booking.startsAt,
    endsAt: booking.endsAt,
    resourceName: booking.resource.name,
  }));
}
