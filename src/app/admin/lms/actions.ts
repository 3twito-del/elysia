"use server";

import type { AdminPermission } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "~/server/auth";
import {
  getAdminFromSession,
  hasAdminPermission,
} from "~/server/auth/admin-access";
import {
  addQuizQuestion,
  createCourse,
  enrollEmployee,
  parseQuizOptions,
  recordLessonProgress,
  setCourseStatus,
  submitQuizAttempt,
  upsertCourseQuiz,
} from "~/server/services/lms";

export async function createCourseAction(formData: FormData) {
  await requireAdmin("BLOG_WRITE");
  const title = stringValue(formData.get("title")).trim();
  if (!title) throw new Error("כותרת הקורס היא שדה חובה.");
  await createCourse({
    title,
    description: optionalString(formData.get("description")),
    lessonCount: Number(stringValue(formData.get("lessonCount"))) || 1,
  });
  revalidatePath("/admin/lms");
}

export async function setCourseStatusAction(formData: FormData) {
  await requireAdmin("BLOG_WRITE");
  const courseId = stringValue(formData.get("courseId"));
  if (!courseId) throw new Error("חסר מזהה קורס.");
  await setCourseStatus({ courseId, status: stringValue(formData.get("status")) });
  revalidatePath("/admin/lms");
}

export async function enrollEmployeeAction(formData: FormData) {
  await requireAdmin("BLOG_WRITE");
  const courseId = stringValue(formData.get("courseId"));
  const employeeId = stringValue(formData.get("employeeId"));
  if (!courseId || !employeeId) throw new Error("יש לבחור קורס ועובד.");
  await enrollEmployee({ courseId, employeeId });
  revalidatePath("/admin/lms");
}

export async function recordLessonProgressAction(formData: FormData) {
  await requireAdmin("BLOG_WRITE");
  const enrollmentId = stringValue(formData.get("enrollmentId"));
  if (!enrollmentId) throw new Error("חסר מזהה הרשמה.");
  await recordLessonProgress({
    enrollmentId,
    completedLessons: Number(stringValue(formData.get("completedLessons"))) || 0,
  });
  revalidatePath("/admin/lms");
}

export async function upsertCourseQuizAction(formData: FormData) {
  await requireAdmin("BLOG_WRITE");
  const courseId = stringValue(formData.get("courseId"));
  if (!courseId) throw new Error("חסר מזהה קורס.");
  await upsertCourseQuiz({
    courseId,
    passingScore: Number(stringValue(formData.get("passingScore"))) || 70,
  });
  revalidatePath("/admin/lms");
}

export async function addQuizQuestionAction(formData: FormData) {
  await requireAdmin("BLOG_WRITE");
  const quizId = stringValue(formData.get("quizId"));
  if (!quizId) throw new Error("חסר מזהה מבחן.");
  const prompt = stringValue(formData.get("prompt")).trim();
  if (!prompt) throw new Error("נדרש נוסח שאלה.");

  const { options, correctIndex } = parseQuizOptions(
    stringValue(formData.get("options")),
  );
  await addQuizQuestion({ quizId, prompt, options, correctIndex });
  revalidatePath("/admin/lms");
}

export async function submitQuizAttemptAction(formData: FormData) {
  await requireAdmin("BLOG_WRITE");
  const enrollmentId = stringValue(formData.get("enrollmentId"));
  if (!enrollmentId) throw new Error("חסר מזהה הרשמה.");

  const responses = stringValue(formData.get("responses"))
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .map((part) => Math.trunc(Number(part)));
  if (responses.length === 0) {
    throw new Error("יש להזין תשובות (אינדקסים מופרדים בפסיק, למשל 0,2,1).");
  }

  await submitQuizAttempt({ enrollmentId, responses });
  revalidatePath("/admin/lms");
}

async function requireAdmin(permission: AdminPermission) {
  const session = await auth();
  if (!session?.user) redirect("/admin/login?next=/admin/lms");
  const admin = await getAdminFromSession(session);
  if (!admin || !hasAdminPermission(admin, permission)) {
    throw new Error("אין הרשאה לבצע את הפעולה המבוקשת.");
  }
  return admin;
}

function optionalString(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function stringValue(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value : "";
}
