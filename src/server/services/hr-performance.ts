import { db } from "~/server/db";

/**
 * HR performance (HRX): review cycles + development goals per employee. The goal
 * roll-up and average rating are pure + unit-tested.
 */

export const REVIEW_STATUSES = ["DRAFT", "SUBMITTED", "ACKNOWLEDGED"] as const;
export const GOAL_STATUSES = ["OPEN", "IN_PROGRESS", "DONE"] as const;

/** Counts by status + average progress for a set of goals. Pure. */
export function summarizeGoals(goals: Array<{ status: string; progress: number }>) {
  let open = 0;
  let inProgress = 0;
  let done = 0;
  let progressSum = 0;
  for (const goal of goals) {
    if (goal.status === "DONE") done += 1;
    else if (goal.status === "IN_PROGRESS") inProgress += 1;
    else open += 1;
    progressSum += goal.progress;
  }
  return {
    total: goals.length,
    open,
    inProgress,
    done,
    avgProgress: goals.length > 0 ? Math.round(progressSum / goals.length) : 0,
  };
}

/** Average review rating (1 decimal). Pure. */
export function averageRating(reviews: Array<{ rating: number }>): number {
  if (reviews.length === 0) return 0;
  const sum = reviews.reduce((total, review) => total + review.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}

function clampRating(value: number): number {
  return Math.max(1, Math.min(5, Math.trunc(value)));
}

function clampProgress(value: number): number {
  return Math.max(0, Math.min(100, Math.trunc(value)));
}

function normalize<T extends string>(value: string | undefined, allowed: readonly T[], fallback: T): T {
  return value && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

export async function createReview(input: {
  employeeId: string;
  cycle: string;
  rating: number;
  summary?: string;
}) {
  if (!input.cycle.trim()) throw new Error("יש להזין מחזור הערכה.");
  return db.performanceReview.create({
    data: {
      employeeId: input.employeeId,
      cycle: input.cycle.trim(),
      rating: clampRating(input.rating),
      summary: input.summary,
    },
  });
}

export async function setReviewStatus(input: { reviewId: string; status: string }) {
  return db.performanceReview.update({
    where: { id: input.reviewId },
    data: { status: normalize(input.status, REVIEW_STATUSES, "DRAFT") },
  });
}

export async function createGoal(input: {
  employeeId: string;
  title: string;
  dueDate?: Date;
}) {
  if (!input.title.trim()) throw new Error("כותרת היעד היא שדה חובה.");
  return db.performanceGoal.create({
    data: {
      employeeId: input.employeeId,
      title: input.title.trim(),
      dueDate: input.dueDate,
    },
  });
}

export async function updateGoal(input: {
  goalId: string;
  status: string;
  progress: number;
}) {
  const status = normalize(input.status, GOAL_STATUSES, "OPEN");
  const progress = status === "DONE" ? 100 : clampProgress(input.progress);
  return db.performanceGoal.update({
    where: { id: input.goalId },
    data: { status, progress },
  });
}

export async function listEmployeesForSelect() {
  const employees = await db.employee.findMany({
    where: { status: "ACTIVE" },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    select: { id: true, firstName: true, lastName: true, role: true },
  });
  return employees.map((employee) => ({
    id: employee.id,
    name: `${employee.firstName} ${employee.lastName}`,
    role: employee.role,
  }));
}

export async function listReviews(limit = 25) {
  const reviews = await db.performanceReview.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      cycle: true,
      rating: true,
      status: true,
      employee: { select: { firstName: true, lastName: true } },
    },
  });
  return reviews.map((review) => ({
    id: review.id,
    cycle: review.cycle,
    rating: review.rating,
    status: review.status,
    employeeName: `${review.employee.firstName} ${review.employee.lastName}`,
  }));
}

export async function listGoals(limit = 30) {
  const goals = await db.performanceGoal.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      title: true,
      status: true,
      progress: true,
      employee: { select: { firstName: true, lastName: true } },
    },
  });
  return goals.map((goal) => ({
    id: goal.id,
    title: goal.title,
    status: goal.status,
    progress: goal.progress,
    employeeName: `${goal.employee.firstName} ${goal.employee.lastName}`,
  }));
}

export async function getPerformanceSummary() {
  const [reviews, goals] = await Promise.all([
    db.performanceReview.findMany({ select: { rating: true } }),
    db.performanceGoal.findMany({ select: { status: true, progress: true } }),
  ]);
  return {
    reviewCount: reviews.length,
    averageRating: averageRating(reviews),
    ...summarizeGoals(goals),
  };
}
