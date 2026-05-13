"use client";

import { StatusMessage } from "~/components/ui/status-message";

export type AdminMutationFeedback = {
  message: string;
  tone: "error" | "neutral" | "success";
};

export function AdminMutationStatus({
  feedback,
}: {
  feedback?: AdminMutationFeedback;
}) {
  if (!feedback) return null;

  return (
    <StatusMessage size="xs" tone={feedback.tone} variant="plain">
      {feedback.message}
    </StatusMessage>
  );
}
