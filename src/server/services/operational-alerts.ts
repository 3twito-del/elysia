// ADR 0007 (docs/DECISIONS.md): P0 observability means business-invariant
// observability, not generic logging. Violations write a durable
// OperationalAlert with dedup identity; acknowledgment silences noise; only
// resolution (the invariant no longer violated) closes the alert.

import { notificationProvider } from "~/server/adapters/notifications";
import { env } from "~/env";
import { db } from "~/server/db";
import { countRecentAdminLoginFailures } from "~/server/services/admin-security";
import { getEventClassPolicy } from "~/server/services/event-classes";
import { recordJobRun } from "~/server/services/outbox";
import {
  checkShopifyIntegrationDrift,
  type ShopifyIntegrationDriftReport,
} from "~/server/services/shopify-integration-drift";
import { checkTypesenseConnectivity } from "~/server/adapters/search";

export const ALERT_SWEEP_JOB_NAME = "operational-alert-sweep";

/** Expired reservation grace before it becomes an operational violation. */
const RESERVATION_RELEASE_GRACE_MINUTES = 15;

/** PAID own-sale order must have its GL sale entry within this window. */
const PAID_WITHOUT_GL_THRESHOLD_MINUTES = 15;

/** Escalating notification cooldowns until acknowledged (ADR 0007 §3). */
export const ALERT_ESCALATION_COOLDOWNS_MS = [
  0,
  15 * 60_000,
  60 * 60_000,
  240 * 60_000,
] as const;

export type OperationalAlertClass =
  | "MONEY"
  | "INVENTORY"
  | "SECURITY"
  | "CUSTOMER_COMMUNICATION"
  | "OUTBOX"
  | "ANALYTICS"
  | "SYSTEM";

export type OperationalAlertSeverity = "P0" | "P1" | "P2";

export type AlertViolation = {
  alertKey: string;
  class: OperationalAlertClass;
  severity: OperationalAlertSeverity;
  invariant: string;
  message: string;
  entityType?: string;
  entityId?: string;
  measuredValue?: string;
  thresholdValue?: string;
  remediationHint?: string;
};

/**
 * Pure: which escalation delay applies before the next notification.
 * Beyond the ladder the last cooldown repeats.
 */
export function nextNotificationDelayMs(notifyCount: number) {
  const index = Math.min(
    Math.max(notifyCount, 0),
    ALERT_ESCALATION_COOLDOWNS_MS.length - 1,
  );

  return ALERT_ESCALATION_COOLDOWNS_MS[index] ?? 0;
}

/**
 * Pure: money-class P0 alerts are loud and repeat with escalating cooldowns
 * until acknowledged; other severities notify once; acknowledged, resolved,
 * and suppressed alerts never notify. Dashboard visibility is unconditional.
 */
export function shouldNotifyAlert(input: {
  status: string;
  severity: string;
  notifyCount: number;
  lastNotifiedAt: Date | null;
  now: Date;
}) {
  if (input.status !== "OPEN") {
    return false;
  }

  if (input.severity === "P2") {
    return false;
  }

  if (input.notifyCount === 0) {
    return true;
  }

  if (input.severity !== "P0") {
    return false;
  }

  if (!input.lastNotifiedAt) {
    return true;
  }

  const delay = nextNotificationDelayMs(input.notifyCount);

  return input.now.getTime() - input.lastNotifiedAt.getTime() >= delay;
}

/**
 * Pure: class-aware outbox invariants (ADR 0003 registry × ADR 0007 sweep).
 * Overdue pending/failed events aggregate per event class; dead-letters
 * aggregate per event type. One stuck payment produces one alert with
 * occurrence counting — never sixty emails an hour.
 */
