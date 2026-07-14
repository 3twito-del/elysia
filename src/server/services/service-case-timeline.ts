// H-05 service case timeline: the "shared high-level state" a customer may
// see. Only two auto-generated, always-CUSTOMER-visible kinds are written
// today -- RECEIVED on creation, STATUS_CHANGED on an admin status update.
// Internal notes already have a home (ServiceRequest.adminNotes, admin-only);
// this does not change that. NOTE/CUSTOMER_MESSAGE kinds exist on the schema
// for a later admin-initiated customer message, not built here.

import type { Prisma, ServiceRequestStatus } from "@prisma/client";

import { db } from "~/server/db";

export async function appendServiceRequestReceivedEvent(
  tx: Prisma.TransactionClient,
  input: { serviceRequestId: string },
) {
  await tx.serviceRequestEvent.create({
    data: {
      kind: "RECEIVED",
      serviceRequestId: input.serviceRequestId,
      visibility: "CUSTOMER",
    },
  });
}

export async function appendServiceRequestStatusChangedEvent(
  tx: Prisma.TransactionClient,
  input: { serviceRequestId: string; status: ServiceRequestStatus },
) {
  await tx.serviceRequestEvent.create({
    data: {
      kind: "STATUS_CHANGED",
      serviceRequestId: input.serviceRequestId,
      status: input.status,
      visibility: "CUSTOMER",
    },
  });
}

export type CustomerServiceRequestTimelineEntry = {
  createdAt: Date;
  id: string;
  kind: "RECEIVED" | "STATUS_CHANGED" | "NOTE" | "CUSTOMER_MESSAGE";
  message: string | null;
  status: ServiceRequestStatus | null;
};

export type CustomerServiceRequestSummary = {
  createdAt: Date;
  events: CustomerServiceRequestTimelineEntry[];
  id: string;
  message: string;
  orderNumber: string | null;
  status: ServiceRequestStatus;
  topicLabel: string;
};

/** The authenticated customer's own requests, oldest event first per case. */
export async function getCustomerServiceRequests(
  customerId: string,
): Promise<CustomerServiceRequestSummary[]> {
  const requests = await db.serviceRequest.findMany({
    include: {
      events: {
        orderBy: { createdAt: "asc" },
        where: { visibility: "CUSTOMER" },
      },
      topic: true,
    },
    orderBy: { createdAt: "desc" },
    where: { customerId },
  });

  return requests.map((request) => ({
    createdAt: request.createdAt,
    events: request.events.map((event) => ({
      createdAt: event.createdAt,
      id: event.id,
      kind: event.kind,
      message: event.message,
      status: event.status,
    })),
    id: request.id,
    message: request.message,
    orderNumber: request.orderNumber,
    status: request.status,
    topicLabel: request.topic?.label ?? "פנייה כללית",
  }));
}
