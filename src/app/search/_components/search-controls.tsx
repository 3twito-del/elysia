"use client";

import Link from "next/link";
import { Check, ChevronDown, Search, SlidersHorizontal, X } from "lucide-react";
import {
  type FormEvent,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from "react";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "~/components/ui/sheet";
import { cn } from "~/lib/utils";
import type { ProductSearchInput } from "~/server/adapters/search";
import type { CatalogCategory, CatalogFacets } from "~/server/services/catalog";
import { SearchHistoryList } from "./search-history-list";

type SearchControlsProps = {
  activeFilterCount: number;
  categories: CatalogCategory[];
  clearFiltersHref: string;
  clearSearchHref: string;
  facets: CatalogFacets;
  input: ProductSearchInput;
  viewMode: "grid" | "list";
};

const publicSelectEmptyValue = "__elysia_empty_selection__";

export function SearchControls({
  activeFilterCount,
  categories,
  clearFiltersHref,
  clearSearchHref,
  facets,
  input,
  viewMode,
}: SearchControlsProps) {
  const shouldShowAdvancedFilters = activeFilterCount > 0;
  const hasQuery = Boolean(input.query?.trim());
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const summaryRef = useRef<HTMLElement>(null);
  const desktopQueryInputRef = useRef<HTMLInputElement>(null);
  const mobileQueryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const detailsElement = detailsRef.current;

    if (!detailsElement) return;

    const focusVisibleQueryInput = () => {
      for (const inputRef of [desktopQueryInputRef, mobileQueryInputRef]) {
        const element = inputRef.current;

        if (element && element.offsetParent !== null) {
          element.focus();
          return;
        }
      }
    };

    const handleToggle = () => {
      if (detailsElement.open) focusVisibleQueryInput();
    };

    detailsElement.addEventListener("toggle", handleToggle);

    return () => detailsElement.removeEventListener("toggle", handleToggle);
  }, []);

  function closeSearchPanel(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Escape") return;

    event.preventDefault();

    if (detailsRef.current) detailsRef.current.open = false;

    summaryRef.current?.focus();
  }

  return (
    <details
      className="group/search-controls w-full max-w-full min-w-0 border-y border-[var(--glass-border)] py-3"
      data-testid="search-form"
      open={hasQuery || activeFilterCount > 0}
      ref={detailsRef}
    >
      <summary
        className="flex min-h-10 w-full max-w-full min-w-0 cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium outline-none focus-visible:ring-3 focus-visible:ring-[var(--glass-focus)]"
        data-testid="search-controls-toggle"
        ref={summaryRef}
      >
        <span className="inline-flex items-center gap-2">
          <SlidersHorizontal aria-hidden="true" className="size-4" />
          חיפוש וסינון
        </span>
        <span className="text-muted-foreground inline-flex items-center gap-2 text-xs">
          {activeFilterCount > 0 ? (
            <Badge variant="secondary">{activeFilterCount}</Badge>
          ) : null}
          <ChevronDown
            aria-hidden="true"
            className="size-4 transition-transform group-open/search-controls:rotate-180"
          />
        </span>
      </summary>
      <div className="mt-3 grid gap-3">
        <form
          action="/search"
          aria-label="חיפוש תכשיטים"
          className="hidden gap-3 lg:grid"
          onSubmit={pruneEmptySearchParams}
          role="search"
        >
          <div className="grid items-end gap-3 lg:grid-cols-[minmax(18rem,1.45fr)_repeat(3,minmax(9rem,1fr))_auto]">
            <PrimarySearchFields
              categories={categories}
              clearSearchHref={clearSearchHref}
              input={input}
              onQueryKeyDown={closeSearchPanel}
              queryInputRef={desktopQueryInputRef}
            />
            <Button className="h-11 gap-2" type="submit">
              <Search aria-hidden="true" className="size-4" />
              חיפוש
            </Button>
          </div>
          <details
            className="group/search-advanced border-t border-[var(--glass-border)] pt-3"
            open={shouldShowAdvancedFilters}
          >
            <summary className="text-muted-foreground hover:text-foreground flex min-h-9 cursor-pointer list-none items-center justify-between gap-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-[var(--glass-focus)]">
              <span className="inline-flex items-center gap-2">
                <SlidersHorizontal aria-hidden="true" className="size-4" />
                {"סינון מתקדם"}
              </span>
              {activeFilterCount > 0 ? (
                <Badge variant="secondary">{activeFilterCount}</Badge>
              ) : null}
            </summary>
            <div className="mt-3 grid items-end gap-3 lg:grid-cols-[repeat(5,minmax(8.5rem,1fr))]">
              <FacetSearchFields facets={facets} input={input} />
              <AvailabilityField input={input} />
              <PreservedModeInput input={input} />
              <PreservedViewInput viewMode={viewMode} />
            </div>
          </details>
        </form>

        <div
          className="grid gap-3 lg:hidden"
          data-testid="mobile-search-controls"
        >
          <form
            action="/search"
            aria-label="חיפוש מהיר"
            className="grid grid-cols-[minmax(0,1fr)_auto] gap-2"
            onSubmit={pruneEmptySearchParams}
            role="search"
          >
            <div className="relative min-w-0">
              <Search
                aria-hidden="true"
                className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2"
              />
              <Input
                aria-label="חיפוש תכשיט, חומר, אבן, אירוע או מחיר"
                className={cn("h-11 ps-10", hasQuery ? "pe-10" : "pe-3")}
                data-search-prune-empty
                defaultValue={input.query}
                name="q"
                onKeyDown={closeSearchPanel}
                placeholder="טבעת, פנינה, מתנה..."
                ref={mobileQueryInputRef}
              />
              {hasQuery ? (
                <SearchClearQueryLink href={clearSearchHref} />
              ) : null}
            </div>
            <PreservedSearchInputs input={input} viewMode={viewMode} />
            <Button
              aria-label="חיפוש"
              className="h-11 gap-2 px-3 text-sm sm:px-4"
              type="submit"
            >
              <Search aria-hidden="true" className="text-background size-4" />
              <span className="sr-only sm:not-sr-only">חיפוש</span>
            </Button>
          </form>

          <Sheet closeOnMediaQuery="(min-width: 768px)">
            <SheetTrigger asChild>
              <Button
                aria-label="סינון ומיון"
                className="relative h-11 w-full justify-center gap-2"
                data-testid="mobile-search-filter-trigger"
                type="button"
                variant="outline"
              >
                <span className="inline-flex items-center gap-2">
                  <SlidersHorizontal
                    aria-hidden="true"
                    className="text-foreground size-4"
                  />
                  סינון ומיון
                </span>
                {activeFilterCount > 0 ? (
                  <Badge
                    className="absolute -top-2 -left-2"
                    variant="secondary"
                  >
                    {activeFilterCount}
                  </Badge>
                ) : null}
              </Button>
            </SheetTrigger>
            <SheetContent
              className="overflow-y-auto p-0"
              data-testid="mobile-search-filter-sheet"
              dir="rtl"
              side="right"
            >
              <SheetHeader className="border-b border-[var(--glass-border)] pe-12 text-right">
                <SheetTitle className="flex items-center gap-2">
                  <SlidersHorizontal aria-hidden="true" className="size-4" />
                  סינון מתקדם
                </SheetTitle>
                <SheetDescription>
                  בחרי חומר, מחיר, סגנון, צבע ומיון כדי לצמצם את התוצאות.
                </SheetDescription>
              </SheetHeader>
              <form
                action="/search"
                aria-label="סינון תוצאות חיפוש"
                className="grid gap-4 p-4"
                onSubmit={pruneEmptySearchParams}
                role="search"
              >
                <PrimarySearchFields
                  categories={categories}
                  clearSearchHref={clearSearchHref}
                  input={input}
                />
                <FacetSearchFields facets={facets} input={input} />
                <AvailabilityField input={input} />
                <PreservedModeInput input={input} />
                <PreservedViewInput viewMode={viewMode} />
                <div className="grid gap-3 pt-1">
                  <Button type="submit">הצגת תוצאות</Button>
                  <Button asChild variant="outline">
                    <SheetClose asChild>
                      <Link href={clearFiltersHref}>איפוס</Link>
                    </SheetClose>
                  </Button>
                </div>
              </form>
            </SheetContent>
          </Sheet>
        </div>
        <SearchHistoryList
          currentQuery={input.query}
          mode={input.mode}
          viewMode={viewMode}
        />
      </div>
    </details>
  );
}