export function evaluateOutboxInvariants(input: {
  events: { type: string; status: string; createdAt: Date }[];
  now: Date;
}): AlertViolation[] {
  const overdueByClass = new Map<string, { count: number; oldestMinutes: number }>();
  const deadLetterByType = new Map<string, number>();

  for (const event of input.events) {
    const policy = getEventClassPolicy(event.type);

    if (event.status === "DEAD_LETTER") {
      deadLetterByType.set(
        event.type,
        (deadLetterByType.get(event.type) ?? 0) + 1,
      );
      continue;
    }

    const ageMinutes =
      (input.now.getTime() - event.createdAt.getTime()) / 60_000;

    if (ageMinutes <= policy.alertAfterMinutes) {
      continue;
    }

    const existing = overdueByClass.get(policy.class) ?? {
      count: 0,
      oldestMinutes: 0,
    };
    overdueByClass.set(policy.class, {
      count: existing.count + 1,
      oldestMinutes: Math.max(existing.oldestMinutes, ageMinutes),
    });
  }

  const violations: AlertViolation[] = [];

  for (const [eventClass, data] of overdueByClass) {
    const isMoney = eventClass === "MONEY";
    violations.push({
      alertKey: `outbox-overdue:${eventClass}`,
      class: isMoney ? "MONEY" : outboxAlertClass(eventClass),
      severity: isMoney ? "P0" : overdueSeverity(eventClass),
      invariant: "outbox-events-converge-within-class-slo",
      message: `${data.count} ${eventClass} outbox event(s) unprocessed beyond the class SLO; oldest is ${Math.round(data.oldestMinutes)} minutes old.`,
      measuredValue: `${Math.round(data.oldestMinutes)}m`,
      thresholdValue: `${getClassAlertThresholdMinutes(eventClass)}m`,
      remediationHint:
        "Run the outbox worker (POST /api/jobs/outbox) and inspect OutboxEvent.lastError for the oldest event.",
    });
  }

  for (const [eventType, count] of deadLetterByType) {
    const policy = getEventClassPolicy(eventType);
    const isMoney = policy.class === "MONEY";
    violations.push({
      alertKey: `outbox-dead-letter:${eventType}`,
      class: isMoney ? "MONEY" : outboxAlertClass(policy.class),
      severity: isMoney ? "P0" : "P1",
      invariant: "no-dead-lettered-business-events",
      message: `${count} ${eventType} event(s) dead-lettered after exhausting retries.`,
      measuredValue: String(count),
      thresholdValue: "0",
      remediationHint:
        "Inspect OutboxEvent.lastError, fix the handler or payload, then requeue the event deliberately.",
    });
  }

  return violations;
}

/** Pure: turns a Shopify drift report (K-06) into alert violations, if any. */
export function buildShopifyDriftViolations(
  drift: ShopifyIntegrationDriftReport | null,
): AlertViolation[] {
  if (!drift || drift.ok) return [];

  const violations: AlertViolation[] = [];

  for (const webhook of drift.webhooks) {
    if (webhook.status === "ok") continue;

    violations.push({
      alertKey: `shopify-webhook-drift:${webhook.topic}`,
      class: "SYSTEM",
      severity: "P1",
      invariant: "shopify-order-webhooks-registered-and-current",
      message:
        webhook.status === "missing"
          ? `Shopify webhook topic "${webhook.topic}" is not registered.`
          : `Shopify webhook topic "${webhook.topic}" points at an unexpected address: ${webhook.registeredAddress}.`,
      entityType: "ShopifyWebhookSubscription",
      entityId: webhook.topic,
      remediationHint:
        "Re-register the missing/misdirected webhook topic in the Shopify admin (Settings > Notifications > Webhooks) pointing at /api/webhooks/shopify/orders.",
    });
  }

  if (drift.missingScopes.length > 0) {
    violations.push({
      alertKey: "shopify-scope-drift",
      class: "SYSTEM",
      severity: "P1",
      invariant: "shopify-admin-token-has-required-scopes",
      message: `Shopify admin token is missing required scope(s): ${drift.missingScopes.join(", ")}.`,
      measuredValue: String(drift.grantedScopeCount),
      remediationHint:
        "Reinstall or reauthorize the Shopify app with the missing scope(s), then rotate SHOPIFY_ADMIN_ACCESS_TOKEN.",
    });
  }

  return violations;
}

/**
 * Pure: turns Typesense reachability (K-06) into an alert violation. Only
 * "unreachable" (configured but dead -- credentials present, provider not
 * responding) is a real, silent degradation worth surfacing; "reachable" and
 * "not-configured" (local fallback by design) both stay quiet.
 */
