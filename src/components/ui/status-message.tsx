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
  return (
    <p
      className={cn(
        "leading-6",
        size === "xs" ? "text-xs" : "text-sm",
        variant === "inset" && "glass-inset rounded-md border p-3",
        tone === "success" && "text-emerald-700",
        tone === "error" && "text-red-700",
        tone === "neutral" && "text-muted-foreground",
        className,
      )}
      data-testid={testId}
      role={role ?? (tone === "error" ? "alert" : "status")}
    >
      {children}
    </p>
  );
}
