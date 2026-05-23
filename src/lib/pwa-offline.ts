"use client";

import { CART_UPDATED_EVENT } from "~/lib/cart-session";

const databaseName = "elysia-pwa-v1";
const databaseVersion = 1;
const actionsStore = "actions";
const cartSnapshotsStore = "cartSnapshots";
const metaStore = "meta";
const deviceStorageKey = "elysia_pwa_device_id";
const syncEventName = "elysia:pwa-sync";
const syncErrorEventName = "elysia:pwa-sync-error";

export type OfflineActionKind =
  | "cart.addItem"
  | "cart.updateItem"
  | "cart.removeItem"
  | "cart.updateOptions"
  | "newsletter.join"
  | "push.preferences"
  | "service.request";

export type OfflineActionRecord = {
  actionId: string;
  createdAt: string;
  deviceId: string;
  files?: File[];
  kind: OfflineActionKind;
  lastError?: string;
  payload: Record<string, unknown>;
};

export type OfflineCartSnapshot = {
  itemCount: number;
  sessionKey: string;
  updatedAt: string;
};

type SyncResult = {
  actionId: string;
  ok: boolean;
  error?: string;
};

type SyncResponse = {
  results: SyncResult[];
};

export async function getPwaDeviceId() {
  const existing = readLocalStorage(deviceStorageKey);

  if (existing) return existing;

  const deviceId = createId("pwa");

  writeLocalStorage(deviceStorageKey, deviceId);
  await putMeta("deviceId", deviceId).catch(() => undefined);

  return deviceId;
}

export async function queueOfflineJsonAction(
  kind: Exclude<OfflineActionKind, "service.request">,
  payload: Record<string, unknown>,
) {
  return queueOfflineAction({ kind, payload });
}

export async function queueOfflineServiceRequest(formData: FormData) {
  const payload: Record<string, unknown> = {};
  const files: File[] = [];

  for (const [key, value] of formData.entries()) {
    if (key === "attachments" && value instanceof File && value.size > 0) {
      files.push(value);
      continue;
    }

    if (typeof value === "string") {
      payload[key] = value;
    }
  }

  return queueOfflineAction({
    files,
    kind: "service.request",
    payload,
  });
}

export async function getOfflineCartDelta(sessionKey: string) {
  const actions = await listOfflineActions();

  return actions.reduce((sum, action) => {
    if (action.kind !== "cart.addItem") return sum;
    if (action.payload.sessionKey !== sessionKey) return sum;

    const quantity = Number(action.payload.quantity ?? 1);

    return sum + (Number.isFinite(quantity) ? quantity : 1);
  }, 0);
}

export async function rememberOfflineCartSnapshot(
  snapshot: OfflineCartSnapshot,
) {
  const db = await openPwaDb();

  await txDone(
    db
      .transaction(cartSnapshotsStore, "readwrite")
      .objectStore(cartSnapshotsStore)
      .put(snapshot),
  );
}

export async function readOfflineCartSnapshot(sessionKey: string) {
  const db = await openPwaDb();

  return requestToPromise<OfflineCartSnapshot | undefined>(
    db
      .transaction(cartSnapshotsStore)
      .objectStore(cartSnapshotsStore)
      .get(sessionKey),
  );
}