export function buildSearchProviderViolations(
  status: "reachable" | "unreachable" | "not-configured",
): AlertViolation[] {
  if (status !== "unreachable") return [];

  return [
    {
      alertKey: "search-provider-unreachable",
      class: "SYSTEM",
      severity: "P1",
      invariant: "search-provider-reachable-when-configured",
      message:
        "Typesense is configured (host/API key present) but unreachable -- every search request is silently running on the local fallback path.",
      remediationHint:
        "Check the Typesense Cloud dashboard/cluster status and TYPESENSE_HOST DNS resolution; see docs/RUNBOOKS.md's Typesense outage runbook.",
    },
  ];
}

function outboxAlertClass(eventClass: string): OperationalAlertClass {
  if (eventClass === "CUSTOMER_COMMUNICATION") {
    return "CUSTOMER_COMMUNICATION";
  }

  if (eventClass === "PROJECTION" || eventClass === "ANALYTICS") {
    return "ANALYTICS";
  }

  return "OUTBOX";
}

function overdueSeverity(eventClass: string): OperationalAlertSeverity {
  if (eventClass === "PROJECTION" || eventClass === "ANALYTICS") {
    return "P2";
  }

  return "P1";
}

function getClassAlertThresholdMinutes(eventClass: string) {
  // Registry thresholds are per event type; classes share the policy values,
  // so read a representative through the same accessor used per event.
  const representative: Record<string, string> = {
    MONEY: "payment.captured",
    OPERATIONAL: "inventory.reservation_expired",
    CUSTOMER_COMMUNICATION: "email.requested",
    PROJECTION: "search.reindex_requested",
    ANALYTICS: "analytics.rollup_requested",
  };

  return getEventClassPolicy(representative[eventClass] ?? "unknown")
    .alertAfterMinutes;
}

/**
 * Class-aware invariant sweep (runs in the worker tick). Each violated
 * invariant raises or refreshes a durable alert; invariants that are no
 * longer violated auto-resolve their alerts. Detection is separated from
 * delivery so a notification failure never hides the violation.
 */
