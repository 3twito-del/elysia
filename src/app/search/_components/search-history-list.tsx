"use client";

import Link from "next/link";
import { History, Search, X } from "lucide-react";
import { useEffect, useMemo, useSyncExternalStore } from "react";

import { Button } from "~/components/ui/button";
import {
  clearSearchHistoryQueries,
  parseSearchHistorySnapshot,
  readSearchHistorySnapshot,
  saveSearchHistoryQuery,
  subscribeToSearchHistory,
} from "~/lib/search-history";
import type { ProductSearchInput } from "~/server/adapters/search";

type SearchHistoryListProps = {
  currentQuery?: string;
  mode?: ProductSearchInput["mode"];
  viewMode: "grid" | "list";
};

export function SearchHistoryList({
  currentQuery,
  mode,
  viewMode,
}: SearchHistoryListProps) {
  const searchHistorySnapshot = useSyncExternalStore(
    subscribeToSearchHistory,
    readSearchHistorySnapshot,
    () => "[]",
  );
  const normalizedCurrentQuery = currentQuery?.trim();
  const queries = useMemo(
    () => parseSearchHistorySnapshot(searchHistorySnapshot),
    [searchHistorySnapshot],
  );

  useEffect(() => {
    if (!normalizedCurrentQuery) return;

    saveSearchHistoryQuery(normalizedCurrentQuery);
  }, [normalizedCurrentQuery]);

  const visibleQueries = useMemo(
    () =>
      queries.filter(
        (query) =>
          query.toLowerCase() !== normalizedCurrentQuery?.toLowerCase(),
      ),
    [normalizedCurrentQuery, queries],
  );

  if (visibleQueries.length === 0) return null;

  return (
    <section
      aria-label="חיפושים אחרונים"
      className="mt-3 flex flex-col gap-2 border-t border-[var(--glass-border)] pt-3 sm:flex-row sm:items-center sm:justify-between"
      data-testid="search-history-list"
    >
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <span className="text-muted-foreground inline-flex items-center gap-1.5 text-xs font-medium">
          <History aria-hidden="true" className="size-3.5" />
          חיפושים אחרונים
        </span>
        {visibleQueries.map((query) => (
          <Link
            className="glass-control hover:border-foreground/30 inline-flex h-8 max-w-full items-center gap-1.5 rounded-md border border-[var(--glass-border)] px-2.5 text-sm transition"
            data-testid="search-history-query"
            href={createSearchHistoryHref(query, { mode, viewMode })}
            key={query}
            scroll={false}
          >
            <Search aria-hidden="true" className="size-3.5 shrink-0" />
            <span className="min-w-0 truncate">{query}</span>
          </Link>
        ))}
      </div>
      <Button
        className="h-8 self-start px-2.5 text-xs sm:self-center"
        data-testid="search-history-clear"
        onClick={() => {
          clearSearchHistoryQueries();
        }}
        type="button"
        variant="ghost"
      >
        <X aria-hidden="true" className="size-3.5" />
        ניקוי
      </Button>
    </section>
  );
}

function createSearchHistoryHref(
  query: string,
  options: {
    mode?: ProductSearchInput["mode"];
    viewMode: "grid" | "list";
  },
) {
  const params = new URLSearchParams({ q: query });

  if (options.mode === "classic") {
    params.set("mode", "classic");
  }

  if (options.viewMode === "list") {
    params.set("view", "list");
  }

  return `/search?${params.toString()}`;
}
