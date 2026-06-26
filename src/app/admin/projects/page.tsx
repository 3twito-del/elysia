import { Briefcase, Coins, FolderKanban, Timer, Wallet } from "lucide-react";

import { AdminShell } from "../_components/admin-shell";
import {
  AdminDatabaseFallback,
  AdminForbidden,
} from "../_components/admin-states";
import { getAdminPageAccess } from "../_lib/access";
import {
  addMilestoneAction,
  completeMilestoneAction,
  createProjectAction,
  invoiceMilestoneAction,
  logTimeAction,
  setProjectStatusAction,
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
  getProjectDetail,
  getProjectsSummary,
  listProjects,
} from "~/server/services/projects";

export const metadata = {
  title: "פרויקטים | Admin",
};

export const dynamic = "force-dynamic";

const statusLabel: Record<string, string> = {
  PLANNING: "בתכנון",
  ACTIVE: "פעיל",
  ON_HOLD: "מושהה",
  COMPLETED: "הושלם",
  CANCELLED: "בוטל",
};

const statusOptions = ["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"];

const healthLabel: Record<string, string> = {
  ON_TRACK: "במסלול",
  AT_RISK: "בסיכון",
  OVER_BUDGET: "חריגת תקציב",
  CLOSED: "סגור",
};

const healthVariant: Record<string, "secondary" | "outline" | "destructive"> = {
  ON_TRACK: "secondary",
  AT_RISK: "outline",
  OVER_BUDGET: "destructive",
  CLOSED: "outline",
};

const milestoneStatusLabel: Record<string, string> = {
  PENDING: "ממתין",
  COMPLETED: "הושלם",
  INVOICED: "חויב",
};