export async function sweepOperationalInvariants(now: Date = new Date()) {
  const violations: AlertViolation[] = [];

  // 1. Outbox convergence + dead letters (MONEY / OPERATIONAL / COMMS / ...).
  const openEvents = await db.outboxEvent.findMany({
    where: {
      status: {
        in: ["PENDING", "PUBLISHED", "PROCESSING", "FAILED", "DEAD_LETTER"],
      },
    },
    select: { type: true, status: true, createdAt: true },
    take: 2_000,
  });
  violations.push(
    ...evaluateOutboxInvariants({
      events: openEvents.map((event) => ({
        createdAt: event.createdAt,
        status: event.status,
        type: event.type,
      })),
      now,
    }),
  );

  // 2. Money truth: a PAID own-sale order without its GL sale entry beyond
  //    SLO (ADR 0002/0013 — the ledger refuses non-OWN_SALE revenue, so the
  //    invariant applies to OWN_SALE orders only).
  const paidCutoff = new Date(
    now.getTime() - PAID_WITHOUT_GL_THRESHOLD_MINUTES * 60_000,
  );
  const paidOrders = await db.order.findMany({
    where: {
      financialTreatment: "OWN_SALE",
      status: { in: ["PAID", "PREPARING", "READY_FOR_PICKUP", "SHIPPED", "COMPLETED"] },
      paidAt: { not: null, lt: paidCutoff },
    },
    select: { id: true, paidAt: true },
    orderBy: { paidAt: "desc" },
    take: 500,
  });

  if (paidOrders.length > 0) {
    const saleEntries = await db.journalEntry.findMany({
      where: {
        orderId: { in: paidOrders.map((order) => order.id) },
        source: "sale",
      },
      select: { orderId: true },
    });
    const postedOrderIds = new Set(saleEntries.map((entry) => entry.orderId));
    const unposted = paidOrders.filter((order) => !postedOrderIds.has(order.id));

    for (const order of unposted) {
      violations.push({
        alertKey: `money-paid-without-gl:${order.id}`,
        class: "MONEY",
        severity: "P0",
        invariant: "every-paid-own-sale-has-a-posted-gl-entry",
        message: `Order ${order.id} is PAID without a posted GL sale entry beyond ${PAID_WITHOUT_GL_THRESHOLD_MINUTES} minutes.`,
        entityType: "Order",
        entityId: order.id,
        thresholdValue: `${PAID_WITHOUT_GL_THRESHOLD_MINUTES}m`,
        remediationHint:
          "Run the outbox worker; if the payment.captured consumer failed, inspect its lastError and repost via finance.postOrderSaleToLedger.",
      });
    }
  }

  // 3. Operational stock: expired-but-unreleased reservations. A 24h expired
  //    hold on a one-of-a-kind piece is a destroyed sale, not technical delay.
  const reservationCutoff = new Date(
    now.getTime() - RESERVATION_RELEASE_GRACE_MINUTES * 60_000,
  );
  const expiredReservations = await db.inventoryReservation.findMany({
    where: { releasedAt: null, expiresAt: { lt: reservationCutoff } },
    select: { expiresAt: true },
    orderBy: { expiresAt: "asc" },
    take: 500,
  });

  if (expiredReservations.length > 0) {
    const oldest = expiredReservations[0]?.expiresAt ?? now;
    const oldestMinutes = Math.round(
      (now.getTime() - oldest.getTime()) / 60_000,
    );
    violations.push({
      alertKey: "reservations-expired-unreleased",
      class: "INVENTORY",
      severity: oldestMinutes > 24 * 60 ? "P0" : "P1",
      invariant: "expired-reservations-release-within-slo",
      message: `${expiredReservations.length} expired inventory reservation(s) still hold stock; oldest expired ${oldestMinutes} minutes ago.`,
      measuredValue: `${oldestMinutes}m`,
      thresholdValue: `${RESERVATION_RELEASE_GRACE_MINUTES}m`,
      remediationHint:
        "Run the outbox worker (reservation.expired handler) or release the holds from admin inventory.",
    });
  }

  // 4. Security: failed / rate-limited admin logins awaiting review
  //    (ADR 0005 telemetry × ADR 0007 sweep).
  const loginFailures = await countRecentAdminLoginFailures({
    now,
    windowMinutes: 60,
  });

  if (loginFailures >= 5) {
    violations.push({
      alertKey: "security-admin-login-failures",
      class: "SECURITY",
      severity: "P1",
      invariant: "admin-login-failures-reviewed",
      message: `${loginFailures} failed or rate-limited admin login attempts in the last 60 minutes.`,
      measuredValue: String(loginFailures),
      thresholdValue: "5/60m",
      remediationHint:
        "Review AdminAuth events in /admin/audit; if the source is unknown, rotate the admin password and inspect for lockout abuse.",
    });
  }

  // 5. Shopify integration drift: webhook registration + token scope (K-06).
  //    `null` when dropshipping isn't enabled/configured -- nothing to check.
  const shopifyDrift = await checkShopifyIntegrationDrift({ now });

  violations.push(...buildShopifyDriftViolations(shopifyDrift));

  // 6. Search provider reachability (K-06): a configured Typesense that has
  //    gone unreachable is invisible to customers (local fallback covers it)
  //    but is a real, silent degradation ops needs to know about.
  const searchStatus = await checkTypesenseConnectivity();

  violations.push(...buildSearchProviderViolations(searchStatus));

  // Raise / refresh all violated invariants, then auto-resolve cleared ones.
  for (const violation of violations) {
    await raiseOperationalAlert(violation, now);
  }

  await resolveClearedAlerts({
    activeKeys: new Set(violations.map((violation) => violation.alertKey)),
    now,
    scopes: [
      "outbox-overdue:",
      "outbox-dead-letter:",
      "money-paid-without-gl:",
      "reservations-expired-unreleased",
      "security-admin-login-failures",
      "shopify-webhook-drift:",
      "shopify-scope-drift",
      "search-provider-unreachable",
    ],
  });

  await recordJobRun({
    name: ALERT_SWEEP_JOB_NAME,
    status: "COMPLETED",
    metadata: {
      openViolations: violations.length,
      sweptAt: now.toISOString(),
    },
  });

  return { violations: violations.length };
}

