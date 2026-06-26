import { getApAging } from "~/server/services/accounts-payable";
import { getArAging } from "~/server/services/accounts-receivable";
import { getApprovalSummary } from "~/server/services/approvals";
import { getReconciliationOverview } from "~/server/services/bank-reconciliation";
import { getFinancialStatements } from "~/server/services/financial-statements";
import { getInventoryValuation } from "~/server/services/inventory-valuation";
import { getLoyaltySummary } from "~/server/services/loyalty";
import { getSubscriptionSummary } from "~/server/services/subscriptions";

/**
 * Executive BI dashboard (§4.K): a cross-module roll-up composed from the
 * existing service summaries. buildExecutiveSummary is pure (derives ratios from
 * the raw inputs) and exported for unit testing.
 */

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

export type ExecutiveInputs = {
  netIncome: number;
  assets: number;
  liabilities: number;
  cashBalance: number;
  arOutstanding: number;
  apOutstanding: number;
  inventoryValue: number;
  mrr: number;
  loyaltyMembers: number;
  openApprovals: number;
};

/** Composes raw KPIs and derives working-capital ratios. Pure. */
export function buildExecutiveSummary(input: ExecutiveInputs) {
  return {
    ...input,
    workingCapital: round2(input.assets - input.liabilities),
    currentRatio:
      input.liabilities > 0
        ? round2(input.assets / input.liabilities)
        : null,
    netReceivablePosition: round2(input.arOutstanding - input.apOutstanding),
  };
}

/** Builds the executive dashboard from every module summary (resilient). */
export async function getExecutiveDashboard() {
  const [
    statements,
    reconciliation,
    arAging,
    apAging,
    inventory,
    subscriptions,
    loyalty,
    approvals,
  ] = await Promise.all([
    getFinancialStatements().catch(() => null),
    getReconciliationOverview().catch(() => null),
    getArAging().catch(() => null),
    getApAging().catch(() => null),
    getInventoryValuation().catch(() => null),
    getSubscriptionSummary().catch(() => null),
    getLoyaltySummary().catch(() => null),
    getApprovalSummary().catch(() => null),
  ]);

  return buildExecutiveSummary({
    netIncome: statements?.incomeStatement.netIncome ?? 0,
    assets: statements?.balanceSheet.assets ?? 0,
    liabilities: statements?.balanceSheet.liabilities ?? 0,
    cashBalance: reconciliation?.glCashBalance ?? 0,
    arOutstanding: arAging?.total ?? 0,
    apOutstanding: apAging?.total ?? 0,
    inventoryValue: inventory?.totalValue ?? 0,
    mrr: subscriptions?.mrr ?? 0,
    loyaltyMembers: loyalty?.members ?? 0,
    openApprovals: approvals?.pending ?? 0,
  });
}
