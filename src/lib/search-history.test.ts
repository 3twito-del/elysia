import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  SEARCH_HISTORY_LIMIT,
  SEARCH_HISTORY_STORAGE_KEY,
  clearSearchHistoryQueries,
  readSearchHistoryQueries,
  saveSearchHistoryQuery,
  subscribeToSearchHistory,
} from "./search-history";

describe("search history storage", () => {
  let storedValues: Map<string, string>;
  let target: EventTarget;

  beforeEach(() => {
    storedValues = new Map();
    target = new EventTarget();

    vi.stubGlobal(
      "CustomEvent",
      class TestCustomEvent<T = unknown> extends Event {
        readonly detail: T;

        constructor(type: string, init?: CustomEventInit<T>) {
          super(type);
          this.detail = init?.detail as T;
        }
      },
    );

    vi.stubGlobal("window", {
      addEventListener: target.addEventListener.bind(target),
      dispatchEvent: target.dispatchEvent.bind(target),
      localStorage: {
        getItem: (key: string) => storedValues.get(key) ?? null,
        removeItem: (key: string) => storedValues.delete(key),
        setItem: (key: string, value: string) => {
          storedValues.set(key, value);
        },
      },
      removeEventListener: target.removeEventListener.bind(target),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("stores recent queries newest first, deduped, and capped", () => {
    for (let index = 1; index <= SEARCH_HISTORY_LIMIT + 2; index += 1) {
      saveSearchHistoryQuery(` טבעת ${index} `);
    }

    saveSearchHistoryQuery("טבעת 3");

    expect(readSearchHistoryQueries()).toEqual([
      "טבעת 3",
      "טבעת 8",
      "טבעת 7",
      "טבעת 6",
      "טבעת 5",
      "טבעת 4",
    ]);
  });

  it("ignores invalid stored values", () => {
    storedValues.set(
      SEARCH_HISTORY_STORAGE_KEY,
      JSON.stringify(["עגילים", "", 42, "עגילים", "  שרשרת   פנינים  "]),
    );

    expect(readSearchHistoryQueries()).toEqual(["עגילים", "שרשרת פנינים"]);
  });

  it("clears history and notifies listeners", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToSearchHistory(listener);

    saveSearchHistoryQuery("צמיד");
    clearSearchHistoryQueries();

    expect(readSearchHistoryQueries()).toEqual([]);
    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
  });
});
