"use client";

import Link from "next/link";
import { Check, Search, SlidersHorizontal } from "lucide-react";
import type { ReactNode } from "react";

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

type SearchControlsProps = {
  activeFilterCount: number;
  categories: CatalogCategory[];
  clearFiltersHref: string;
  facets: CatalogFacets;
  input: ProductSearchInput;
  viewMode: "grid" | "list";
};

const searchSelectClassName =
  "glass-control h-11 w-full min-w-0 rounded-md border px-3 text-sm outline-none transition-colors focus-visible:border-[var(--glass-border-strong)] focus-visible:ring-3 focus-visible:ring-[var(--glass-focus)]";

export function SearchControls({
  activeFilterCount,
  categories,
  clearFiltersHref,
  facets,
  input,
  viewMode,
}: SearchControlsProps) {
  return (
    <div
      className="brand-control-panel rounded-md p-[var(--ui-panel-padding)]"
      data-testid="search-form"
    >
      <form
        action="/search"
        aria-label="חיפוש בקטלוג"
        className="hidden gap-3 lg:grid"
        role="search"
      >
        <div className="grid items-end gap-3 lg:grid-cols-[minmax(18rem,1.45fr)_repeat(3,minmax(9rem,1fr))_auto]">
          <PrimarySearchFields categories={categories} input={input} />
          <Button className="h-11 gap-2" type="submit">
            <Search aria-hidden="true" className="size-4" />
            חיפוש
          </Button>
        </div>
        <div className="grid items-end gap-3 border-t border-[var(--glass-border)] pt-3 lg:grid-cols-[repeat(3,minmax(9rem,1fr))_minmax(8rem,0.8fr)_minmax(9rem,0.9fr)]">
          <FacetSearchFields facets={facets} input={input} />
          <AvailabilityField input={input} />
          <PreservedModeInput input={input} />
          <PreservedViewInput viewMode={viewMode} />
        </div>
      </form>

      <div
        className="grid gap-3 lg:hidden"
        data-testid="mobile-search-controls"
      >
        <form
          action="/search"
          aria-label="חיפוש מהיר בקטלוג"
          className="grid grid-cols-[minmax(0,1fr)_auto] gap-2"
          role="search"
        >
          <div className="relative min-w-0">
            <Search
              aria-hidden="true"
              className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2"
            />
            <Input
              aria-label="חיפוש מוצר, חומר, אבן, אירוע או תקציב"
              className="h-11 ps-10 pe-3"
              defaultValue={input.query}
              name="q"
              placeholder="טבעת, עגילים, מתנה..."
            />
          </div>
          <PreservedSearchInputs input={input} viewMode={viewMode} />
          <Button
            aria-label="חיפוש"
            className="h-11 gap-2 px-4 text-sm"
            type="submit"
          >
            <Search aria-hidden="true" className="text-background size-4" />
            חיפוש
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
                סינון מדויק
              </span>
              {activeFilterCount > 0 ? (
                <Badge className="absolute -top-2 -left-2" variant="secondary">
                  {activeFilterCount}
                </Badge>
              ) : null}
            </Button>
          </SheetTrigger>
          <SheetContent
            className="max-h-[88dvh] overflow-y-auto rounded-t-md p-0"
            data-testid="mobile-search-filter-sheet"
            dir="rtl"
            side="bottom"
          >
            <SheetHeader className="border-b border-[var(--glass-border)] pe-12 text-right">
              <SheetTitle className="flex items-center gap-2">
                <SlidersHorizontal aria-hidden="true" className="size-4" />
                סינון מדויק
              </SheetTitle>
              <SheetDescription>
                בחרו סוג תכשיט, חומר, אבן, קולקציה, תקציב וסדר הצגה.
              </SheetDescription>
            </SheetHeader>
            <form
              action="/search"
              aria-label="סינון תוצאות חיפוש"
              className="grid gap-4 p-4"
              role="search"
            >
              <PrimarySearchFields categories={categories} input={input} />
              <FacetSearchFields facets={facets} input={input} />
              <AvailabilityField input={input} />
              <PreservedModeInput input={input} />
              <PreservedViewInput viewMode={viewMode} />
              <div className="grid grid-cols-2 gap-2 pt-1">
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
    </div>
  );
}

function PrimarySearchFields({
  categories,
  input,
}: {
  categories: CatalogCategory[];
  input: ProductSearchInput;
}) {
  return (
    <>
      <SearchControlField label="חיפוש">
        <div className="relative min-w-0">
          <Search
            aria-hidden="true"
            className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2"
          />
          <Input
            aria-label="חיפוש מוצר, חומר, אבן, אירוע או תקציב"
            className="h-11 ps-10 pe-3"
            defaultValue={input.query}
            name="q"
            placeholder="טבעת, עגילים, מתנה..."
          />
        </div>
      </SearchControlField>
      <SearchSelectField
        label="סוג תכשיט"
        name="category"
        options={categories.map((category) => ({
          label: category.name,
          value: category.slug,
        }))}
        placeholder="כל הסוגים"
        value={input.category}
      />
      <SearchControlField label="תקציב">
        <Input
          aria-label="מחיר מקסימלי"
          className="h-11"
          defaultValue={input.maxPrice}
          min={0}
          name="maxPrice"
          placeholder="מחיר עד"
          type="number"
        />
      </SearchControlField>
      <SearchSelectField
        label="סדר הצגה"
        name="sort"
        options={[
          { label: "התאמה", value: "relevance" },
          { label: "מחיר עולה", value: "price-asc" },
          { label: "מחיר יורד", value: "price-desc" },
          { label: "החדשים תחילה", value: "newest" },
          { label: "המומלצים תחילה", value: "popular" },
        ]}
        placeholder="התאמה"
        value={input.sort ?? "relevance"}
      />
    </>
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
  label,
  name,
  options,
  placeholder,
  value,
}: {
  label: string;
  name: keyof ProductSearchInput;
  options: Array<{ label: string; value: string }>;
  placeholder: string;
  value?: string;
}) {
  return (
    <SearchControlField label={label}>
      <select
        aria-label={label}
        className={searchSelectClassName}
        defaultValue={value ?? ""}
        name={name}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </SearchControlField>
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
        <span className="min-w-0 truncate">זמין במלאי</span>
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
    <label className="grid min-w-0 gap-1.5 text-sm">
      <span className="text-muted-foreground text-xs">{label}</span>
      {children}
    </label>
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
