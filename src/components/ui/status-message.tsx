import type { ReactNode } from "react";

import { cn } from "~/lib/utils";

type StatusMessageProps = {
  children: ReactNode;
  className?: string;
  role?: "alert" | "status";
  size?: "xs" | "sm";
  testId?: string;
  tone?: "error" | "neutral" | "success";
  variant?: "inset" | "plain";
};

export function StatusMessage({
  children,
  className,
  role,
  size = "sm",
  testId,
  tone = "neutral",
  variant = "inset",
}: StatusMessageProps) {
  const messageRole = role ?? (tone === "error" ? "alert" : "status");

  return (
    <p
      aria-atomic="true"
      aria-live={messageRole === "alert" ? "assertive" : "polite"}
      className={cn(
        "leading-6",
        size === "xs" ? "text-xs" : "text-sm",
        variant === "inset" && "glass-inset rounded-md border p-3",
        tone === "success" && "text-emerald-700 dark:text-emerald-300",
        tone === "error" && "text-red-700 dark:text-red-300",
        tone === "neutral" && "text-muted-foreground",
        className,
      )}
      data-testid={testId}
      role={messageRole}
    >
      {children}
    </p>
  );
}
