import {
  FileCheck2,
  FileDown,
  Landmark,
  Percent,
  ReceiptText,
} from "lucide-react";
import Link from "next/link";

import { AdminShell } from "../_components/admin-shell";
import {
  AdminDatabaseFallback,
  AdminForbidden,
} from "../_components/admin-states";
import { getAdminPageAccess } from "../_lib/access";
import {
  assignAllocationNumberAction,
  createWithholdingRuleAction,
  flagAllocationAction,
  toggleWithholdingRuleAction,
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
import { formatPrice } from "~/lib/format";
import {
  ALLOCATION_NUMBER_THRESHOLD,
  getStatutorySummary,
  listInvoicesNeedingAllocation,
  listWithholdingRules,
} from "~/server/services/israeli-tax";
import { getShaamExportForPeriod } from "~/server/services/shaam-export";

export const metadata = {
  title: "מיסוי ישראלי | Admin",
};

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminTaxPage({ searchParams }: PageProps) {
  const access = await getAdminPageAccess("FINANCE_READ", "/admin/tax");

  if (access.denied) return <AdminForbidden {...access.denied} />;

  const summary = await getStatutorySummary().catch(() => null);

  if (!summary) return <AdminDatabaseFallback />;

  const query = await searchParams;
  const now = new Date();
  const year = Number(query.year) || now.getUTCFullYear();
  const month = Number(query.month) || now.getUTCMonth() + 1;
  const shaam = await getShaamExportForPeriod({ year, month }).catch(() => null);

  const [rules, needingAllocation] = await Promise.all([
    listWithholdingRules().catch(() => []),
    listInvoicesNeedingAllocation().catch(() => []),
  ]);

  return (
    <AdminShell
      active="tax"
      admin={access.admin}
      description='מיסוי ישראלי: ניכוי מס במקור ומספרי הקצאה ל"חשבונית ישראל". כל שיעור/סף לדוגמה — לאימות מול רו"ח.'
      title="מיסוי ישראלי"
    >
      <div className="grid gap-5 md:grid-cols-3">
        <MetricCard
          detail="כללי ניכוי פעילים"
          icon={Percent}
          label="ניכוי במקור"
          value={String(summary.withholdingRules)}
        />
        <MetricCard
          detail={`מעל ${formatPrice(ALLOCATION_NUMBER_THRESHOLD)}`}
          icon={ReceiptText}
          label="ממתינות להקצאה"
          value={String(summary.needingAllocation)}
        />
        <MetricCard
          detail="חשבוניות עם מספר הקצאה"
          icon={FileCheck2}
          label="הוקצו"
          value={String(summary.assigned)}
        />
      </div>

      <Card className="mt-6 rounded-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent aria-hidden="true" className="size-5" />
            ניכוי מס במקור
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 lg:grid-cols-[1fr_1.6fr]">
          <form action={createWithholdingRuleAction} className="grid gap-2">
            <p className="text-muted-foreground text-sm">
              שיעור ניכוי לפי קטגוריה, מתוארך-תוקף. השיעורים לדוגמה בלבד.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Input name="category" placeholder="קטגוריה (שירותים)" required />
              <Input
                min="0"
                name="ratePercent"
                placeholder="שיעור %"
                step="0.01"
                type="number"
              />
            </div>
            <Input aria-label="בתוקף מ-" name="effectiveFrom" type="date" />
            <Button className="w-fit" size="sm" type="submit">
              הוסף כלל
            </Button>
          </form>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>קטגוריה</TableHead>
                <TableHead>שיעור</TableHead>
                <TableHead>בתוקף מ-</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.length === 0 ? (
                <TableEmptyRow
                  colSpan={4}
                  description="טרם הוגדרו כללי ניכוי."
                  icon={Percent}
                  title="אין כללים"
                />
              ) : (
                rules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell className="text-sm">{rule.category}</TableCell>
                    <TableCell className="text-sm">{rule.ratePercent}%</TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {rule.effectiveFrom.toLocaleDateString("he-IL")}
                    </TableCell>
                    <TableCell>
                      <form action={toggleWithholdingRuleAction}>
                        <input name="ruleId" type="hidden" value={rule.id} />
                        <input
                          name="isActive"
                          type="hidden"
                          value={rule.isActive ? "0" : "1"}
                        />
                        <Button size="sm" type="submit" variant="ghost">
                          {rule.isActive ? "השבת" : "הפעל"}
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

      <Card className="mt-6 rounded-md">
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <Landmark aria-hidden="true" className="size-5" />
              מספרי הקצאה (חשבונית ישראל)
            </span>
            <form action={flagAllocationAction}>
              <Button size="sm" type="submit" variant="outline">
                סרוק חשבוניות
              </Button>
            </form>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>חשבונית</TableHead>
                <TableHead>סכום</TableHead>
                <TableHead>סטטוס</TableHead>
                <TableHead>מספר הקצאה</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {needingAllocation.length === 0 ? (
                <TableEmptyRow
                  colSpan={4}
                  description="אין חשבוניות מעל הסף הממתינות למספר הקצאה."
                  icon={ReceiptText}
                  title="הכול מטופל"
                />
              ) : (
                needingAllocation.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="text-sm">{invoice.invoiceNumber}</TableCell>
                    <TableCell className="text-sm">
                      {formatPrice(invoice.total)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          invoice.allocationStatus === "REQUIRED"
                            ? "destructive"
                            : "outline"
                        }
                      >
                        {invoice.allocationStatus === "REQUIRED" ? "נדרש" : "—"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <form
                        action={assignAllocationNumberAction}
                        className="flex items-center gap-1"
                      >
                        <input name="invoiceId" type="hidden" value={invoice.id} />
                        <Input
                          className="h-8 w-32"
                          dir="ltr"
                          inputMode="numeric"
                          name="allocationNumber"
                          placeholder="9 ספרות"
                        />
                        <Button size="sm" type="submit" variant="outline">
                          שייך
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

      <Card className="mt-6 rounded-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileDown aria-hidden="true" className="size-5" />
            מבנה אחיד (SHAAM) — ייצוא לביקורת
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <form className="flex flex-wrap items-end gap-2" method="get">
            <div className="grid gap-1">
              <label className="text-muted-foreground text-xs" htmlFor="shaam-year">
                שנה
              </label>
              <Input
                className="w-24"
                defaultValue={String(year)}
                id="shaam-year"
                name="year"
                type="number"
              />
            </div>
            <div className="grid gap-1">
              <label className="text-muted-foreground text-xs" htmlFor="shaam-month">
                חודש
              </label>
              <Input
                className="w-20"
                defaultValue={String(month)}
                id="shaam-month"
                max="12"
                min="1"
                name="month"
                type="number"
              />
            </div>
            <Button size="sm" type="submit" variant="outline">
              חשב תקופה
            </Button>
          </form>

          {shaam ? (
            <div className="grid gap-3 text-sm sm:grid-cols-3">
              <div className="grid gap-1">
                <span className="text-muted-foreground">רשומות בקובץ</span>
                <span className="text-xl font-semibold">{shaam.summary.recordCount}</span>
              </div>
              <div className="grid gap-1">
                <span className="text-muted-foreground">תנועות יומן</span>
                <span className="text-xl font-semibold">{shaam.summary.movementCount}</span>
              </div>
              <div className="grid gap-1">
                <span className="text-muted-foreground">חובה / זכות</span>
                <span className="text-xl font-semibold">
                  {formatPrice(shaam.summary.totalDebit)} /{" "}
                  {formatPrice(shaam.summary.totalCredit)}
                </span>
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href={`/api/admin/tax/shaam?year=${year}&month=${month}&file=bkmvdata`}>
                <FileDown aria-hidden="true" className="size-3" />
                הורד BKMVDATA
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href={`/api/admin/tax/shaam?year=${year}&month=${month}&file=ini`}>
                <FileDown aria-hidden="true" className="size-3" />
                הורד INI
              </Link>
            </Button>
          </div>

          <p className="text-muted-foreground text-xs">
            {
              'מבנה רשומות A100/B100/Z900 לפי הוראה 1.31 — מבנה בלבד. יש לאמת רוחב שדות, קודים וסט הרשומות המלא (B110/C100/D110) מול רשות המסים ורו"ח לפני הגשה.'
            }
          </p>
        </CardContent>
      </Card>
    </AdminShell>
  );
}
