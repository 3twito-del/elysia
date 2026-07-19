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
        isComplete && "checkout-step-badge-complete",
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
