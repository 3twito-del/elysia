"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  AdminMutationStatus,
  type AdminMutationFeedback,
} from "./admin-mutation-status";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";

type AppointmentStatus = "REQUESTED" | "CONFIRMED" | "COMPLETED" | "CANCELLED";

const actionsByStatus: Record<
  AppointmentStatus,
  Array<{ label: string; status: AppointmentStatus }>
> = {
  CANCELLED: [],
  COMPLETED: [],
  CONFIRMED: [
    { label: "הושלם", status: "COMPLETED" },
    { label: "ביטול", status: "CANCELLED" },
  ],
  REQUESTED: [
    { label: "אישור", status: "CONFIRMED" },
    { label: "ביטול", status: "CANCELLED" },
  ],
};

export function AdminAppointmentActions({
  appointmentId,
  status,
}: {
  appointmentId: string;
  status: AppointmentStatus;
}) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<AdminMutationFeedback>();
  const mutation = api.admin.updateAppointmentStatus.useMutation({
    onError: (error) => setFeedback({ message: error.message, tone: "error" }),
    onMutate: () => setFeedback(undefined),
    onSuccess: () => {
      router.refresh();
      setFeedback({ message: "התור עודכן.", tone: "success" });
    },
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
            aria-label={`עדכון תור: ${action.label}`}
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
      <AdminMutationStatus feedback={feedback} />
    </div>
  );
}
