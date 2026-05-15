import { Spinner } from "~/components/ui/spinner";
import { cn } from "~/lib/utils";

type LoadingStateProps = {
  className?: string;
  label: string;
  variant?: "inset" | "inline" | "plain";
};

export function LoadingState({
  className,
  label,
  variant = "inset",
}: LoadingStateProps) {
  return (
    <div
      aria-live="polite"
      className={cn(
        "text-muted-foreground flex items-center gap-2 text-sm leading-6",
        variant === "inset" &&
          "w-fit border-y border-[var(--glass-border)] py-3",
        variant === "inline" &&
          "w-fit border-y border-[var(--glass-border)] px-1 py-2",
        className,
      )}
      role="status"
    >
      <Spinner
        aria-hidden="true"
        className="size-4 shrink-0"
        role="presentation"
      />
      <span>{label}</span>
    </div>
  );
}
