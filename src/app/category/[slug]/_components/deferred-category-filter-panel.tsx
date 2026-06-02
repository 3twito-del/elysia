import Link from "next/link";
import { Check, MapPin, RotateCw, X } from "lucide-react";
import type { ReactNode } from "react";

import type { CategoryFilterPayload } from "../_lib/category-filter-state";
import { SheetClose } from "~/components/ui/sheet";
import { cn } from "~/lib/utils";

type DeferredCategoryFilterPanelProps = {
  closeOnSelect?: boolean;
  data: CategoryFilterPayload;
};

export function DeferredCategoryFilterPanel({
  closeOnSelect = false,
  data,
}: DeferredCategoryFilterPanelProps) {
  return (
    <div className="min-h-40">
      <FilterPanelContent closeOnSelect={closeOnSelect} data={data} />
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
    <div className="grid gap-6 text-sm" data-filter-style="fluent-list">
      <div className="grid gap-4 pb-1">
        <div className="flex items-start justify-between gap-3">
          <div className="grid gap-1">
            <p className="text-foreground text-sm font-medium">סינון</p>
            <p className="text-muted-foreground text-xs leading-5">
              סינון לפי קטגוריה, חומר, אבן, מחיר, סגנון, אירוע וקולקציה.
            </p>
          </div>
          {data.activeFilterCount > 0 && (
            <FilterActionLink
              closeOnSelect={closeOnSelect}
              href={data.resetHref}
              variant="ghost"
            >
              איפוס הכל
            </FilterActionLink>
          )}
        </div>

        <FilterSelectionSummary sections={data.sections} />
      </div>

      {data.activeFilters.length > 0 && (
        <div aria-label="בחירות פעילות" className="flex flex-wrap gap-2">
          {data.activeFilters.map((filter) => (
            <FilterActionLink
              className="text-foreground h-auto max-w-full gap-1 rounded-full bg-[var(--muted)] px-2.5 py-1 text-xs whitespace-normal"
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

      <div className="grid gap-5">
        {data.sections.map((section, index) => (
          <FilterSection
            closeOnSelect={closeOnSelect}
            key={section.title}
            section={section}
            withOffset={index > 0}
          />
        ))}
      </div>
    </div>
  );
}

function FilterSelectionSummary({
  sections,
}: {
  sections: CategoryFilterPayload["sections"];
}) {
  return (
    <dl
      className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs"
      data-testid="category-filter-selection-summary"
    >
      {sections.map((section) => {
        const activeOption = section.options.find((option) => option.active);

        return (
          <div className="min-w-0" key={section.title}>
            <dt className="text-muted-foreground">{section.title}</dt>
            <dd
              className="text-foreground truncate font-medium"
              data-testid="category-filter-section-current"
            >
              {activeOption?.label ?? "כל האפשרויות"}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

function FilterSection({
  closeOnSelect,
  section,
  withOffset,
}: {
  closeOnSelect: boolean;
  section: CategoryFilterPayload["sections"][number];
  withOffset: boolean;
}) {
  return (
    <section
      aria-label={section.title}
      className={cn(
        "grid gap-3",
        withOffset && "border-t border-[var(--glass-border)] pt-5",
      )}
    >
      <div className="grid gap-1">
        <h3 className="text-foreground text-sm font-medium">{section.title}</h3>
        <p className="text-muted-foreground text-xs leading-5">
          {section.description}
        </p>
        {section.title === "מחיר" ? (
          <div
            className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs"
            data-testid="category-price-filter-labels"
          >
            <span>מינימום: כל מחיר</span>
            <span>מקסימום: לפי בחירה</span>
          </div>
        ) : null}
      </div>
      <ul className="grid gap-1">
        {section.options.map((option) => (
          <li key={`${section.title}-${option.href}-${option.label}`}>
            <FilterOptionLink closeOnSelect={closeOnSelect} option={option} />
          </li>
        ))}
      </ul>
    </section>
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
    "grid min-h-10 w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-md px-2.5 py-2.5 text-right text-sm whitespace-normal transition-colors outline-none",
    "hover:bg-[var(--muted)] hover:text-foreground focus-visible:ring-3 focus-visible:ring-[var(--glass-focus)]",
    option.active ? "text-foreground font-semibold" : "text-muted-foreground",
    option.active && "bg-[var(--secondary)] shadow-none",
    option.disabled && "cursor-not-allowed opacity-45",
  );
  const content = (
    <>
      <span
        aria-hidden="true"
        className={cn(
          "grid size-4 place-items-center rounded-full text-transparent",
          option.active && "text-foreground",
        )}
      >
        {option.active && <Check aria-hidden="true" className="size-3" />}
      </span>
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
      </span>
    </>
  );

  if (option.disabled) {
    return (
      <span
        aria-disabled="true"
        className={className}
        data-disabled="true"
        title="אין התאמות פתוחות"
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
      className={cn(
        "text-muted-foreground hover:text-foreground inline-flex min-h-8 items-center justify-center gap-1.5 px-1 text-sm font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-[var(--glass-focus)]",
        variant === "outline" &&
          "text-foreground hover:border-foreground border-b border-[var(--glass-border)]",
        className,
      )}
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

export function FilterPanelFallback({ resetHref }: { resetHref: string }) {
  return (
    <div className="grid gap-3 text-sm">
      <div className="text-muted-foreground flex items-center gap-2">
        <RotateCw aria-hidden="true" className="size-4" />
        <span>הסינון אינו פתוח כרגע.</span>
      </div>
      <Link
        className="hover:border-foreground inline-flex min-h-8 w-fit items-center border-b border-[var(--glass-border)] px-1 text-sm font-medium transition-colors focus-visible:ring-3 focus-visible:ring-[var(--glass-focus)] focus-visible:outline-none"
        href={resetHref}
        scroll={false}
      >
        איפוס סינונים
      </Link>
    </div>
  );
}
