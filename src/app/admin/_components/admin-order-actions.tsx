"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw, Save, Truck } from "lucide-react";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { StatusMessage } from "~/components/ui/status-message";
import { Textarea } from "~/components/ui/textarea";
import { getReturnStatusLabel } from "~/lib/commerce-labels";
import { api } from "~/trpc/react";

type AdminOrderActionsProps = {
  orderId: string;
  status: string;
  fulfillmentMethod: string;
  shipment?: {
    provider: string | null;
    tracking: string | null;
    status: string;
  } | null;
  returns: Array<{
    id: string;
    reason: string;
    status: string;
  }>;
};

const terminalStatuses = new Set(["COMPLETED", "CANCELLED", "REFUNDED"]);

export function AdminOrderActions({
  orderId,
  status,
  fulfillmentMethod,
  shipment,
  returns,
}: AdminOrderActionsProps) {
  const router = useRouter();
  const updateStatus = api.admin.updateOrderStatus.useMutation({
    onSuccess: () => router.refresh(),
  });
  const actions = getAvailableActions(status, fulfillmentMethod);

  return (
    <div className="grid min-w-72 gap-3">
      {actions.length === 0 ? (
        <span className="text-muted-foreground text-xs">אין פעולות סטטוס</span>
      ) : null}
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
      {fulfillmentMethod === "DELIVERY" ? (
        <AdminShipmentForm orderId={orderId} shipment={shipment} />
      ) : null}
      <AdminRefundForm orderId={orderId} returns={returns} status={status} />
    </div>
  );
}

function AdminShipmentForm({
  orderId,
  shipment,
}: {
  orderId: string;
  shipment: AdminOrderActionsProps["shipment"];
}) {
  const router = useRouter();
  const [provider, setProvider] = useState(shipment?.provider ?? "");
  const [tracking, setTracking] = useState(shipment?.tracking ?? "");
  const [status, setStatus] = useState(shipment?.status ?? "SHIPPED");
  const mutation = api.admin.upsertShipment.useMutation({
    onSuccess: () => router.refresh(),
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    mutation.mutate({
      orderId,
      provider: provider || undefined,
      tracking: tracking || undefined,
      status,
    });
  }

  return (
    <form className="grid gap-2 rounded-md border p-2" onSubmit={handleSubmit}>
      <Label className="flex items-center gap-2 text-xs">
        <Truck className="size-3.5" />
        משלוח
      </Label>
      <div className="grid gap-2 sm:grid-cols-3">
        <Input
          className="h-9"
          onChange={(event) => setProvider(event.currentTarget.value)}
          placeholder="ספק"
          value={provider}
        />
        <Input
          className="h-9"
          onChange={(event) => setTracking(event.currentTarget.value)}
          placeholder="Tracking"
          value={tracking}
        />
        <select
          className="glass-control h-9 rounded-md border px-2 text-xs"
          onChange={(event) => setStatus(event.currentTarget.value)}
          value={status}
        >
          <option value="SHIPPED">נשלח</option>
          <option value="IN_TRANSIT">בדרך</option>
          <option value="DELIVERED">נמסר</option>
        </select>
      </div>
      <Button
        className="w-fit gap-2"
        disabled={mutation.isPending}
        size="sm"
        type="submit"
        variant="outline"
      >
        <Save className="size-3.5" />
        שמירת משלוח
      </Button>
    </form>
  );
}

function AdminRefundForm({
  orderId,
  returns,
  status,
}: {
  orderId: string;
  returns: AdminOrderActionsProps["returns"];
  status: string;
}) {
  const router = useRouter();
  const [reason, setReason] = useState(returns[0]?.reason ?? "");
  const [restockItems, setRestockItems] = useState(false);
  const mutation = api.admin.refundOrder.useMutation({
    onSuccess: () => router.refresh(),
  });
  const activeReturn = returns.find(
    (request) => request.status !== "CANCELLED",
  );
  const refundable = [
    "PAID",
    "PREPARING",
    "READY_FOR_PICKUP",
    "SHIPPED",
    "COMPLETED",
  ].includes(status);

  if (!refundable) return null;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    mutation.mutate({
      orderId,
      returnRequestId: activeReturn?.id,
      reason: reason.trim() ? reason : (activeReturn?.reason ?? "Admin refund"),
      restockItems,
    });
  }

  return (
    <form className="grid gap-2 rounded-md border p-2" onSubmit={handleSubmit}>
      <Label className="flex items-center gap-2 text-xs">
        <RotateCcw className="size-3.5" />
        זיכוי / החזרה
      </Label>
      {activeReturn ? (
        <p className="text-muted-foreground text-xs">
          בקשה פתוחה: {getReturnStatusLabel(activeReturn.status)} ·{" "}
          {activeReturn.reason}
        </p>
      ) : null}
      <Textarea
        className="min-h-16"
        onChange={(event) => setReason(event.currentTarget.value)}
        placeholder="סיבת זיכוי"
        value={reason}
      />
      <label className="text-muted-foreground flex items-center gap-2 text-xs">
        <input
          checked={restockItems}
          onChange={(event) => setRestockItems(event.currentTarget.checked)}
          type="checkbox"
        />
        החזרת פריטים למלאי
      </label>
      <Button
        className="w-fit gap-2"
        disabled={mutation.isPending}
        size="sm"
        type="submit"
        variant="outline"
      >
        <RotateCcw className="size-3.5" />
        ביצוע זיכוי
      </Button>
      {mutation.error ? (
        <StatusMessage size="xs" tone="error" variant="plain">
          {mutation.error.message}
        </StatusMessage>
      ) : null}
    </form>
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
