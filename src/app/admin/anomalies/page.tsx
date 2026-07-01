import { Activity, LineChart, TrendingDown, TrendingUp } from "lucide-react";

import { AdminShell } from "../_components/admin-shell";
import {
  AdminDatabaseFallback,
  AdminForbidden,
} from "../_components/admin-states";
import { getAdminPageAccess } from "../_lib/access";
import { MetricCard } from "~/components/metric-card";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
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
import { getRevenueAnomalies } from "~/server/services/anomaly-detection";
import { getRevenueForecast } from "~/server/services/forecasting";

export const metadata = { title: "אנומליות | Admin" };

export const dynamic = "force-dynamic";

export default async function AdminAnomaliesPage() {
  const access = await getAdminPageAccess("FINANCE_READ", "/admin/anomalies");
  if (access.denied) return <AdminForbidden {...access.denied} />;

  const data = await getRevenueAnomalies({ days: 30 }).catch(() => null);
  if (!data) return <AdminDatabaseFallback />;

  const forecast = await getRevenueForecast({ days: 30, horizon: 7 }).catch(
    () => null,
  );

  return (
    <AdminShell
      active="anomalies"
      admin={access.admin}
      description="זיהוי אנומליות: קפיצות וצניחות חריגות בהכנסה היומית (z-score) ב-30 הימים האחרונים."
      title="אנומליות"
    >
      <div className="grid gap-5 md:grid-cols-2">
        <MetricCard detail="הכנסה יומית ממוצעת" icon={Activity} label="ממוצע" value={formatPrice(data.average)} />
        <MetricCard detail="ימים חריגים (|z| ≥ 2)" icon={TrendingUp} label="אנומליות" value={String(data.anomalies.length)} />
      </div>

      <Card className="mt-6 rounded-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity aria-hidden="true" className="size-5" />
            ימים חריגים בהכנסה
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>תאריך</TableHead>
                <TableHead>הכנסה</TableHead>
                <TableHead>z-score</TableHead>
                <TableHead>סוג</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.anomalies.length === 0 ? (
                <TableEmptyRow colSpan={4} description="לא זוהו אנומליות בהכנסה היומית." icon={Activity} title="תקין" />
              ) : (
                data.anomalies.map((anomaly) => (
                  <TableRow key={anomaly.label}>
                    <TableCell className="text-sm" dir="ltr">{anomaly.label}</TableCell>
                    <TableCell className="text-sm">{formatPrice(anomaly.value)}</TableCell>
                    <TableCell className="text-sm">{anomaly.z}</TableCell>
                    <TableCell>
                      <Badge variant={anomaly.direction === "DROP" ? "destructive" : "secondary"}>
                        {anomaly.direction === "DROP" ? (
                          <TrendingDown aria-hidden="true" className="size-3" />
                        ) : (
                          <TrendingUp aria-hidden="true" className="size-3" />
                        )}
                        {anomaly.direction === "DROP" ? "צניחה" : "קפיצה"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {forecast ? (
        <Card className="mt-6 rounded-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LineChart aria-hidden="true" className="size-5" />
              תחזית הכנסה (7 ימים)
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <MetricCard
                detail="סכום 7 ימי התחזית"
                icon={LineChart}
                label="תחזית מצטברת"
                value={formatPrice(forecast.projectedTotal)}
              />
              <MetricCard
                detail="ממוצע נע (7 ימים)"
                icon={Activity}
                label="בסיס"
                value={formatPrice(forecast.baseline)}
              />
              <MetricCard
                detail="שינוי יומי ממוצע (מגמה)"
                icon={forecast.trendSlope >= 0 ? TrendingUp : TrendingDown}
                label="מגמה"
                value={`${forecast.trendSlope >= 0 ? "+" : ""}${formatPrice(forecast.trendSlope)}`}
              />
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>תאריך</TableHead>
                  <TableHead>הכנסה חזויה</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {forecast.forecast.length === 0 ? (
                  <TableEmptyRow
                    colSpan={2}
                    description="אין מספיק נתונים לתחזית."
                    icon={LineChart}
                    title="אין תחזית"
                  />
                ) : (
                  forecast.forecast.map((point) => (
                    <TableRow key={point.label}>
                      <TableCell className="text-sm" dir="ltr">
                        {point.label}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatPrice(point.value)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}
    </AdminShell>
  );
}
