// ADR 0003 — event-class latency SLOs over indiscriminate batch.
//
// Every outbox event type declares the business cost of its delay: its class,
// convergence target, alert threshold, retry budget, and whether batch
// processing or financial close may tolerate it. The worker and the invariant
// sweep read this registry instead of treating all events as one queue.

import { BUSINESS_EVENTS } from "~/server/services/outbox";

export type EventClass =
  | "MONEY"
  | "OPERATIONAL"
  | "CUSTOMER_COMMUNICATION"
  | "PROJECTION"
  | "ANALYTICS";

export type EventClassPolicy = {
  batchAcceptable: boolean;
  class: EventClass;
  closeBlocking: boolean;
  customerVisible: boolean;
  /** Alert when an event is still unprocessed this many minutes after creation. */
  alertAfterMinutes: number;
  /** Attempts after which a failing event stops retrying and dead-letters. */
  maxAttempts: number;
  /** Normal convergence target from creation to successful processing. */
  targetMinutes: number;
};

const MONEY_POLICY: EventClassPolicy = {
  class: "MONEY",
  targetMinutes: 5,
  alertAfterMinutes: 15,
  maxAttempts: 10,
  batchAcceptable: false,
  closeBlocking: true,
  customerVisible: true,
};

const OPERATIONAL_POLICY: EventClassPolicy = {
  class: "OPERATIONAL",
  targetMinutes: 15,
  alertAfterMinutes: 30,
  maxAttempts: 8,
  batchAcceptable: false,
  closeBlocking: false,
  customerVisible: true,
};

const COMMUNICATION_POLICY: EventClassPolicy = {
  class: "CUSTOMER_COMMUNICATION",
  targetMinutes: 15,
  alertAfterMinutes: 30,
  maxAttempts: 8,
  batchAcceptable: false,
  closeBlocking: false,
  customerVisible: true,
};

const PROJECTION_POLICY: EventClassPolicy = {
  class: "PROJECTION",
  targetMinutes: 60,
  alertAfterMinutes: 180,
  maxAttempts: 6,
  batchAcceptable: true,
  closeBlocking: false,
  customerVisible: false,
};

const ANALYTICS_POLICY: EventClassPolicy = {
  class: "ANALYTICS",
  targetMinutes: 24 * 60,
  alertAfterMinutes: 2 * 24 * 60,
  maxAttempts: 5,
  batchAcceptable: true,
  closeBlocking: false,
  customerVisible: false,
};

// Marketing sends are deliberately NOT customer-communication class
// (ADR 0003): a delayed campaign is low severity, a delayed order email is not.
const MARKETING_POLICY: EventClassPolicy = {
  ...ANALYTICS_POLICY,
  targetMinutes: 4 * 60,
  alertAfterMinutes: 24 * 60,
};

export const EVENT_CLASS_POLICIES: Record<string, EventClassPolicy> = {
  [BUSINESS_EVENTS.paymentCaptured]: MONEY_POLICY,
  [BUSINESS_EVENTS.orderCreated]: OPERATIONAL_POLICY,
  [BUSINESS_EVENTS.inventoryReserved]: OPERATIONAL_POLICY,
  [BUSINESS_EVENTS.inventoryReservationExpired]: OPERATIONAL_POLICY,
  [BUSINESS_EVENTS.emailRequested]: COMMUNICATION_POLICY,
  [BUSINESS_EVENTS.pushCampaignRequested]: MARKETING_POLICY,
  [BUSINESS_EVENTS.pushCartReminderDue]: MARKETING_POLICY,
  [BUSINESS_EVENTS.searchReindexRequested]: PROJECTION_POLICY,
  [BUSINESS_EVENTS.analyticsRollupRequested]: ANALYTICS_POLICY,
  [BUSINESS_EVENTS.webhookReceived]: OPERATIONAL_POLICY,
};

/**
 * Unknown event types get the conservative operational policy: they retry
 * with a bounded budget and alert like operational work rather than being
 * silently treated as harmless.
 */
export function getEventClassPolicy(eventType: string): EventClassPolicy {
  return EVENT_CLASS_POLICIES[eventType] ?? OPERATIONAL_POLICY;
}

/**
 * After a processing failure, decide whether the event keeps retrying or
 * stops and becomes a loud dead letter for the invariant sweep (ADR 0007).
 */
export function resolveFailureStatus(input: {
  attempts: number;
  eventType: string;
}): "FAILED" | "DEAD_LETTER" {
  const policy = getEventClassPolicy(input.eventType);

  return input.attempts >= policy.maxAttempts ? "DEAD_LETTER" : "FAILED";
}
