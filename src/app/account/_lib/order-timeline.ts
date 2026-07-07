export type AccountOrderTimelineInput = {
  cancelledAt?: Date | string | null;
  completedAt?: Date | string | null;
  createdAt: Date | string;
  paidAt?: Date | string | null;
  preparingAt?: Date | string | null;
  readyForPickupAt?: Date | string | null;
  refundedAt?: Date | string | null;
  shippedAt?: Date | string | null;
  status: string;
};

export type AccountOrderTimelineEvent = {
  at: Date | string | null;
  description: string;
  id:
    | "created"
    | "paid"
    | "preparing"
    | "handoff"
    | "completed"
    | "cancelled"
    | "refunded";
  label: string;
  state: "done" | "current" | "pending";
};

const standardStepOrder = [
  "created",
  "paid",
  "preparing",
  "handoff",
  "completed",
] as const;
const currentStepByStatus: Record<string, (typeof standardStepOrder)[number]> =
  {
    CANCELLED: "completed",
    COMPLETED: "completed",
    PAID: "preparing",
    PENDING_PAYMENT: "paid",
    PREPARING: "preparing",
    READY_FOR_PICKUP: "handoff",
    REFUNDED: "completed",
    SHIPPED: "handoff",
  };

export function createAccountOrderTimeline(
  order: AccountOrderTimelineInput,
): AccountOrderTimelineEvent[] {
  if (order.status === "CANCELLED") {
    return [
      createTerminalBaseEvent(order),
      {
        at: order.cancelledAt ?? null,
        description: "ההזמנה נסגרה. ניתן לפנות לשירות אם נדרש בירור נוסף.",
        id: "cancelled",
        label: "בוטלה",
        state: "current",
      },
    ];
  }

  if (order.status === "REFUNDED") {
    return [
      createTerminalBaseEvent(order),
      {
        at: order.refundedAt ?? null,
        description: "זיכוי ההזמנה טופל לפי אמצעי התשלום המקורי.",
        id: "refunded",
        label: "זוכתה",
        state: "current",
      },
    ];
  }

  const currentStep = currentStepByStatus[order.status] ?? "paid";
  const currentIndex = standardStepOrder.indexOf(currentStep);
  const events: Array<
    Omit<AccountOrderTimelineEvent, "state"> & {
      id: (typeof standardStepOrder)[number];
    }
  > = [
    {
      at: order.createdAt,
      description: "ההזמנה התקבלה ונשמרה באזור האישי.",
      id: "created",
      label: "התקבלה",
    },
    {
      at: order.paidAt ?? null,
      description: "התשלום מאומת לפני ההכנה והמשלוח.",
      id: "paid",
      label: "תשלום",
    },
    {
      at: order.preparingAt ?? null,
      description: "הצוות מכין את הפריטים למשלוח.",
      id: "preparing",
      label: "בהכנה",
    },
    {
      at: order.shippedAt ?? order.readyForPickupAt ?? null,
      description: "פרטי המשלוח או המסירה יעודכנו כאן.",
      id: "handoff",
      label: "משלוח",
    },
    {
      at: order.completedAt ?? null,
      description: "ההזמנה הושלמה ונשמרת להיסטוריה.",
      id: "completed",
      label: "הושלמה",
    },
  ];

  return events.map((event, index) => ({
    ...event,
    state: getTimelineState({
      at: event.at,
      currentIndex,
      index,
      isTerminalComplete: order.status === "COMPLETED",
    }),
  }));
}

export function getCurrentOrderTimelineEvent(
  events: AccountOrderTimelineEvent[],
) {
  return (
    events.find((event) => event.state === "current") ??
    [...events].reverse().find((event) => event.state === "done") ??
    events[0]
  );
}

function createTerminalBaseEvent(
  order: AccountOrderTimelineInput,
): AccountOrderTimelineEvent {
  return {
    at: order.createdAt,
    description: "ההזמנה התקבלה ונשמרה באזור האישי.",
    id: "created",
    label: "התקבלה",
    state: "done",
  };
}

function getTimelineState({
  at,
  currentIndex,
  index,
  isTerminalComplete,
}: {
  at: Date | string | null;
  currentIndex: number;
  index: number;
  isTerminalComplete: boolean;
}): AccountOrderTimelineEvent["state"] {
  if (isTerminalComplete || at || index < currentIndex) return "done";

  return index === currentIndex ? "current" : "pending";
}