function PrimarySearchFields({
  categories,
  clearSearchHref,
  input,
  onQueryKeyDown,
  queryInputRef,
}: {
  categories: CatalogCategory[];
  clearSearchHref: string;
  input: ProductSearchInput;
  // Optional: only the "חיפוש וסינון" details panel's own input wires these
  // (autofocus-on-open + Escape returns focus to its summary toggle). The
  // mobile filter/sort Sheet reuses this component too, but a Sheet is a
  // separate overlay with its own native Escape-to-close behavior, which
  // must stay unmodified.
  onQueryKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
  queryInputRef?: RefObject<HTMLInputElement | null>;
}) {
  const hasQuery = Boolean(input.query?.trim());

  return (
    <>
      <SearchControlField label="חיפוש">
        <div className="relative min-w-0">
          <Search
            aria-hidden="true"
            className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2"
          />
          <Input
            aria-label="חיפוש תכשיט, חומר, אבן, אירוע או מחיר"
            className={cn("h-11 ps-10", hasQuery ? "pe-10" : "pe-3")}
            data-search-prune-empty
            defaultValue={input.query}
            name="q"
            onKeyDown={onQueryKeyDown}
            placeholder="טבעת, פנינה, מתנה..."
            ref={queryInputRef}
          />
          {hasQuery ? <SearchClearQueryLink href={clearSearchHref} /> : null}
        </div>
      </SearchControlField>
      <SearchSelectField
        key={`category-${input.category ?? ""}`}
        label="קטגוריה"
        name="category"
        options={categories.map((category) => ({
          label: category.name,
          value: category.slug,
        }))}
        placeholder="כל הקטגוריות"
        value={input.category}
      />
      <SearchControlField label="מחיר">
        <Input
          aria-label="מחיר מקסימלי"
          className="h-11"
          data-search-prune-empty
          defaultValue={input.maxPrice}
          min={0}
          name="maxPrice"
          placeholder="מחיר עד"
          type="number"
        />
      </SearchControlField>
      <SearchSelectField
        key={`sort-${input.sort ?? "relevance"}`}
        label="מיון"
        name="sort"
        options={[
          { label: "התאמה", value: "relevance" },
          { label: "מחיר: נמוך לגבוה", value: "price-asc" },
          { label: "מחיר: גבוה לנמוך", value: "price-desc" },
          { label: "חדשים", value: "newest" },
          { label: "מומלצים", value: "popular" },
        ]}
        placeholder="התאמה"
        defaultSubmitValue="relevance"
        value={input.sort ?? "relevance"}
      />
    </>
  );
}

