import { GraduationCap, Users } from "lucide-react";

import { AdminShell } from "../_components/admin-shell";
import {
  AdminDatabaseFallback,
  AdminForbidden,
} from "../_components/admin-states";
import { getAdminPageAccess } from "../_lib/access";
import {
  createCourseAction,
  enrollEmployeeAction,
  recordLessonProgressAction,
  setCourseStatusAction,
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
import { listEmployeesForSelect } from "~/server/services/hr-performance";
import { getLmsSummary, listCourses, listEnrollments } from "~/server/services/lms";

export const metadata = { title: "הדרכה | Admin" };

export const dynamic = "force-dynamic";

const statusLabel: Record<string, string> = {
  ENROLLED: "נרשם",
  IN_PROGRESS: "בתהליך",
  COMPLETED: "הושלם",
};

export default async function AdminLmsPage() {
  const access = await getAdminPageAccess("BLOG_READ", "/admin/lms");
  if (access.denied) return <AdminForbidden {...access.denied} />;

  const summary = await getLmsSummary().catch(() => null);
  if (!summary) return <AdminDatabaseFallback />;

  const [courses, enrollments, employees] = await Promise.all([
    listCourses().catch(() => []),
    listEnrollments().catch(() => []),
    listEmployeesForSelect().catch(() => []),
  ]);
  const publishedCourses = courses.filter((course) => course.status === "PUBLISHED");

  return (
    <AdminShell
      active="lms"
      admin={access.admin}
      description="הדרכה ואונבורדינג: קורסים, הרשמת עובדים ומעקב השלמה."
      title="הדרכה (LMS)"
    >
      <div className="grid gap-5 md:grid-cols-3">
        <MetricCard detail={`${summary.published} פורסמו`} icon={GraduationCap} label="קורסים" value={String(summary.courses)} />
        <MetricCard detail="הרשמות פעילות" icon={Users} label="הרשמות" value={String(summary.enrollments)} />
        <MetricCard detail="עובדים שסיימו קורס" icon={GraduationCap} label="השלמות" value={String(summary.completed)} />
      </div>

      <Card className="mt-6 rounded-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap aria-hidden="true" className="size-5" />
            קורסים
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 lg:grid-cols-[1fr_1.7fr]">
          <form action={createCourseAction} className="grid gap-2">
            <Input name="title" placeholder="שם הקורס" required />
            <Input name="description" placeholder="תיאור (רשות)" />
            <Input defaultValue="3" min="1" name="lessonCount" placeholder="מספר שיעורים" type="number" />
            <Button className="w-fit" size="sm" type="submit">צור קורס</Button>
          </form>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>קורס</TableHead>
                <TableHead>שיעורים</TableHead>
                <TableHead>הרשמות</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.length === 0 ? (
                <TableEmptyRow colSpan={4} description="טרם נוצרו קורסים." icon={GraduationCap} title="אין קורסים" />
              ) : (
                courses.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell className="text-sm">
                      <div className="font-medium">{course.title}</div>
                      <Badge className="mt-1" variant={course.status === "PUBLISHED" ? "secondary" : "outline"}>
                        {course.status === "PUBLISHED" ? "פורסם" : "טיוטה"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{course.lessonCount}</TableCell>
                    <TableCell className="text-sm">{course.enrollmentCount}</TableCell>
                    <TableCell>
                      <form action={setCourseStatusAction}>
                        <input name="courseId" type="hidden" value={course.id} />
                        <input name="status" type="hidden" value={course.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED"} />
                        <Button size="sm" type="submit" variant="ghost">
                          {course.status === "PUBLISHED" ? "בטל פרסום" : "פרסם"}
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
            <Users aria-hidden="true" className="size-5" />
            הרשמות ומעקב
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 lg:grid-cols-[1fr_1.7fr]">
          <form action={enrollEmployeeAction} className="grid gap-2">
            <select aria-label="קורס" autoComplete="off" className="glass-control h-10 rounded-md border px-3 text-sm" defaultValue="" name="courseId" required>
              <option disabled value="">בחר קורס…</option>
              {publishedCourses.map((course) => (
                <option key={course.id} value={course.id}>{course.title}</option>
              ))}
            </select>
            <select aria-label="עובד" autoComplete="off" className="glass-control h-10 rounded-md border px-3 text-sm" defaultValue="" name="employeeId" required>
              <option disabled value="">בחר עובד…</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>{employee.name}</option>
              ))}
            </select>
            <Button className="w-fit" size="sm" type="submit">הרשם</Button>
          </form>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>עובד</TableHead>
                <TableHead>קורס</TableHead>
                <TableHead>התקדמות</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {enrollments.length === 0 ? (
                <TableEmptyRow colSpan={4} description="טרם נרשמו עובדים." icon={Users} title="אין הרשמות" />
              ) : (
                enrollments.map((enrollment) => (
                  <TableRow key={enrollment.id}>
                    <TableCell className="text-sm">{enrollment.employeeName}</TableCell>
                    <TableCell className="max-w-[10rem] truncate text-xs">{enrollment.courseTitle}</TableCell>
                    <TableCell className="text-sm">
                      {enrollment.progress}%
                      <Badge className="mr-2" variant={enrollment.status === "COMPLETED" ? "secondary" : "outline"}>
                        {statusLabel[enrollment.status] ?? enrollment.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <form action={recordLessonProgressAction} className="flex items-center gap-1">
                        <input name="enrollmentId" type="hidden" value={enrollment.id} />
                        <Input aria-label="שיעורים שהושלמו" className="h-8 w-16" defaultValue={String(enrollment.completedLessons)} max={enrollment.lessonCount} min="0" name="completedLessons" type="number" />
                        <Button size="sm" type="submit" variant="outline">עדכן</Button>
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
