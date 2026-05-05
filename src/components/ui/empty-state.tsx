import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "~/lib/utils";

type EmptyStateProps = {
  actions?: ReactNode;
  className?: string;
  description: ReactNode;
  icon: LucideIcon;
  testId?: string;
  title: ReactNode;
  variant?: "panel" | "inset" | "plain";
};

export function EmptyState({
  actions,
  className,
  description,
  icon: Icon,
  testId,
  title,
  variant = "panel",
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "grid place-items-center rounded-md p-8 text-center",
        variant === "panel" && "glass-panel min-h-80 border",
        variant === "inset" && "glass-inset border",
        variant === "plain" && "min-h-40",
        className,
      )}
      data-testid={testId}
    >
      <div className="max-w-lg">
        <div className="glass-inset mx-auto mb-4 flex size-12 items-center justify-center rounded-md border">
          <Icon className="size-5" aria-hidden="true" />
        </div>
        <p className="text-xl font-semibold">{title}</p>
        <div className="text-muted-foreground mt-2 leading-7">
          {description}
        </div>
        {actions ? (
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {actions}
          </div>
        ) : null}
      </div>
    </div>
  );
}
