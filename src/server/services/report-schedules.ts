import { notificationProvider } from "~/server/adapters/notifications";
import { db } from "~/server/db";
import { toCsv } from "~/server/services/report-engine";
import { runReport } from "~/server/services/reports";

/** Parses comma/newline-separated recipient emails into a clean list. Pure. */
export function parseRecipients(input: string | null | undefined): string[] {
  if (!input) return [];
  return [
    ...new Set(
      input
        .split(/[,\n;]/)
        .map((part) => part.trim())
        .filter((part) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(part)),
    ),
  ];
}

/**
 * Scheduled reports (RPT-003): a saved report runs on a recurring cadence and
 * captures a CSV snapshot, processed by the report-schedules cron. The cadence
 * maths are pure + unit-tested.
 */

export const SCHEDULE_FREQUENCIES = ["DAILY", "WEEKLY", "MONTHLY"] as const;
export type ScheduleFrequency = (typeof SCHEDULE_FREQUENCIES)[number];

/** Normalizes free-text to a known frequency (defaults to WEEKLY). Pure. */
export function normalizeFrequency(value: string | undefined): ScheduleFrequency {
  const upper = (value ?? "").toUpperCase();
  return (SCHEDULE_FREQUENCIES as readonly string[]).includes(upper)
    ? (upper as ScheduleFrequency)
    : "WEEKLY";
}

/** The next run time after `from` for a frequency. Pure. */
export function computeNextRun(
  frequency: ScheduleFrequency,
  from: Date,
): Date {
  const next = new Date(from.getTime());
  if (frequency === "DAILY") {
    next.setUTCDate(next.getUTCDate() + 1);
  } else if (frequency === "WEEKLY") {
    next.setUTCDate(next.getUTCDate() + 7);
  } else {
    next.setUTCMonth(next.getUTCMonth() + 1);
  }
  return next;
}

/** Whether a schedule is due to run at `now`. Pure. */
export function isScheduleDue(nextRunAt: Date, now: Date): boolean {
  return nextRunAt.getTime() <= now.getTime();
}

export async function createReportSchedule(input: {
  reportId: string;
  frequency?: string;
  recipients?: string;
}) {
  const report = await db.reportDefinition.findUnique({
    where: { id: input.reportId },
    select: { id: true },
  });
  if (!report) throw new Error("דוח לא נמצא.");

  const frequency = normalizeFrequency(input.frequency);
  const recipients = parseRecipients(input.recipients);
  return db.reportSchedule.create({
    data: {
      reportId: input.reportId,
      frequency,
      recipients: recipients.length > 0 ? recipients.join(", ") : null,
      nextRunAt: computeNextRun(frequency, new Date()),
    },
  });
}

export async function setReportScheduleActive(input: {
  scheduleId: string;
  isActive: boolean;
}) {
  return db.reportSchedule.update({
    where: { id: input.scheduleId },
    data: { isActive: input.isActive },
  });
}

export async function deleteReportSchedule(input: { scheduleId: string }) {
  return db.reportSchedule.delete({ where: { id: input.scheduleId } });
}

/**
 * Runs all active, due schedules: executes each report, stores a CSV snapshot,
 * and advances lastRunAt/nextRunAt. Returns a processing summary.
 */
export async function runDueReportSchedules(
  input: { now?: Date; limit?: number } = {},
) {
  const now = input.now ?? new Date();
  const due = await db.reportSchedule.findMany({
    where: { isActive: true, nextRunAt: { lte: now } },
    take: input.limit ?? 25,
    select: { id: true, reportId: true, frequency: true, recipients: true },
  });

  let processed = 0;
  let failed = 0;
  let delivered = 0;
  for (const schedule of due) {
    try {
      const report = await runReport(schedule.reportId);
      const csv = toCsv(report.result);
      await db.reportRun.create({
        data: {
          scheduleId: schedule.id,
          reportName: report.name,
          rowCount: report.result.rowCount,
          csv,
        },
      });

      // Deliver to recipients (best-effort — a send failure never blocks the run).
      const recipients = parseRecipients(schedule.recipients);
      for (const to of recipients) {
        try {
          await notificationProvider.sendEmail({
            to,
            subject: `דוח מתוזמן: ${report.name}`,
            body: `הדוח "${report.name}" הופק (${report.result.rowCount} שורות).\n\n${csv.slice(0, 20000)}`,
          });
          delivered += 1;
        } catch (sendError) {
          if (process.env.NODE_ENV === "development") {
            console.error("[report-schedules] send failed", to, sendError);
          }
        }
      }

      await db.reportSchedule.update({
        where: { id: schedule.id },
        data: {
          lastRunAt: now,
          nextRunAt: computeNextRun(
            normalizeFrequency(schedule.frequency),
            now,
          ),
        },
      });
      processed += 1;
    } catch (error) {
      failed += 1;
      if (process.env.NODE_ENV === "development") {
        console.error("[report-schedules] run failed", schedule.id, error);
      }
    }
  }

  return { scanned: due.length, processed, failed, delivered };
}

export async function listReportSchedules(limit = 30) {
  const schedules = await db.reportSchedule.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      frequency: true,
      isActive: true,
      lastRunAt: true,
      nextRunAt: true,
      report: { select: { name: true } },
    },
  });
  return schedules.map((schedule) => ({
    id: schedule.id,
    reportName: schedule.report.name,
    frequency: schedule.frequency,
    isActive: schedule.isActive,
    lastRunAt: schedule.lastRunAt,
    nextRunAt: schedule.nextRunAt,
  }));
}

export async function listRecentReportRuns(limit = 15) {
  return db.reportRun.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      reportName: true,
      rowCount: true,
      createdAt: true,
    },
  });
}

export async function getReportRunCsv(id: string) {
  return db.reportRun.findUnique({
    where: { id },
    select: { csv: true, reportName: true },
  });
}