export default async function AdminProjectsPage() {
  const access = await getAdminPageAccess("ERP_READ", "/admin/projects");

  if (access.denied) return <AdminForbidden {...access.denied} />;

  const summary = await getProjectsSummary().catch(() => null);

  if (!summary) return <AdminDatabaseFallback />;

  const projects = await listProjects().catch(() => []);
  const focus = projects[0]
    ? await getProjectDetail(projects[0].id).catch(() => null)
    : null;

  return (
    <AdminShell
      active="projects"
      admin={access.admin}
      description="פרויקטים: תקציב, אבני דרך לחיוב, ורישום שעות מול עלות מתוכננת."
      title="פרויקטים"
    >
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          detail="פרויקטים פעילים כעת"
          icon={FolderKanban}
          label="פעילים"
          value={String(summary.activeCount)}
        />
        <MetricCard
          detail="סך התקציב המתוכנן"
          icon={Wallet}
          label="תקציב"
          value={formatPrice(summary.totalBudget)}
        />
        <MetricCard
          detail="עלות שעות שנרשמו"
          icon={Coins}
          label="נוצל"
          value={formatPrice(summary.totalSpent)}
        />
        <MetricCard
          detail="שעות חייבות שטרם חויבו"
          icon={Timer}
          label="לחיוב"
          value={formatPrice(summary.totalUnbilled)}
        />
      </div>

      <Card className="mt-6 rounded-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase aria-hidden="true" className="size-5" />
            פרויקטים
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 lg:grid-cols-[1fr_1.7fr]">
          <form action={createProjectAction} className="grid gap-2">
            <p className="text-muted-foreground text-sm">
              פתיחת פרויקט עם תקציב ושיטת חיוב. קוד הפרויקט מוקצה אוטומטית.
            </p>
            <Input name="name" placeholder="שם הפרויקט" required />
            <div className="grid grid-cols-2 gap-2">
              <Input
                min="0"
                name="budgetAmount"
                placeholder="תקציב (₪)"
                step="0.01"
                type="number"
              />
              <select
                aria-label="שיטת חיוב"
                autoComplete="off"
                className="glass-control h-10 rounded-md border px-3 text-sm"
                defaultValue="MILESTONE"
                name="billingType"
              >
                <option value="MILESTONE">לפי אבני דרך</option>
                <option value="FIXED">מחיר קבוע</option>
                <option value="TIME_AND_MATERIALS">לפי זמן וחומרים</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input
                aria-label="תאריך התחלה"
                name="startDate"
                type="date"
              />
              <Input aria-label="תאריך סיום" name="endDate" type="date" />
            </div>
            <Button className="w-fit" size="sm" type="submit">
              פתח פרויקט
            </Button>
          </form>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>פרויקט</TableHead>
                <TableHead>תקציב</TableHead>
                <TableHead>נוצל</TableHead>
                <TableHead>בריאות</TableHead>
                <TableHead>סטטוס</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.length === 0 ? (
                <TableEmptyRow
                  colSpan={5}
                  description="טרם נפתחו פרויקטים."
                  icon={FolderKanban}
                  title="אין פרויקטים"
                />
              ) : (
                projects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell className="text-sm">
                      <div className="font-medium">{project.name}</div>
                      <div className="text-muted-foreground text-xs">
                        {project.code} · {project.billingTypeLabel}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatPrice(project.budget)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatPrice(project.spent)}
                      <span className="text-muted-foreground text-xs">
                        {" "}
                        ({project.utilization}%)
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={healthVariant[project.health] ?? "outline"}>
                        {healthLabel[project.health] ?? project.health}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <form
                        action={setProjectStatusAction}
                        className="flex items-center gap-1"
                      >
                        <input
                          name="projectId"
                          type="hidden"
                          value={project.id}
                        />
                        <select
                          aria-label="סטטוס פרויקט"
                          autoComplete="off"
                          className="glass-control h-9 rounded-md border px-2 text-xs"
                          defaultValue={project.status}
                          name="status"
                        >
                          {statusOptions.map((status) => (
                            <option key={status} value={status}>
                              {statusLabel[status] ?? status}
                            </option>
                          ))}
                        </select>
                        <Button size="sm" type="submit" variant="outline">
                          עדכן
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
              <Timer aria-hidden="true" className="size-5" />
              אבני דרך ושעות
            </span>
            {focus ? (
              <span className="text-muted-foreground text-sm font-normal">
                {focus.code} · {focus.name}
              </span>
            ) : null}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 lg:grid-cols-2">
          <div className="grid gap-5">
            <form action={addMilestoneAction} className="grid gap-2">
              <p className="text-muted-foreground text-sm">הוספת אבן דרך לחיוב.</p>
              <select
                aria-label="פרויקט"
                autoComplete="off"
                className="glass-control h-10 rounded-md border px-3 text-sm"
                defaultValue=""
                name="projectId"
                required
              >
                <option disabled value="">
                  בחר פרויקט…
                </option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.code} · {project.name}
                  </option>
                ))}
              </select>
              <Input name="name" placeholder="שם אבן הדרך" required />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  min="0"
                  name="amount"
                  placeholder="סכום (₪)"
                  step="0.01"
                  type="number"
                />
                <Input aria-label="תאריך יעד" name="dueDate" type="date" />
              </div>
              <Button className="w-fit" size="sm" type="submit">
                הוסף אבן דרך
              </Button>
            </form>

            <form action={logTimeAction} className="grid gap-2 border-t pt-4">
              <p className="text-muted-foreground text-sm">רישום שעות עבודה.</p>
              <select
                aria-label="פרויקט"
                autoComplete="off"
                className="glass-control h-10 rounded-md border px-3 text-sm"
                defaultValue=""
                name="projectId"
                required
              >
                <option disabled value="">
                  בחר פרויקט…
                </option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.code} · {project.name}
                  </option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  min="0"
                  name="hours"
                  placeholder="שעות"
                  required
                  step="0.25"
                  type="number"
                />
                <Input
                  min="0"
                  name="ratePerHour"
                  placeholder="תעריף לשעה (₪)"
                  step="0.01"
                  type="number"
                />
              </div>
              <Input name="description" placeholder="תיאור (רשות)" />
              <Button className="w-fit" size="sm" type="submit">
                רשום שעות
              </Button>
            </form>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>אבן דרך</TableHead>
                <TableHead>סכום</TableHead>
                <TableHead>סטטוס</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {!focus || focus.milestones.length === 0 ? (
                <TableEmptyRow
                  colSpan={4}
                  description="טרם הוגדרו אבני דרך לפרויקט המוצג."
                  icon={Coins}
                  title="אין אבני דרך"
                />
              ) : (
                focus.milestones.map((milestone) => (
                  <TableRow key={milestone.id}>
                    <TableCell className="text-sm">{milestone.name}</TableCell>
                    <TableCell className="text-sm">
                      {formatPrice(milestone.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          milestone.status === "INVOICED"
                            ? "secondary"
                            : milestone.status === "COMPLETED"
                              ? "outline"
                              : "outline"
                        }
                      >
                        {milestoneStatusLabel[milestone.status] ??
                          milestone.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {milestone.status === "PENDING" ? (
                        <form action={completeMilestoneAction}>
                          <input
                            name="milestoneId"
                            type="hidden"
                            value={milestone.id}
                          />
                          <Button size="sm" type="submit" variant="outline">
                            סמן הושלם
                          </Button>
                        </form>
                      ) : milestone.status === "COMPLETED" ? (
                        <form action={invoiceMilestoneAction}>
                          <input
                            name="milestoneId"
                            type="hidden"
                            value={milestone.id}
                          />
                          <Button size="sm" type="submit" variant="outline">
                            חייב
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
    </AdminShell>
  );
}
