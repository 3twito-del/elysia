"use client";

import Link from "next/link";
import { Search, SlidersHorizontal } from "lucide-react";
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
import type { ProductSearchInput } from "~/server/adapters/search";
import type { CatalogCategory } from "~/server/services/catalog";

type SearchControlsProps = {
  activeFilterCount: number;
  categories: CatalogCategory[];
  clearFiltersHref: string;
  input: ProductSearchInput;
};

const searchSelectClassName =
  "glass-control h-11 min-w-0 rounded-md border px-3 text-sm outline-none focus-visible:border-[var(--glass-border-strong)] focus-visible:ring-3 focus-visible:ring-[var(--glass-focus)]";

export function SearchControls({
  activeFilterCount,
  categories,
  clearFiltersHref,
  input,
}: SearchControlsProps) {
  return (
    <div data-testid="search-form">
      <form
        action="/search"
        aria-label="חיפוש בקטלוג"
        className="mt-4 hidden items-end gap-2.5 border-b border-[var(--glass-border)] pb-4 lg:grid lg:grid-cols-[1fr_repeat(3,152px)_116px]"
        role="search"
      >
        <SearchFields categories={categories} input={input} />
        <PreservedFacetInputs input={input} />
        <Button className="h-11 gap-2" type="submit">
          <Search aria-hidden="true" className="size-4" />
          חיפוש
        </Button>
      </form>

      <div
        className="mt-3 grid gap-2 border-b border-[var(--glass-border)] pb-3 lg:hidden"
        data-testid="mobile-search-controls"
      >
        <form
          action="/search"
          aria-label="חיפוש מהיר בקטלוג"
          className="grid grid-cols-[minmax(0,1fr)_auto] gap-2"
          role="search"
        >
          <Input
            aria-label="חיפוש מוצר, חומר, אבן, אירוע או תקציב"
            className="h-11"
            defaultValue={input.query}
            name="q"
            placeholder="טבעת, עגילים, מתנה..."
          />
          <PreservedSearchInputs input={input} />
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
              className="relative h-11 w-full justify-center gap-2"
              aria-label="סינון ומיון"
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
            className="max-h-[85dvh] overflow-y-auto rounded-t-md p-0"
            data-testid="mobile-search-filter-sheet"
            dir="rtl"
            side="bottom"
          >
            <SheetHeader className="border-b border-[var(--glass-border)] pe-12 text-right">
              <SheetTitle>סינון מדויק</SheetTitle>
              <SheetDescription>
                בחרו סוג תכשיט, תקציב וסדר הצגה.
              </SheetDescription>
            </SheetHeader>
            <form
              action="/search"
              aria-label="סינון תוצאות חיפוש"
              className="grid gap-4 p-4"
              role="search"
            >
              <SearchFields categories={categories} input={input} />
              <PreservedFacetInputs input={input} />
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

function SearchFields({
  categories,
  input,
}: {
  categories: CatalogCategory[];
  input: ProductSearchInput;
}) {
  return (
    <>
      <SearchControlField label="חיפוש">
        <Input
          aria-label="חיפוש מוצר, חומר, אבן, אירוע או תקציב"
          className="h-11"
          defaultValue={input.query}
          name="q"
          placeholder="טבעת, עגילים, מתנה..."
        />
      </SearchControlField>
      <SearchControlField label="סוג תכשיט">
        <select
          aria-label="סינון לפי קטגוריה"
          className={searchSelectClassName}
          defaultValue={input.category}
          name="category"
        >
          <option value="">כל הסוגים</option>
          {categories.map((category) => (
            <option key={category.slug} value={category.slug}>
              {category.name}
            </option>
          ))}
        </select>
      </SearchControlField>
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
      <SearchControlField label="סדר הצגה">
        <select
          aria-label="מיון תוצאות"
          className={searchSelectClassName}
          defaultValue={input.sort ?? "relevance"}
          name="sort"
        >
          <option value="relevance">התאמה</option>
          <option value="price-asc">מחיר עולה</option>
          <option value="price-desc">מחיר יורד</option>
          <option value="newest">החדשים תחילה</option>
          <option value="popular">המומלצים תחילה</option>
        </select>
      </SearchControlField>
    </>
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
    <label className="grid gap-1.5 text-sm">
      <span className="text-muted-foreground text-xs">{label}</span>
      {children}
    </label>
  );
}

function PreservedSearchInputs({ input }: { input: ProductSearchInput }) {
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
    </>
  );
}

function PreservedFacetInputs({ input }: { input: ProductSearchInput }) {
  return (
    <>
      <PreservedInput name="material" value={input.material} />
      <PreservedInput name="stone" value={input.stone} />
      <PreservedInput name="collection" value={input.collection} />
      <PreservedInput
        name="availableOnly"
        value={input.availableOnly ? "1" : undefined}
      />
    </>
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
