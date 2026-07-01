import { db } from "~/server/db";

/**
 * Employee training / LMS (KNW-002): courses + enrolments with progress. The
 * progress percentage and derived enrolment status are pure + unit-tested.
 */

/** Course completion percentage. Pure. */
export function courseProgress(completedLessons: number, lessonCount: number): number {
  if (lessonCount <= 0) return 0;
  const pct = (Math.min(completedLessons, lessonCount) / lessonCount) * 100;
  return Math.round(pct);
}

/** Derived enrolment status from progress. Pure. */
export function enrollmentStatus(
  completedLessons: number,
  lessonCount: number,
): "ENROLLED" | "IN_PROGRESS" | "COMPLETED" {
  if (completedLessons <= 0) return "ENROLLED";
  if (completedLessons >= lessonCount) return "COMPLETED";
  return "IN_PROGRESS";
}

export async function createCourse(input: {
  title: string;
  description?: string;
  lessonCount?: number;
}) {
  if (!input.title.trim()) throw new Error("כותרת הקורס היא שדה חובה.");
  return db.course.create({
    data: {
      title: input.title.trim(),
      description: input.description,
      lessonCount: Math.max(1, Math.trunc(input.lessonCount ?? 1)),
    },
  });
}

export async function setCourseStatus(input: { courseId: string; status: string }) {
  return db.course.update({
    where: { id: input.courseId },
    data: { status: input.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT" },
  });
}

export async function enrollEmployee(input: { courseId: string; employeeId: string }) {
  return db.courseEnrollment.upsert({
    where: {
      courseId_employeeId: {
        courseId: input.courseId,
        employeeId: input.employeeId,
      },
    },
    create: { courseId: input.courseId, employeeId: input.employeeId },
    update: {},
  });
}

/** Sets an enrolment's completed-lesson count and derives status/completion. */
export async function recordLessonProgress(input: {
  enrollmentId: string;
  completedLessons: number;
}) {
  const enrollment = await db.courseEnrollment.findUnique({
    where: { id: input.enrollmentId },
    select: { course: { select: { lessonCount: true } } },
  });
  if (!enrollment) throw new Error("הרשמה לא נמצאה.");

  const lessonCount = enrollment.course.lessonCount;
  const completed = Math.max(0, Math.min(input.completedLessons, lessonCount));
  const status = enrollmentStatus(completed, lessonCount);
  return db.courseEnrollment.update({
    where: { id: input.enrollmentId },
    data: {
      completedLessons: completed,
      status,
      completedAt: status === "COMPLETED" ? new Date() : null,
    },
  });
}

export async function listCourses(limit = 30) {
  const courses = await db.course.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      title: true,
      lessonCount: true,
      status: true,
      _count: { select: { enrollments: true } },
    },
  });
  return courses.map((course) => ({
    id: course.id,
    title: course.title,
    lessonCount: course.lessonCount,
    status: course.status,
    enrollmentCount: course._count.enrollments,
  }));
}

export async function listEnrollments(limit = 40) {
  const enrollments = await db.courseEnrollment.findMany({
    orderBy: { updatedAt: "desc" },
    take: limit,
    select: {
      id: true,
      completedLessons: true,
      status: true,
      employeeId: true,
      course: { select: { title: true, lessonCount: true } },
    },
  });

  const employees = await db.employee.findMany({
    where: { id: { in: enrollments.map((e) => e.employeeId) } },
    select: { id: true, firstName: true, lastName: true },
  });
  const nameById = new Map(
    employees.map((e) => [e.id, `${e.firstName} ${e.lastName}`]),
  );

  return enrollments.map((enrollment) => ({
    id: enrollment.id,
    courseTitle: enrollment.course.title,
    employeeName: nameById.get(enrollment.employeeId) ?? "—",
    status: enrollment.status,
    completedLessons: enrollment.completedLessons,
    lessonCount: enrollment.course.lessonCount,
    progress: courseProgress(enrollment.completedLessons, enrollment.course.lessonCount),
  }));
}

export async function getLmsSummary() {
  const [courses, published, enrollments, completed] = await Promise.all([
    db.course.count(),
    db.course.count({ where: { status: "PUBLISHED" } }),
    db.courseEnrollment.count(),
    db.courseEnrollment.count({ where: { status: "COMPLETED" } }),
  ]);
  return { courses, published, enrollments, completed };
}
