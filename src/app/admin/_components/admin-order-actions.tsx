"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw, Save, Truck } from "lucide-react";

import {
  AdminMutationStatus,
  type AdminMutationFeedback,
} from "./admin-mutation-status";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import {
  refundAdminOrderInputSchema,
  upsertAdminShipmentInputSchema,
} from "~/lib/admin-validation";
import { getReturnStatusLabel } from "~/lib/commerce-labels";
import {
  getFirstZodIssueMessage,
  getZodFieldErrors,
  type FormFieldErrors,
} from "~/lib/form-validation";
import { api } from "~/trpc/react";

type AdminOrderActionsProps = {
  fulfillmentMethod: string;
  orderId: string;
  returns: Array<{
    id: string;
    reason: string;
    status: string;
  }>;
  shipment?: {
    provider: string | null;
    status: string;
    tracking: string | null;
  } | null;
  status: string;
};

const terminalStatuses = new Set(["COMPLETED", "CANCELLED", "REFUNDED"]);

export function AdminOrderActions({
  fulfillmentMethod,
  orderId,
  returns,
  shipment,
  status,
}: AdminOrderActionsProps) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<AdminMutationFeedback>();
  const updateStatus = api.admin.updateOrderStatus.useMutation({
    onError: (error) => setFeedback({ message: error.message, tone: "error" }),
    onMutate: () =>
      setFeedback({ message: "מעדכן סטטוס הזמנה...", tone: "neutral" }),
    onSuccess: () => {
      router.refresh();
      setFeedback({ message: "סטטוס ההזמנה עודכן.", tone: "success" });
    },
  });
  const actions = getAvailableActions(status, fulfillmentMethod);

  return (
    <div className="grid min-w-72 gap-3">
      {actions.length === 0 ? (
        <span className="text-muted-foreground text-xs">אין פעולות סטטוס</span>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <StatusActionButton
            disabled={updateStatus.isPending}
            key={action.status}
            label={action.label}
            onConfirm={() =>
              updateStatus.mutate({ orderId, status: action.status })
            }
            pending={updateStatus.isPending}
            requiresConfirmation={action.status === "CANCELLED"}
            variant={action.status === "CANCELLED" ? "outline" : "secondary"}
          />
        ))}
      </div>
      <AdminMutationStatus feedback={feedback} />
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
  const [feedback, setFeedback] = useState<AdminMutationFeedback>();
  const [fieldErrors, setFieldErrors] = useState<FormFieldErrors>({});
  const mutation = api.admin.upsertShipment.useMutation({
    onError: (error) => setFeedback({ message: error.message, tone: "error" }),
    onMutate: () =>
      setFeedback({ message: "שומר פרטי משלוח...", tone: "neutral" }),
    onSuccess: () => {
      router.refresh();
      setFeedback({ message: "פרטי המשלוח נשמרו.", tone: "success" });
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextProvider = provider.trim();
    const nextTracking = tracking.trim();

    const parsed = upsertAdminShipmentInputSchema.safeParse({
      orderId,
      provider: nextProvider.length > 0 ? nextProvider : undefined,
      status,
      tracking: nextTracking.length > 0 ? nextTracking : undefined,
    });

    if (!parsed.success) {
      setFieldErrors(getZodFieldErrors(parsed.error));
      setFeedback({
        message: getFirstZodIssueMessage(parsed.error),
        tone: "error",
      });
      return;
    }

    setFieldErrors({});
    mutation.mutate(parsed.data);
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
          aria-invalid={Boolean(fieldErrors.provider)}
          disabled={mutation.isPending}
          onChange={(event) => setProvider(event.currentTarget.value)}
          placeholder="ספק"
          value={provider}
        />
        <Input
          className="h-9"
          aria-invalid={Boolean(fieldErrors.tracking)}
          disabled={mutation.isPending}
          onChange={(event) => setTracking(event.currentTarget.value)}
          placeholder="מספר מעקב"
          value={tracking}
        />
        <select
          className="glass-control h-9 rounded-md border px-2 text-xs"
          aria-invalid={Boolean(fieldErrors.status)}
          disabled={mutation.isPending}
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
        {mutation.isPending ? "שומר..." : "שמירת משלוח"}
      </Button>
      <AdminMutationStatus feedback={feedback} />
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
  const [feedback, setFeedback] = useState<AdminMutationFeedback>();
  const [fieldErrors, setFieldErrors] = useState<FormFieldErrors>({});
  const mutation = api.admin.refundOrder.useMutation({
    onError: (error) => setFeedback({ message: error.message, tone: "error" }),
    onMutate: () => setFeedback({ message: "מבצע זיכוי...", tone: "neutral" }),
    onSuccess: () => {
      router.refresh();
      setFeedback({ message: "הזיכוי נשמר וההזמנה עודכנה.", tone: "success" });
    },
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
  }

  function submitRefund() {
    const trimmedReason = reason.trim();

    const parsed = refundAdminOrderInputSchema.safeParse({
      orderId,
      reason:
        trimmedReason.length > 0
          ? trimmedReason
          : (activeReturn?.reason ?? "זיכוי אדמין"),
      restockItems,
      returnRequestId: activeReturn?.id,
    });

    if (!parsed.success) {
      setFieldErrors(getZodFieldErrors(parsed.error));
      setFeedback({
        message: getFirstZodIssueMessage(parsed.error),
        tone: "error",
      });
      return;
    }

    setFieldErrors({});
    mutation.mutate(parsed.data);
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
        aria-invalid={Boolean(fieldErrors.reason)}
        className="min-h-16"
        disabled={mutation.isPending}
        onChange={(event) => setReason(event.currentTarget.value)}
        placeholder="סיבת זיכוי"
        value={reason}
      />
      <label className="text-muted-foreground flex items-center gap-2 text-xs">
        <input
          checked={restockItems}
          disabled={mutation.isPending}
          onChange={(event) => setRestockItems(event.currentTarget.checked)}
          type="checkbox"
        />
        החזרת פריטים למלאי
      </label>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            className="w-fit gap-2"
            disabled={mutation.isPending}
            size="sm"
            type="button"
            variant="outline"
          >
            <RotateCcw className="size-3.5" />
            {mutation.isPending ? "מבצע..." : "ביצוע זיכוי"}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>לאשר זיכוי להזמנה?</AlertDialogTitle>
            <AlertDialogDescription>
              הפעולה תעדכן את סטטוס ההזמנה והתשלומים לזיכוי, ותיצור אירוע הודעה
              ללקוח. החזרת מלאי תתבצע רק אם האפשרות סומנה.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction
              disabled={mutation.isPending}
              onClick={submitRefund}
            >
              אישור זיכוי
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AdminMutationStatus feedback={feedback} />
    </form>
  );
}

function StatusActionButton({
  disabled,
  label,
  onConfirm,
  pending,
  requiresConfirmation,
  variant,
}: {
  disabled: boolean;
  label: string;
  onConfirm: () => void;
  pending: boolean;
  requiresConfirmation: boolean;
  variant: "outline" | "secondary";
}) {
  const buttonLabel = pending ? "מעדכן..." : label;

  if (!requiresConfirmation) {
    return (
      <Button
        disabled={disabled}
        onClick={onConfirm}
        size="sm"
        type="button"
        variant={variant}
      >
        {buttonLabel}
      </Button>
    );
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button disabled={disabled} size="sm" type="button" variant={variant}>
          {buttonLabel}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent dir="rtl">
        <AlertDialogHeader>
          <AlertDialogTitle>לאשר ביטול הזמנה?</AlertDialogTitle>
          <AlertDialogDescription>
            ביטול ישחרר שמירות מלאי, יעדכן תשלום ידני לכשל ויירשם ב-audit.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>חזרה</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>אישור ביטול</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function getAvailableActions(status: string, fulfillmentMethod: string) {
  if (terminalStatuses.has(status)) return [];

  if (status === "PENDING_PAYMENT") {
    return [
      { label: "אישור תשלום ידני", status: "PAID" as const },
      { label: "ביטול", status: "CANCELLED" as const },
    ];
  }

  if (status === "PAID") {
    return [
      { label: "העברה להכנה", status: "PREPARING" as const },
      { label: "ביטול", status: "CANCELLED" as const },
    ];
  }

  if (status === "PREPARING") {
    return [
      {
        label: fulfillmentMethod === "PICKUP" ? "מוכן לאיסוף" : "נשלח",
        status:
          fulfillmentMethod === "PICKUP"
            ? ("READY_FOR_PICKUP" as const)
            : ("SHIPPED" as const),
      },
      { label: "ביטול", status: "CANCELLED" as const },
    ];
  }

  return [{ label: "השלמה", status: "COMPLETED" as const }];
}
