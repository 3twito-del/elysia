"use client";

import { Loader2 } from "lucide-react";
import {
  useState,
  type MouseEvent,
  type ReactNode,
  type ComponentPropsWithoutRef,
} from "react";

type CategoryPaginationLinkProps = Omit<
  ComponentPropsWithoutRef<"a">,
  "href"
> & {
  children: ReactNode;
  href: string;
  loadingLabel?: ReactNode;
  testId?: string;
};

export function CategoryPaginationLink({
  children,
  loadingLabel = "טוען",
  onClick,
  testId = "category-pagination-link",
  ...props
}: CategoryPaginationLinkProps) {
  const [isLoading, setIsLoading] = useState(false);

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (isLoading) {
      event.preventDefault();
      return;
    }

    onClick?.(event);

    if (!event.defaultPrevented) {
      setIsLoading(true);
    }
  }

  return (
    <a
      {...props}
      aria-busy={isLoading}
      aria-disabled={isLoading || undefined}
      data-loading={isLoading ? "true" : "false"}
      data-testid={testId}
      onClick={handleClick}
    >
      {isLoading ? (
        <Loader2 aria-hidden="true" className="size-3 animate-spin" />
      ) : null}
      {isLoading ? loadingLabel : children}
    </a>
  );
}