/** Dedup upsert: refresh an existing alert or reopen a resolved one. */
export async function raiseOperationalAlert(
  violation: AlertViolation,
  now: Date = new Date(),
) {
  const existing = await db.operationalAlert.findUnique({
    where: { alertKey: violation.alertKey },
    select: { id: true, status: true },
  });

  if (!existing) {
    return db.operationalAlert.create({
      data: {
        alertKey: violation.alertKey,
        class: violation.class,
        severity: violation.severity,
        invariant: violation.invariant,
        message: violation.message,
        entityType: violation.entityType,
        entityId: violation.entityId,
        measuredValue: violation.measuredValue,
        thresholdValue: violation.thresholdValue,
        remediationHint: violation.remediationHint,
        firstSeenAt: now,
        lastSeenAt: now,
      },
    });
  }

  const reopen = existing.status === "RESOLVED";

  return db.operationalAlert.update({
    where: { id: existing.id },
    data: {
      class: violation.class,
      severity: violation.severity,
      message: violation.message,
      measuredValue: violation.measuredValue,
      lastSeenAt: now,
      occurrenceCount: { increment: 1 },
      ...(reopen
        ? {
            status: "OPEN",
            resolvedAt: null,
            acknowledgedAt: null,
            acknowledgedById: null,
            notifyCount: 0,
            lastNotifiedAt: null,
          }
        : {}),
    },
  });
}

/** Resolution means the invariant is no longer violated — never a human whim. */
async function resolveClearedAlerts(input: {
  activeKeys: Set<string>;
  now: Date;
  scopes: string[];
}) {
  const candidates = await db.operationalAlert.findMany({
    where: { status: { in: ["OPEN", "ACKNOWLEDGED"] } },
    select: { id: true, alertKey: true },
  });

  const clearedIds = candidates
    .filter(
      (alert) =>
        input.scopes.some((scope) => alert.alertKey.startsWith(scope)) &&
        !input.activeKeys.has(alert.alertKey),
    )
    .map((alert) => alert.id);

  if (clearedIds.length === 0) {
    return { resolved: 0 };
  }

  await db.operationalAlert.updateMany({
    where: { id: { in: clearedIds } },
    data: { status: "RESOLVED", resolvedAt: input.now },
  });

  return { resolved: clearedIds.length };
}

/**
 * Pure: K-04 per-class alert ownership. `CUSTOMER_COMMUNICATION` (stuck
 * transactional emails) routes to the customer-facing service escalation
 * address; every other class is technical/site and routes to the technical
 * address. Each falls back to the shared operations address when its own
 * dedicated one isn't configured, so routing degrades to the old
 * single-address behavior rather than going silent.
 */
export function resolveAlertNotificationEmail(input: {
  alertClass: string;
  customerServiceEmail: string | undefined;
  operationsEmail: string | undefined;
  technicalEmail: string | undefined;
}): string | null {
  const dedicated =
    input.alertClass === "CUSTOMER_COMMUNICATION"
      ? input.customerServiceEmail
      : input.technicalEmail;

  return dedicated ?? input.operationsEmail ?? null;
}

/**
 * Severity-aware delivery over existing channels (ADR 0007 §3), routed
 * per-class (K-04); the admin dashboard shows everything unconditionally.
 * Failures are logged and retried on the next tick — delivery never masks
 * detection.
 */
