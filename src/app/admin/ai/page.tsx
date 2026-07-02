import { Activity, Bot, Sparkles, ShieldCheck, Wrench } from "lucide-react";

import { AdminShell } from "../_components/admin-shell";
import {
  AdminDatabaseFallback,
  AdminForbidden,
} from "../_components/admin-states";
import { getAdminPageAccess } from "../_lib/access";
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
import {
  describeGuardrails,
  getAiGovernanceOverview,
} from "~/server/services/ai-governance";
import { answerAdminQuestion } from "~/server/services/admin-copilot";

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

type AdminAiPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminAiPage({ searchParams }: AdminAiPageProps) {
  const access = await getAdminPageAccess("SYSTEM_CONFIG", "/admin/ai");

  if (access.denied) return <AdminForbidden {...access.denied} />;

  const overview = await getAiGovernanceOverview().catch(() => null);

  if (!overview) return <AdminDatabaseFallback />;

  const guardrails = describeGuardrails();

  const params = await searchParams;
  const copilotQuestion = typeof params.q === "string" ? params.q : "";
  const copilot = copilotQuestion
    ? await answerAdminQuestion({ question: copilotQuestion }).catch(() => null)
    : null;

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
            <Sparkles aria-hidden="true" className="size-5" />
            קופיילוט ניהולי (AI-001)
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <p className="text-muted-foreground text-sm">
            שאלות ניהול מעוגנות בנתונים חיים (גבייה, הפרשי-שער, רווחיות). המלצה
            בלבד — ה-AI אינו מבצע פעולות. ללא מפתח AI מוגדר מוצג סיכום מדדים.
          </p>
          <form className="flex flex-wrap gap-2">
            <Input
              className="max-w-md"
              defaultValue={copilotQuestion}
              name="q"
              placeholder="למשל: מה מצב הגבייה? אילו סיכונים פיננסיים?"
            />
            <Button type="submit" variant="outline">
              <Sparkles aria-hidden="true" className="size-4" />
              שאל
            </Button>
          </form>

          {copilot ? (
            <div className="border-border/60 grid gap-2 rounded-md border p-3">
              <Badge
                className="w-fit"
                variant={copilot.source === "ai" ? "secondary" : "outline"}
              >
                {copilot.source === "ai" ? "תשובת AI" : "סיכום מדדים (ללא AI)"}
              </Badge>
              <p className="text-sm whitespace-pre-line">{copilot.answer}</p>
            </div>
          ) : copilotQuestion ? (
            <p className="text-muted-foreground text-sm">
              לא ניתן היה להפיק תשובה כרגע.
            </p>
          ) : null}
        </CardContent>
      </Card>

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