function SearchClearQueryLink({ href }: { href: string }) {
  return (
    <Link
      aria-label="ניקוי חיפוש"
      className="text-muted-foreground hover:text-foreground absolute top-1/2 left-2 grid size-7 -translate-y-1/2 place-items-center rounded-md transition outline-none focus-visible:ring-3 focus-visible:ring-[var(--glass-focus)]"
      data-testid="search-clear-query"
      href={href}
      scroll={false}
    >
      <X aria-hidden="true" className="size-4" />
    </Link>
  );
}

function FacetSearchFields({
  facets,
  input,
}: {
  facets: CatalogFacets;
  input: ProductSearchInput;
}) {
  return (
    <>
      <SearchSelectField
        key={`material-${input.material ?? ""}`}
        label="חומר"
        name="material"
        options={facets.materials.map((material) => ({
          label: material,
          value: material,
        }))}
        placeholder="כל החומרים"
        value={input.material}
      />
      <SearchSelectField
        key={`style-${input.style ?? ""}`}
        label="סגנון"
        name="style"
        options={facets.styles.map((style) => ({
          label: style,
          value: style,
        }))}
        placeholder="כל הסגנונות"
        value={input.style}
      />
      <SearchSelectField
        key={`gift-${input.gift ?? ""}`}
        label="מתנה"
        name="gift"
        options={facets.giftTags.map((gift) => ({
          label: gift,
          value: gift,
        }))}
        placeholder="כל המתנות"
        value={input.gift}
      />
      <SearchSelectField
        key={`color-${input.color ?? ""}`}
        label="צבע"
        name="color"
        options={facets.colors.map((color) => ({
          label: color,
          value: color,
        }))}
        placeholder="כל הצבעים"
        value={input.color}
      />
      <SearchSelectField
        key={`stone-${input.stone ?? ""}`}
        label="אבן"
        name="stone"
        options={facets.stones.map((stone) => ({
          label: stone,
          value: stone,
        }))}
        placeholder="כל האבנים"
        value={input.stone}
      />
      <SearchSelectField
        key={`collection-${input.collection ?? ""}`}
        label="קולקציה"
        name="collection"
        options={facets.collections.map((collection) => ({
          label: collection,
          value: collection,
        }))}
        placeholder="כל הקולקציות"
        value={input.collection}
      />
    </>
  );
}

