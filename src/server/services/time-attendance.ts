import { db } from "~/server/db";

/**
 * Time & attendance (HR-002): clock-in/out entries and leave requests. The
 * hours and leave-day maths are pure + unit-tested.
 */

export const LEAVE_TYPES = ["VACATION", "SICK", "UNPAID"] as const;
export type LeaveType = (typeof LEAVE_TYPES)[number];

function round2(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Normalizes free-text to a known leave type (defaults to VACATION). Pure. */
export function normalizeLeaveType(value: string | undefined): LeaveType {
  const upper = (value ?? "").toUpperCase();
  return (LEAVE_TYPES as readonly string[]).includes(upper)
    ? (upper as LeaveType)
    : "VACATION";
}

/**
 * Worked hours for a shift = (clockOut − clockIn) − break, floored at 0.
 * Returns 0 while the shift is still open (no clockOut). Pure.
 */
export function computeWorkedHours(
  clockIn: Date,
  clockOut: Date | null,
  breakMinutes: number,
): number {
  if (!clockOut) return 0;
  const grossMinutes = (clockOut.getTime() - clockIn.getTime()) / 60000;
  const net = grossMinutes - Math.max(0, breakMinutes);
  return round2(Math.max(0, net) / 60);
}

/** Inclusive leave-day count between two dates. Pure. */
export function computeLeaveDays(start: Date, end: Date): number {
  const startDay = Date.UTC(
    start.getUTCFullYear(),
    start.getUTCMonth(),
    start.getUTCDate(),
  );
  const endDay = Date.UTC(
    end.getUTCFullYear(),
    end.getUTCMonth(),
    end.getUTCDate(),
  );
  if (endDay < startDay) return 0;
  return Math.round((endDay - startDay) / (24 * 60 * 60 * 1000)) + 1;
}

/** Records an attendance entry (open or closed shift). */
export async function recordAttendance(input: {
  employeeId: string;
  workDate: Date;
  clockIn: Date;
  clockOut?: Date;
  breakMinutes?: number;
  notes?: string;
}) {
  if (!input.employeeId) throw new Error("יש לבחור עובד.");
  if (input.clockOut && input.clockOut.getTime() < input.clockIn.getTime()) {
    throw new Error("שעת יציאה מוקדמת משעת כניסה.");
  }
  return db.attendanceEntry.create({
    data: {
      employeeId: input.employeeId,
      workDate: input.workDate,
      clockIn: input.clockIn,
      clockOut: input.clockOut,
      breakMinutes: Math.max(0, Math.trunc(input.breakMinutes ?? 0)),
      notes: input.notes,
    },
  });
}

/** Creates a PENDING leave request, computing the inclusive day count. */
export async function createLeaveRequest(input: {
  employeeId: string;
  type?: string;
  startDate: Date;
  endDate: Date;
  notes?: string;
}) {
  if (!input.employeeId) throw new Error("יש לבחור עובד.");
  const days = computeLeaveDays(input.startDate, input.endDate);
  if (days <= 0) throw new Error("טווח התאריכים אינו תקין.");

  return db.leaveRequest.create({
    data: {
      employeeId: input.employeeId,
      type: normalizeLeaveType(input.type),
      startDate: input.startDate,
      endDate: input.endDate,
      days,
      notes: input.notes,
    },
  });
}

export async function setLeaveRequestStatus(input: {
  leaveRequestId: string;
  status: "APPROVED" | "REJECTED";
}) {
  const leave = await db.leaveRequest.findUnique({
    where: { id: input.leaveRequestId },
    select: { status: true },
  });
  if (!leave) throw new Error("בקשת חופשה לא נמצאה.");
  if (leave.status !== "PENDING") {
    throw new Error("ניתן להכריע רק בקשה ממתינה.");
  }
  return db.leaveRequest.update({
    where: { id: input.leaveRequestId },
    data: { status: input.status },
  });
}

function employeeName(employee: { firstName: string; lastName: string }) {
  return `${employee.firstName} ${employee.lastName}`;
}

export async function listAttendance(limit = 30) {
  const entries = await db.attendanceEntry.findMany({
    orderBy: [{ workDate: "desc" }, { clockIn: "desc" }],
    take: limit,
    select: {
      id: true,
      workDate: true,
      clockIn: true,
      clockOut: true,
      breakMinutes: true,
      employee: { select: { firstName: true, lastName: true } },
    },
  });
  return entries.map((entry) => ({
    id: entry.id,
    workDate: entry.workDate,
    employeeName: employeeName(entry.employee),
    hours: computeWorkedHours(entry.clockIn, entry.clockOut, entry.breakMinutes),
    open: entry.clockOut == null,
  }));
}

export async function listLeaveRequests(limit = 30) {
  const requests = await db.leaveRequest.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      type: true,
      startDate: true,
      endDate: true,
      days: true,
      status: true,
      employee: { select: { firstName: true, lastName: true } },
    },
  });
  return requests.map((request) => ({
    id: request.id,
    type: request.type,
    startDate: request.startDate,
    endDate: request.endDate,
    days: request.days,
    status: request.status,
    employeeName: employeeName(request.employee),
  }));
}

export async function getAttendanceSummary() {
  const [openShifts, pendingLeave] = await Promise.all([
    db.attendanceEntry.count({ where: { clockOut: null } }),
    db.leaveRequest.count({ where: { status: "PENDING" } }),
  ]);
  return { openShifts, pendingLeave };
}
