import {
  Banknote,
  Building2,
  CreditCard,
  Landmark,
  Lock,
  PieChart,
  ReceiptText,
  Repeat,
  TrendingUp,
  Users,
  Wallet,
  Wrench,
} from "lucide-react";

import { AdminShell } from "../_components/admin-shell";
import {
  AdminDatabaseFallback,
  AdminForbidden,
} from "../_components/admin-states";
import { getAdminPageAccess } from "../_lib/access";
import {
  approveExpenseClaimAction,
  autoMatchBankStatementAction,
  cancelSubscriptionAction,
  closePeriodAction,
  createCostCenterAction,
  createMaintenanceScheduleAction,
  recordMaintenanceAction,
  recordDunningContactAction,
  sendDunningReminderAction,
  setExchangeRateAction,
  toggleMaintenanceScheduleAction,
  createCustomerInvoiceAction,
  createEmployeeAction,
  createExpenseClaimAction,
  createFixedAssetAction,
  createLedgerAccountAction,
  recordCostEntryAction,
  toggleCostCenterAction,
  createSubscriptionPlanAction,
  disposeFixedAssetAction,
  ignoreBankStatementLineAction,
  importBankStatementAction,
  issueCustomerInvoiceAction,
  postManualJournalEntryAction,
  recordCustomerReceiptAction,
  rejectExpenseClaimAction,
  runDepreciationAction,
  runPayrollAction,
  runSubscriptionBillingAction,
  seedChartAction,
  setBudgetAction,
  subscribeAction,
} from "./actions";
import { MetricCard } from "~/components/metric-card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { TableEmptyRow } from "~/components/ui/table-empty-row";
import { Textarea } from "~/components/ui/textarea";
import {
  formatHebrewDate,
  formatHebrewDateTime,
  formatPrice,
} from "~/lib/format";
import { listCustomerInvoices } from "~/server/services/accounts-receivable";
import {
  getReconciliationOverview,
  listBankStatementLines,
} from "~/server/services/bank-reconciliation";
import { getBudgetVsActual } from "~/server/services/budgeting";
import {
  getCostAccountingSummary,
  listCostCenters,
} from "~/server/services/cost-accounting";
import {
  getMaintenanceSummary,
  listAssetsForMaintenance,
  listMaintenanceSchedules,
} from "~/server/services/asset-maintenance";
import {
  getDunningSummary,
  getDunningWorklist,
} from "~/server/services/dunning";
import {
  getRevaluationPreview,
  listExchangeRates,
} from "~/server/services/currency-fx";
import { getCashFlowStatement } from "~/server/services/cash-flow";
import { listAccountsWithBalances } from "~/server/services/chart-of-accounts";
import {
  getExpenseSummary,
  listExpenseClaims,
} from "~/server/services/expense-management";
import {
  getFixedAssetsSummary,
  listFixedAssets,
} from "~/server/services/fixed-assets";
import {
  getPayrollSummary,
  listEmployees,
} from "~/server/services/hr-payroll";
import {
  getSubscriptionSummary,
  listPlans,
  listSubscriptions,
} from "~/server/services/subscriptions";
import {
  getFinanceOverview,
  getGeneralLedgerOverview,
} from "~/server/services/finance";
import { listEntityOptions } from "~/server/services/entities";
import { getFinancialStatements } from "~/server/services/financial-statements";
import {
  listLedgerAccounts,
  listRecentJournalEntries,
} from "~/server/services/manual-journal";
import {
  getPeriodCloseSummary,
  listFiscalPeriods,
} from "~/server/services/period-close";
import { computeVatReport } from "~/server/services/vat-report";

export const metadata = {
  title: "Finance | Admin",
};

export const dynamic = "force-dynamic";

const customerInvoiceStatusLabel: Record<string, string> = {
  DRAFT: "טיוטה",
  ISSUED: "הונפקה",
  PARTIALLY_PAID: "שולם חלקית",
  PAID: "שולם",
  CANCELLED: "בוטל",
};

const bankStatusLabel: Record<string, string> = {
  UNMATCHED: "ללא התאמה",
  MATCHED: "הותאם",
  IGNORED: "נוטרל",
};

const bankStatusVariant: Record<
  string,
  "secondary" | "outline" | "destructive"
> = {
  UNMATCHED: "outline",
  MATCHED: "secondary",
  IGNORED: "destructive",
};

const journalSourceLabel: Record<string, string> = {
  sale: "מכירה",
  customer_receipt: "תקבול לקוח",
  customer_invoice: "חשבונית לקוח",
  vendor_invoice: "חשבונית ספק",
  vendor_payment: "תשלום ספק",
  purchase_receipt: "קליטת סחורה",
  period_close: "סגירת תקופה",
  reversal: "היפוך",
  manual: "ידני",
};

const customerInvoiceStatusVariant: Record<
  string,
  "secondary" | "outline" | "destructive"
> = {
  DRAFT: "outline",
  ISSUED: "outline",
  PARTIALLY_PAID: "outline",
  PAID: "secondary",
  CANCELLED: "destructive",
};