export async function deliverDueAlertNotifications(now: Date = new Date()) {
  const operationsEmail = env.OPERATIONS_EMAIL;
  const technicalEmail = env.TECHNICAL_ALERT_EMAIL;
  const customerServiceEmail = env.CUSTOMER_SERVICE_ALERT_EMAIL;

  if (!operationsEmail && !technicalEmail && !customerServiceEmail) {
    return { delivered: 0, skipped: "no-operations-email" as const };
  }

  const openAlerts = await db.operationalAlert.findMany({
    where: { status: "OPEN", severity: { in: ["P0", "P1"] } },
    orderBy: { firstSeenAt: "asc" },
    take: 50,
  });

  let delivered = 0;

  for (const alert of openAlerts) {
    if (
      !shouldNotifyAlert({
        lastNotifiedAt: alert.lastNotifiedAt,
        notifyCount: alert.notifyCount,
        now,
        severity: alert.severity,
        status: alert.status,
      })
    ) {
      continue;
    }

    const to = resolveAlertNotificationEmail({
      alertClass: alert.class,
      customerServiceEmail,
      operationsEmail,
      technicalEmail,
    });

    if (!to) continue;

    try {
      await notificationProvider.sendEmail({
        to,
        subject: `[Elysia ${alert.severity} ${alert.class}] ${alert.invariant}`,
        body: [
          alert.message,
          "",
          `Alert key: ${alert.alertKey}`,
          `First seen: ${alert.firstSeenAt.toISOString()}`,
          `Occurrences: ${alert.occurrenceCount}`,
          alert.remediationHint ? `Remediation: ${alert.remediationHint}` : "",
          "Acknowledge in /admin/notifications to silence escalation; the alert resolves only when the invariant holds again.",
        ]
          .filter(Boolean)
          .join("\n"),
        idempotencyKey: `operational-alert:${alert.id}:${alert.notifyCount}`,
      });

      await db.operationalAlert.update({
        where: { id: alert.id },
        data: {
          lastNotifiedAt: now,
          notifyCount: { increment: 1 },
        },
      });
      delivered += 1;
    } catch (error) {
      console.error("[operational-alerts:notify-failed]", alert.alertKey, error);
    }
  }

  return { delivered };
}

/** Acknowledgment ≠ resolution: the operator saw it; escalation goes quiet. */
export async function acknowledgeOperationalAlert(input: {
  alertId: string;
  adminUserId: string;
}) {
  return db.$transaction(async (tx) => {
    const alert = await tx.operationalAlert.update({
      where: { id: input.alertId },
      data: {
        status: "ACKNOWLEDGED",
        acknowledgedAt: new Date(),
        acknowledgedById: input.adminUserId,
      },
    });

    await tx.auditLog.create({
      data: {
        adminUserId: input.adminUserId,
        action: "operational_alert.acknowledged",
        entity: "OperationalAlert",
        entityId: alert.id,
        metadata: { alertKey: alert.alertKey, severity: alert.severity },
      },
    });

    return alert;
  });
}

export async function getOperationalAlertsOverview() {
  const [open, acknowledged, recent, lastSweep] = await Promise.all([
    db.operationalAlert.count({ where: { status: "OPEN" } }),
    db.operationalAlert.count({ where: { status: "ACKNOWLEDGED" } }),
    db.operationalAlert.findMany({
      where: { status: { in: ["OPEN", "ACKNOWLEDGED"] } },
      orderBy: [{ severity: "asc" }, { lastSeenAt: "desc" }],
      take: 30,
    }),
    db.jobRun.findFirst({
      where: { name: ALERT_SWEEP_JOB_NAME, status: "COMPLETED" },
      orderBy: { finishedAt: "desc" },
      select: { finishedAt: true },
    }),
  ]);

  const openP0 = recent.filter(
    (alert) => alert.severity === "P0" && alert.status === "OPEN",
  ).length;

  return {
    acknowledged,
    alerts: recent,
    lastSweepAt: lastSweep?.finishedAt ?? null,
    open,
    openP0,
  };
}

/** Coarse heartbeat data for the health surface (ADR 0007 §4). */
export async function getOperationalHeartbeats() {
  const [lastSweep, lastWorkerRun, openP0] = await Promise.all([
    db.jobRun.findFirst({
      where: { name: ALERT_SWEEP_JOB_NAME },
      orderBy: { finishedAt: "desc" },
      select: { finishedAt: true },
    }),
    db.jobRun.findFirst({
      orderBy: { finishedAt: "desc" },
      select: { finishedAt: true, name: true },
    }),
    db.operationalAlert.count({
      where: { status: "OPEN", severity: "P0" },
    }),
  ]);

  return {
    lastSweepAt: lastSweep?.finishedAt ?? null,
    lastWorkerRunAt: lastWorkerRun?.finishedAt ?? null,
    openP0Alerts: openP0,
  };
}
