"use client";

import * as React from "react";
import { Dialog as SheetPrimitive } from "radix-ui";

import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import { XIcon } from "lucide-react";

type SheetProps = Omit<
  React.ComponentProps<typeof SheetPrimitive.Root>,
  "defaultOpen" | "onOpenChange" | "open"
> & {
  closeOnMediaQuery?: string;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
};

function Sheet({
  closeOnMediaQuery,
  defaultOpen,
  onOpenChange,
  open: controlledOpen,
  ...props
}: SheetProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(
    defaultOpen ?? false,
  );
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      if (!isControlled) {
        setUncontrolledOpen(nextOpen);
      }

      onOpenChange?.(nextOpen);
    },
    [isControlled, onOpenChange],
  );

  React.useEffect(() => {
    if (!closeOnMediaQuery || !open) return;

    const mediaQuery = window.matchMedia(closeOnMediaQuery);
    const closeIfMatched = () => {
      if (mediaQuery.matches) {
        handleOpenChange(false);
      }
    };

    closeIfMatched();
    mediaQuery.addEventListener("change", closeIfMatched);

    return () => mediaQuery.removeEventListener("change", closeIfMatched);
  }, [closeOnMediaQuery, handleOpenChange, open]);

  return (
    <SheetPrimitive.Root
      data-slot="sheet"
      onOpenChange={handleOpenChange}
      open={open}
      {...props}
    />
  );
}

function SheetTrigger({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Trigger>) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

function SheetClose({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Close>) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />;
}

function SheetPortal({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Portal>) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />;
}

function SheetOverlay({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
  return (
    <SheetPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn(
        "popup-overlay data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 fixed inset-0 z-[80] data-closed:duration-150 data-open:duration-200 motion-reduce:animate-none",
        className,
      )}
      {...props}
    />
  );
}

function SheetContent({
  className,
  children,
  side = "right",
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
  side?: "top" | "right" | "bottom" | "left";
  showCloseButton?: boolean;
}) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        data-side={side}
        className={cn(
          "popup-surface text-popover-foreground data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 fixed z-[90] flex flex-col gap-4 text-sm ease-[var(--ease-motion-standard)] data-closed:duration-150 data-open:duration-200 motion-reduce:animate-none motion-reduce:transition-none",
          side === "bottom" &&
            "data-open:slide-in-from-bottom data-closed:slide-out-to-bottom inset-x-0 bottom-0 h-auto border-t",
          side === "left" &&
            "data-open:slide-in-from-left data-closed:slide-out-to-left inset-y-0 left-0 h-full w-[min(88dvw,22rem)] border-r sm:max-w-sm",
          side === "right" &&
            "data-open:slide-in-from-right data-closed:slide-out-to-right inset-y-0 right-[calc(100vw-100dvw)] h-full w-[min(88dvw,22rem)] border-l sm:max-w-sm",
          side === "top" &&
            "data-open:slide-in-from-top data-closed:slide-out-to-top inset-x-0 top-0 h-auto border-b",
          className,
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <SheetPrimitive.Close data-slot="sheet-close" asChild>
            <Button
              variant="ghost"
              className="absolute end-3 top-3"
              size="icon-sm"
            >
              <XIcon aria-hidden="true" />
              <span className="sr-only">סגירה</span>
            </Button>
          </SheetPrimitive.Close>
        )}
      </SheetPrimitive.Content>
    </SheetPortal>
  );
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-0.5 p-4", className)}
      {...props}
    />
  );
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      {...props}
    />
  );
}

function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn(
        "font-heading text-foreground text-base font-medium",
        className,
      )}
      {...props}
    />
  );
}

function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
};
