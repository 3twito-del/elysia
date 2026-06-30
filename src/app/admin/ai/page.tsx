import { Activity, Bot, ShieldCheck, Wrench } from "lucide-react";

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
import {
  describeGuardrails,
  getAiGovernanceOverview,
} from "~/server/services/ai-governance";

export const metadata = {
  title: "ממשל AI | Admin",
};

export const dynamic = "force-dynamic";

const autonomyLabel: Record<string, string> = {
  RECOMMEND: "המלצה בלבד",
  APPROVE: "פעולה עם אישור",
  AUTONOMOUS: "אוטונומי",
};

const runStatusVariant: Record<string, "secondary" | "outline" | "destructive"> = {
  SUCCEEDED: "secondary",
  STARTED: "outline",
  FAILED: "destructive",
};

export default async function AdminAiPage() {
  const access = await getAdminPageAccess("SYSTEM_CONFIG", "/admin/ai");

  if (access.denied) return <AdminForbidden {...access.denied} />;

  const overview = await getAiGovernanceOverview().catch(() => null);

  if (!overview) return <AdminDatabaseFallback />;

  const guardrails = describeGuardrails();

  return (
    <AdminShell
      active="ai"
      admin={access.admin}
      description="ממשל AI: מעקב הרצות, מודלים ושומרי-סף. AI ממליץ או פועל עם אישור — לעולם לא אוטונומי על הספרים."
      title="ממשל AI"
    >
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          detail="הרצות AI מתועדות"
          icon={Bot}
          label="הרצות"
          value={String(overview.summary.total)}
        />
        <MetricCard
          detail={`${overview.summary.failed} נכשלו`}
          icon={Activity}
          label="הצלחה"
          value={`${overview.summary.successRate}%`}
        />
        <MetricCard
          detail="קריאות לכלים מתועדות"
          icon={Wrench}
          label="קריאות כלים"
          value={String(overview.toolCalls)}
        />
        <MetricCard
          detail="זמן ריצה ממוצע"
          icon={Activity}
          label="זמן ממוצע"
          value={`${overview.summary.avgDurationMs}ms`}
        />
      </div>

      <Card className="mt-6 rounded-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck aria-hidden="true" className="size-5" />
            מטריצת שומרי-סף (AI-005)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-3 text-sm">
            בתחומים פיננסיים AI אינו רשאי לפעול אוטונומית — נדרש אישור אנושי לכל
            פעולה על הספרים.
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>תחום</TableHead>
                <TableHead>רמת אוטונומיה מרבית</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {guardrails.map((rule) => (
                <TableRow key={rule.domain}>
                  <TableCell className="text-sm">{rule.domain}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        rule.maxAutonomy === "AUTONOMOUS" ? "secondary" : "outline"
                      }
                    >
                      {autonomyLabel[rule.maxAutonomy] ?? rule.maxAutonomy}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="mt-6 rounded-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot aria-hidden="true" className="size-5" />
            הרצות AI אחרונות
          </CardTitle>
        </CardHeader>
        <CardContent>
          {overview.models.length > 0 ? (
            <p className="text-muted-foreground mb-3 text-xs">
              {overview.models
                .map((model) => `${model.model}: ${model.runs}`)
                .join(" · ")}
            </p>
          ) : null}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>סוג</TableHead>
                <TableHead>מודל</TableHead>
                <TableHead>סטטוס</TableHead>
                <TableHead>זמן</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {overview.recent.length === 0 ? (
                <TableEmptyRow
                  colSpan={4}
                  description="טרם בוצעו הרצות AI."
                  icon={Bot}
                  title="אין הרצות"
                />
              ) : (
                overview.recent.map((run) => (
                  <TableRow key={run.id}>
                    <TableCell className="text-sm">{run.kind}</TableCell>
                    <TableCell className="max-w-[10rem] truncate text-xs">
                      {run.model}
                    </TableCell>
                    <TableCell>
                      <Badge variant={runStatusVariant[run.status] ?? "outline"}>
                        {run.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {run.durationMs ? `${run.durationMs}ms` : "—"}
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