function SearchSelectField({
  defaultSubmitValue,
  label,
  name,
  options,
  placeholder,
  value,
}: {
  defaultSubmitValue?: string;
  label: string;
  name: keyof ProductSearchInput;
  options: Array<{ label: string; value: string }>;
  placeholder: string;
  value?: string;
}) {
  const listboxId = useId();
  const normalizedValue = value ?? "";
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [currentValue, setCurrentValue] = useState(normalizedValue);
  const [isOpen, setIsOpen] = useState(false);
  const selectedValue = currentValue || publicSelectEmptyValue;
  const showPlaceholderItem = !options.some(
    (option) => option.label === placeholder,
  );
  const selectOptions = [
    ...(showPlaceholderItem
      ? [{ label: placeholder, value: publicSelectEmptyValue }]
      : []),
    ...options,
  ];
  const selectedIndex = Math.max(
    0,
    selectOptions.findIndex((option) => option.value === selectedValue),
  );
  const selectedLabel =
    selectOptions.find((option) => option.value === selectedValue)?.label ??
    placeholder;

  function focusOption(index: number) {
    window.requestAnimationFrame(() => {
      optionRefs.current[index]?.focus();
    });
  }

  function openList(index = selectedIndex) {
    setIsOpen(true);
    focusOption(index);
  }

  function closeList({ focusTrigger = false } = {}) {
    setIsOpen(false);

    if (focusTrigger) {
      window.requestAnimationFrame(() => {
        triggerRef.current?.focus();
      });
    }
  }

  function selectValue(nextValue: string) {
    setCurrentValue(nextValue === publicSelectEmptyValue ? "" : nextValue);
    closeList({ focusTrigger: true });
  }

  function handleTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (
      event.key === "ArrowDown" ||
      event.key === "Enter" ||
      event.key === " "
    ) {
      event.preventDefault();
      openList();
      return;
    }

    if (event.key === "Escape") {
      closeList();
    }
  }

  function handleListKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const activeIndex = optionRefs.current.findIndex(
      (option) => option === document.activeElement,
    );
    const currentIndex = activeIndex >= 0 ? activeIndex : selectedIndex;
    const lastIndex = selectOptions.length - 1;

    if (event.key === "Escape") {
      event.preventDefault();
      closeList({ focusTrigger: true });
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      focusOption(currentIndex === lastIndex ? 0 : currentIndex + 1);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      focusOption(currentIndex === 0 ? lastIndex : currentIndex - 1);
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      focusOption(0);
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      focusOption(lastIndex);
    }
  }

  return (
    <SearchControlField label={label}>
      <div className="public-select-shell">
        <button
          aria-label={label}
          aria-controls={isOpen ? listboxId : undefined}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          className="public-select-trigger"
          data-testid={`public-select-trigger-${name}`}
          data-state={isOpen ? "open" : "closed"}
          onClick={() => {
            if (isOpen) {
              closeList();
            } else {
              openList();
            }
          }}
          onKeyDown={handleTriggerKeyDown}
          ref={triggerRef}
          type="button"
        >
          <span data-public-select-value>{selectedLabel}</span>
          <ChevronDown aria-hidden="true" className="size-4 shrink-0" />
        </button>
        {isOpen ? (
          <button
            aria-label="סגירת רשימה"
            className="public-select-backdrop"
            onClick={() => closeList()}
            tabIndex={-1}
            type="button"
          />
        ) : null}
        {isOpen ? (
          <div
            aria-label={label}
            className="public-select-content"
            data-testid={`public-select-content-${name}`}
            id={listboxId}
            onKeyDown={handleListKeyDown}
            role="listbox"
            tabIndex={-1}
          >
            {selectOptions.map((option, index) => {
              const isSelected = option.value === selectedValue;

              return (
                <button
                  aria-selected={isSelected}
                  className="public-select-option"
                  data-highlighted={isSelected ? "" : undefined}
                  key={option.value}
                  onClick={() => selectValue(option.value)}
                  ref={(node) => {
                    optionRefs.current[index] = node;
                  }}
                  role="option"
                  type="button"
                >
                  <span>{option.label}</span>
                  {isSelected ? (
                    <Check aria-hidden="true" className="size-3.5 shrink-0" />
                  ) : null}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
      <input
        data-search-default-value={defaultSubmitValue}
        data-search-prune-empty
        name={name}
        type="hidden"
        value={currentValue}
      />
    </SearchControlField>
  );
}

function pruneEmptySearchParams(event: FormEvent<HTMLFormElement>) {
  const disabledFields: Array<
    HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
  > = [];

  for (const field of Array.from(event.currentTarget.elements)) {
    if (!isSubmittableField(field)) continue;
    if (!field.hasAttribute("data-search-prune-empty")) continue;

    const value = field.value.trim();
    const defaultValue = field.getAttribute("data-search-default-value");

    if (value === "" || (defaultValue !== null && value === defaultValue)) {
      field.disabled = true;
      disabledFields.push(field);
    }
  }

  window.setTimeout(() => {
    for (const field of disabledFields) {
      field.disabled = false;
    }
  }, 0);
}

function isSubmittableField(
  field: Element,
): field is HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement {
  return (
    field instanceof HTMLInputElement ||
    field instanceof HTMLSelectElement ||
    field instanceof HTMLTextAreaElement
  );
}

function AvailabilityField({ input }: { input: ProductSearchInput }) {
  return (
    <SearchControlField label="זמינות">
      <label
        className={cn(
          "glass-control flex h-11 min-w-0 items-center gap-2 rounded-md border px-3 text-sm transition-colors focus-within:border-[var(--glass-border-strong)] focus-within:ring-3 focus-within:ring-[var(--glass-focus)]",
          input.availableOnly && "border-[var(--glass-border-strong)]",
        )}
      >
        <input
          className="size-4 shrink-0 accent-[var(--foreground)]"
          defaultChecked={input.availableOnly}
          name="availableOnly"
          type="checkbox"
          value="1"
        />
        <span className="min-w-0 truncate">זמין</span>
        {input.availableOnly ? (
          <Check aria-hidden="true" className="ms-auto size-3.5 shrink-0" />
        ) : null}
      </label>
    </SearchControlField>
  );
}

function SearchControlField({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <div className="grid min-w-0 gap-1.5 text-sm">
      <span className="text-muted-foreground text-xs">{label}</span>
      {children}
    </div>
  );
}

function PreservedSearchInputs({
  input,
  viewMode,
}: {
  input: ProductSearchInput;
  viewMode: "grid" | "list";
}) {
  return (
    <>
      <PreservedInput name="category" value={input.category} />
      <PreservedInput name="material" value={input.material} />
      <PreservedInput name="stone" value={input.stone} />
      <PreservedInput name="collection" value={input.collection} />
      <PreservedInput name="style" value={input.style} />
      <PreservedInput name="gift" value={input.gift} />
      <PreservedInput name="color" value={input.color} />
      <PreservedInput name="maxPrice" value={input.maxPrice} />
      <PreservedInput
        name="availableOnly"
        value={input.availableOnly ? "1" : undefined}
      />
      <PreservedInput
        name="sort"
        value={
          input.sort && input.sort !== "relevance" ? input.sort : undefined
        }
      />
      <PreservedModeInput input={input} />
      <PreservedViewInput viewMode={viewMode} />
    </>
  );
}

function PreservedModeInput({ input }: { input: ProductSearchInput }) {
  return (
    <PreservedInput
      name="mode"
      value={input.mode === "classic" ? "classic" : undefined}
    />
  );
}

function PreservedViewInput({ viewMode }: { viewMode: "grid" | "list" }) {
  return (
    <PreservedInput
      name="view"
      value={viewMode === "list" ? "list" : undefined}
    />
  );
}

function PreservedInput({
  name,
  value,
}: {
  name: string;
  value?: number | string;
}) {
  if (value === undefined || value === "") return null;

  return <input name={name} type="hidden" value={String(value)} />;
}
