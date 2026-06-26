import { db } from "~/server/db";

/**
 * Recruiting pipeline (HRX, §4.AG): job openings and candidates moving through
 * stages. The stage progression and roll-up are pure and exported for testing.
 */

export const RECRUITING_STAGES = [
  "APPLIED",
  "SCREEN",
  "INTERVIEW",
  "OFFER",
  "HIRED",
] as const;

/** The next stage in the pipeline (terminal stages stay put). Pure. */
export function nextStage(stage: string): string {
  if (stage === "HIRED" || stage === "REJECTED") return stage;
  const index = RECRUITING_STAGES.indexOf(stage as (typeof RECRUITING_STAGES)[number]);
  if (index < 0 || index >= RECRUITING_STAGES.length - 1) return "HIRED";
  return RECRUITING_STAGES[index + 1]!;
}

/** Counts candidates per stage. Pure. */
export function summarizeCandidatesByStage(
  candidates: Array<{ stage: string }>,
) {
  const counts: Record<string, number> = {};
  for (const candidate of candidates) {
    counts[candidate.stage] = (counts[candidate.stage] ?? 0) + 1;
  }
  return counts;
}

/** Creates a job opening. */
export async function createOpening(input: {
  title: string;
  department?: string;
  openings?: number;
}) {
  if (!input.title.trim()) throw new Error("כותרת המשרה היא שדה חובה.");

  return db.jobOpening.create({
    data: {
      title: input.title.trim(),
      department: input.department,
      openings: Math.max(1, Math.trunc(input.openings ?? 1)),
    },
  });
}

/** Sets an opening's status. */
export async function setOpeningStatus(input: {
  openingId: string;
  status: "OPEN" | "ON_HOLD" | "CLOSED";
}) {
  return db.jobOpening.update({
    where: { id: input.openingId },
    data: { status: input.status },
  });
}

/** Adds a candidate to an opening. */
export async function createCandidate(input: {
  openingId: string;
  name: string;
  email?: string;
}) {
  if (!input.name.trim()) throw new Error("שם המועמד הוא שדה חובה.");

  return db.jobCandidate.create({
    data: {
      openingId: input.openingId,
      name: input.name.trim(),
      email: input.email,
    },
  });
}

/** Advances a candidate to the next stage. */
export async function advanceCandidate(input: { candidateId: string }) {
  const candidate = await db.jobCandidate.findUnique({
    where: { id: input.candidateId },
    select: { stage: true },
  });
  if (!candidate) throw new Error("מועמד לא נמצא.");

  return db.jobCandidate.update({
    where: { id: input.candidateId },
    data: { stage: nextStage(candidate.stage) },
  });
}

/** Rejects a candidate. */
export async function rejectCandidate(input: { candidateId: string }) {
  return db.jobCandidate.update({
    where: { id: input.candidateId },
    data: { stage: "REJECTED" },
  });
}

/** Open job openings with candidate counts. */
export async function listOpenings(limit = 20) {
  const openings = await db.jobOpening.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      title: true,
      department: true,
      status: true,
      openings: true,
      _count: { select: { candidates: true } },
    },
  });

  return openings.map((opening) => ({
    id: opening.id,
    title: opening.title,
    department: opening.department,
    status: opening.status,
    openings: opening.openings,
    candidateCount: opening._count.candidates,
  }));
}

/** Recent candidates with their opening title. */
export async function listCandidates(limit = 30) {
  const candidates = await db.jobCandidate.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      name: true,
      stage: true,
      opening: { select: { title: true } },
    },
  });

  return candidates.map((candidate) => ({
    id: candidate.id,
    name: candidate.name,
    stage: candidate.stage,
    openingTitle: candidate.opening.title,
  }));
}

export async function getRecruitingSummary() {
  const candidates = await db.jobCandidate.findMany({ select: { stage: true } });
  const openOpenings = await db.jobOpening.count({ where: { status: "OPEN" } });
  return {
    openOpenings,
    byStage: summarizeCandidatesByStage(candidates),
    totalCandidates: candidates.length,
  };
}
