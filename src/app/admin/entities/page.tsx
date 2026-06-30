import { Building2, Globe, Landmark, Scale, Workflow } from "lucide-react";

import { AdminShell } from "../_components/admin-shell";
import {
  AdminDatabaseFallback,
  AdminForbidden,
} from "../_components/admin-states";
import { getAdminPageAccess } from "../_lib/access";
import {
  createEntityAction,
  createIntercompanyAction,
  eliminateIntercompanyAction,
  setEntityFxAction,
  toggleEntityAction,
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
  getConsolidatedReport,
  getEntitiesSummary,
  listEntities,
  listIntercompany,
} from "~/server/services/entities";

export const metadata = {
  title: "ישויות | Admin",
};

export const dynamic = "force-dynamic";

export default async function AdminEntitiesPage() {
  const access = await getAdminPageAccess("FINANCE_READ", "/admin/entities");

  if (access.denied) return <AdminForbidden {...access.denied} />;

  const summary = await getEntitiesSummary().catch(() => null);

  if (!summary) return <AdminDatabaseFallback />;

  const [entities, intercompany, report] = await Promise.all([
    listEntities().catch(() => []),
    listIntercompany().catch(() => []),
    getConsolidatedReport().catch(() => null),
  ]);

  const entityOptions = entities.filter((entity) => entity.isActive);

  return (
    <AdminShell
      active="entities"
      admin={access.admin}
      description="מבנה רב-ישותי: חברות, מטבעות, עסקאות בין-חברתיות ודוח מאוחד מול הספר הראשי."
      title="ישויות ואיחוד"
    >
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          detail={`${summary.active} פעילות`}
          icon={Building2}
          label="ישויות"
          value={String(summary.total)}
        />
        <MetricCard
          detail="ישות בסיס לדיווח"
          icon={Landmark}
          label="בסיס"
          value={summary.baseCode ?? "—"}
        />
        <MetricCard
          detail="עסקאות בין-חברתיות פתוחות"
          icon={Workflow}
          label="בין-חברתי"
          value={String(summary.openIntercompany)}
        />
        <MetricCard
          detail={report?.consolidated.balanced ? "מאוזן" : "לא מאוזן"}
          icon={Scale}
          label="מאזן בוחן מאוחד"
          value={report ? formatPrice(report.consolidated.totalDebit) : "—"}
        />
      </div>

      <Card className="mt-6 rounded-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 aria-hidden="true" className="size-5" />
            ישויות משפטיות
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 lg:grid-cols-[1fr_1.6fr]">
          <form action={createEntityAction} className="grid gap-2">
            <p className="text-muted-foreground text-sm">
              הוספת חברה. ישות אחת מסומנת כבסיס; שער החליפין ממיר למטבע הבסיס באיחוד.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Input name="code" placeholder="קוד (IL)" required />
              <Input
                defaultValue="ILS"
                name="functionalCurrency"
                placeholder="מטבע"
              />
            </div>
            <Input name="name" placeholder="שם החברה" required />
            <Input
              defaultValue="1"
              min="0"
              name="fxRateToBase"
              placeholder="שער לבסיס"
              step="0.000001"
              type="number"
            />
            <label className="text-muted-foreground flex items-center gap-2 text-sm">
              <input name="isBase" type="checkbox" value="1" />
              ישות בסיס (מטבע דיווח)
            </label>
            <Button className="w-fit" size="sm" type="submit">
              הוסף ישות
            </Button>
          </form>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ישות</TableHead>
                <TableHead>מטבע</TableHead>
                <TableHead>שער</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {entities.length === 0 ? (
                <TableEmptyRow
                  colSpan={4}
                  description="טרם הוגדרו ישויות. כל פעילות קיימת תיוחס לישות הבסיס."
                  icon={Building2}
                  title="אין ישויות"
                />
              ) : (
                entities.map((entity) => (
                  <TableRow key={entity.id}>
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-2 font-medium">
                        {entity.code}
                        {entity.isBase ? (
                          <Badge variant="secondary">בסיס</Badge>
                        ) : null}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {entity.name} · {entity.journalEntryCount} פקודות
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{entity.currency}</TableCell>
                    <TableCell>
                      <form
                        action={setEntityFxAction}
                        className="flex items-center gap-1"
                      >
                        <input name="entityId" type="hidden" value={entity.id} />
                        <Input
                          className="h-8 w-24"
                          defaultValue={String(entity.fxRateToBase)}
                          min="0"
                          name="fxRateToBase"
                          step="0.000001"
                          type="number"
                        />
                        <Button size="sm" type="submit" variant="outline">
                          עדכן
                        </Button>
                      </form>
                    </TableCell>
                    <TableCell>
                      <form action={toggleEntityAction}>
                        <input name="entityId" type="hidden" value={entity.id} />
                        <input
                          name="isActive"
                          type="hidden"
                          value={entity.isActive ? "0" : "1"}
                        />
                        <Button size="sm" type="submit" variant="ghost">
                          {entity.isActive ? "השבת" : "הפעל"}
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
              <Workflow aria-hidden="true" className="size-5" />
              עסקאות בין-חברתיות
            </span>
            {report ? (
              <span className="text-muted-foreground text-sm font-normal">
                פתוח {formatPrice(report.intercompany.openAmount)} · בוטל{" "}
                {formatPrice(report.intercompany.eliminatedAmount)}
              </span>
            ) : null}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 lg:grid-cols-[1fr_1.6fr]">
          <form action={createIntercompanyAction} className="grid gap-2">
            <div className="grid grid-cols-2 gap-2">
              <select
                aria-label="מ-ישות"
                autoComplete="off"
                className="glass-control h-10 rounded-md border px-3 text-sm"
                defaultValue=""
                name="fromEntityId"
                required
              >
                <option disabled value="">
                  מ-ישות…
                </option>
                {entityOptions.map((entity) => (
                  <option key={entity.id} value={entity.id}>
                    {entity.code}
                  </option>
                ))}
              </select>
              <select
                aria-label="ל-ישות"
                autoComplete="off"
                className="glass-control h-10 rounded-md border px-3 text-sm"
                defaultValue=""
                name="toEntityId"
                required
              >
                <option disabled value="">
                  ל-ישות…
                </option>
                {entityOptions.map((entity) => (
                  <option key={entity.id} value={entity.id}>
                    {entity.code}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input
                min="0"
                name="amount"
                placeholder="סכום"
                step="0.01"
                type="number"
              />
              <Input defaultValue="ILS" name="currency" placeholder="מטבע" />
            </div>
            <Input name="description" placeholder="תיאור (רשות)" />
            <Button className="w-fit" size="sm" type="submit">
              רשום עסקה
            </Button>
          </form>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>אסמכתא</TableHead>
                <TableHead>צדדים</TableHead>
                <TableHead>סכום</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {intercompany.length === 0 ? (
                <TableEmptyRow
                  colSpan={4}
                  description="טרם נרשמו עסקאות בין-חברתיות."
                  icon={Workflow}
                  title="אין עסקאות"
                />
              ) : (
                intercompany.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="text-xs">
                      {transaction.transactionNumber}
                    </TableCell>
                    <TableCell className="text-sm">
                      {transaction.from} → {transaction.to}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatPrice(transaction.amount)}
                      <Badge
                        className="mr-2"
                        variant={
                          transaction.status === "ELIMINATED"
                            ? "outline"
                            : "secondary"
                        }
                      >
                        {transaction.status === "ELIMINATED" ? "בוטל" : "פתוח"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {transaction.status === "OPEN" ? (
                        <form action={eliminateIntercompanyAction}>
                          <input
                            name="transactionId"
                            type="hidden"
                            value={transaction.id}
                          />
                          <Button size="sm" type="submit" variant="outline">
                            בטל באיחוד
                          </Button>
                        </form>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {report ? (
        <Card className="mt-6 rounded-md">
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <Globe aria-hidden="true" className="size-5" />
                מאזן בוחן מאוחד (מטבע בסיס)
              </span>
              <Badge variant={report.consolidated.balanced ? "secondary" : "destructive"}>
                {report.consolidated.balanced ? "מאוזן" : "לא מאוזן"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-3 text-xs">
              {report.entities
                .map((entity) => `${entity.entityCode} ×${entity.fxRate}`)
                .join(" · ")}
            </p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>חשבון</TableHead>
                  <TableHead>חובה</TableHead>
                  <TableHead>זכות</TableHead>
                  <TableHead>יתרה</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.consolidated.rows.length === 0 ? (
                  <TableEmptyRow
                    colSpan={4}
                    description="אין תנועות בספר הראשי."
                    icon={Scale}
                    title="ריק"
                  />
                ) : (
                  report.consolidated.rows.map((row) => (
                    <TableRow key={row.accountCode}>
                      <TableCell className="text-sm">
                        {row.accountCode} {row.accountName}
                      </TableCell>
                      <TableCell className="text-sm">{formatPrice(row.debit)}</TableCell>
                      <TableCell className="text-sm">{formatPrice(row.credit)}</TableCell>
                      <TableCell className="text-sm">{formatPrice(row.balance)}</TableCell>
                    </TableRow>
                  ))
                )}
                {report.consolidated.rows.length > 0 ? (
                  <TableRow className="font-semibold">
                    <TableCell>{'סה"כ'}</TableCell>
                    <TableCell>{formatPrice(report.consolidated.totalDebit)}</TableCell>
                    <TableCell>{formatPrice(report.consolidated.totalCredit)}</TableCell>
                    <TableCell />
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}
    </AdminShell>
  );
}
