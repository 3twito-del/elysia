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

/** Grades quiz responses against the correct answer indexes. Pure. */
export function scoreQuiz(
  responses: number[],
  correctIndexes: number[],
): { correct: number; total: number; scorePct: number } {
  const total = correctIndexes.length;
  if (total === 0) return { correct: 0, total: 0, scorePct: 0 };
  let correct = 0;
  for (let i = 0; i < total; i += 1) {
    if (responses[i] === correctIndexes[i]) correct += 1;
  }
  return { correct, total, scorePct: Math.round((correct / total) * 100) };
}

/** Whether a score percentage meets the passing threshold. Pure. */
export function isQuizPassed(scorePct: number, passingScore: number): boolean {
  return scorePct >= passingScore;
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

// ---- quizzes ----

/** Creates (or updates the passing score of) a course's quiz. */
export async function upsertCourseQuiz(input: {
  courseId: string;
  passingScore?: number;
}) {
  const passingScore = Math.max(
    0,
    Math.min(100, Math.trunc(input.passingScore ?? 70)),
  );
  return db.courseQuiz.upsert({
    where: { courseId: input.courseId },
    create: { courseId: input.courseId, passingScore },
    update: { passingScore },
  });
}

/** Adds a multiple-choice question to a course quiz. */
export async function addQuizQuestion(input: {
  quizId: string;
  prompt: string;
  options: string[];
  correctIndex: number;
}) {
  const prompt = input.prompt.trim();
  if (!prompt) throw new Error("נדרש נוסח שאלה.");

  const options = input.options.map((option) => option.trim()).filter(Boolean);
  if (options.length < 2) throw new Error("נדרשות לפחות שתי תשובות אפשריות.");
  if (input.correctIndex < 0 || input.correctIndex >= options.length) {
    throw new Error("אינדקס התשובה הנכונה אינו בטווח האפשרויות.");
  }

  const count = await db.quizQuestion.count({ where: { quizId: input.quizId } });

  return db.quizQuestion.create({
    data: {
      quizId: input.quizId,
      prompt,
      options,
      correctIndex: input.correctIndex,
      sortOrder: count,
    },
  });
}

/** Parses free-text quiz answers "opt1 | opt2 | opt3*" — the starred option is correct. Pure. */
export function parseQuizOptions(input: string): {
  options: string[];
  correctIndex: number;
} {
  const parts = input
    .split("|")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
  if (parts.length < 2) throw new Error("נדרשות לפחות שתי תשובות אפשריות.");

  let correctIndex = -1;
  const options = parts.map((part, index) => {
    if (part.endsWith("*")) {
      correctIndex = index;
      return part.slice(0, -1).trim();
    }
    return part;
  });
  if (correctIndex < 0) {
    throw new Error('יש לסמן את התשובה הנכונה בכוכבית (למשל "תשובה*").');
  }
  return { options, correctIndex };
}

/**
 * Grades and stores a quiz attempt for an enrolment. If passed and the course
 * lessons are all done, the enrolment is not auto-changed — grading is separate
 * from lesson progress. Returns the attempt with its score/passed flag.
 */
export async function submitQuizAttempt(input: {
  enrollmentId: string;
  responses: number[];
}) {
  const enrollment = await db.courseEnrollment.findUnique({
    where: { id: input.enrollmentId },
    select: { courseId: true },
  });
  if (!enrollment) throw new Error("הרשמה לא נמצאה.");

  const quiz = await db.courseQuiz.findUnique({
    where: { courseId: enrollment.courseId },
    select: {
      id: true,
      passingScore: true,
      questions: {
        orderBy: { sortOrder: "asc" },
        select: { correctIndex: true },
      },
    },
  });
  if (!quiz) throw new Error("לקורס זה אין מבחן.");
  if (quiz.questions.length === 0) throw new Error("במבחן אין שאלות עדיין.");

  const { scorePct } = scoreQuiz(
    input.responses,
    quiz.questions.map((question) => question.correctIndex),
  );
  const passed = isQuizPassed(scorePct, quiz.passingScore);

  return db.quizAttempt.create({
    data: {
      quizId: quiz.id,
      enrollmentId: input.enrollmentId,
      score: scorePct,
      passed,
    },
  });
}

/** Quizzes keyed by course id, with question counts. */
export async function listQuizzesByCourse() {
  const quizzes = await db.courseQuiz.findMany({
    select: {
      id: true,
      courseId: true,
      passingScore: true,
      _count: { select: { questions: true, attempts: true } },
    },
  });
  return new Map(
    quizzes.map((quiz) => [
      quiz.courseId,
      {
        id: quiz.id,
        passingScore: quiz.passingScore,
        questionCount: quiz._count.questions,
        attemptCount: quiz._count.attempts,
      },
    ]),
  );
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
