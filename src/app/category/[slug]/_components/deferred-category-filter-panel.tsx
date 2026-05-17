"use client";

import Link from "next/link";
import { Check, MapPin, RotateCw, X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import type { CategoryFilterPayload } from "../_lib/category-filter-state";
import { buttonVariants } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { SheetClose } from "~/components/ui/sheet";
import { cn } from "~/lib/utils";

type DeferredCategoryFilterPanelProps = {
  activeFilterCount: number;
  closeOnSelect?: boolean;
  queryString: string;
  resetHref: string;
  slug: string;
};

type LoadState =
  | { status: "idle" }
  | { data: CategoryFilterPayload; status: "ready" }
  | { status: "error" };

export function DeferredCategoryFilterPanel({
  activeFilterCount,
  closeOnSelect = false,
  queryString,
  resetHref,
  slug,
}: DeferredCategoryFilterPanelProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [shouldLoad, setShouldLoad] = useState(closeOnSelect);
  const [loadState, setLoadState] = useState<LoadState>({ status: "idle" });

  useEffect(() => {
    if (shouldLoad) return;

    const node = rootRef.current;
    if (!node) return;

    if (!("IntersectionObserver" in window)) {
      const fallbackTimer = setTimeout(() => setShouldLoad(true), 0);

      return () => clearTimeout(fallbackTimer);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: "480px 0px" },
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [shouldLoad]);

  useEffect(() => {
    if (!shouldLoad || loadState.status !== "idle") return;

    const controller = new AbortController();
    const params = queryString ? `?${queryString}` : "";

    fetch(`/category/${slug}/filters${params}`, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error("Filter payload failed");

        return response.json() as Promise<CategoryFilterPayload>;
      })
      .then((data) => setLoadState({ data, status: "ready" }))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setLoadState({ status: "error" });
      });

    return () => controller.abort();
  }, [loadState.status, queryString, shouldLoad, slug]);

  return (
    <div className="min-h-40" ref={rootRef}>
      {loadState.status === "ready" ? (
        <FilterPanelContent
          closeOnSelect={closeOnSelect}
          data={loadState.data}
        />
      ) : loadState.status === "error" ? (
        <FilterPanelFallback resetHref={resetHref} />
      ) : (
        <FilterPanelSkeleton activeFilterCount={activeFilterCount} />
      )}
    </div>
  );
}

function FilterPanelContent({
  closeOnSelect,
  data,
}: {
  closeOnSelect: boolean;
  data: CategoryFilterPayload;
}) {
  return (
    <div className="grid gap-5 text-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-muted-foreground text-xs">
          {data.activeFilterCount > 0
            ? `${data.activeFilterCount} בחירות פעילות`
            : "בחירה נקייה"}
        </p>
        {data.activeFilterCount > 0 && (
          <FilterActionLink
            closeOnSelect={closeOnSelect}
            href={data.resetHref}
            variant="ghost"
          >
            איפוס
          </FilterActionLink>
        )}
      </div>

      {data.activeFilters.length > 0 && (
        <div aria-label="בחירות פעילות" className="flex flex-wrap gap-2">
          {data.activeFilters.map((filter) => (
            <FilterActionLink
              className="h-auto max-w-full gap-1 px-2 py-1 text-xs whitespace-normal"
              closeOnSelect={closeOnSelect}
              href={filter.href}
              key={filter.key}
            >
              <span className="min-w-0 truncate">{filter.label}</span>
              <X aria-hidden="true" className="size-3" />
            </FilterActionLink>
          ))}
        </div>
      )}

      {data.sections.map((section, index) => (
        <FilterSection
          closeOnSelect={closeOnSelect}
          key={section.title}
          section={section}
          withSeparator={index > 0}
        />
      ))}
    </div>
  );
}

