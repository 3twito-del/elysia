"use client";

import type { ReactNode } from "react";
import {
  Children,
  cloneElement,
  isValidElement,
  useState,
  type MouseEventHandler,
  type ReactElement,
} from "react";

import { Sheet } from "~/components/ui/sheet";

type CategoryFilterSheetProps = {
  activeFilterCount: number;
  children: ReactNode;
};

type FilterTriggerProps = {
  "aria-expanded"?: boolean;
  "aria-haspopup"?: "dialog";
  "data-active-filter-count"?: number;
  onClick?: MouseEventHandler<HTMLElement>;
};

export function CategoryFilterSheet({
  activeFilterCount,
  children,
}: CategoryFilterSheetProps) {
  const [open, setOpen] = useState(false);
  const [trigger, ...content] = Children.toArray(children);

  if (!isValidElement(trigger)) {
    return (
      <Sheet
        closeOnMediaQuery="(min-width: 1024px)"
        onOpenChange={setOpen}
        open={open}
      >
        {children}
      </Sheet>
    );
  }

  const triggerElement = trigger as ReactElement<FilterTriggerProps>;
  const handleTriggerClick: MouseEventHandler<HTMLElement> = (event) => {
    triggerElement.props.onClick?.(event);

    if (!event.defaultPrevented) {
      setOpen(true);
    }
  };

  return (
    <>
      {cloneElement(triggerElement, {
        "aria-expanded": open,
        "aria-haspopup": "dialog",
        "data-active-filter-count": activeFilterCount,
        onClick: handleTriggerClick,
      })}
      <Sheet
        closeOnMediaQuery="(min-width: 1024px)"
        onOpenChange={setOpen}
        open={open}
      >
        {content}
      </Sheet>
    </>
  );
}
