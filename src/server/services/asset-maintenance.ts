import { db } from "~/server/db";
import { writeAdminAudit } from "~/server/services/admin-commerce-workflow";

/**
 * Preventive maintenance for fixed assets (FIN-FA-004): recurring service
 * schedules with a next-due date. The scheduling maths are pure + unit-tested.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

/** The next due date = base date + interval days. Pure. */
export function computeNextDue(base: Date, intervalDays: number): Date {
  const days = Math.max(1, Math.trunc(intervalDays));
  return new Date(base.getTime() + days * DAY_MS);
}

/** Maintenance posture relative to now. Pure. */
export function maintenanceStatus(
  nextDueAt: Date,
  now: Date,
  warnDays = 7,
): "OVERDUE" | "DUE_SOON" | "OK" {
  const diffMs = nextDueAt.getTime() - now.getTime();
  if (diffMs < 0) return "OVERDUE";
  return diffMs <= warnDays * DAY_MS ? "DUE_SOON" : "OK";
}

export async function createMaintenanceSchedule(input: {
  fixedAssetId: string;
  title: string;
  intervalDays: number;
  startDate?: Date;
  adminUserId: string;
}) {
  const title = input.title.trim();
  if (!input.fixedAssetId) throw new Error("יש לבחור נכס.");
  if (!title) throw new Error("יש להזין כותרת תחזוקה.");
  const intervalDays = Math.trunc(input.intervalDays);
  if (intervalDays <= 0) throw new Error("מרווח הימים חייב להיות חיובי.");

  const asset = await db.fixedAsset.findUnique({
    where: { id: input.fixedAssetId },
    select: { id: true },
  });
  if (!asset) throw new Error("נכס לא נמצא.");

  const start = input.startDate ?? new Date();

  return db.$transaction(async (tx) => {
    const schedule = await tx.maintenanceSchedule.create({
      data: {
        fixedAssetId: input.fixedAssetId,
        title,
        intervalDays,
        nextDueAt: computeNextDue(start, intervalDays),
      },
    });

    await writeAdminAudit(tx, {
      adminUserId: input.adminUserId,
      action: "maintenance_schedule_created",
      entity: "MaintenanceSchedule",
      entityId: schedule.id,
      metadata: { fixedAssetId: input.fixedAssetId, title: schedule.title },
    });

    return schedule;
  });
}

/** Records a completed service: sets lastServicedAt=now and advances nextDueAt. */
export async function recordMaintenance(input: {
  scheduleId: string;
  adminUserId: string;
}) {
  const schedule = await db.maintenanceSchedule.findUnique({
    where: { id: input.scheduleId },
    select: { intervalDays: true },
  });
  if (!schedule) throw new Error("תזמון תחזוקה לא נמצא.");

  const now = new Date();

  return db.$transaction(async (tx) => {
    const updated = await tx.maintenanceSchedule.update({
      where: { id: input.scheduleId },
      data: {
        lastServicedAt: now,
        nextDueAt: computeNextDue(now, schedule.intervalDays),
      },
    });

    await writeAdminAudit(tx, {
      adminUserId: input.adminUserId,
      action: "maintenance_recorded",
      entity: "MaintenanceSchedule",
      entityId: updated.id,
    });

    return updated;
  });
}

export async function setMaintenanceScheduleStatus(input: {
  scheduleId: string;
  status: "ACTIVE" | "PAUSED";
  adminUserId: string;
}) {
  return db.$transaction(async (tx) => {
    const updated = await tx.maintenanceSchedule.update({
      where: { id: input.scheduleId },
      data: { status: input.status },
    });

    await writeAdminAudit(tx, {
      adminUserId: input.adminUserId,
      action: "maintenance_schedule_status_updated",
      entity: "MaintenanceSchedule",
      entityId: updated.id,
      metadata: { status: updated.status },
    });

    return updated;
  });
}

export async function listMaintenanceSchedules(limit = 30) {
  const schedules = await db.maintenanceSchedule.findMany({
    orderBy: { nextDueAt: "asc" },
    take: limit,
    select: {
      id: true,
      title: true,
      intervalDays: true,
      lastServicedAt: true,
      nextDueAt: true,
      status: true,
      asset: { select: { assetNumber: true, name: true } },
    },
  });

  const now = new Date();
  return schedules.map((schedule) => ({
    id: schedule.id,
    title: schedule.title,
    intervalDays: schedule.intervalDays,
    lastServicedAt: schedule.lastServicedAt,
    nextDueAt: schedule.nextDueAt,
    status: schedule.status,
    assetLabel: `${schedule.asset.assetNumber} · ${schedule.asset.name}`,
    due: schedule.status === "ACTIVE"
      ? maintenanceStatus(schedule.nextDueAt, now)
      : "OK",
  }));
}

export async function getMaintenanceSummary() {
  const schedules = await db.maintenanceSchedule.findMany({
    where: { status: "ACTIVE" },
    select: { nextDueAt: true },
  });
  const now = new Date();
  let overdue = 0;
  let dueSoon = 0;
  for (const schedule of schedules) {
    const status = maintenanceStatus(schedule.nextDueAt, now);
    if (status === "OVERDUE") overdue += 1;
    if (status === "DUE_SOON") dueSoon += 1;
  }
  return { active: schedules.length, overdue, dueSoon };
}

/** Active fixed assets for the maintenance-schedule select. */
export async function listAssetsForMaintenance() {
  const assets = await db.fixedAsset.findMany({
    where: { status: "ACTIVE" },
    orderBy: { assetNumber: "asc" },
    select: { id: true, assetNumber: true, name: true },
  });
  return assets.map((asset) => ({
    id: asset.id,
    label: `${asset.assetNumber} · ${asset.name}`,
  }));
}
