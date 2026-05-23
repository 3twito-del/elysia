import {
  normalizeSavedSize,
  sizeFitKinds,
  type SavedSize,
  type SizeFitKind,
} from "~/lib/size-fit";

export const savedSizeStorageKey = "elysia_saved_sizes_v1";
export const savedSizeUpdatedEvent = "elysia:saved-size-updated";

type SavedSizeStore = Partial<Record<SizeFitKind, string>>;

export function getSavedSize(kind: SizeFitKind) {
  return getAllSavedSizes()[kind];
}

export function getAllSavedSizes(): SavedSizeStore {
  const storage = getStorage();

  if (!storage) return {};

  try {
    const parsed = JSON.parse(
      storage.getItem(savedSizeStorageKey) ?? "{}",
    ) as unknown;

    if (!isRecord(parsed)) {
      return {};
    }

    return Object.fromEntries(
      sizeFitKinds.flatMap((kind) => {
        const value = parsed[kind];

        if (typeof value !== "string") return [];

        const normalized = normalizeSavedSize(kind, value);

        return normalized ? [[kind, normalized] as const] : [];
      }),
    );
  } catch {
    return {};
  }
}

export function setSavedSize(kind: SizeFitKind, rawValue: string) {
  const normalized = normalizeSavedSize(kind, rawValue);

  if (!normalized) return null;

  const storage = getStorage();
  const next = {
    ...getAllSavedSizes(),
    [kind]: normalized,
  };

  storage?.setItem(savedSizeStorageKey, JSON.stringify(next));
  dispatchSavedSizeUpdated({ kind, value: normalized });

  return normalized;
}

export function removeSavedSize(kind: SizeFitKind) {
  const storage = getStorage();
  const next = getAllSavedSizes();

  delete next[kind];
  storage?.setItem(savedSizeStorageKey, JSON.stringify(next));
  dispatchSavedSizeUpdated({ kind, value: "" });
}

export function subscribeToSavedSizeUpdates(listener: () => void) {
  if (typeof window === "undefined") return () => undefined;

  window.addEventListener(savedSizeUpdatedEvent, listener);
  window.addEventListener("storage", listener);

  return () => {
    window.removeEventListener(savedSizeUpdatedEvent, listener);
    window.removeEventListener("storage", listener);
  };
}

function dispatchSavedSizeUpdated(detail: SavedSize) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(new CustomEvent(savedSizeUpdatedEvent, { detail }));
}

function getStorage() {
  if (typeof window === "undefined") return null;

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
