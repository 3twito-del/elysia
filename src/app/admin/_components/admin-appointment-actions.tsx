"use client";

import { useRouter } from "next/navigation";

import { Button } from "~/components/ui/button";
import { StatusMessage } from "~/components/ui/status-message";
import { api } from "~/trpc/react";

type AppointmentStatus = "REQUESTED" | "CONFIRMED" | "COMPLETED" | "CANCELLED";

const actionsByStatus: Record<
  AppointmentStatus,
  Array<{ status: AppointmentStatus; label: string }>
> = {
  REQUESTED: [
    { status: "CONFIRMED", label: "אישור" },
    { status: "CANCELLED", label: "ביטול" },
  ],
  CONFIRMED: [
    { status: "COMPLETED", label: "הושלם" },
    { status: "CANCELLED", label: "ביטול" },
  ],
  COMPLETED: [],
  CANCELLED: [],
};

export function AdminAppointmentActions({
  appointmentId,
  status,
}: {
  appointmentId: string;
  status: AppointmentStatus;
}) {
  const router = useRouter();
  const mutation = api.admin.updateAppointmentStatus.useMutation({
    onSuccess: () => router.refresh(),
  });
  const actions = actionsByStatus[status];

  if (actions.length === 0) {
    return <span className="text-muted-foreground text-xs">אין פעולות</span>;
  }

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <Button
            disabled={mutation.isPending}
            key={action.status}
            onClick={() =>
              mutation.mutate({
                appointmentId,
                status: action.status,
              })
            }
            size="sm"
            type="button"
            variant={action.status === "CANCELLED" ? "outline" : "secondary"}
          >
            {action.label}
          </Button>
        ))}
      </div>
      {mutation.error ? (
        <StatusMessage size="xs" tone="error" variant="plain">
          {mutation.error.message}
        </StatusMessage>
      ) : null}
    </div>
  );
}
