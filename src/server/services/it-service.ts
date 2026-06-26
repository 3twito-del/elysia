import { db } from "~/server/db";

/**
 * Internal IT service management: help-desk tickets + IT asset register (ITSM,
 * §4.AI). The status roll-ups are pure and exported for unit testing.
 */

const OPEN_TICKET_STATUSES = ["OPEN", "IN_PROGRESS"];

export type TicketSummaryInput = { status: string; priority: string };

/** Counts open vs resolved tickets and the urgent/high open exposure. Pure. */
export function summarizeTickets(tickets: TicketSummaryInput[]) {
  let open = 0;
  let urgentOpen = 0;
  let resolved = 0;

  for (const ticket of tickets) {
    if (OPEN_TICKET_STATUSES.includes(ticket.status)) {
      open += 1;
      if (ticket.priority === "URGENT" || ticket.priority === "HIGH") {
        urgentOpen += 1;
      }
    } else {
      resolved += 1;
    }
  }

  return { open, urgentOpen, resolved };
}

export type AssetSummaryInput = { status: string };

/** Counts IT assets by lifecycle state. Pure. */
export function summarizeAssets(assets: AssetSummaryInput[]) {
  let inUse = 0;
  let inStorage = 0;
  let retired = 0;

  for (const asset of assets) {
    if (asset.status === "IN_USE") inUse += 1;
    else if (asset.status === "IN_STORAGE") inStorage += 1;
    else if (asset.status === "RETIRED") retired += 1;
  }

  return { inUse, inStorage, retired };
}

async function nextTicketNumber() {
  const count = await db.iTTicket.count();
  return `IT-${String(count + 1).padStart(5, "0")}`;
}

/** Opens an IT help-desk ticket. */
export async function createTicket(input: {
  title: string;
  category?: string;
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  requestedById?: string;
}) {
  if (!input.title.trim()) throw new Error("כותרת הפנייה היא שדה חובה.");

  return db.iTTicket.create({
    data: {
      ticketNumber: await nextTicketNumber(),
      title: input.title.trim(),
      category: input.category,
      priority: input.priority ?? "MEDIUM",
      requestedById: input.requestedById,
    },
  });
}

/** Updates a ticket's status (resolving stamps resolvedAt). */
export async function setTicketStatus(input: {
  ticketId: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
}) {
  const resolved = input.status === "RESOLVED" || input.status === "CLOSED";

  return db.iTTicket.update({
    where: { id: input.ticketId },
    data: { status: input.status, resolvedAt: resolved ? new Date() : null },
  });
}

/** Recent tickets. */
export async function listTickets(limit = 20) {
  return db.iTTicket.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: limit,
    select: {
      id: true,
      ticketNumber: true,
      title: true,
      category: true,
      priority: true,
      status: true,
    },
  });
}

export async function getTicketSummary() {
  const tickets = await db.iTTicket.findMany({
    select: { status: true, priority: true },
  });
  return summarizeTickets(tickets);
}

async function nextAssetTag() {
  const count = await db.iTAsset.count();
  return `AST-${String(count + 1).padStart(5, "0")}`;
}

/** Registers an IT asset. */
export async function createAsset(input: {
  name: string;
  category?: string;
  serialNumber?: string;
  assignedTo?: string;
}) {
  if (!input.name.trim()) throw new Error("שם הנכס הוא שדה חובה.");

  return db.iTAsset.create({
    data: {
      assetTag: await nextAssetTag(),
      name: input.name.trim(),
      category: input.category,
      serialNumber: input.serialNumber,
      assignedTo: input.assignedTo,
    },
  });
}

/** Updates an asset's lifecycle status. */
export async function setAssetStatus(input: {
  assetId: string;
  status: "IN_USE" | "IN_STORAGE" | "RETIRED";
}) {
  return db.iTAsset.update({
    where: { id: input.assetId },
    data: { status: input.status },
  });
}

/** Recent IT assets. */
export async function listAssets(limit = 20) {
  return db.iTAsset.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      assetTag: true,
      name: true,
      category: true,
      status: true,
      assignedTo: true,
    },
  });
}

export async function getAssetSummary() {
  const assets = await db.iTAsset.findMany({ select: { status: true } });
  return summarizeAssets(assets);
}