export default async function AdminFinancePage() {
  const access = await getAdminPageAccess("FINANCE_READ", "/admin/finance");

  if (access.denied) return <AdminForbidden {...access.denied} />;

  const finance = await getFinanceOverview({
    adminUserId: access.admin.id,
  }).catch((error: unknown) => {
    if (process.env.NODE_ENV === "development") {
      console.error("[admin] failed to load finance", error);
    }

    return null;
  });

  if (!finance) return <AdminDatabaseFallback />;

  const gl = await getGeneralLedgerOverview({ range: finance.range }).catch(
    (error: unknown) => {
      if (process.env.NODE_ENV === "development") {
        console.error("[admin] failed to load general ledger", error);
      }

      return null;
    },
  );

  const customerInvoices = await listCustomerInvoices().catch(() => []);

  const vat = await computeVatReport({
    from: finance.range.from,
    to: finance.range.to,
  }).catch(() => null);

  const statements = await getFinancialStatements().catch(() => null);

  const cashFlow = await getCashFlowStatement().catch(() => null);

  const now = new Date();
  const closeTarget = {
    year: now.getUTCMonth() === 0 ? now.getUTCFullYear() - 1 : now.getUTCFullYear(),
    month: now.getUTCMonth() === 0 ? 12 : now.getUTCMonth(),
  };
  const [
    fiscalPeriods,
    closeSummary,
    ledgerAccounts,
    recentEntries,
    entityOptions,
  ] = await Promise.all([
    listFiscalPeriods().catch(() => []),
    getPeriodCloseSummary(closeTarget.year, closeTarget.month).catch(() => null),
    listLedgerAccounts().catch(() => []),
    listRecentJournalEntries().catch(() => []),
    listEntityOptions().catch(() => []),
  ]);

  const [
    bankLines,
    reconciliation,
    fixedAssets,
    fixedAssetsSummary,
    employees,
    payrollSummary,
  ] = await Promise.all([
    listBankStatementLines().catch(() => []),
    getReconciliationOverview().catch(() => null),
    listFixedAssets().catch(() => []),
    getFixedAssetsSummary().catch(() => null),
    listEmployees().catch(() => []),
    getPayrollSummary().catch(() => null),
  ]);

  const [expenseClaims, expenseSummary, budget] = await Promise.all([
    listExpenseClaims().catch(() => []),
    getExpenseSummary().catch(() => null),
    getBudgetVsActual().catch(() => null),
  ]);

  const [costCenters, costSummary] = await Promise.all([
    listCostCenters().catch(() => []),
    getCostAccountingSummary().catch(() => ({
      centers: 0,
      revenue: 0,
      expense: 0,
      margin: 0,
    })),
  ]);
  const currentPeriod = `${now.getUTCFullYear()}-${String(
    now.getUTCMonth() + 1,
  ).padStart(2, "0")}`;

  const [maintenanceSchedules, maintenanceAssets, maintenanceSummary] =
    await Promise.all([
      listMaintenanceSchedules().catch(() => []),
      listAssetsForMaintenance().catch(() => []),
      getMaintenanceSummary().catch(() => ({
        active: 0,
        overdue: 0,
        dueSoon: 0,
      })),
    ]);
  const maintenanceDueMeta: Record<
    string,
    { label: string; variant: "secondary" | "outline" | "destructive" }
  > = {
    OK: { label: "תקין", variant: "secondary" },
    DUE_SOON: { label: "מתקרב", variant: "outline" },
    OVERDUE: { label: "באיחור", variant: "destructive" },
  };

  const [dunningWorklist, dunningSummary] = await Promise.all([
    getDunningWorklist().catch(() => []),
    getDunningSummary().catch(() => ({
      overdueCount: 0,
      overdueTotal: 0,
      escalations: 0,
    })),
  ]);

  const [exchangeRates, revaluation] = await Promise.all([
    listExchangeRates().catch(() => []),
    getRevaluationPreview().catch(() => ({ lines: [], totalUnrealized: 0 })),
  ]);
  const currentYmd = now.toISOString().slice(0, 10);

  const [subscriptionPlans, subscriptions, subscriptionSummary] =
    await Promise.all([
      listPlans().catch(() => []),
      listSubscriptions().catch(() => []),
      getSubscriptionSummary().catch(() => null),
    ]);

  const chartAccounts = await listAccountsWithBalances().catch(() => []);

  const subscriptionStatusLabel: Record<string, string> = {
    ACTIVE: "פעיל",
    PAUSED: "מושהה",
    CANCELLED: "בוטל",
  };

  const fixedAssetStatusLabel: Record<string, string> = {
    ACTIVE: "פעיל",
    FULLY_DEPRECIATED: "פוחת במלואו",
    DISPOSED: "נגרע",
  };

  const expenseStatusLabel: Record<string, string> = {
    SUBMITTED: "הוגשה",
    APPROVED: "אושרה",
    REJECTED: "נדחתה",
  };

  const expenseStatusVariant: Record<
    string,
    "secondary" | "outline" | "destructive"
  > = {
    SUBMITTED: "outline",
    APPROVED: "secondary",
    REJECTED: "destructive",
  };

  return (
    <AdminShell
      active="finance"
      admin={access.admin}
      description="Ledger תפעולי: הכנסות, תשלומים, COGS, gross margin, refunds ונתונים מוכנים לייצוא חשבונאי."
      title="Finance"
    >
      <p className="text-muted-foreground mb-4 text-sm">
        לא מחליף הנהלת חשבונות חוקית. צפייה ב־Finance נרשמת ל־AuditLog. טווח{" "}
        {formatHebrewDate(finance.range.from)}–
        {formatHebrewDate(finance.range.to)}.
      </p>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          detail={`${finance.kpis.orderCount} הזמנות`}
          icon={Landmark}
          label="Revenue"
          value={formatPrice(finance.kpis.revenue)}
        />
        <MetricCard
          detail={`${finance.kpis.capturedPaymentCount} תשלומים נקלטו`}
          icon={CreditCard}
          label="Captured"
          value={formatPrice(finance.kpis.capturedPayments)}
        />
        <MetricCard
          detail={`Rate ${formatPercent(finance.kpis.grossMarginRate)}`}
          icon={TrendingUp}
          label="Gross margin"
          value={formatPrice(finance.kpis.grossMargin)}
        />
        <MetricCard
          detail={`${finance.kpis.refundCount} refunds`}
          icon={ReceiptText}
          label="COGS / Refunds"
          value={`${formatPrice(finance.kpis.cogs)} / ${formatPrice(finance.kpis.refunds)}`}
        />
      </div>

      {vat ? (
        <Card className="mt-6 rounded-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Landmark aria-hidden="true" className="size-5" />
              דוח מע&quot;מ (סיכום תקופתי)
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm sm:grid-cols-4">
            <div className="grid gap-1">
              <span className="text-muted-foreground">מע&quot;מ עסקאות (פלט)</span>
              <span className="text-xl font-semibold">
                {formatPrice(vat.outputVat)}
              </span>
            </div>
            <div className="grid gap-1">
              <span className="text-muted-foreground">מע&quot;מ תשומות (קלט)</span>
              <span className="text-xl font-semibold">
                {formatPrice(vat.inputVat)}
              </span>
            </div>
            <div className="grid gap-1">
              <span className="text-muted-foreground">מע&quot;מ לתשלום (נטו)</span>
              <span className="text-xl font-semibold">
                {formatPrice(vat.netVatDue)}
              </span>
            </div>
            <div className="grid gap-1">
              <span className="text-muted-foreground">בסיס מכירות חייב</span>
              <span className="text-xl font-semibold">
                {formatPrice(vat.salesBase)}
              </span>
            </div>
            <p className="text-muted-foreground text-xs sm:col-span-4">
              סיכום ניהולי מתוך הספר הראשי — אינו דוח PCN874 / מבנה אחיד רשמי.
              לאימות מול רו&quot;ח.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {statements ? (
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <Card className="rounded-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp aria-hidden="true" className="size-5" />
                רווח והפסד (P&amp;L)
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">הכנסות</span>
                <span className="font-medium">
                  {formatPrice(statements.incomeStatement.revenue)}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">
                  הוצאות (COGS וכו&apos;)
                </span>
                <span className="font-medium">
                  {formatPrice(statements.incomeStatement.expenses)}
                </span>
              </div>
              <div className="flex justify-between gap-3 border-t pt-2">
                <span className="font-medium">רווח נקי</span>
                <span className="font-semibold">
                  {formatPrice(statements.incomeStatement.netIncome)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-md">
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <Landmark aria-hidden="true" className="size-5" />
                  מאזן (Balance Sheet)
                </span>
                <Badge
                  variant={
                    statements.balanceSheet.balanced
                      ? "secondary"
                      : "destructive"
                  }
                >
                  {statements.balanceSheet.balanced ? "מאוזן" : "לא מאוזן"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">נכסים</span>
                <span className="font-medium">
                  {formatPrice(statements.balanceSheet.assets)}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">התחייבויות</span>
                <span className="font-medium">
                  {formatPrice(statements.balanceSheet.liabilities)}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">הון</span>
                <span className="font-medium">
                  {formatPrice(statements.balanceSheet.equity)}
                </span>
              </div>
              <div className="flex justify-between gap-3 border-t pt-2">
                <span className="text-muted-foreground">
                  רווח נקי (טרם נסגר להון)
                </span>
                <span className="font-medium">
                  {formatPrice(statements.balanceSheet.netIncome)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {cashFlow ? (
        <Card className="mt-6 rounded-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet aria-hidden="true" className="size-5" />
              תזרים מזומנים (Cash Flow)
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm sm:grid-cols-4">
            <div className="grid gap-1">
              <span className="text-muted-foreground">פעילות שוטפת</span>
              <span className="text-xl font-semibold">
                {formatPrice(cashFlow.operating)}
              </span>
            </div>
            <div className="grid gap-1">
              <span className="text-muted-foreground">פעילות השקעה</span>
              <span className="text-xl font-semibold">
                {formatPrice(cashFlow.investing)}
              </span>
            </div>
            <div className="grid gap-1">
              <span className="text-muted-foreground">פעילות מימון</span>
              <span className="text-xl font-semibold">
                {formatPrice(cashFlow.financing)}
              </span>
            </div>
            <div className="grid gap-1">
              <span className="text-muted-foreground">שינוי נטו במזומן</span>
              <span className="text-xl font-semibold">
                {formatPrice(cashFlow.netChange)}
              </span>
            </div>
            <p className="text-muted-foreground text-xs sm:col-span-4">
              שיטה ישירה מתוך תנועות חשבון המזומן. פעילות השקעה תתמלא עם הוספת
              חשבונות רכוש קבוע.
            </p>
          </CardContent>
        </Card>
      ) : null}

      <Card className="mt-6 rounded-md">
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <Building2 aria-hidden="true" className="size-5" />
              רכוש קבוע ופחת (Fixed Assets)
            </span>
            <form action={runDepreciationAction}>
              <Button size="sm" type="submit" variant="outline">
                הרץ פחת לחודש הנוכחי
              </Button>
            </form>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
          <form action={createFixedAssetAction} className="grid gap-3">
            <p className="text-muted-foreground text-sm">
              היוון נכס ורישומו לספרים (Dr רכוש קבוע / Cr מזומן). פחת קו-ישר חודשי
              נרשם ל-GL (Dr הוצאות פחת / Cr פחת נצבר) ומופיע כפעילות השקעה בתזרים.
            </p>
            <Input name="name" placeholder="שם הנכס" required />
            <Input name="category" placeholder="קטגוריה (רשות)" />
            <div className="grid grid-cols-2 gap-2">
              <Input
                name="acquisitionCost"
                placeholder="עלות רכישה"
                step="0.01"
                type="number"
              />
              <Input
                name="salvageValue"
                placeholder="ערך גרט"
                step="0.01"
                type="number"
              />
            </div>
            <Input
              name="usefulLifeMonths"
              placeholder="אורך חיים (חודשים)"
              type="number"
            />
            <Button className="w-fit" type="submit">
              היוון נכס
            </Button>
          </form>

          <div className="grid gap-3">
            {fixedAssetsSummary ? (
              <div className="bg-muted/40 grid gap-3 rounded-md p-4 text-sm sm:grid-cols-4">
                <div className="grid gap-1">
                  <span className="text-muted-foreground">נכסים</span>
                  <span className="text-lg font-semibold">
                    {fixedAssetsSummary.count}
                  </span>
                </div>
                <div className="grid gap-1">
                  <span className="text-muted-foreground">עלות</span>
                  <span className="text-lg font-semibold">
                    {formatPrice(fixedAssetsSummary.totalCost)}
                  </span>
                </div>
                <div className="grid gap-1">
                  <span className="text-muted-foreground">פחת נצבר</span>
                  <span className="text-lg font-semibold">
                    {formatPrice(fixedAssetsSummary.totalAccumulated)}
                  </span>
                </div>
                <div className="grid gap-1">
                  <span className="text-muted-foreground">ערך בספרים</span>
                  <span className="text-lg font-semibold">
                    {formatPrice(fixedAssetsSummary.netBookValue)}
                  </span>
                </div>
              </div>
            ) : null}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>מס׳</TableHead>
                  <TableHead>שם</TableHead>
                  <TableHead className="text-left">עלות</TableHead>
                  <TableHead className="text-left">ערך בספרים</TableHead>
                  <TableHead>סטטוס</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {fixedAssets.length === 0 ? (
                  <TableEmptyRow
                    colSpan={6}
                    description="טרם הוונו נכסים קבועים."
                    icon={Building2}
                    title="אין נכסים"
                  />
                ) : (
                  fixedAssets.map((asset) => (
                    <TableRow key={asset.id}>
                      <TableCell className="whitespace-nowrap font-mono text-xs">
                        {asset.assetNumber}
                      </TableCell>
                      <TableCell className="text-sm">{asset.name}</TableCell>
                      <TableCell className="text-left">
                        {formatPrice(asset.acquisitionCost)}
                      </TableCell>
                      <TableCell className="text-left">
                        {formatPrice(asset.netBookValue)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            asset.status === "ACTIVE" ? "secondary" : "outline"
                          }
                        >
                          {fixedAssetStatusLabel[asset.status] ?? asset.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {asset.status === "ACTIVE" ? (
                          <form
                            action={disposeFixedAssetAction}
                            className="flex items-center gap-1"
                          >
                            <input
                              name="fixedAssetId"
                              type="hidden"
                              value={asset.id}
                            />
                            <Input
                              aria-label="תמורה"
                              className="h-8 w-24"
                              name="proceeds"
                              placeholder="תמורה"
                              step="0.01"
                              type="number"
                            />
                            <Button size="sm" type="submit" variant="ghost">
                              מימוש
                            </Button>
                          </form>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6 rounded-md">
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <Users aria-hidden="true" className="size-5" />
              כוח אדם ושכר (HR / Payroll)
            </span>
            <div className="flex items-center gap-2">
              {payrollSummary ? (
                <span className="text-muted-foreground text-sm font-normal">
                  {payrollSummary.headcount} עובדים ·{" "}
                  {formatPrice(payrollSummary.monthlyGross)} ברוטו/חודש
                </span>
              ) : null}
              <form action={runPayrollAction}>
                <Button size="sm" type="submit" variant="outline">
                  הרץ שכר לחודש הנוכחי
                </Button>
              </form>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
          <form action={createEmployeeAction} className="grid gap-3">
            <p className="text-muted-foreground text-sm">
              קליטת עובד. הרצת שכר חודשית רושמת ל-GL: Dr הוצאות שכר / Cr מזומן
              (נטו) / Cr ניכויים. שיעורי ניכוי להמחשה — לא שכר סטטוטורי.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Input name="firstName" placeholder="שם פרטי" required />
              <Input name="lastName" placeholder="שם משפחה" required />
            </div>
            <Input name="role" placeholder="תפקיד (רשות)" />
            <Input name="department" placeholder="מחלקה (רשות)" />
            <Input
              name="monthlyGross"
              placeholder="שכר חודשי ברוטו"
              step="0.01"
              type="number"
            />
            <Button className="w-fit" type="submit">
              קלוט עובד
            </Button>
          </form>

          <div className="grid gap-2">
            <span className="text-muted-foreground text-sm">
              עובדים
              {payrollSummary?.lastRun
                ? ` · שכר אחרון ${payrollSummary.lastRun.period}: ${formatPrice(payrollSummary.lastRun.netTotal)} נטו`
                : ""}
            </span>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>מס׳</TableHead>
                  <TableHead>שם</TableHead>
                  <TableHead>תפקיד</TableHead>
                  <TableHead className="text-left">שכר ברוטו</TableHead>
                  <TableHead>סטטוס</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.length === 0 ? (
                  <TableEmptyRow
                    colSpan={5}
                    description="טרם נקלטו עובדים."
                    icon={Users}
                    title="אין עובדים"
                  />
                ) : (
                  employees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell className="whitespace-nowrap font-mono text-xs">
                        {employee.employeeNumber}
                      </TableCell>
                      <TableCell className="text-sm">{employee.name}</TableCell>
                      <TableCell className="text-sm">
                        {employee.role ?? "—"}
                      </TableCell>
                      <TableCell className="text-left">
                        {formatPrice(employee.monthlyGross)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            employee.status === "ACTIVE"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {employee.status === "ACTIVE" ? "פעיל" : "סיים"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6 rounded-md">
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <ReceiptText aria-hidden="true" className="size-5" />
              ניהול הוצאות (Expenses)
            </span>
            {expenseSummary ? (
              <span className="text-muted-foreground text-sm font-normal">
                {expenseSummary.pendingCount} ממתינות ·{" "}
                {formatPrice(expenseSummary.pendingTotal)}
              </span>
            ) : null}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
          <form action={createExpenseClaimAction} className="grid gap-3">
            <p className="text-muted-foreground text-sm">
              בקשת החזר הוצאה. אישור רושם ל-GL: Dr הוצאות תפעוליות / Cr מזומן.
            </p>
            <Input name="description" placeholder="תיאור ההוצאה" required />
            <div className="grid grid-cols-2 gap-2">
              <Input name="category" placeholder="קטגוריה" />
              <Input
                name="amount"
                placeholder="סכום"
                step="0.01"
                type="number"
              />
            </div>
            <select
              aria-label="עובד"
              autoComplete="off"
              className="glass-control h-10 rounded-md border px-3 text-sm"
              defaultValue=""
              name="employeeId"
            >
              <option value="">ללא עובד משויך</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name}
                </option>
              ))}
            </select>
            <Button className="w-fit" type="submit">
              הגש בקשה
            </Button>
          </form>

          <div className="grid gap-2">
            <span className="text-muted-foreground text-sm">בקשות אחרונות</span>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>מס׳</TableHead>
                  <TableHead>תיאור</TableHead>
                  <TableHead className="text-left">סכום</TableHead>
                  <TableHead>סטטוס</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenseClaims.length === 0 ? (
                  <TableEmptyRow
                    colSpan={5}
                    description="טרם הוגשו בקשות הוצאה."
                    icon={ReceiptText}
                    title="אין בקשות"
                  />
                ) : (
                  expenseClaims.map((claim) => (
                    <TableRow key={claim.id}>
                      <TableCell className="whitespace-nowrap font-mono text-xs">
                        {claim.claimNumber}
                      </TableCell>
                      <TableCell className="max-w-[12rem] truncate text-sm">
                        {claim.description}
                      </TableCell>
                      <TableCell className="text-left">
                        {formatPrice(claim.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            expenseStatusVariant[claim.status] ?? "outline"
                          }
                        >
                          {expenseStatusLabel[claim.status] ?? claim.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {claim.status === "SUBMITTED" ? (
                          <div className="flex gap-1">
                            <form action={approveExpenseClaimAction}>
                              <input
                                name="claimId"
                                type="hidden"
                                value={claim.id}
                              />
                              <Button size="sm" type="submit" variant="outline">
                                אשר
                              </Button>
                            </form>
                            <form action={rejectExpenseClaimAction}>
                              <input
                                name="claimId"
                                type="hidden"
                                value={claim.id}
                              />
                              <Button size="sm" type="submit" variant="ghost">
                                דחה
                              </Button>
                            </form>
                          </div>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {budget ? (
        <Card className="mt-6 rounded-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp aria-hidden="true" className="size-5" />
              תקצוב מול ביצוע — {budget.period} (Budget vs Actual)
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
            <form action={setBudgetAction} className="grid gap-3">
              <p className="text-muted-foreground text-sm">
                הגדרת תקציב לחשבון בתקופה. הביצוע נגזר מהספר הראשי לאותו חודש.
              </p>
              <Input
                defaultValue={budget.period}
                name="period"
                placeholder="YYYY-MM"
                type="month"
              />
              <select
                aria-label="חשבון"
                autoComplete="off"
                className="glass-control h-10 rounded-md border px-3 text-sm"
                defaultValue=""
                name="accountCode"
                required
              >
                <option disabled value="">
                  בחר חשבון…
                </option>
                {ledgerAccounts.map((account) => (
                  <option key={account.code} value={account.code}>
                    {account.code} · {account.name}
                  </option>
                ))}
              </select>
              <Input
                name="amount"
                placeholder="סכום תקציב"
                step="0.01"
                type="number"
              />
              <Button className="w-fit" type="submit">
                שמור תקציב
              </Button>
            </form>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>חשבון</TableHead>
                  <TableHead className="text-left">תקציב</TableHead>
                  <TableHead className="text-left">ביצוע</TableHead>
                  <TableHead className="text-left">סטייה</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {budget.lines.length === 0 ? (
                  <TableEmptyRow
                    colSpan={4}
                    description="טרם הוגדרו תקציבים לחודש זה."
                    icon={TrendingUp}
                    title="אין תקציב"
                  />
                ) : (
                  budget.lines.map((line) => (
                    <TableRow key={line.accountCode}>
                      <TableCell className="text-sm">
                        {line.accountName}
                      </TableCell>
                      <TableCell className="text-left">
                        {formatPrice(line.budget)}
                      </TableCell>
                      <TableCell className="text-left">
                        {formatPrice(line.actual)}
                      </TableCell>
                      <TableCell className="text-left">
                        <span
                          className={
                            line.variance > 0
                              ? "text-destructive"
                              : "text-muted-foreground"
                          }
                        >
                          {formatPrice(line.variance)}
                          {line.variancePct !== null
                            ? ` (${line.variancePct}%)`
                            : ""}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}

      <Card className="mt-6 rounded-md">
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <Landmark aria-hidden="true" className="size-5" />
              תרשים חשבונות (Chart of Accounts)
            </span>
            <form action={seedChartAction}>
              <Button size="sm" type="submit" variant="outline">
                אתחל תרשים ברירת מחדל
              </Button>
            </form>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
          <form action={createLedgerAccountAction} className="grid gap-3">
            <p className="text-muted-foreground text-sm">
              הוספת חשבון מותאם לספר הראשי. צד טבעי נגזר מהסוג. קוד = 3–5 ספרות.
            </p>
            <Input name="code" placeholder="קוד (לדוגמה 1600)" required />
            <Input name="name" placeholder="שם החשבון" required />
            <select
              aria-label="סוג"
              autoComplete="off"
              className="glass-control h-10 rounded-md border px-3 text-sm"
              defaultValue="ASSET"
              name="type"
            >
              <option value="ASSET">נכס (ASSET)</option>
              <option value="LIABILITY">התחייבות (LIABILITY)</option>
              <option value="EQUITY">הון (EQUITY)</option>
              <option value="REVENUE">הכנסה (REVENUE)</option>
              <option value="EXPENSE">הוצאה (EXPENSE)</option>
            </select>
            <Button className="w-fit" type="submit">
              צור חשבון
            </Button>
          </form>

          <div className="grid gap-2">
            <span className="text-muted-foreground text-sm">
              {chartAccounts.length} חשבונות
            </span>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>קוד</TableHead>
                  <TableHead>שם</TableHead>
                  <TableHead>סוג</TableHead>
                  <TableHead className="text-left">יתרה</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {chartAccounts.length === 0 ? (
                  <TableEmptyRow
                    colSpan={4}
                    description="התרשים ריק — אתחל את ברירת המחדל."
                    icon={Landmark}
                    title="אין חשבונות"
                  />
                ) : (
                  chartAccounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell className="font-mono text-xs">
                        {account.code}
                      </TableCell>
                      <TableCell className="text-sm">{account.name}</TableCell>
                      <TableCell className="text-xs">{account.type}</TableCell>
                      <TableCell className="text-left">
                        {formatPrice(account.balance)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6 rounded-md">
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <Repeat aria-hidden="true" className="size-5" />
              מנויים וחיוב מתגלגל (Subscriptions)
            </span>
            <div className="flex items-center gap-2">
              {subscriptionSummary ? (
                <span className="text-muted-foreground text-sm font-normal">
                  {subscriptionSummary.activeCount} פעילים · MRR{" "}
                  {formatPrice(subscriptionSummary.mrr)}
                </span>
              ) : null}
              <form action={runSubscriptionBillingAction}>
                <Button size="sm" type="submit" variant="outline">
                  הרץ חיוב
                </Button>
              </form>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
          <div className="grid gap-5">
            <form action={createSubscriptionPlanAction} className="grid gap-2">
              <p className="text-muted-foreground text-sm">
                הרצת חיוב מנפיקה חשבונית AR לכל מנוי פעיל שמועד חיובו הגיע (הכנסה
                ל-GL).
              </p>
              <Input name="key" placeholder="מפתח תוכנית (vip-monthly)" required />
              <Input name="name" placeholder="שם התוכנית" required />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  name="amount"
                  placeholder="סכום"
                  step="0.01"
                  type="number"
                />
                <select
                  aria-label="מחזור"
                  autoComplete="off"
                  className="glass-control h-10 rounded-md border px-3 text-sm"
                  defaultValue="MONTHLY"
                  name="interval"
                >
                  <option value="MONTHLY">חודשי</option>
                  <option value="YEARLY">שנתי</option>
                </select>
              </div>
              <Button className="w-fit" size="sm" type="submit">
                צור תוכנית
              </Button>
            </form>

            <form action={subscribeAction} className="grid gap-2 border-t pt-4">
              <select
                aria-label="תוכנית"
                autoComplete="off"
                className="glass-control h-10 rounded-md border px-3 text-sm"
                defaultValue=""
                name="planId"
                required
              >
                <option disabled value="">
                  בחר תוכנית…
                </option>
                {subscriptionPlans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name} · {formatPrice(Number(plan.amount))}
                  </option>
                ))}
              </select>
              <Button className="w-fit" size="sm" type="submit">
                צרף מנוי
              </Button>
            </form>
          </div>

          <div className="grid gap-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>תוכנית</TableHead>
                  <TableHead className="text-left">סכום</TableHead>
                  <TableHead>חיוב הבא</TableHead>
                  <TableHead>סטטוס</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptions.length === 0 ? (
                  <TableEmptyRow
                    colSpan={5}
                    description="טרם נוצרו מנויים."
                    icon={Repeat}
                    title="אין מנויים"
                  />
                ) : (
                  subscriptions.map((subscription) => (
                    <TableRow key={subscription.id}>
                      <TableCell className="text-sm">
                        {subscription.planName}
                      </TableCell>
                      <TableCell className="text-left">
                        {formatPrice(subscription.amount)}
                      </TableCell>
                      <TableCell className="text-xs">
                        {formatHebrewDate(subscription.nextBillingAt)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            subscription.status === "ACTIVE"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {subscriptionStatusLabel[subscription.status] ??
                            subscription.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {subscription.status === "ACTIVE" ? (
                          <form action={cancelSubscriptionAction}>
                            <input
                              name="subscriptionId"
                              type="hidden"
                              value={subscription.id}
                            />
                            <Button size="sm" type="submit" variant="ghost">
                              בטל
                            </Button>
                          </form>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6 rounded-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock aria-hidden="true" className="size-5" />
            סגירת תקופה (Period Close)
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 lg:grid-cols-[1fr_1fr]">
          <div className="grid gap-3">
            <p className="text-muted-foreground text-sm">
              סגירת חודש מייצרת תנועת סגירה שמאפסת הכנסות והוצאות לעודפים, ונועלת
              את התקופה מפני רישומים נוספים. לא ניתן לבטל סגירה למעט בתנועת היפוך.
            </p>
            {closeSummary ? (
              <div className="bg-muted/40 grid gap-2 rounded-md p-4 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium">
                    תקופת יעד: {closeSummary.month}/{closeSummary.year}
                  </span>
                  <Badge
                    variant={
                      closeSummary.status === "CLOSED" ? "secondary" : "outline"
                    }
                  >
                    {closeSummary.status === "CLOSED" ? "סגורה" : "פתוחה"}
                  </Badge>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">הכנסות בתקופה</span>
                  <span>{formatPrice(closeSummary.revenue)}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">הוצאות בתקופה</span>
                  <span>{formatPrice(closeSummary.expenses)}</span>
                </div>
                <div className="flex justify-between gap-3 border-t pt-2">
                  <span className="font-medium">רווח נקי לסגירה</span>
                  <span className="font-semibold">
                    {formatPrice(closeSummary.netIncome)}
                  </span>
                </div>
                {closeSummary.status === "CLOSED" ? (
                  <p className="text-muted-foreground text-xs">
                    התקופה כבר נסגרה
                    {closeSummary.closedAt
                      ? ` בתאריך ${formatHebrewDate(closeSummary.closedAt)}`
                      : ""}
                    .
                  </p>
                ) : (
                  <form action={closePeriodAction} className="mt-1">
                    <input name="year" type="hidden" value={closeSummary.year} />
                    <input
                      name="month"
                      type="hidden"
                      value={closeSummary.month}
                    />
                    <Button className="w-full" type="submit">
                      סגור תקופה {closeSummary.month}/{closeSummary.year}
                    </Button>
                  </form>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                אין נתוני תקופה זמינים כעת.
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <span className="text-muted-foreground text-sm">תקופות אחרונות</span>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>תקופה</TableHead>
                  <TableHead>סטטוס</TableHead>
                  <TableHead>נסגרה</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fiscalPeriods.length === 0 ? (
                  <TableEmptyRow
                    colSpan={3}
                    description="טרם נסגרו תקופות חשבונאיות."
                    icon={Lock}
                    title="אין תקופות"
                  />
                ) : (
                  fiscalPeriods.map((period) => (
                    <TableRow key={period.id}>
                      <TableCell>
                        {period.month}/{period.year}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            period.status === "CLOSED" ? "secondary" : "outline"
                          }
                        >
                          {period.status === "CLOSED" ? "סגורה" : "פתוחה"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {period.closedAt
                          ? formatHebrewDate(period.closedAt)
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6 rounded-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ReceiptText aria-hidden="true" className="size-5" />
            תנועת יומן ידנית (Manual Journal Entry)
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 lg:grid-cols-[1fr_1fr]">
          <form action={postManualJournalEntryAction} className="grid gap-3">
            <p className="text-muted-foreground text-sm">
              רישום ידני לספר הראשי (התאמות, הפרשות, יתרות פתיחה, הון). חובה = זכות
              אחרת הרישום נדחה. שורה לכל חשבון בפורמט{" "}
              <code>קוד חשבון | חובה | זכות</code>.
            </p>
            <div className="grid gap-1.5">
              <label className="text-sm font-medium" htmlFor="je-date">
                תאריך (ברירת מחדל: היום)
              </label>
              <Input id="je-date" name="entryDate" type="date" />
            </div>
            <div className="grid gap-1.5">
              <label className="text-sm font-medium" htmlFor="je-memo">
                תיאור
              </label>
              <Input
                id="je-memo"
                name="memo"
                placeholder="לדוגמה: הפרשה לחופשה"
              />
            </div>
            {entityOptions.length > 0 ? (
              <div className="grid gap-1.5">
                <label className="text-sm font-medium" htmlFor="je-entity">
                  ישות (ברירת מחדל: ישות הבסיס)
                </label>
                <select
                  autoComplete="off"
                  className="glass-control h-10 rounded-md border px-3 text-sm"
                  defaultValue=""
                  id="je-entity"
                  name="entityId"
                >
                  <option value="">ישות הבסיס</option>
                  {entityOptions.map((entity) => (
                    <option key={entity.id} value={entity.id}>
                      {entity.code} · {entity.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
            <div className="grid gap-1.5">
              <label className="text-sm font-medium" htmlFor="je-lines">
                שורות
              </label>
              <Textarea
                className="font-mono"
                id="je-lines"
                name="lines"
                placeholder={"1000 | 500 | 0\n3000 | 0 | 500"}
                rows={4}
              />
            </div>
            <Button className="w-fit" type="submit">
              רשום תנועה
            </Button>
          </form>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <span className="text-muted-foreground text-sm">
                חשבונות זמינים
              </span>
              <div className="flex flex-wrap gap-1.5">
                {ledgerAccounts.map((account) => (
                  <Badge
                    className="font-normal"
                    key={account.code}
                    variant="outline"
                  >
                    {account.code} · {account.name}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="grid gap-2">
              <span className="text-muted-foreground text-sm">
                תנועות אחרונות
              </span>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>מס׳</TableHead>
                    <TableHead>תיאור</TableHead>
                    <TableHead>מקור</TableHead>
                    <TableHead className="text-left">סכום</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentEntries.length === 0 ? (
                    <TableEmptyRow
                      colSpan={4}
                      description="טרם נרשמו תנועות יומן."
                      icon={ReceiptText}
                      title="אין תנועות"
                    />
                  ) : (
                    recentEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="whitespace-nowrap font-mono text-xs">
                          {entry.entryNumber}
                        </TableCell>
                        <TableCell className="max-w-[14rem] truncate">
                          {entry.memo ?? "—"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              entry.status === "REVERSED"
                                ? "destructive"
                                : "outline"
                            }
                          >
                            {journalSourceLabel[entry.source] ?? entry.source}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-left">
                          {formatPrice(entry.amount)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6 rounded-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Banknote aria-hidden="true" className="size-5" />
            התאמת בנק (Bank Reconciliation)
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
          <div className="grid gap-3">
            <form action={importBankStatementAction} className="grid gap-2">
              <p className="text-muted-foreground text-sm">
                ייבוא דף בנק כ-CSV: שורה לכל תנועה בפורמט{" "}
                <code>תאריך,תיאור,סכום,אסמכתא</code> (סכום חיובי = זכות/הפקדה,
                שלילי = חובה/משיכה).
              </p>
              <Textarea
                className="font-mono"
                name="csv"
                placeholder={"2026-06-01,תקבול,1180,REF1\n2026-06-03,תשלום ספק,-400"}
                rows={4}
              />
              <Button className="w-fit" type="submit">
                ייבא שורות
              </Button>
            </form>

            {reconciliation ? (
              <div className="bg-muted/40 grid gap-2 rounded-md p-4 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">
                    יתרת מזומן בספרים
                  </span>
                  <span>{formatPrice(reconciliation.glCashBalance)}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">יתרת דף הבנק</span>
                  <span>{formatPrice(reconciliation.statementBalance)}</span>
                </div>
                <div className="flex items-center justify-between gap-3 border-t pt-2">
                  <span className="font-medium">הפרש</span>
                  <Badge
                    variant={
                      Math.abs(reconciliation.difference) < 0.005
                        ? "secondary"
                        : "destructive"
                    }
                  >
                    {formatPrice(reconciliation.difference)}
                  </Badge>
                </div>
                <div className="text-muted-foreground text-xs">
                  {reconciliation.matched} הותאמו · {reconciliation.unmatched}{" "}
                  ללא התאמה · {reconciliation.ignored} נוטרלו
                </div>
                <form action={autoMatchBankStatementAction} className="mt-1">
                  <Button className="w-full" type="submit" variant="outline">
                    התאמה אוטומטית מול הספר
                  </Button>
                </form>
              </div>
            ) : null}
          </div>

          <div className="grid gap-2">
            <span className="text-muted-foreground text-sm">שורות דף הבנק</span>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>תאריך</TableHead>
                  <TableHead>תיאור</TableHead>
                  <TableHead className="text-left">סכום</TableHead>
                  <TableHead>סטטוס</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {bankLines.length === 0 ? (
                  <TableEmptyRow
                    colSpan={5}
                    description="ייבא דף בנק כדי להתחיל בהתאמה."
                    icon={Banknote}
                    title="אין שורות"
                  />
                ) : (
                  bankLines.map((line) => (
                    <TableRow key={line.id}>
                      <TableCell className="whitespace-nowrap">
                        {formatHebrewDate(line.statementDate)}
                      </TableCell>
                      <TableCell className="max-w-[12rem] truncate">
                        {line.description}
                      </TableCell>
                      <TableCell className="text-left">
                        {formatPrice(line.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={bankStatusVariant[line.status] ?? "outline"}>
                          {bankStatusLabel[line.status] ?? line.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {line.status === "UNMATCHED" ? (
                          <form action={ignoreBankStatementLineAction}>
                            <input name="lineId" type="hidden" value={line.id} />
                            <Button size="sm" type="submit" variant="ghost">
                              נטרל
                            </Button>
                          </form>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <Card className="rounded-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ReceiptText aria-hidden="true" className="size-5" />
              Ledger
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table className="min-w-[840px]">
              <TableHeader>
                <TableRow>
                  <TableHead>תאריך</TableHead>
                  <TableHead>סוג</TableHead>
                  <TableHead>קטגוריה</TableHead>
                  <TableHead>מקור</TableHead>
                  <TableHead>Debit</TableHead>
                  <TableHead>Credit</TableHead>
                  <TableHead>תיאור</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {finance.ledgerEntries.length === 0 ? (
                  <TableEmptyRow
                    colSpan={7}
                    description="Ledger יופיע לאחר סנכרון תשלומים/הזמנות."
                    icon={ReceiptText}
                    title="אין ledger entries"
                  />
                ) : (
                  finance.ledgerEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{formatHebrewDate(entry.entryDate)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{entry.type}</Badge>
                      </TableCell>
                      <TableCell>{entry.category}</TableCell>
                      <TableCell>{entry.source}</TableCell>
                      <TableCell>
                        {entry.debit == null ? "-" : formatPrice(entry.debit)}
                      </TableCell>
                      <TableCell>
                        {entry.credit == null ? "-" : formatPrice(entry.credit)}
                      </TableCell>
                      <TableCell>{entry.description ?? "-"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="rounded-md">
          <CardHeader>
            <CardTitle>Top orders</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            {finance.topOrders.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                אין הזמנות בטווח הנבחר.
              </p>
            ) : (
              finance.topOrders.map((order) => (
                <div className="rounded-md border p-3" key={order.id}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{order.orderNumber}</p>
                    <Badge variant="secondary">
                      {formatPrice(order.total)}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground mt-1 text-sm">
                    COGS {formatPrice(order.cogs)} · margin{" "}
                    {formatPrice(order.grossMargin)} ·{" "}
                    {formatHebrewDateTime(order.createdAt)}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {gl ? (
        <div className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          <Card className="rounded-md">
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2">
                <Landmark aria-hidden="true" className="size-5" />
                מאזן בוחן (Trial Balance)
              </CardTitle>
              <Badge
                variant={
                  gl.trialBalance.balanced ? "secondary" : "destructive"
                }
              >
                {gl.trialBalance.balanced ? "מאוזן" : "לא מאוזן"}
              </Badge>
            </CardHeader>
            <CardContent>
              <Table className="min-w-[560px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>חשבון</TableHead>
                    <TableHead>Debit</TableHead>
                    <TableHead>Credit</TableHead>
                    <TableHead>יתרה</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gl.trialBalance.rows.length === 0 ? (
                    <TableEmptyRow
                      colSpan={4}
                      description="רישומי יומן יופיעו לאחר מכירות וקליטות סחורה."
                      icon={ReceiptText}
                      title="אין תנועות GL"
                    />
                  ) : (
                    gl.trialBalance.rows.map((row) => (
                      <TableRow key={row.accountId}>
                        <TableCell className="font-medium">
                          {row.code} · {row.name}
                        </TableCell>
                        <TableCell>{formatPrice(row.debit)}</TableCell>
                        <TableCell>{formatPrice(row.credit)}</TableCell>
                        <TableCell>{formatPrice(row.balance)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              {gl.trialBalance.rows.length > 0 ? (
                <p className="text-muted-foreground mt-3 text-sm">
                  סה״כ Debit {formatPrice(gl.trialBalance.totalDebit)} · Credit{" "}
                  {formatPrice(gl.trialBalance.totalCredit)}
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card className="rounded-md">
            <CardHeader>
              <CardTitle>גיול AP / AR ושווי מלאי</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm">
              <div className="rounded-md border p-3">
                <p className="font-medium">ספקים (AP) — לתשלום</p>
                <p className="text-muted-foreground mt-1 leading-6">
                  סה״כ פתוח {formatPrice(gl.apAging.total)} · באיחור 90+{" "}
                  {formatPrice(gl.apAging.days90plus)}
                </p>
              </div>
              <div className="rounded-md border p-3">
                <p className="font-medium">לקוחות (AR) — לגבייה</p>
                <p className="text-muted-foreground mt-1 leading-6">
                  סה״כ פתוח {formatPrice(gl.arAging.total)} · באיחור 90+{" "}
                  {formatPrice(gl.arAging.days90plus)}
                </p>
              </div>
              <div className="rounded-md border p-3">
                <p className="font-medium">שווי מלאי ({gl.inventoryValuation.method})</p>
                <p className="text-muted-foreground mt-1 leading-6">
                  {formatPrice(gl.inventoryValuation.totalValue)} ·{" "}
                  {gl.inventoryValuation.onHandUnits} יח׳ במלאי
                  {gl.inventoryValuation.uncostedItems > 0
                    ? ` · ${gl.inventoryValuation.uncostedItems} ללא בסיס עלות`
                    : ""}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {gl && gl.entries.length > 0 ? (
        <Card className="mt-6 rounded-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ReceiptText aria-hidden="true" className="size-5" />
              תנועות יומן אחרונות (Journal Entries)
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            {gl.entries.map((entry) => (
              <div className="rounded-md border p-3" key={entry.id}>
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">
                    {entry.entryNumber} · {entry.memo ?? entry.source}
                  </p>
                  <Badge variant="outline">
                    {formatHebrewDate(entry.entryDate)}
                  </Badge>
                </div>
                <div className="text-muted-foreground mt-2 grid gap-0.5 text-xs">
                  {entry.lines.map((line) => (
                    <div
                      className="flex justify-between gap-3"
                      key={`${entry.id}-${line.code}-${line.debit}-${line.credit}`}
                    >
                      <span>
                        {line.code} · {line.name}
                      </span>
                      <span>
                        {line.debit > 0
                          ? `חובה ${formatPrice(line.debit)}`
                          : `זכות ${formatPrice(line.credit)}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <Card className="mt-6 rounded-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet aria-hidden="true" className="size-5" />
            חשבונות לגבייה (AR)
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <form action={createCustomerInvoiceAction} className="grid gap-2">
            <div className="grid gap-2 sm:grid-cols-[1fr_180px]">
              <Input name="customerId" placeholder="מזהה לקוח (אופציונלי)" />
              <Input aria-label="לתשלום עד" name="dueDate" type="date" />
            </div>
            <Textarea
              name="lines"
              placeholder="שורה לכל פריט: תיאור | כמות | מחיר"
              rows={3}
            />
            <Button className="w-fit" type="submit">
              צור חשבונית לקוח
            </Button>
          </form>

          <Table className="min-w-[820px]">
            <TableHeader>
              <TableRow>
                <TableHead>חשבונית</TableHead>
                <TableHead>לקוח</TableHead>
                <TableHead>סטטוס</TableHead>
                <TableHead>סה״כ</TableHead>
                <TableHead>יתרה</TableHead>
                <TableHead>פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customerInvoices.length === 0 ? (
                <TableEmptyRow
                  colSpan={6}
                  description="חשבוניות לקוח שתיצרו יופיעו כאן להנפקה (→ הכנסה/לקוחות) ולתקבול."
                  icon={Wallet}
                  title="אין חשבוניות לקוח"
                />
              ) : (
                customerInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">
                      {invoice.invoiceNumber}
                    </TableCell>
                    <TableCell>{invoice.customerName}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          customerInvoiceStatusVariant[invoice.status] ??
                          "outline"
                        }
                      >
                        {customerInvoiceStatusLabel[invoice.status] ??
                          invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatPrice(invoice.total)}</TableCell>
                    <TableCell>{formatPrice(invoice.outstanding)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-2">
                        <form action={issueCustomerInvoiceAction}>
                          <input
                            name="invoiceId"
                            type="hidden"
                            value={invoice.id}
                          />
                          <Button size="sm" type="submit" variant="outline">
                            הנפק
                          </Button>
                        </form>
                        <form
                          action={recordCustomerReceiptAction}
                          className="flex items-center gap-1"
                        >
                          <input
                            name="invoiceId"
                            type="hidden"
                            value={invoice.id}
                          />
                          <input
                            name="customerId"
                            type="hidden"
                            value={invoice.customerId ?? ""}
                          />
                          <Input
                            aria-label="סכום תקבול"
                            className="h-8 w-24"
                            defaultValue={
                              invoice.outstanding > 0
                                ? String(invoice.outstanding)
                                : ""
                            }
                            inputMode="numeric"
                            name="amount"
                          />
                          <Button size="sm" type="submit">
                            תקבול
                          </Button>
                        </form>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="mt-6 rounded-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Repeat aria-hidden="true" className="size-5" />
            רב-מטבעיות והפרשי שער (FX)
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 lg:grid-cols-[1fr_1.6fr]">
          <form action={setExchangeRateAction} className="grid gap-2">
            <p className="text-muted-foreground text-sm">
              שער אל בסיס (ILS) לכל מטבע, effective-dated. הערכת שווי מחדש
              מציגה הפרשי-שער לא-ממומשים על יתרות מטבע-חוץ פתוחות. שערים ידניים
              — לאמת מול מקור מוסמך.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Input dir="ltr" name="currency" placeholder="מטבע (USD)" required />
              <Input
                dir="ltr"
                min="0"
                name="rateToBase"
                placeholder="שער ל-ILS"
                step="0.0001"
                type="number"
              />
            </div>
            <Input defaultValue={currentYmd} name="effectiveDate" type="date" />
            <Button className="w-fit" size="sm" type="submit">
              עדכן שער
            </Button>
            <p className="text-muted-foreground text-xs">
              {'סה"כ הפרשי-שער לא-ממומשים:'}{" "}
              {formatPrice(revaluation.totalUnrealized)}
            </p>
          </form>

          <div className="grid gap-4">
            <div className="flex flex-wrap gap-2">
              {exchangeRates.length === 0 ? (
                <span className="text-muted-foreground text-sm">
                  טרם הוזנו שערים.
                </span>
              ) : (
                exchangeRates.map((rate) => (
                  <Badge key={rate.id} variant="outline">
                    <span dir="ltr">
                      {rate.currency} {rate.rateToBase} ·{" "}
                      {rate.effectiveDate.toISOString().slice(0, 10)}
                    </span>
                  </Badge>
                ))
              )}
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>מסמך</TableHead>
                  <TableHead>{'מט"ח'}</TableHead>
                  <TableHead>שווי נוכחי</TableHead>
                  <TableHead>הפרש</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {revaluation.lines.length === 0 ? (
                  <TableEmptyRow
                    colSpan={4}
                    description="אין יתרות מט''ח פתוחות להערכה."
                    icon={Repeat}
                    title="אין מט''ח"
                  />
                ) : (
                  revaluation.lines.map((line) => (
                    <TableRow key={`${line.kind}-${line.reference}`}>
                      <TableCell className="text-sm">
                        {line.reference}
                        <Badge className="mr-2" variant="outline">
                          {line.kind}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm" dir="ltr">
                        {line.foreignOutstanding} {line.currency}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatPrice(line.currentBase)}
                      </TableCell>
                      <TableCell className="text-sm">
                        <Badge
                          variant={line.unrealized < 0 ? "destructive" : "secondary"}
                        >
                          {formatPrice(line.unrealized)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6 rounded-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Banknote aria-hidden="true" className="size-5" />
            גבייה (Dunning)
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <p className="text-muted-foreground text-sm">
            חשבוניות לקוח באיחור לפי רמת הסלמה. {dunningSummary.overdueCount}{" "}
            באיחור · {formatPrice(dunningSummary.overdueTotal)} · {" "}
            {dunningSummary.escalations} בהסלמה. תיעוד פנייה בלבד (שליחת אימייל —
            בהמשך, מותנה בספק).
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>חשבונית / לקוח</TableHead>
                <TableHead>יתרה</TableHead>
                <TableHead>איחור</TableHead>
                <TableHead>רמה</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {dunningWorklist.length === 0 ? (
                <TableEmptyRow
                  colSpan={5}
                  description="אין חשבוניות באיחור."
                  icon={Banknote}
                  title="אין פיגורים"
                />
              ) : (
                dunningWorklist.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-sm">
                      <div className="font-medium">{entry.invoiceNumber}</div>
                      <div className="text-muted-foreground text-xs">
                        {entry.customerLabel}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatPrice(entry.outstanding)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {entry.daysOverdue} ימים
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={entry.level >= 3 ? "destructive" : "outline"}
                      >
                        רמה {entry.level}
                        {entry.lastContactLevel != null
                          ? ` (נוצר: ${entry.lastContactLevel})`
                          : ""}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {entry.customerEmail ? (
                          <form action={sendDunningReminderAction}>
                            <input
                              name="customerInvoiceId"
                              type="hidden"
                              value={entry.id}
                            />
                            <Button size="sm" type="submit" variant="outline">
                              שלח תזכורת
                            </Button>
                          </form>
                        ) : null}
                        <form action={recordDunningContactAction}>
                          <input
                            name="customerInvoiceId"
                            type="hidden"
                            value={entry.id}
                          />
                          <input name="level" type="hidden" value={entry.level} />
                          <Button size="sm" type="submit" variant="ghost">
                            תעד פנייה
                          </Button>
                        </form>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="mt-6 rounded-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench aria-hidden="true" className="size-5" />
            תחזוקת נכסים (PM)
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 lg:grid-cols-[1fr_1.6fr]">
          <form action={createMaintenanceScheduleAction} className="grid gap-2">
            <p className="text-muted-foreground text-sm">
              תחזוקה מונעת חוזרת לנכס. {maintenanceSummary.overdue} באיחור ·{" "}
              {maintenanceSummary.dueSoon} מתקרבים.
            </p>
            <select
              aria-label="נכס"
              autoComplete="off"
              className="glass-control h-10 rounded-md border px-3 text-sm"
              defaultValue=""
              name="fixedAssetId"
              required
            >
              <option disabled value="">
                בחר נכס…
              </option>
              {maintenanceAssets.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.label}
                </option>
              ))}
            </select>
            <Input name="title" placeholder="כותרת (למשל טיפול תקופתי)" required />
            <Input
              min="1"
              name="intervalDays"
              placeholder="מרווח (ימים)"
              type="number"
            />
            <Button className="w-fit" size="sm" type="submit">
              צור תזמון
            </Button>
          </form>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>נכס / משימה</TableHead>
                <TableHead>הבא</TableHead>
                <TableHead>מצב</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {maintenanceSchedules.length === 0 ? (
                <TableEmptyRow
                  colSpan={4}
                  description="טרם הוגדרו תזמוני תחזוקה."
                  icon={Wrench}
                  title="אין תזמונים"
                />
              ) : (
                maintenanceSchedules.map((schedule) => (
                  <TableRow key={schedule.id}>
                    <TableCell className="text-sm">
                      <div className="font-medium">{schedule.title}</div>
                      <div className="text-muted-foreground text-xs">
                        {schedule.assetLabel} · כל {schedule.intervalDays} ימים
                      </div>
                    </TableCell>
                    <TableCell className="text-xs" dir="ltr">
                      {schedule.nextDueAt.toISOString().slice(0, 10)}
                    </TableCell>
                    <TableCell>
                      {schedule.status === "PAUSED" ? (
                        <Badge variant="outline">מושהה</Badge>
                      ) : (
                        <Badge
                          variant={
                            maintenanceDueMeta[schedule.due]?.variant ?? "outline"
                          }
                        >
                          {maintenanceDueMeta[schedule.due]?.label ?? schedule.due}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <form action={recordMaintenanceAction}>
                          <input name="scheduleId" type="hidden" value={schedule.id} />
                          <Button size="sm" type="submit" variant="outline">
                            בוצע
                          </Button>
                        </form>
                        <form action={toggleMaintenanceScheduleAction}>
                          <input name="scheduleId" type="hidden" value={schedule.id} />
                          <input
                            name="status"
                            type="hidden"
                            value={schedule.status === "ACTIVE" ? "PAUSED" : "ACTIVE"}
                          />
                          <Button size="sm" type="submit" variant="ghost">
                            {schedule.status === "ACTIVE" ? "השהה" : "הפעל"}
                          </Button>
                        </form>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="mt-6 rounded-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart aria-hidden="true" className="size-5" />
            מרכזי עלות ורווח (CO)
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5">
          <p className="text-muted-foreground text-sm">
            שכבת בקרה נפרדת מה-GL: {costSummary.centers} מרכזים · הכנסות{" "}
            {formatPrice(costSummary.revenue)} · הוצאות{" "}
            {formatPrice(costSummary.expense)} · רווחיות{" "}
            {formatPrice(costSummary.margin)}.
          </p>

          <div className="grid gap-5 lg:grid-cols-2">
            <form action={createCostCenterAction} className="grid gap-2">
              <p className="text-sm font-medium">מרכז חדש</p>
              <div className="grid grid-cols-2 gap-2">
                <Input dir="ltr" name="code" placeholder="קוד (CC-01)" required />
                <select
                  aria-label="סוג מרכז"
                  autoComplete="off"
                  className="glass-control h-10 rounded-md border px-3 text-sm"
                  defaultValue="COST"
                  name="kind"
                >
                  <option value="COST">מרכז עלות</option>
                  <option value="PROFIT">מרכז רווח</option>
                </select>
              </div>
              <Input name="name" placeholder="שם המרכז" required />
              <Input
                min="0"
                name="monthlyBudget"
                placeholder="תקציב חודשי ₪"
                type="number"
              />
              <Button className="w-fit" size="sm" type="submit">
                צור מרכז
              </Button>
            </form>

            <form action={recordCostEntryAction} className="grid gap-2">
              <p className="text-sm font-medium">רישום תנועה</p>
              <select
                aria-label="מרכז"
                autoComplete="off"
                className="glass-control h-10 rounded-md border px-3 text-sm"
                defaultValue=""
                name="costCenterId"
                required
              >
                <option disabled value="">
                  בחר מרכז…
                </option>
                {costCenters.map((center) => (
                  <option key={center.id} value={center.id}>
                    {center.code} · {center.name}
                  </option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <select
                  aria-label="סוג תנועה"
                  autoComplete="off"
                  className="glass-control h-10 rounded-md border px-3 text-sm"
                  defaultValue="EXPENSE"
                  name="kind"
                >
                  <option value="EXPENSE">הוצאה</option>
                  <option value="REVENUE">הכנסה</option>
                </select>
                <Input
                  defaultValue={currentPeriod}
                  dir="ltr"
                  name="period"
                  placeholder="YYYY-MM"
                />
              </div>
              <Input min="0" name="amount" placeholder="סכום ₪" type="number" />
              <Button className="w-fit" size="sm" type="submit" variant="outline">
                רשום תנועה
              </Button>
            </form>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>מרכז</TableHead>
                <TableHead>הכנסות</TableHead>
                <TableHead>הוצאות</TableHead>
                <TableHead>רווחיות</TableHead>
                <TableHead>תקציב</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {costCenters.length === 0 ? (
                <TableEmptyRow
                  colSpan={6}
                  description="טרם הוגדרו מרכזי עלות."
                  icon={PieChart}
                  title="אין מרכזים"
                />
              ) : (
                costCenters.map((center) => (
                  <TableRow key={center.id}>
                    <TableCell className="text-sm">
                      <div className="font-medium">
                        <span dir="ltr">{center.code}</span> · {center.name}
                      </div>
                      <Badge
                        className="mt-1"
                        variant={center.kind === "PROFIT" ? "secondary" : "outline"}
                      >
                        {center.kind === "PROFIT" ? "רווח" : "עלות"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatPrice(center.revenue)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatPrice(center.expense)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatPrice(center.margin)} ({center.marginPct}%)
                    </TableCell>
                    <TableCell className="text-sm">
                      <Badge variant={center.budget.over ? "destructive" : "outline"}>
                        {formatPrice(center.monthlyBudget)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <form action={toggleCostCenterAction}>
                        <input
                          name="costCenterId"
                          type="hidden"
                          value={center.id}
                        />
                        <input
                          name="isActive"
                          type="hidden"
                          value={center.isActive ? "0" : "1"}
                        />
                        <Button size="sm" type="submit" variant="ghost">
                          {center.isActive ? "השבת" : "הפעל"}
                        </Button>
                      </form>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AdminShell>
  );
}

function formatPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}
