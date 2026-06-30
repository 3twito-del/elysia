import { Boxes, FileText, Play, Scale, Timer, Workflow, Zap } from "lucide-react";

import { AdminShell } from "../_components/admin-shell";
import {
  AdminDatabaseFallback,
  AdminForbidden,
} from "../_components/admin-states";
import { getAdminPageAccess } from "../_lib/access";
import {
  createBusinessRuleAction,
  createFormAction,
  createWorkflowAction,
  defineCustomFieldAction,
  deleteBusinessRuleAction,
  deleteWorkflowAction,
  runWorkflowAction,
  toggleBusinessRuleAction,
  toggleFormAction,
  toggleWorkflowAction,
  upsertSlaPolicyAction,
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
import {
  listBusinessRules,
  listSlaPolicies,
} from "~/server/services/business-rules";
import { listCustomFields, getCustomFieldsSummary } from "~/server/services/custom-fields";
import { getFormsSummary, listForms } from "~/server/services/forms";
import {
  getWorkflowSummary,
  listWorkflowRuns,
  listWorkflows,
} from "~/server/services/workflows";

export const metadata = {
  title: "אוטומציות | Admin",
};

export const dynamic = "force-dynamic";

const triggerLabel: Record<string, string> = {
  MANUAL: "ידני",
  EVENT: "אירוע",
  SCHEDULE: "מתוזמן",
};

const runStatusVariant: Record<string, "secondary" | "outline" | "destructive"> = {
  MATCHED: "secondary",
  SKIPPED: "outline",
  FAILED: "destructive",
};

const conditionOps = [
  "eq",
  "neq",
  "gt",
  "gte",
  "lt",
  "lte",
  "contains",
  "in",
  "exists",
];

export default async function AdminWorkflowPage() {
  const access = await getAdminPageAccess("ERP_READ", "/admin/workflow");

  if (access.denied) return <AdminForbidden {...access.denied} />;

  const summary = await getWorkflowSummary().catch(() => null);

  if (!summary) return <AdminDatabaseFallback />;

  const [
    workflows,
    runs,
    forms,
    formsSummary,
    customFields,
    cfSummary,
    businessRules,
    slaPolicies,
  ] = await Promise.all([
    listWorkflows().catch(() => []),
    listWorkflowRuns({ limit: 12 }).catch(() => []),
    listForms().catch(() => []),
    getFormsSummary().catch(() => null),
    listCustomFields().catch(() => []),
    getCustomFieldsSummary().catch(() => null),
    listBusinessRules().catch(() => []),
    listSlaPolicies().catch(() => []),
  ]);

  return (
    <AdminShell
      active="workflow"
      admin={access.admin}
      description="פלטפורמת No-Code: בניית תהליכים (טריגר → תנאי → פעולה), טפסים ושדות מותאמים — בלי קוד."
      title="אוטומציות וטפסים"
    >
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          detail={`${summary.active} פעילים`}
          icon={Workflow}
          label="תהליכים"
          value={String(summary.total)}
        />
        <MetricCard
          detail={`${summary.totalRuns} הרצות סה"כ`}
          icon={Zap}
          label="הופעלו"
          value={String(summary.matchedRuns)}
        />
        <MetricCard
          detail={`${formsSummary?.submissions ?? 0} הגשות`}
          icon={FileText}
          label="טפסים"
          value={String(formsSummary?.forms ?? 0)}
        />
        <MetricCard
          detail={`${cfSummary?.entityTypes ?? 0} סוגי ישות`}
          icon={Boxes}
          label="שדות מותאמים"
          value={String(cfSummary?.fields ?? 0)}
        />
      </div>

      <Card className="mt-6 rounded-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Workflow aria-hidden="true" className="size-5" />
            תהליכים אוטומטיים
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 lg:grid-cols-[1fr_1.6fr]">
          <form action={createWorkflowAction} className="grid gap-2">
            <p className="text-muted-foreground text-sm">
              טריגר → תנאי → פעולה. השאר את התנאי ריק כדי שירוץ תמיד.
            </p>
            <Input name="name" placeholder="שם התהליך" required />
            <select
              aria-label="סוג טריגר"
              autoComplete="off"
              className="glass-control h-10 rounded-md border px-3 text-sm"
              defaultValue="MANUAL"
              name="triggerType"
            >
              <option value="MANUAL">ידני</option>
              <option value="EVENT">אירוע</option>
              <option value="SCHEDULE">מתוזמן</option>
            </select>
            <Input name="triggerEvent" placeholder="שם אירוע (לטריגר אירוע)" />
            <div className="grid grid-cols-[1fr_auto_1fr] gap-2">
              <Input name="conditionField" placeholder="שדה" />
              <select
                aria-label="אופרטור"
                autoComplete="off"
                className="glass-control h-10 rounded-md border px-2 text-sm"
                defaultValue="eq"
                name="conditionOp"
              >
                {conditionOps.map((op) => (
                  <option key={op} value={op}>
                    {op}
                  </option>
                ))}
              </select>
              <Input name="conditionValue" placeholder="ערך" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select
                aria-label="סוג פעולה"
                autoComplete="off"
                className="glass-control h-10 rounded-md border px-3 text-sm"
                defaultValue="CREATE_APPROVAL"
                name="actionType"
              >
                <option value="CREATE_APPROVAL">בקשת אישור</option>
                <option value="NOTIFY">התראה</option>
                <option value="LOG">רישום</option>
                <option value="WEBHOOK">Webhook</option>
              </select>
              <Input name="actionTitle" placeholder="כותרת הפעולה" />
            </div>
            <Input
              name="actionMessage"
              placeholder="הודעה / כתובת (תומך ב-{{שדה}})"
            />
            <Button className="w-fit" size="sm" type="submit">
              צור תהליך
            </Button>
          </form>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>תהליך</TableHead>
                <TableHead>תנאי</TableHead>
                <TableHead>הרצות</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {workflows.length === 0 ? (
                <TableEmptyRow
                  colSpan={4}
                  description="טרם הוגדרו תהליכים."
                  icon={Workflow}
                  title="אין תהליכים"
                />
              ) : (
                workflows.map((workflow) => (
                  <TableRow key={workflow.id}>
                    <TableCell className="text-sm">
                      <div className="font-medium">{workflow.name}</div>
                      <div className="text-muted-foreground text-xs">
                        {triggerLabel[workflow.triggerType] ??
                          workflow.triggerType}
                        {workflow.triggerEvent ? ` · ${workflow.triggerEvent}` : ""}{" "}
                        · {workflow.actionCount} פעולות
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[12rem] truncate text-xs">
                      {workflow.condition}
                    </TableCell>
                    <TableCell className="text-sm">
                      <Badge variant={workflow.isActive ? "secondary" : "outline"}>
                        {workflow.isActive ? "פעיל" : "כבוי"}
                      </Badge>
                      <span className="text-muted-foreground text-xs">
                        {" "}
                        {workflow.runCount}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        <form action={runWorkflowAction}>
                          <input
                            name="workflowId"
                            type="hidden"
                            value={workflow.id}
                          />
                          <Button size="sm" type="submit" variant="outline">
                            <Play aria-hidden="true" className="size-3" />
                            הרץ
                          </Button>
                        </form>
                        <form action={toggleWorkflowAction}>
                          <input
                            name="workflowId"
                            type="hidden"
                            value={workflow.id}
                          />
                          <input
                            name="isActive"
                            type="hidden"
                            value={workflow.isActive ? "0" : "1"}
                          />
                          <Button size="sm" type="submit" variant="ghost">
                            {workflow.isActive ? "כבה" : "הפעל"}
                          </Button>
                        </form>
                        <form action={deleteWorkflowAction}>
                          <input
                            name="workflowId"
                            type="hidden"
                            value={workflow.id}
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
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="rounded-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText aria-hidden="true" className="size-5" />
              טפסים (No-Code)
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <form action={createFormAction} className="grid gap-2">
              <Input name="name" placeholder="שם הטופס" required />
              <textarea
                className="glass-control min-h-[88px] rounded-md border px-3 py-2 text-sm"
                name="fieldsSpec"
                placeholder={"שורה לכל שדה:\nkey|תווית|TEXT|1\nemail|דוא\"ל|EMAIL|0"}
              />
              <Button className="w-fit" size="sm" type="submit">
                צור טופס
              </Button>
            </form>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>טופס</TableHead>
                  <TableHead>שדות</TableHead>
                  <TableHead>הגשות</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {forms.length === 0 ? (
                  <TableEmptyRow
                    colSpan={4}
                    description="טרם נוצרו טפסים."
                    icon={FileText}
                    title="אין טפסים"
                  />
                ) : (
                  forms.map((form) => (
                    <TableRow key={form.id}>
                      <TableCell className="text-sm">
                        <div className="font-medium">{form.name}</div>
                        <div className="text-muted-foreground text-xs">
                          /{form.slug}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{form.fieldCount}</TableCell>
                      <TableCell className="text-sm">
                        {form.submissionCount}
                      </TableCell>
                      <TableCell>
                        <form action={toggleFormAction}>
                          <input name="formId" type="hidden" value={form.id} />
                          <input
                            name="isActive"
                            type="hidden"
                            value={form.isActive ? "0" : "1"}
                          />
                          <Button size="sm" type="submit" variant="ghost">
                            {form.isActive ? "השבת" : "הפעל"}
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

        <Card className="rounded-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Boxes aria-hidden="true" className="size-5" />
              שדות מותאמים
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <form action={defineCustomFieldAction} className="grid gap-2">
              <p className="text-muted-foreground text-sm">
                הוספת שדה לכל ישות (לקוח/הזמנה/מוצר…) בלי שינוי סכמה.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Input name="entityType" placeholder="סוג ישות (customer)" required />
                <Input name="key" placeholder="מפתח (vipLevel)" required />
              </div>
              <Input name="label" placeholder="תווית" required />
              <div className="grid grid-cols-2 gap-2">
                <select
                  aria-label="סוג שדה"
                  autoComplete="off"
                  className="glass-control h-10 rounded-md border px-3 text-sm"
                  defaultValue="TEXT"
                  name="fieldType"
                >
                  <option value="TEXT">טקסט</option>
                  <option value="NUMBER">מספר</option>
                  <option value="BOOLEAN">כן/לא</option>
                  <option value="DATE">תאריך</option>
                  <option value="SELECT">בחירה</option>
                </select>
                <label className="text-muted-foreground flex items-center gap-2 text-sm">
                  <input name="required" type="checkbox" value="1" />
                  חובה
                </label>
              </div>
              <Input name="options" placeholder="אפשרויות לבחירה (מופרד בפסיק)" />
              <Button className="w-fit" size="sm" type="submit">
                הגדר שדה
              </Button>
            </form>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ישות</TableHead>
                  <TableHead>שדה</TableHead>
                  <TableHead>סוג</TableHead>
                  <TableHead>ערכים</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customFields.length === 0 ? (
                  <TableEmptyRow
                    colSpan={4}
                    description="טרם הוגדרו שדות מותאמים."
                    icon={Boxes}
                    title="אין שדות"
                  />
                ) : (
                  customFields.map((field) => (
                    <TableRow key={field.id}>
                      <TableCell className="text-xs">{field.entityType}</TableCell>
                      <TableCell className="text-sm">
                        {field.label}
                        <span className="text-muted-foreground text-xs">
                          {" "}
                          ({field.key})
                        </span>
                      </TableCell>
                      <TableCell className="text-xs">{field.fieldType}</TableCell>
                      <TableCell className="text-sm">{field.valueCount}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 rounded-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale aria-hidden="true" className="size-5" />
            חוקים עסקיים (Business Rules)
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 lg:grid-cols-[1fr_1.6fr]">
          <form action={createBusinessRuleAction} className="grid gap-2">
            <p className="text-muted-foreground text-sm">
              סיווג סינכרוני של רשומות: כשהתנאי מתקיים — סימון/עדיפות/אישור/הסלמה.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Input name="name" placeholder="שם החוק" required />
              <Input name="entityType" placeholder="ישות (order)" required />
            </div>
            <div className="grid grid-cols-[1fr_auto_1fr] gap-2">
              <Input name="conditionField" placeholder="שדה" />
              <select
                aria-label="אופרטור"
                autoComplete="off"
                className="glass-control h-10 rounded-md border px-2 text-sm"
                defaultValue="gt"
                name="conditionOp"
              >
                {["eq", "neq", "gt", "gte", "lt", "lte", "contains", "in", "exists"].map(
                  (op) => (
                    <option key={op} value={op}>
                      {op}
                    </option>
                  ),
                )}
              </select>
              <Input name="conditionValue" placeholder="ערך" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select
                aria-label="פעולה"
                autoComplete="off"
                className="glass-control h-10 rounded-md border px-3 text-sm"
                defaultValue="REQUIRE_APPROVAL"
                name="actionType"
              >
                <option value="FLAG">סימון</option>
                <option value="SET_PRIORITY">עדיפות</option>
                <option value="REQUIRE_APPROVAL">דרישת אישור</option>
                <option value="ESCALATE">הסלמה</option>
                <option value="NOTIFY">התראה</option>
              </select>
              <Input name="actionDetail" placeholder="פירוט (רשות)" />
            </div>
            <Button className="w-fit" size="sm" type="submit">
              צור חוק
            </Button>
          </form>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>חוק</TableHead>
                <TableHead>תנאי</TableHead>
                <TableHead>פעולה</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {businessRules.length === 0 ? (
                <TableEmptyRow
                  colSpan={4}
                  description="טרם הוגדרו חוקים עסקיים."
                  icon={Scale}
                  title="אין חוקים"
                />
              ) : (
                businessRules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell className="text-sm">
                      <div className="font-medium">{rule.name}</div>
                      <div className="text-muted-foreground text-xs">
                        {rule.entityType} · #{rule.priority}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[10rem] truncate text-xs">
                      {rule.condition}
                    </TableCell>
                    <TableCell className="text-xs">
                      <Badge variant={rule.isActive ? "secondary" : "outline"}>
                        {rule.action}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <form action={toggleBusinessRuleAction}>
                          <input name="ruleId" type="hidden" value={rule.id} />
                          <input
                            name="isActive"
                            type="hidden"
                            value={rule.isActive ? "0" : "1"}
                          />
                          <Button size="sm" type="submit" variant="ghost">
                            {rule.isActive ? "כבה" : "הפעל"}
                          </Button>
                        </form>
                        <form action={deleteBusinessRuleAction}>
                          <input name="ruleId" type="hidden" value={rule.id} />
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
            <Timer aria-hidden="true" className="size-5" />
            יעדי SLA והסלמה
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 lg:grid-cols-[1fr_1.6fr]">
          <form action={upsertSlaPolicyAction} className="grid gap-2">
            <p className="text-muted-foreground text-sm">
              יעד תגובה/פתרון (בדקות) לכל ישות ורמת דחיפות. חריגה מזינה הסלמה.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Input name="name" placeholder="שם המדיניות" required />
              <Input name="entityType" placeholder="ישות" required />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <select
                aria-label="רמה"
                autoComplete="off"
                className="glass-control h-10 rounded-md border px-2 text-sm"
                defaultValue="STANDARD"
                name="tier"
              >
                <option value="LOW">נמוכה</option>
                <option value="STANDARD">רגילה</option>
                <option value="HIGH">גבוהה</option>
                <option value="URGENT">דחוף</option>
              </select>
              <Input
                defaultValue="60"
                min="1"
                name="responseMinutes"
                placeholder="תגובה (ד׳)"
                type="number"
              />
              <Input
                defaultValue="240"
                min="1"
                name="resolutionMinutes"
                placeholder="פתרון (ד׳)"
                type="number"
              />
            </div>
            <Button className="w-fit" size="sm" type="submit">
              שמור מדיניות
            </Button>
          </form>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>מדיניות</TableHead>
                <TableHead>ישות / רמה</TableHead>
                <TableHead>תגובה</TableHead>
                <TableHead>פתרון</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {slaPolicies.length === 0 ? (
                <TableEmptyRow
                  colSpan={4}
                  description="טרם הוגדרו יעדי SLA."
                  icon={Timer}
                  title="אין מדיניות"
                />
              ) : (
                slaPolicies.map((policy) => (
                  <TableRow key={policy.id}>
                    <TableCell className="text-sm">{policy.name}</TableCell>
                    <TableCell className="text-xs">
                      {policy.entityType} · {policy.tier}
                    </TableCell>
                    <TableCell className="text-sm">{policy.responseMinutes}ד׳</TableCell>
                    <TableCell className="text-sm">
                      {policy.resolutionMinutes}ד׳
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
            <Zap aria-hidden="true" className="size-5" />
            הרצות אחרונות
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>תהליך</TableHead>
                <TableHead>תוצאה</TableHead>
                <TableHead>מתי</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runs.length === 0 ? (
                <TableEmptyRow
                  colSpan={3}
                  description="טרם בוצעו הרצות."
                  icon={Play}
                  title="אין הרצות"
                />
              ) : (
                runs.map((run) => (
                  <TableRow key={run.id}>
                    <TableCell className="text-sm">{run.workflowName}</TableCell>
                    <TableCell>
                      <Badge variant={runStatusVariant[run.status] ?? "outline"}>
                        {run.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {run.createdAt.toLocaleString("he-IL")}
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
