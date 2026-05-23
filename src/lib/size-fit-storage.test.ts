import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  getAllSavedSizes,
  getSavedSize,
  savedSizeStorageKey,
  setSavedSize,
  subscribeToSavedSizeUpdates,
} from "./size-fit-storage";

describe("size fit local storage", () => {
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

  it("stores normalized values by size kind", () => {
    expect(setSavedSize("bracelet", "m")).toBe("M");

    expect(getSavedSize("bracelet")).toBe("M");
    expect(JSON.parse(storedValues.get(savedSizeStorageKey) ?? "{}")).toEqual({
      bracelet: "M",
    });
  });

  it("ignores invalid persisted values", () => {
    storedValues.set(
      savedSizeStorageKey,
      JSON.stringify({ ring: "54", necklace: "120" }),
    );

    expect(getAllSavedSizes()).toEqual({ ring: "54" });
  });

  it("notifies listeners when a saved size changes", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToSavedSizeUpdates(listener);

    setSavedSize("ring", "54");

    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
  });
});
