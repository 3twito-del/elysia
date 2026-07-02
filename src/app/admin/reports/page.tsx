import {
  BarChart3,
  CalendarClock,
  Database,
  FileSpreadsheet,
  Filter,
  Play,
  Table2,
} from "lucide-react";
import Link from "next/link";

import { AdminShell } from "../_components/admin-shell";
import {
  AdminDatabaseFallback,
  AdminForbidden,
} from "../_components/admin-states";
import { getAdminPageAccess } from "../_lib/access";
import {
  createReportAction,
  createReportScheduleAction,
  deleteReportAction,
  deleteReportScheduleAction,
  toggleReportAction,
  toggleReportScheduleAction,
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
import { cn } from "~/lib/utils";
import { formatOptionalHebrewDateTime } from "~/lib/format";
import { toDisplayString } from "~/lib/stringify";
import { listDatasets } from "~/server/services/report-datasets";
import { formatMeasure } from "~/server/services/report-engine";
import {
  getReportsSummary,
  listReports,
  runReport,
  type RunReportResult,
} from "~/server/services/reports";
import {
  listRecentReportRuns,
  listReportSchedules,
} from "~/server/services/report-schedules";
import { answerNlQuery } from "~/server/services/nl-query";

export const metadata = {
  title: "דוחות | Admin",
};

export const dynamic = "force-dynamic";

const filterOps = ["eq", "neq", "gt", "gte", "lt", "lte", "contains", "in"];

const scheduleFrequencyLabel: Record<string, string> = {
  DAILY: "יומי",
  WEEKLY: "שבועי",
  MONTHLY: "חודשי",
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminReportsPage({ searchParams }: PageProps) {
  const access = await getAdminPageAccess("ERP_READ", "/admin/reports");

  if (access.denied) return <AdminForbidden {...access.denied} />;

  const summary = await getReportsSummary().catch(() => null);

  if (!summary) return <AdminDatabaseFallback />;

  const query = await searchParams;
  const datasets = listDatasets();
  const activeKey =
    typeof query.dataset === "string" &&
    datasets.some((dataset) => dataset.key === query.dataset)
      ? query.dataset
      : (datasets[0]?.key ?? "orders");
  const activeDataset =
    datasets.find((dataset) => dataset.key === activeKey) ?? datasets[0];

  const reports = await listReports().catch(() => []);
  const [schedules, reportRuns] = await Promise.all([
    listReportSchedules().catch(() => []),
    listRecentReportRuns().catch(() => []),
  ]);

  const reportId = typeof query.report === "string" ? query.report : undefined;
  const run: RunReportResult | null = reportId
    ? await runReport(reportId).catch(() => null)
    : null;

  const nlQuestion = typeof query.nlq === "string" ? query.nlq : "";
  const nlResult = nlQuestion
    ? await answerNlQuery({ question: nlQuestion }).catch(() => null)
    : null;

  return (
    <AdminShell
      active="reports"
      admin={access.admin}
      description="בונה דוחות מעל שכבה סמנטית: בחר ממדים ומדדים, סנן, והרץ חי על נתוני המערכת."
      title="דוחות"
    >
      <div className="grid gap-5 md:grid-cols-3">
        <MetricCard
          detail={`${summary.active} פעילים`}
          icon={BarChart3}
          label="דוחות שמורים"
          value={String(summary.total)}
        />
        <MetricCard
          detail="מאגרי נתונים בשכבה הסמנטית"
          icon={Database}
          label="מאגרים"
          value={String(summary.datasets)}
        />
        <MetricCard
          detail="ממדים × מדדים, חי"
          icon={Table2}
          label="הרצה"
          value="Live"
        />
      </div>

      <Card className="mt-6 rounded-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 aria-hidden="true" className="size-5" />
            שאילתה בשפה טבעית (NL-Query)
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <p className="text-muted-foreground text-sm">
            שאל בשפה חופשית — ה-AI ממפה לשכבה הסמנטית (מאגר + ממדים + מדדים) ומריץ
            חי. ללא SQL חופשי, מוגבל למאגרים המוגדרים. דורש מפתח AI.
          </p>
          <form className="flex flex-wrap gap-2">
            <Input
              className="max-w-md"
              defaultValue={nlQuestion}
              name="nlq"
              placeholder="למשל: הכנסה לפי סניף, או מספר הזמנות לפי סטטוס"
            />
            <Button type="submit" variant="outline">
              <Play aria-hidden="true" className="size-4" />
              הרץ שאילתה
            </Button>
          </form>

          {nlResult?.message ? (
            <p className="text-muted-foreground text-sm">{nlResult.message}</p>
          ) : null}

          {nlResult?.result ? (
            <div className="grid gap-2">
              <Badge className="w-fit" variant="secondary">
                {nlResult.datasetLabel} · {nlResult.result.rowCount} שורות
              </Badge>
              <Table>
                <TableHeader>
                  <TableRow>
                    {nlResult.result.dimensions.map((dimension) => (
                      <TableHead key={dimension.key}>{dimension.label}</TableHead>
                    ))}
                    {nlResult.result.measures.map((measure) => (
                      <TableHead key={measure.key}>{measure.label}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {nlResult.result.rows.slice(0, 20).map((row, index) => (
                    <TableRow key={index}>
                      {nlResult.result!.dimensions.map((dimension) => (
                        <TableCell className="text-sm" key={dimension.key}>
                          {toDisplayString(row.dimensions[dimension.key] ?? "")}
                        </TableCell>
                      ))}
                      {nlResult.result!.measures.map((measure) => (
                        <TableCell className="text-sm" key={measure.key}>
                          {formatMeasure(
                            row.measures[measure.key] ?? 0,
                            measure.format,
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {activeDataset ? (
        <Card className="mt-6 rounded-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 aria-hidden="true" className="size-5" />
              בונה דוחות
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex flex-wrap gap-2">
              {datasets.map((dataset) => (
                <Link
                  key={dataset.key}
                  className={cn(
                    "rounded-md border px-3 py-1.5 text-sm",
                    dataset.key === activeKey
                      ? "bg-primary text-primary-foreground"
                      : "glass-control",
                  )}
                  href={`/admin/reports?dataset=${dataset.key}`}
                >
                  {dataset.label}
                </Link>
              ))}
            </div>
            <p className="text-muted-foreground text-sm">
              {activeDataset.description}
            </p>

            <form action={createReportAction} className="grid gap-3">
              <input name="datasetKey" type="hidden" value={activeDataset.key} />
              <Input name="name" placeholder="שם הדוח" required />

              <div className="grid gap-3 md:grid-cols-2">
                <fieldset className="grid gap-1.5 rounded-md border p-3">
                  <legend className="text-muted-foreground px-1 text-xs">
                    ממדים (קיבוץ)
                  </legend>
                  {activeDataset.dimensions.map((dimension) => (
                    <label
                      key={dimension.key}
                      className="flex items-center gap-2 text-sm"
                    >
                      <input name="dim" type="checkbox" value={dimension.key} />
                      {dimension.label}
                    </label>
                  ))}
                </fieldset>

                <fieldset className="grid gap-1.5 rounded-md border p-3">
                  <legend className="text-muted-foreground px-1 text-xs">
                    מדדים
                  </legend>
                  {activeDataset.measures.map((measure) => (
                    <label
                      key={measure.key}
                      className="flex items-center gap-2 text-sm"
                    >
                      <input
                        defaultChecked={measure.key === activeDataset.measures[0]?.key}
                        name="measure"
                        type="checkbox"
                        value={measure.key}
                      />
                      {measure.label}
                    </label>
                  ))}
                </fieldset>
              </div>

              <div className="grid grid-cols-[auto_1fr_auto_1fr] items-center gap-2">
                <span className="text-muted-foreground flex items-center gap-1 text-sm">
                  <Filter aria-hidden="true" className="size-4" />
                  סינון
                </span>
                <Input name="filterField" placeholder="שדה (status / total / month)" />
                <select
                  aria-label="אופרטור"
                  autoComplete="off"
                  className="glass-control h-10 rounded-md border px-2 text-sm"
                  defaultValue="eq"
                  name="filterOp"
                >
                  {filterOps.map((op) => (
                    <option key={op} value={op}>
                      {op}
                    </option>
                  ))}
                </select>
                <Input name="filterValue" placeholder="ערך" />
              </div>

              <Button className="w-fit" size="sm" type="submit">
                שמור דוח
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <Card className="mt-6 rounded-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Table2 aria-hidden="true" className="size-5" />
            דוחות שמורים
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>דוח</TableHead>
                <TableHead>מאגר</TableHead>
                <TableHead>מבנה</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.length === 0 ? (
                <TableEmptyRow
                  colSpan={4}
                  description="טרם נשמרו דוחות."
                  icon={BarChart3}
                  title="אין דוחות"
                />
              ) : (
                reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="text-sm">
                      <div className="font-medium">{report.name}</div>
                      <Badge
                        className="mt-1"
                        variant={report.isActive ? "secondary" : "outline"}
                      >
                        {report.isActive ? "פעיל" : "כבוי"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{report.datasetLabel}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {report.dimensionCount} ממדים · {report.measureCount} מדדים
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        <Button asChild size="sm" variant="outline">
                          <Link
                            href={`/admin/reports?dataset=${activeKey}&report=${report.id}`}
                          >
                            <Play aria-hidden="true" className="size-3" />
                            הרץ
                          </Link>
                        </Button>
                        <Button asChild size="sm" variant="ghost">
                          <Link href={`/api/admin/reports/${report.id}/export?format=xlsx`}>
                            <FileSpreadsheet aria-hidden="true" className="size-3" />
                            Excel
                          </Link>
                        </Button>
                        <Button asChild size="sm" variant="ghost">
                          <Link href={`/api/admin/reports/${report.id}/export?format=csv`}>
                            CSV
                          </Link>
                        </Button>
                        <Button asChild size="sm" variant="ghost">
                          <Link href={`/admin/reports/${report.id}/print`}>
                            PDF
                          </Link>
                        </Button>
                        <form action={toggleReportAction}>
                          <input name="reportId" type="hidden" value={report.id} />
                          <input
                            name="isActive"
                            type="hidden"
                            value={report.isActive ? "0" : "1"}
                          />
                          <Button size="sm" type="submit" variant="ghost">
                            {report.isActive ? "כבה" : "הפעל"}
                          </Button>
                        </form>
                        <form action={deleteReportAction}>
                          <input name="reportId" type="hidden" value={report.id} />
                          <Button size="sm" type="submit" variant="ghost">
                            מחק
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
            <CalendarClock aria-hidden="true" className="size-5" />
            דוחות מתוזמנים
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 lg:grid-cols-[1fr_1.6fr]">
          <form action={createReportScheduleAction} className="grid gap-2">
            <p className="text-muted-foreground text-sm">
              הרצה אוטומטית של דוח שמור בתדירות קבועה; כל הרצה שומרת snapshot של
              CSV להורדה. מופעל {'ע"י'} ה-cron היומי.
            </p>
            <select
              aria-label="דוח"
              autoComplete="off"
              className="glass-control h-10 rounded-md border px-3 text-sm"
              defaultValue=""
              name="reportId"
              required
            >
              <option disabled value="">
                בחר דוח…
              </option>
              {reports.map((report) => (
                <option key={report.id} value={report.id}>
                  {report.name}
                </option>
              ))}
            </select>
            <select
              aria-label="תדירות"
              autoComplete="off"
              className="glass-control h-10 rounded-md border px-3 text-sm"
              defaultValue="WEEKLY"
              name="frequency"
            >
              <option value="DAILY">יומי</option>
              <option value="WEEKLY">שבועי</option>
              <option value="MONTHLY">חודשי</option>
            </select>
            <Input
              name="recipients"
              placeholder='נמענים לאימייל (מופרד בפסיק, רשות)'
            />
            <Button className="w-fit" size="sm" type="submit">
              צור תזמון
            </Button>
          </form>

          <div className="grid gap-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>דוח</TableHead>
                  <TableHead>תדירות</TableHead>
                  <TableHead>הרצה הבאה</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedules.length === 0 ? (
                  <TableEmptyRow
                    colSpan={4}
                    description="טרם הוגדרו תזמונים."
                    icon={CalendarClock}
                    title="אין תזמונים"
                  />
                ) : (
                  schedules.map((schedule) => (
                    <TableRow key={schedule.id}>
                      <TableCell className="text-sm">
                        {schedule.reportName}
                        <Badge
                          className="mr-2"
                          variant={schedule.isActive ? "secondary" : "outline"}
                        >
                          {schedule.isActive ? "פעיל" : "כבוי"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {scheduleFrequencyLabel[schedule.frequency] ??
                          schedule.frequency}
                      </TableCell>
                      <TableCell className="text-xs">
                        {formatOptionalHebrewDateTime(schedule.nextRunAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <form action={toggleReportScheduleAction}>
                            <input
                              name="scheduleId"
                              type="hidden"
                              value={schedule.id}
                            />
                            <input
                              name="isActive"
                              type="hidden"
                              value={schedule.isActive ? "0" : "1"}
                            />
                            <Button size="sm" type="submit" variant="ghost">
                              {schedule.isActive ? "כבה" : "הפעל"}
                            </Button>
                          </form>
                          <form action={deleteReportScheduleAction}>
                            <input
                              name="scheduleId"
                              type="hidden"
                              value={schedule.id}
                            />
                            <Button size="sm" type="submit" variant="ghost">
                              מחק
                            </Button>
                          </form>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {reportRuns.length > 0 ? (
              <div>
                <p className="text-muted-foreground mb-2 text-xs font-medium">
                  הרצות אחרונות
                </p>
                <div className="grid gap-1">
                  {reportRuns.map((reportRun) => (
                    <div
                      className="flex flex-wrap items-center gap-2 text-xs"
                      key={reportRun.id}
                    >
                      <span className="font-medium">{reportRun.reportName}</span>
                      <span className="text-muted-foreground">
                        {reportRun.rowCount} שורות ·{" "}
                        {formatOptionalHebrewDateTime(reportRun.createdAt)}
                      </span>
                      <Button asChild className="h-6 px-2" size="sm" variant="ghost">
                        <Link href={`/api/admin/reports/runs/${reportRun.id}`}>
                          הורד CSV
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {run ? (
        <Card className="mt-6 rounded-md">
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <Play aria-hidden="true" className="size-5" />
                {run.name}
              </span>
              <span className="text-muted-foreground text-sm font-normal">
                {run.datasetLabel} · {run.result.rowCount} שורות · סינון:{" "}
                {run.filterDescription}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  {run.result.dimensions.map((dimension) => (
                    <TableHead key={dimension.key}>{dimension.label}</TableHead>
                  ))}
                  {run.result.measures.map((measure) => (
                    <TableHead key={measure.key}>{measure.label}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {run.result.rows.length === 0 ? (
                  <TableEmptyRow
                    colSpan={
                      run.result.dimensions.length + run.result.measures.length
                    }
                    description="אין נתונים תואמים לסינון."
                    icon={Table2}
                    title="ריק"
                  />
                ) : (
                  run.result.rows.map((row) => (
                    <TableRow key={row.key}>
                      {run.result.dimensions.map((dimension) => (
                        <TableCell key={dimension.key} className="text-sm">
                          {toDisplayString(row.dimensions[dimension.key]) || "—"}
                        </TableCell>
                      ))}
                      {run.result.measures.map((measure) => (
                        <TableCell key={measure.key} className="text-sm">
                          {formatMeasure(
                            row.measures[measure.key] ?? 0,
                            measure.format,
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
                {run.result.rows.length > 0 ? (
                  <TableRow className="font-semibold">
                    {run.result.dimensions.map((dimension, index) => (
                      <TableCell key={dimension.key}>
                        {index === 0 ? 'סה"כ' : ""}
                      </TableCell>
                    ))}
                    {run.result.measures.map((measure) => (
                      <TableCell key={measure.key} className="text-sm">
                        {formatMeasure(
                          run.result.totals[measure.key] ?? 0,
                          measure.format,
                        )}
                      </TableCell>
                    ))}
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
