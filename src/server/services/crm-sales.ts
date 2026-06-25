import { db } from "~/server/db";

/**
 * CRM sales pipeline (CRM-SAL): Leads → Opportunities with a weighted forecast.
 * Pure helpers are exported for unit testing.
 */

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

/** Default win probability per pipeline stage (CRM-SAL-003). */
export const STAGE_PROBABILITY: Record<string, number> = {
  QUALIFIED: 20,
  PROPOSAL: 50,
  NEGOTIATION: 75,
  WON: 100,
  LOST: 0,
};

export const OPEN_STAGES = ["QUALIFIED", "PROPOSAL", "NEGOTIATION"] as const;

export type OpportunityLike = {
  stage: string;
  status: string;
  amount: number;
  probability: number;
};

/** Weighted pipeline value: Σ amount × (probability/100) over OPEN opportunities. */
export function weightedPipelineValue(opportunities: OpportunityLike[]): number {
  return round2(
    opportunities
      .filter((opportunity) => opportunity.status === "OPEN")
      .reduce(
        (sum, opportunity) =>
          sum + opportunity.amount * (opportunity.probability / 100),
        0,
      ),
  );
}

/** Open pipeline grouped by stage: count, total amount and weighted value. */
export function pipelineByStage(opportunities: OpportunityLike[]) {
  const stages = new Map<
    string,
    { stage: string; count: number; amount: number; weighted: number }
  >();

  for (const opportunity of opportunities) {
    if (opportunity.status !== "OPEN") continue;

    const row = stages.get(opportunity.stage) ?? {
      stage: opportunity.stage,
      count: 0,
      amount: 0,
      weighted: 0,
    };
    row.count += 1;
    row.amount = round2(row.amount + opportunity.amount);
    row.weighted = round2(
      row.weighted + opportunity.amount * (opportunity.probability / 100),
    );
    stages.set(opportunity.stage, row);
  }

  return Array.from(stages.values());
}

/** Win rate over closed opportunities: won / (won + lost), as a percentage. */
export function winRate(opportunities: OpportunityLike[]): number {
  const won = opportunities.filter((o) => o.status === "WON").length;
  const lost = opportunities.filter((o) => o.status === "LOST").length;
  const closed = won + lost;

  return closed === 0 ? 0 : Math.round((won / closed) * 100);
}

export async function createLead(input: {
  name: string;
  email?: string;
  phone?: string;
  source?: string;
  customerId?: string;
  assignedAdminUserId?: string;
  notes?: string;
}) {
  return db.lead.create({
    data: {
      name: input.name,
      email: input.email,
      phone: input.phone,
      source: input.source ?? "manual",
      customerId: input.customerId,
      assignedAdminUserId: input.assignedAdminUserId,
      notes: input.notes,
    },
  });
}

export async function convertLeadToOpportunity(input: {
  leadId: string;
  title: string;
  amount?: number;
  stage?: string;
  expectedCloseDate?: Date;
  assignedAdminUserId?: string;
}) {
  return db.$transaction(async (tx) => {
    const lead = await tx.lead.findUnique({ where: { id: input.leadId } });
    if (!lead) throw new Error("Lead not found.");

    const stage = input.stage ?? "QUALIFIED";
    const opportunity = await tx.opportunity.create({
      data: {
        title: input.title,
        stage,
        status: "OPEN",
        amount: input.amount ?? 0,
        probability: STAGE_PROBABILITY[stage] ?? 0,
        expectedCloseDate: input.expectedCloseDate,
        customerId: lead.customerId,
        leadId: lead.id,
        assignedAdminUserId:
          input.assignedAdminUserId ?? lead.assignedAdminUserId,
      },
    });

    await tx.lead.update({
      where: { id: lead.id },
      data: { status: "CONVERTED" },
    });

    return opportunity;
  });
}

export async function setOpportunityStage(input: {
  opportunityId: string;
  stage: string;
  probability?: number;
}) {
  const status =
    input.stage === "WON" ? "WON" : input.stage === "LOST" ? "LOST" : "OPEN";

  return db.opportunity.update({
    where: { id: input.opportunityId },
    data: {
      stage: input.stage,
      status,
      probability: input.probability ?? STAGE_PROBABILITY[input.stage] ?? 0,
      closedAt: status === "OPEN" ? null : new Date(),
    },
  });
}

/** Pipeline overview for the CRM dashboard: open value, weighted forecast, win rate. */
export async function getSalesPipelineOverview() {
  const opportunities = await db.opportunity.findMany({
    select: { stage: true, status: true, amount: true, probability: true },
  });
  const mapped: OpportunityLike[] = opportunities.map((opportunity) => ({
    stage: opportunity.stage,
    status: opportunity.status,
    amount: Number(opportunity.amount),
    probability: opportunity.probability,
  }));

  const open = mapped.filter((opportunity) => opportunity.status === "OPEN");

  return {
    openOpportunities: open.length,
    totalOpenValue: round2(
      open.reduce((sum, opportunity) => sum + opportunity.amount, 0),
    ),
    weightedValue: weightedPipelineValue(mapped),
    winRate: winRate(mapped),
    byStage: pipelineByStage(mapped),
    generatedAt: new Date(),
  };
}

/** Open leads (NEW / QUALIFIED) for the CRM workbench. */
export async function listRecentLeads(limit = 20) {
  return db.lead.findMany({
    where: { status: { in: ["NEW", "QUALIFIED"] } },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      source: true,
      status: true,
      createdAt: true,
    },
  });
}

/** Recent opportunities (open first) for the CRM workbench. */
export async function listOpportunities(limit = 20) {
  const opportunities = await db.opportunity.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: limit,
    select: {
      id: true,
      title: true,
      stage: true,
      status: true,
      amount: true,
      probability: true,
      expectedCloseDate: true,
      createdAt: true,
    },
  });

  return opportunities.map((opportunity) => ({
    ...opportunity,
    amount: Number(opportunity.amount),
  }));
}