export async function syncPendingOfflineActions() {
  if (!navigator.onLine) return { synced: 0 };

  const actions = await listOfflineActions();
  let synced = 0;

  for (const serviceAction of actions.filter(
    (action) => action.kind === "service.request",
  )) {
    const result = await syncServiceRequest(serviceAction);

    if (result.ok) {
      await deleteAction(serviceAction.actionId);
      synced += 1;
    } else {
      await updateActionError(serviceAction.actionId, result.error);
    }
  }

  const jsonActions = actions.filter(
    (action) => action.kind !== "service.request",
  );

  if (jsonActions.length > 0) {
    const response = await fetch("/api/pwa/sync", {
      body: JSON.stringify({
        actions: jsonActions.map(({ files: _files, ...action }) => action),
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

    if (!response.ok) {
      throw new Error("Offline sync failed.");
    }

    const data = (await response.json()) as SyncResponse;

    for (const result of data.results) {
      if (result.ok) {
        await deleteAction(result.actionId);
        synced += 1;
      } else {
        await updateActionError(result.actionId, result.error);
      }
    }
  }

  if (synced > 0) {
    window.dispatchEvent(new Event(syncEventName));
    window.dispatchEvent(new Event(CART_UPDATED_EVENT));
  }

  return { synced };
}

export function installPwaOfflineSync() {
  if (typeof window === "undefined") return () => undefined;

  let running = false;

  const run = () => {
    if (running || !navigator.onLine) return;

    running = true;
    void syncPendingOfflineActions()
      .catch((error: unknown) => {
        window.dispatchEvent(
          new CustomEvent(syncErrorEventName, {
            detail: error instanceof Error ? error.message : "Sync failed.",
          }),
        );
      })
      .finally(() => {
        running = false;
      });
  };

  const timer = window.setTimeout(run, 1200);

  window.addEventListener("online", run);
  window.addEventListener("focus", run);

  return () => {
    window.clearTimeout(timer);
    window.removeEventListener("online", run);
    window.removeEventListener("focus", run);
  };
}

async function queueOfflineAction(input: {
  files?: File[];
  kind: OfflineActionKind;
  payload: Record<string, unknown>;
}) {
  const record: OfflineActionRecord = {
    actionId: createId("offline"),
    createdAt: new Date().toISOString(),
    deviceId: await getPwaDeviceId(),
    files: input.files,
    kind: input.kind,
    payload: input.payload,
  };
  const db = await openPwaDb();

  await txDone(
    db
      .transaction(actionsStore, "readwrite")
      .objectStore(actionsStore)
      .put(record),
  );

  window.dispatchEvent(new Event(CART_UPDATED_EVENT));

  return record;
}

async function listOfflineActions() {
  const db = await openPwaDb();

  return requestToPromise<OfflineActionRecord[]>(
    db.transaction(actionsStore).objectStore(actionsStore).getAll(),
  ).then((actions) =>
    actions.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    ),
  );
}

async function syncServiceRequest(action: OfflineActionRecord) {
  const formData = new FormData();

  formData.set(
    "metadata",
    JSON.stringify({
      actionId: action.actionId,
      createdAt: action.createdAt,
      deviceId: action.deviceId,
      kind: action.kind,
      payload: action.payload,
    }),
  );

  for (const file of action.files ?? []) {
    formData.append("attachments", file, file.name);
  }

  const response = await fetch("/api/pwa/sync/service-request", {
    body: formData,
    method: "POST",
  });

  if (!response.ok) {
    return {
      actionId: action.actionId,
      ok: false,
      error: "Service request sync failed.",
    };
  }

  return { actionId: action.actionId, ok: true };
}

async function deleteAction(actionId: string) {
  const db = await openPwaDb();

  await txDone(
    db
      .transaction(actionsStore, "readwrite")
      .objectStore(actionsStore)
      .delete(actionId),
  );
}

async function updateActionError(actionId: string, lastError?: string) {
  const db = await openPwaDb();
  const record = await requestToPromise<OfflineActionRecord | undefined>(
    db.transaction(actionsStore).objectStore(actionsStore).get(actionId),
  );

  if (!record) return;

  record.lastError = lastError ?? "Sync failed.";
  await txDone(
    db
      .transaction(actionsStore, "readwrite")
      .objectStore(actionsStore)
      .put(record),
  );
}

async function putMeta(key: string, value: string) {
  const db = await openPwaDb();

  await txDone(
    db.transaction(metaStore, "readwrite").objectStore(metaStore).put({
      key,
      value,
    }),
  );
}

function openPwaDb() {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB is not available."));
  }

  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(databaseName, databaseVersion);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(actionsStore)) {
        const store = db.createObjectStore(actionsStore, {
          keyPath: "actionId",
        });
        store.createIndex("createdAt", "createdAt");
        store.createIndex("kind", "kind");
      }

      if (!db.objectStoreNames.contains(cartSnapshotsStore)) {
        db.createObjectStore(cartSnapshotsStore, { keyPath: "sessionKey" });
      }

      if (!db.objectStoreNames.contains(metaStore)) {
        db.createObjectStore(metaStore, { keyPath: "key" });
      }
    };
    request.onerror = () =>
      reject(
        request.error ?? new Error("Failed to open PWA offline database."),
      );
    request.onsuccess = () => resolve(request.result);
  });
}

function txDone(request: IDBRequest) {
  return requestToPromise(request).then(() => undefined);
}

function requestToPromise<T = unknown>(request: IDBRequest) {
  return new Promise<T>((resolve, reject) => {
    request.onerror = () =>
      reject(request.error ?? new Error("IndexedDB request failed."));
    request.onsuccess = () => resolve(request.result as T);
  });
}

function readLocalStorage(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeLocalStorage(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // IndexedDB still keeps the device id for browsers that block localStorage.
  }
}

function createId(prefix: string) {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);

  return `${prefix}_${random}`;
}
