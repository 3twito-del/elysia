import { Star, Target, Users } from "lucide-react";

import { AdminShell } from "../_components/admin-shell";
import {
  AdminDatabaseFallback,
  AdminForbidden,
} from "../_components/admin-states";
import { getAdminPageAccess } from "../_lib/access";
import {
  createGoalAction,
  createReviewAction,
  setReviewStatusAction,
  updateGoalAction,
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
  getPerformanceSummary,
  GOAL_STATUSES,
  listEmployeesForSelect,
  listGoals,
  listReviews,
  REVIEW_STATUSES,
} from "~/server/services/hr-performance";

export const metadata = {
  title: "ביצועים | Admin",
};

export const dynamic = "force-dynamic";

const reviewStatusLabel: Record<string, string> = {
  DRAFT: "טיוטה",
  SUBMITTED: "הוגש",
  ACKNOWLEDGED: "אושר",
};

const goalStatusLabel: Record<string, string> = {
  OPEN: "פתוח",
  IN_PROGRESS: "בתהליך",
  DONE: "הושלם",
};

export default async function AdminPerformancePage() {
  const access = await getAdminPageAccess("ERP_READ", "/admin/performance");

  if (access.denied) return <AdminForbidden {...access.denied} />;

  const summary = await getPerformanceSummary().catch(() => null);

  if (!summary) return <AdminDatabaseFallback />;

  const [employees, reviews, goals] = await Promise.all([
    listEmployeesForSelect().catch(() => []),
    listReviews().catch(() => []),
    listGoals().catch(() => []),
  ]);

  return (
    <AdminShell
      active="performance"
      admin={access.admin}
      description="ניהול ביצועים: מחזורי הערכה, דירוגים ויעדי פיתוח לעובדים."
      title="ביצועים"
    >
      <div className="grid gap-5 md:grid-cols-3">
        <MetricCard
          detail={`דירוג ממוצע ${summary.averageRating}`}
          icon={Star}
          label="הערכות"
          value={String(summary.reviewCount)}
        />
        <MetricCard
          detail={`${summary.done} הושלמו`}
          icon={Target}
          label="יעדים"
          value={String(summary.total)}
        />
        <MetricCard
          detail="התקדמות ממוצעת ביעדים"
          icon={Users}
          label="התקדמות"
          value={`${summary.avgProgress}%`}
        />
      </div>

      <Card className="mt-6 rounded-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star aria-hidden="true" className="size-5" />
            הערכות ביצועים
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 lg:grid-cols-[1fr_1.7fr]">
          <form action={createReviewAction} className="grid gap-2">
            <select
              aria-label="עובד"
              autoComplete="off"
              className="glass-control h-10 rounded-md border px-3 text-sm"
              defaultValue=""
              name="employeeId"
              required
            >
              <option disabled value="">
                בחר עובד…
              </option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name}
                  {employee.role ? ` · ${employee.role}` : ""}
                </option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <Input name="cycle" placeholder="מחזור (2026-H1)" required />
              <Input
                defaultValue="3"
                max="5"
                min="1"
                name="rating"
                placeholder="דירוג 1-5"
                type="number"
              />
            </div>
            <Input name="summary" placeholder="סיכום (רשות)" />
            <Button className="w-fit" size="sm" type="submit">
              צור הערכה
            </Button>
          </form>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>עובד</TableHead>
                <TableHead>מחזור</TableHead>
                <TableHead>דירוג</TableHead>
                <TableHead>סטטוס</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reviews.length === 0 ? (
                <TableEmptyRow
                  colSpan={4}
                  description="טרם נוצרו הערכות."
                  icon={Star}
                  title="אין הערכות"
                />
              ) : (
                reviews.map((review) => (
                  <TableRow key={review.id}>
                    <TableCell className="text-sm">{review.employeeName}</TableCell>
                    <TableCell className="text-xs">{review.cycle}</TableCell>
                    <TableCell className="text-sm">{review.rating}/5</TableCell>
                    <TableCell>
                      <form
                        action={setReviewStatusAction}
                        className="flex items-center gap-1"
                      >
                        <input name="reviewId" type="hidden" value={review.id} />
                        <select
                          aria-label="סטטוס"
                          autoComplete="off"
                          className="glass-control h-8 rounded-md border px-1 text-xs"
                          defaultValue={review.status}
                          name="status"
                        >
                          {REVIEW_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {reviewStatusLabel[status] ?? status}
                            </option>
                          ))}
                        </select>
                        <Button size="sm" type="submit" variant="ghost">
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
          <CardTitle className="flex items-center gap-2">
            <Target aria-hidden="true" className="size-5" />
            יעדי פיתוח
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 lg:grid-cols-[1fr_1.7fr]">
          <form action={createGoalAction} className="grid gap-2">
            <select
              aria-label="עובד"
              autoComplete="off"
              className="glass-control h-10 rounded-md border px-3 text-sm"
              defaultValue=""
              name="employeeId"
              required
            >
              <option disabled value="">
                בחר עובד…
              </option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name}
                </option>
              ))}
            </select>
            <Input name="title" placeholder="כותרת היעד" required />
            <Input aria-label="תאריך יעד" name="dueDate" type="date" />
            <Button className="w-fit" size="sm" type="submit">
              הוסף יעד
            </Button>
          </form>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>יעד</TableHead>
                <TableHead>עובד</TableHead>
                <TableHead>התקדמות / סטטוס</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {goals.length === 0 ? (
                <TableEmptyRow
                  colSpan={3}
                  description="טרם הוגדרו יעדים."
                  icon={Target}
                  title="אין יעדים"
                />
              ) : (
                goals.map((goal) => (
                  <TableRow key={goal.id}>
                    <TableCell className="text-sm">
                      <div className="font-medium">{goal.title}</div>
                      <Badge
                        className="mt-1"
                        variant={goal.status === "DONE" ? "secondary" : "outline"}
                      >
                        {goalStatusLabel[goal.status] ?? goal.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">{goal.employeeName}</TableCell>
                    <TableCell>
                      <form
                        action={updateGoalAction}
                        className="flex items-center gap-1"
                      >
                        <input name="goalId" type="hidden" value={goal.id} />
                        <Input
                          aria-label="התקדמות"
                          className="h-8 w-16"
                          defaultValue={String(goal.progress)}
                          max="100"
                          min="0"
                          name="progress"
                          type="number"
                        />
                        <select
                          aria-label="סטטוס"
                          autoComplete="off"
                          className="glass-control h-8 rounded-md border px-1 text-xs"
                          defaultValue={goal.status}
                          name="status"
                        >
                          {GOAL_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {goalStatusLabel[status] ?? status}
                            </option>
                          ))}
                        </select>
                        <Button size="sm" type="submit" variant="ghost">
                          שמור
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
    </AdminShell>
  );
}
