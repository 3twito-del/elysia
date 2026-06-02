export const SEARCH_HISTORY_STORAGE_KEY = "elysia_search_history";
export const SEARCH_HISTORY_UPDATED_EVENT = "elysia:search-history-updated";
export const SEARCH_HISTORY_LIMIT = 6;

export function readSearchHistorySnapshot() {
  const storage = getSearchHistoryStorage();

  if (!storage) return "[]";

  try {
    return storage.getItem(SEARCH_HISTORY_STORAGE_KEY) ?? "[]";
  } catch {
    return "[]";
  }
}

export function readSearchHistoryQueries() {
  return parseSearchHistorySnapshot(readSearchHistorySnapshot());
}

export function parseSearchHistorySnapshot(snapshot: string) {
  try {
    const parsed: unknown = JSON.parse(snapshot);

    if (!Array.isArray(parsed)) return [];

    return normalizeSearchHistoryQueries(parsed);
  } catch {
    return [];
  }
}

export function saveSearchHistoryQuery(query: string) {
  const normalizedQuery = normalizeSearchHistoryQuery(query);

  if (!normalizedQuery) return readSearchHistoryQueries();

  const nextQueries = [
    normalizedQuery,
    ...readSearchHistoryQueries().filter(
      (savedQuery) =>
        savedQuery.toLowerCase() !== normalizedQuery.toLowerCase(),
    ),
  ].slice(0, SEARCH_HISTORY_LIMIT);

  writeSearchHistoryQueries(nextQueries);

  return nextQueries;
}

export function clearSearchHistoryQueries() {
  const storage = getSearchHistoryStorage();

  try {
    storage?.removeItem(SEARCH_HISTORY_STORAGE_KEY);
  } catch {
    // Local history is optional and should never block search controls.
  }

  dispatchSearchHistoryUpdated([]);
}

export function subscribeToSearchHistory(listener: () => void) {
  if (typeof window === "undefined") return () => undefined;

  const handleUpdated = () => listener();
  const handleStorage = (event: StorageEvent) => {
    if (event.key === SEARCH_HISTORY_STORAGE_KEY) listener();
  };

  window.addEventListener(SEARCH_HISTORY_UPDATED_EVENT, handleUpdated);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(SEARCH_HISTORY_UPDATED_EVENT, handleUpdated);
    window.removeEventListener("storage", handleStorage);
  };
}

function writeSearchHistoryQueries(queries: string[]) {
  const storage = getSearchHistoryStorage();

  try {
    storage?.setItem(SEARCH_HISTORY_STORAGE_KEY, JSON.stringify(queries));
  } catch {
    return;
  }

  dispatchSearchHistoryUpdated(queries);
}

function normalizeSearchHistoryQueries(values: unknown[]) {
  const queries: string[] = [];
  const seen = new Set<string>();

  for (const value of values) {
    if (typeof value !== "string") continue;

    const query = normalizeSearchHistoryQuery(value);
    const key = query.toLowerCase();

    if (!query || seen.has(key)) continue;

    seen.add(key);
    queries.push(query);

    if (queries.length >= SEARCH_HISTORY_LIMIT) break;
  }

  return queries;
}

function normalizeSearchHistoryQuery(value: string) {
  return value.replace(/\s+/g, " ").trim().slice(0, 80);
}

function dispatchSearchHistoryUpdated(queries: string[]) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent(SEARCH_HISTORY_UPDATED_EVENT, { detail: { queries } }),
  );
}

function getSearchHistoryStorage() {
  if (typeof window === "undefined") return null;

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
