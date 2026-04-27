"use client";

import { useRouter } from "next/navigation";

import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";

type AdminOrderActionsProps = {
  orderId: string;
  status: string;
  fulfillmentMethod: string;
};

const terminalStatuses = new Set(["COMPLETED", "CANCELLED", "REFUNDED"]);

export function AdminOrderActions({
  orderId,
  status,
  fulfillmentMethod,
}: AdminOrderActionsProps) {
  const router = useRouter();
  const updateStatus = api.admin.updateOrderStatus.useMutation({
    onSuccess: () => router.refresh(),
  });

  const actions = getAvailableActions(status, fulfillmentMethod);

  if (actions.length === 0) {
    return <span className="text-muted-foreground text-xs">אין פעולות</span>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => (
        <Button
          disabled={updateStatus.isPending}
          key={action.status}
          onClick={() =>
            updateStatus.mutate({ orderId, status: action.status })
          }
          size="sm"
          type="button"
          variant={action.status === "CANCELLED" ? "outline" : "secondary"}
        >
          {action.label}
        </Button>
      ))}
    </div>
  );
}

function getAvailableActions(status: string, fulfillmentMethod: string) {
  if (terminalStatuses.has(status)) return [];

  if (status === "PENDING_PAYMENT") {
    return [
      { status: "PAID" as const, label: "אישור תשלום ידני" },
      { status: "CANCELLED" as const, label: "ביטול" },
    ];
  }

  if (status === "PAID") {
    return [
      { status: "PREPARING" as const, label: "העברה להכנה" },
      { status: "CANCELLED" as const, label: "ביטול" },
    ];
  }

  if (status === "PREPARING") {
    return [
      {
        status:
          fulfillmentMethod === "PICKUP"
            ? ("READY_FOR_PICKUP" as const)
            : ("SHIPPED" as const),
        label: fulfillmentMethod === "PICKUP" ? "מוכן לאיסוף" : "נשלח",
      },
      { status: "CANCELLED" as const, label: "ביטול" },
    ];
  }

  return [{ status: "COMPLETED" as const, label: "השלמה" }];
}
