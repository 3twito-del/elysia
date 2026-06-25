import {
  CreditCard,
  Landmark,
  Lock,
  ReceiptText,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { AdminShell } from "../_components/admin-shell";
import {
  AdminDatabaseFallback,
  AdminForbidden,
} from "../_components/admin-states";
import { getAdminPageAccess } from "../_lib/access";
import {
  closePeriodAction,
  createCustomerInvoiceAction,
  issueCustomerInvoiceAction,
  postManualJournalEntryAction,
  recordCustomerReceiptAction,
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
import { getCashFlowStatement } from "~/server/services/cash-flow";
import {
  getFinanceOverview,
  getGeneralLedgerOverview,
} from "~/server/services/finance";
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
  const [fiscalPeriods, closeSummary, ledgerAccounts, recentEntries] =
    await Promise.all([
      listFiscalPeriods().catch(() => []),
      getPeriodCloseSummary(closeTarget.year, closeTarget.month).catch(
        () => null,
      ),
      listLedgerAccounts().catch(() => []),
      listRecentJournalEntries().catch(() => []),
    ]);

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
    </AdminShell>
  );
}

function formatPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}
