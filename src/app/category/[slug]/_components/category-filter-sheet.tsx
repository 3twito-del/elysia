"use client";

import type { ReactNode } from "react";
import {
  Children,
  cloneElement,
  isValidElement,
  useState,
  type ReactElement,
} from "react";

import { Sheet, SheetTrigger } from "~/components/ui/sheet";

type CategoryFilterSheetProps = {
  activeFilterCount: number;
  children: ReactNode;
};

type FilterTriggerProps = {
  "aria-expanded"?: boolean;
  "aria-haspopup"?: "dialog";
  "data-active-filter-count"?: number;
};

export function CategoryFilterSheet({
  activeFilterCount,
  children,
}: CategoryFilterSheetProps) {
  const [open, setOpen] = useState(false);
  const [trigger, ...content] = Children.toArray(children);

  if (!isValidElement(trigger)) {
    return (
      <Sheet onOpenChange={setOpen} open={open}>
        {children}
      </Sheet>
    );
  }

  const triggerElement = trigger as ReactElement<FilterTriggerProps>;

  return (
    <Sheet onOpenChange={setOpen} open={open}>
      <SheetTrigger asChild>
        {cloneElement(triggerElement, {
          "aria-expanded": open,
          "aria-haspopup": "dialog",
          "data-active-filter-count": activeFilterCount,
        })}
      </SheetTrigger>
      {content}
    </Sheet>
  );
}
