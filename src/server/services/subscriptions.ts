import { db } from "~/server/db";
import {
  createCustomerInvoice,
  issueCustomerInvoice,
} from "~/server/services/accounts-receivable";

/**
 * Subscriptions and recurring billing (SUB, §4.W).
 *
 * The billing run invoices every ACTIVE subscription whose nextBillingAt is due:
 * it creates and issues a customer invoice (so the recurring revenue hits the
 * GL via AR) and advances the schedule. The date math is pure and tested.
 */

export type BillingInterval = "MONTHLY" | "YEARLY";

/** Advances a date by one billing interval (UTC). Pure. */
export function computeNextBilling(from: Date, interval: BillingInterval): Date {
  const next = new Date(from.getTime());
  if (interval === "YEARLY") {
    next.setUTCFullYear(next.getUTCFullYear() + 1);
  } else {
    next.setUTCMonth(next.getUTCMonth() + 1);
  }
  return next;
}

/** Whether a subscription is due to bill at `now`. Pure. */
export function isSubscriptionDue(nextBillingAt: Date, now: Date = new Date()) {
  return nextBillingAt.getTime() <= now.getTime();
}

/** Creates a subscription plan. */
export async function createPlan(input: {
  key: string;
  name: string;
  amount: number;
  interval?: BillingInterval;
}) {
  if (input.amount <= 0) throw new Error("סכום המנוי חייב להיות חיובי.");

  return db.subscriptionPlan.create({
    data: {
      key: input.key,
      name: input.name,
      amount: input.amount,
      interval: input.interval ?? "MONTHLY",
    },
  });
}

/** Subscribes a customer to a plan, billing on the next run. */
export async function subscribeCustomer(input: {
  planId: string;
  customerId?: string;
}) {
  const plan = await db.subscriptionPlan.findUnique({
    where: { id: input.planId },
    select: { id: true, isActive: true },
  });
  if (!plan) throw new Error("תוכנית מנוי לא נמצאה.");
  if (!plan.isActive) throw new Error("תוכנית המנוי אינה פעילה.");

  return db.customerSubscription.create({
    data: {
      planId: input.planId,
      customerId: input.customerId,
      nextBillingAt: new Date(),
    },
  });
}

export async function pauseSubscription(input: { subscriptionId: string }) {
  return db.customerSubscription.update({
    where: { id: input.subscriptionId },
    data: { status: "PAUSED" },
  });
}

export async function cancelSubscription(input: { subscriptionId: string }) {
  return db.customerSubscription.update({
    where: { id: input.subscriptionId },
    data: { status: "CANCELLED" },
  });
}

/**
 * Bills every due ACTIVE subscription: issues an AR invoice per plan amount and
 * advances the schedule. Returns the number billed and the total amount.
 */
export async function runSubscriptionBilling(now: Date = new Date()) {
  const due = await db.customerSubscription.findMany({
    where: { status: "ACTIVE", nextBillingAt: { lte: now } },
    include: { plan: true },
    take: 200,
  });

  let billed = 0;
  let total = 0;

  for (const subscription of due) {
    const amount = Number(subscription.plan.amount);

    const invoice = await createCustomerInvoice({
      customerId: subscription.customerId ?? undefined,
      invoiceDate: now,
      lines: [
        {
          description: `מנוי — ${subscription.plan.name}`,
          quantity: 1,
          unitPrice: amount,
        },
      ],
    });
    await issueCustomerInvoice({ invoiceId: invoice.id });

    await db.customerSubscription.update({
      where: { id: subscription.id },
      data: {
        lastBilledAt: now,
        nextBillingAt: computeNextBilling(
          subscription.nextBillingAt,
          subscription.plan.interval as BillingInterval,
        ),
      },
    });

    billed += 1;
    total = Math.round((total + amount) * 100) / 100;
  }

  return { billed, total };
}

/** Active plans for selects/lists. */
export async function listPlans() {
  return db.subscriptionPlan.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
    select: { id: true, key: true, name: true, amount: true, interval: true },
  });
}

/** Recent subscriptions with plan label. */
export async function listSubscriptions(limit = 20) {
  const subscriptions = await db.customerSubscription.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      status: true,
      nextBillingAt: true,
      plan: { select: { name: true, amount: true } },
    },
  });

  return subscriptions.map((subscription) => ({
    id: subscription.id,
    status: subscription.status,
    nextBillingAt: subscription.nextBillingAt,
    planName: subscription.plan.name,
    amount: Number(subscription.plan.amount),
  }));
}

/** Active subscription count and monthly-equivalent recurring revenue (MRR). */
export async function getSubscriptionSummary() {
  const subscriptions = await db.customerSubscription.findMany({
    where: { status: "ACTIVE" },
    select: { plan: { select: { amount: true, interval: true } } },
  });

  const mrr = subscriptions.reduce((sum, subscription) => {
    const amount = Number(subscription.plan.amount);
    const monthly = subscription.plan.interval === "YEARLY" ? amount / 12 : amount;
    return sum + monthly;
  }, 0);

  return {
    activeCount: subscriptions.length,
    mrr: Math.round(mrr * 100) / 100,
  };
}