function FilterSection({
  closeOnSelect,
  section,
  withSeparator,
}: {
  closeOnSelect: boolean;
  section: CategoryFilterPayload["sections"][number];
  withSeparator: boolean;
}) {
  return (
    <>
      {withSeparator && <Separator />}
      <section aria-label={section.title} className="grid gap-2">
        <p className="font-medium">{section.title}</p>
        <div className="grid gap-1">
          {section.options.map((option) => (
            <FilterOptionLink
              closeOnSelect={closeOnSelect}
              key={`${section.title}-${option.href}-${option.label}`}
              option={option}
            />
          ))}
        </div>
      </section>
    </>
  );
}

function FilterOptionLink({
  closeOnSelect,
  option,
}: {
  closeOnSelect: boolean;
  option: CategoryFilterPayload["sections"][number]["options"][number];
}) {
  const className = cn(
    buttonVariants({
      size: "sm",
      variant: option.active ? "secondary" : "ghost",
    }),
    "h-auto min-h-10 w-full justify-between border px-3 py-2 text-right whitespace-normal",
    option.active &&
      "border-[var(--glass-border-strong)] bg-[var(--glass-inset-bg)] shadow-[inset_0_0_0_1px_var(--glass-border-strong)]",
    option.disabled && "cursor-not-allowed opacity-45",
  );
  const content = (
    <>
      <span className="flex min-w-0 items-center gap-2">
        {option.icon === "pin" && (
          <MapPin aria-hidden="true" className="size-3.5" />
        )}
        <span className="min-w-0 truncate">{option.label}</span>
      </span>
      <span className="flex shrink-0 items-center gap-2">
        {option.meta && (
          <span className="text-muted-foreground text-xs">{option.meta}</span>
        )}
        {option.active && <Check aria-hidden="true" className="size-3.5" />}
      </span>
    </>
  );

  if (option.disabled) {
    return (
      <span
        aria-disabled="true"
        className={className}
        data-disabled="true"
        title="אין תוצאות זמינות"
      >
        {content}
      </span>
    );
  }

  const link = (
    <Link
      aria-current={option.active ? "page" : undefined}
      className={cn(
        className,
        "focus-visible:ring-3 focus-visible:ring-[var(--glass-focus)] focus-visible:outline-none",
      )}
      data-state={option.active ? "checked" : "unchecked"}
      href={option.href}
      scroll={false}
    >
      {content}
    </Link>
  );

  if (closeOnSelect) {
    return <SheetClose asChild>{link}</SheetClose>;
  }

  return link;
}

function FilterActionLink({
  href,
  children,
  className,
  closeOnSelect,
  variant = "outline",
}: {
  href: string;
  children: ReactNode;
  className?: string;
  closeOnSelect?: boolean;
  variant?: "outline" | "ghost";
}) {
  const link = (
    <Link
      className={cn(buttonVariants({ size: "sm", variant }), className)}
      href={href}
      scroll={false}
    >
      {children}
    </Link>
  );

  if (closeOnSelect) {
    return <SheetClose asChild>{link}</SheetClose>;
  }

  return link;
}

function FilterPanelSkeleton({
  activeFilterCount,
}: {
  activeFilterCount: number;
}) {
  return (
    <div aria-busy="true" className="grid gap-4 text-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="bg-muted h-3 w-28 rounded-md" />
        {activeFilterCount > 0 && (
          <span className="bg-muted h-7 w-16 rounded-md" />
        )}
      </div>
      {Array.from({ length: 4 }, (_, index) => (
        <div className="grid gap-2" key={index}>
          {index > 0 && <Separator />}
          <span className="bg-muted h-4 w-20 rounded-md" />
          <span className="bg-muted h-9 w-full rounded-md" />
          <span className="bg-muted h-9 w-full rounded-md" />
        </div>
      ))}
    </div>
  );
}

function FilterPanelFallback({ resetHref }: { resetHref: string }) {
  return (
    <div className="grid gap-3 text-sm">
      <div className="text-muted-foreground flex items-center gap-2">
        <RotateCw aria-hidden="true" className="size-4" />
        <span>לא ניתן לטעון פילטרים כרגע.</span>
      </div>
      <Link
        className={buttonVariants({ size: "sm", variant: "outline" })}
        href={resetHref}
        scroll={false}
      >
        איפוס פילטרים
      </Link>
    </div>
  );
}
