import {
  CreditCard,
  Landmark,
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
  createCustomerInvoiceAction,
  issueCustomerInvoiceAction,
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
import {
  getFinanceOverview,
  getGeneralLedgerOverview,
} from "~/server/services/finance";

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
