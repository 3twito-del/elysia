import { db } from "~/server/db";

/**
 * Facilities / branch maintenance requests (FAC, §4.AH).
 *
 * Requests move OPEN → SCHEDULED → DONE (or CANCELLED). The roll-up is pure and
 * exported for unit testing.
 */

export type FacilitySummaryInput = { status: string };

/** Counts requests by workflow state. Pure. */
export function summarizeFacilityRequests(requests: FacilitySummaryInput[]) {
  let open = 0;
  let scheduled = 0;
  let done = 0;

  for (const request of requests) {
    if (request.status === "OPEN") open += 1;
    else if (request.status === "SCHEDULED") scheduled += 1;
    else if (request.status === "DONE") done += 1;
  }

  return { open, scheduled, done };
}

async function nextRequestNumber() {
  const count = await db.facilityRequest.count();
  return `FR-${String(count + 1).padStart(5, "0")}`;
}

/** Opens a facilities request. */
export async function createFacilityRequest(input: {
  title: string;
  branchId?: string;
  category?: string;
  priority?: "LOW" | "MEDIUM" | "HIGH";
  notes?: string;
}) {
  if (!input.title.trim()) throw new Error("כותרת הבקשה היא שדה חובה.");

  return db.facilityRequest.create({
    data: {
      requestNumber: await nextRequestNumber(),
      title: input.title.trim(),
      branchId: input.branchId,
      category: input.category,
      priority: input.priority ?? "MEDIUM",
      notes: input.notes,
    },
  });
}

/** Schedules a request for a date (status SCHEDULED). */
export async function scheduleFacilityRequest(input: {
  requestId: string;
  scheduledAt: Date;
}) {
  return db.facilityRequest.update({
    where: { id: input.requestId },
    data: { status: "SCHEDULED", scheduledAt: input.scheduledAt },
  });
}

/** Updates a request's status. */
export async function setFacilityStatus(input: {
  requestId: string;
  status: "OPEN" | "SCHEDULED" | "DONE" | "CANCELLED";
}) {
  return db.facilityRequest.update({
    where: { id: input.requestId },
    data: { status: input.status },
  });
}

/** Recent facilities requests with branch name. */
export async function listFacilityRequests(limit = 20) {
  const requests = await db.facilityRequest.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: limit,
    select: {
      id: true,
      requestNumber: true,
      title: true,
      category: true,
      priority: true,
      status: true,
      scheduledAt: true,
    },
  });

  return requests;
}

export async function getFacilitySummary() {
  const requests = await db.facilityRequest.findMany({
    select: { status: true },
  });
  return summarizeFacilityRequests(requests);
}
