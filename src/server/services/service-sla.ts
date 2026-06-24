import { db } from "~/server/db";

/**
 * Service SLA engine (CRM-SVC-002) over ServiceRequest. Pure deadline/breach
 * helpers are exported for unit testing; DB helpers manage case lifecycle.
 *
 * Simplification: WAITING_FOR_CUSTOMER does not pause the clock yet.
 */

const hourMs = 60 * 60 * 1000;

/** Response/resolution targets (hours) by priority. */
export const SLA_TARGETS_HOURS: Record<
  string,
  { response: number; resolution: number }
> = {
  URGENT: { response: 1, resolution: 8 },
  HIGH: { response: 4, resolution: 24 },
  NORMAL: { response: 8, resolution: 72 },
  LOW: { response: 24, resolution: 168 },
};

const OPEN_STATUSES = new Set([
  "NEW",
  "IN_REVIEW",
  "WAITING_FOR_CUSTOMER",
]);

export type SlaRequest = {
  createdAt: Date;
  priority: string;
  status: string;
  firstRespondedAt: Date | null;
  resolvedAt: Date | null;
};

export type SlaStatus = "MET" | "BREACHED" | "AT_RISK" | "ON_TRACK";

function targetsFor(priority: string) {
  return SLA_TARGETS_HOURS[priority] ?? SLA_TARGETS_HOURS.NORMAL!;
}

export function computeSlaDeadlines(createdAt: Date, priority: string) {
  const targets = targetsFor(priority);

  return {
    firstResponseDueAt: new Date(createdAt.getTime() + targets.response * hourMs),
    resolutionDueAt: new Date(createdAt.getTime() + targets.resolution * hourMs),
  };
}

/** True when no first response was logged and the response deadline has passed. */
export function isFirstResponseBreached(
  request: SlaRequest,
  asOf: Date = new Date(),
): boolean {
  if (request.firstRespondedAt) return false;
  return asOf > computeSlaDeadlines(request.createdAt, request.priority)
    .firstResponseDueAt;
}

/** True when resolved after the resolution deadline, or still open past it. */
export function isResolutionBreached(
  request: SlaRequest,
  asOf: Date = new Date(),
): boolean {
  const { resolutionDueAt } = computeSlaDeadlines(
    request.createdAt,
    request.priority,
  );
  const end = request.resolvedAt ?? asOf;
  return end > resolutionDueAt;
}

export function slaStatus(
  request: SlaRequest,
  asOf: Date = new Date(),
): SlaStatus {
  const { resolutionDueAt } = computeSlaDeadlines(
    request.createdAt,
    request.priority,
  );

  if (!OPEN_STATUSES.has(request.status)) {
    const end = request.resolvedAt ?? asOf;
    return end <= resolutionDueAt ? "MET" : "BREACHED";
  }

  if (isFirstResponseBreached(request, asOf) || isResolutionBreached(request, asOf)) {
    return "BREACHED";
  }

  const total = resolutionDueAt.getTime() - request.createdAt.getTime();
  const remaining = resolutionDueAt.getTime() - asOf.getTime();
  return remaining < total * 0.25 ? "AT_RISK" : "ON_TRACK";
}

export async function assignServiceRequest(input: {
  id: string;
  assignedAdminUserId: string;
  priority?: string;
}) {
  return db.serviceRequest.update({
    where: { id: input.id },
    data: {
      assignedAdminUserId: input.assignedAdminUserId,
      ...(input.priority ? { priority: input.priority } : {}),
    },
  });
}

export async function setServicePriority(input: {
  id: string;
  priority: string;
}) {
  return db.serviceRequest.update({
    where: { id: input.id },
    data: { priority: input.priority },
  });
}

/** Logs the first response if not already set, and moves NEW → IN_REVIEW. */
export async function recordFirstResponse(id: string) {
  const request = await db.serviceRequest.findUnique({
    where: { id },
    select: { firstRespondedAt: true, status: true },
  });
  if (!request) throw new Error("Service request not found.");

  return db.serviceRequest.update({
    where: { id },
    data: {
      firstRespondedAt: request.firstRespondedAt ?? new Date(),
      status: request.status === "NEW" ? "IN_REVIEW" : request.status,
    },
  });
}

export async function resolveServiceRequest(id: string) {
  return db.serviceRequest.update({
    where: { id },
    data: { status: "RESOLVED", resolvedAt: new Date() },
  });
}

/** Open-case SLA overview for the admin service dashboard. */
export async function getServiceSlaOverview(asOf: Date = new Date()) {
  const requests = await db.serviceRequest.findMany({
    where: { status: { in: ["NEW", "IN_REVIEW", "WAITING_FOR_CUSTOMER"] } },
    select: {
      createdAt: true,
      priority: true,
      status: true,
      firstRespondedAt: true,
      resolvedAt: true,
    },
  });

  let breached = 0;
  let atRisk = 0;
  let awaitingFirstResponse = 0;
  const byPriority = new Map<string, number>();

  for (const request of requests) {
    const status = slaStatus(request, asOf);
    if (status === "BREACHED") breached += 1;
    else if (status === "AT_RISK") atRisk += 1;
    if (!request.firstRespondedAt) awaitingFirstResponse += 1;
    byPriority.set(request.priority, (byPriority.get(request.priority) ?? 0) + 1);
  }

  return {
    openCases: requests.length,
    breached,
    atRisk,
    awaitingFirstResponse,
    byPriority: Array.from(byPriority.entries()).map(([priority, count]) => ({
      priority,
      count,
    })),
    generatedAt: new Date(),
  };
}
