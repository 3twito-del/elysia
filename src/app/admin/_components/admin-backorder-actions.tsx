"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  AdminMutationStatus,
  type AdminMutationFeedback,
} from "./admin-mutation-status";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";

/** OMS-002: converts one OPEN backorder into a real reservation, once real
 * stock actually covers it (re-checked server-side, not assumed here). */
export function AdminFulfillBackorderButton({
  backorderId,
}: {
  backorderId: string;
}) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<AdminMutationFeedback>();
  const mutation = api.admin.fulfillBackorder.useMutation({
    onError: (error) => setFeedback({ message: error.message, tone: "error" }),
    onMutate: () => setFeedback(undefined),
    onSuccess: () => {
      router.refresh();
      setFeedback({ message: "ההזמנה מראש מולאה.", tone: "success" });
    },
  });

  return (
    <div className="grid gap-1">
      <Button
        disabled={mutation.isPending}
        onClick={() => mutation.mutate({ backorderId })}
        size="sm"
        type="button"
        variant="outline"
      >
        מלא הזמנה מראש
      </Button>
      <AdminMutationStatus feedback={feedback} />
    </div>
  );
}
