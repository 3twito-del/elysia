import { db } from "~/server/db";

/**
 * Internal staff announcements / alerts center (COM, Phase 7).
 *
 * Announcements are published immediately, optionally pinned and expiring.
 * activeAnnouncements (pure) returns the currently-visible set, pinned first.
 */

export type AnnouncementLite = {
  isPinned: boolean;
  publishedAt: Date | null;
  expiresAt: Date | null;
};

/** Currently-visible announcements (published, unexpired), pinned first. Pure. */
export function activeAnnouncements<T extends AnnouncementLite>(
  announcements: T[],
  now: Date = new Date(),
): T[] {
  return announcements
    .filter(
      (announcement) =>
        announcement.publishedAt !== null &&
        announcement.publishedAt.getTime() <= now.getTime() &&
        (announcement.expiresAt === null ||
          announcement.expiresAt.getTime() > now.getTime()),
    )
    .sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return (b.publishedAt?.getTime() ?? 0) - (a.publishedAt?.getTime() ?? 0);
    });
}

/** Publishes a new announcement immediately. */
export async function createAnnouncement(input: {
  title: string;
  body: string;
  severity?: "INFO" | "WARNING" | "CRITICAL";
  isPinned?: boolean;
  expiresAt?: Date;
  authorAdminUserId?: string;
}) {
  return db.announcement.create({
    data: {
      title: input.title,
      body: input.body,
      severity: input.severity ?? "INFO",
      isPinned: input.isPinned ?? false,
      publishedAt: new Date(),
      expiresAt: input.expiresAt,
      authorAdminUserId: input.authorAdminUserId,
    },
  });
}

/** Toggles the pinned flag. */
export async function setAnnouncementPinned(input: {
  announcementId: string;
  isPinned: boolean;
}) {
  return db.announcement.update({
    where: { id: input.announcementId },
    data: { isPinned: input.isPinned },
  });
}

/** Expires an announcement now (hides it from the active set). */
export async function expireAnnouncement(input: { announcementId: string }) {
  return db.announcement.update({
    where: { id: input.announcementId },
    data: { expiresAt: new Date() },
  });
}

/** Currently-active announcements for the workspace. */
export async function listActiveAnnouncements(limit = 20) {
  const announcements = await db.announcement.findMany({
    orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }],
    take: limit,
    select: {
      id: true,
      title: true,
      body: true,
      severity: true,
      isPinned: true,
      publishedAt: true,
      expiresAt: true,
    },
  });

  return activeAnnouncements(announcements);
}
