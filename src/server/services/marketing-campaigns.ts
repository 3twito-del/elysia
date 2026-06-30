import { db } from "~/server/db";

/**
 * Digital marketing campaigns (DMK-002): track budget/spend/revenue per channel
 * and derive ROAS. The metrics are pure + unit-tested; ad-network integration
 * (Google/Meta) would feed spend/revenue via IPL adapters later.
 */

export const MARKETING_CHANNELS = [
  "GOOGLE_ADS",
  "META",
  "TIKTOK",
  "EMAIL",
  "ORGANIC",
  "OTHER",
] as const;

export const CAMPAIGN_STATUSES = [
  "PLANNED",
  "ACTIVE",
  "PAUSED",
  "COMPLETED",
] as const;

function round2(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Return on ad spend (revenue ÷ spend). Pure. */
export function computeRoas(revenue: number, spend: number): number {
  return spend > 0 ? round2(revenue / spend) : 0;
}

/** Per-campaign derived metrics. Pure. */
export function computeCampaignMetrics(input: {
  budget: number;
  spend: number;
  revenue: number;
}) {
  return {
    roas: computeRoas(input.revenue, input.spend),
    profit: round2(input.revenue - input.spend),
    budgetUsedPercent:
      input.budget > 0 ? round2((input.spend / input.budget) * 100) : 0,
  };
}

function normalizeChannel(value: string | undefined): string {
  return value && (MARKETING_CHANNELS as readonly string[]).includes(value)
    ? value
    : "OTHER";
}

function normalizeStatus(value: string | undefined): string {
  return value && (CAMPAIGN_STATUSES as readonly string[]).includes(value)
    ? value
    : "ACTIVE";
}

export async function createCampaign(input: {
  name: string;
  channel?: string;
  budget?: number;
  startDate?: Date;
  endDate?: Date;
}) {
  if (!input.name.trim()) throw new Error("שם הקמפיין הוא שדה חובה.");
  return db.marketingCampaign.create({
    data: {
      name: input.name.trim(),
      channel: normalizeChannel(input.channel),
      budget: round2(Math.max(0, input.budget ?? 0)),
      startDate: input.startDate,
      endDate: input.endDate,
    },
  });
}

/** Records (adds to) spend and revenue for a campaign. */
export async function recordCampaignResults(input: {
  campaignId: string;
  spend?: number;
  revenue?: number;
}) {
  return db.marketingCampaign.update({
    where: { id: input.campaignId },
    data: {
      spend: { increment: round2(Math.max(0, input.spend ?? 0)) },
      revenue: { increment: round2(Math.max(0, input.revenue ?? 0)) },
    },
  });
}

export async function setCampaignStatus(input: {
  campaignId: string;
  status: string;
}) {
  return db.marketingCampaign.update({
    where: { id: input.campaignId },
    data: { status: normalizeStatus(input.status) },
  });
}

export async function listCampaigns(limit = 30) {
  const campaigns = await db.marketingCampaign.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      name: true,
      channel: true,
      status: true,
      budget: true,
      spend: true,
      revenue: true,
    },
  });

  return campaigns.map((campaign) => {
    const budget = Number(campaign.budget);
    const spend = Number(campaign.spend);
    const revenue = Number(campaign.revenue);
    return {
      id: campaign.id,
      name: campaign.name,
      channel: campaign.channel,
      status: campaign.status,
      budget,
      spend,
      revenue,
      ...computeCampaignMetrics({ budget, spend, revenue }),
    };
  });
}

export async function getMarketingSummary() {
  const campaigns = await db.marketingCampaign.findMany({
    select: { status: true, spend: true, revenue: true },
  });

  let activeCampaigns = 0;
  let totalSpend = 0;
  let totalRevenue = 0;
  for (const campaign of campaigns) {
    if (campaign.status === "ACTIVE") activeCampaigns += 1;
    totalSpend += Number(campaign.spend);
    totalRevenue += Number(campaign.revenue);
  }

  return {
    totalCampaigns: campaigns.length,
    activeCampaigns,
    totalSpend: round2(totalSpend),
    totalRevenue: round2(totalRevenue),
    roas: computeRoas(totalRevenue, totalSpend),
  };
}
