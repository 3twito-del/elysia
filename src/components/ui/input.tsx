import * as React from "react";

import { cn } from "~/lib/utils";

function Input({
  autoComplete = "off",
  className,
  type,
  ...props
}: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      autoComplete={autoComplete}
      data-slot="input"
      className={cn(
        "elysia-control glass-control placeholder:text-muted-foreground aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 h-11 w-full min-w-0 rounded-md border px-3 py-2 text-base transition-colors outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:border-[var(--glass-border-hover)] focus-visible:ring-3 focus-visible:ring-[var(--glass-focus)] disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-[var(--glass-inset-bg)] disabled:opacity-50 aria-invalid:ring-3 md:text-sm",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
