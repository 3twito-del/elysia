import { Check } from "lucide-react";

import { cn } from "~/lib/utils";

export function CheckoutStepBadge({
  isComplete = false,
  value,
}: {
  isComplete?: boolean;
  value: string;
}) {
  return (
    <span
      className={cn(
        "glass-inset grid size-7 place-items-center rounded-full border text-xs font-semibold transition-colors duration-[var(--motion-fast)]",
        isComplete &&
          "border-emerald-700/30 text-emerald-700 dark:border-emerald-300/30 dark:text-emerald-300",
      )}
      data-checkout-step-complete={isComplete}
    >
      {isComplete ? (
        <>
          <Check aria-hidden="true" className="size-3.5" />
          <span className="sr-only">{`שלב ${value} הושלם`}</span>
        </>
      ) : (
        value
      )}
    </span>
  );
}
