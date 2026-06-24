"use client";

import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { getOrCreateCartSessionKey } from "~/lib/cart-session";
import type { CookieConsentValue } from "~/lib/cookie-consent";
import { useCookieConsentValue } from "~/lib/use-cookie-consent";

type AnalyticsClientEventType =
  | "page_view"
  | "route_change"
  | "scroll_depth"
  | "cta_impression"
  | "cta_click"
  | "outbound_click"
  | "form_start"
  | "form_error";

type AnalyticsClientEventPayload = {
  type: AnalyticsClientEventType;
  visitorKey?: string;
  sessionKey?: string;
  source: "client";
  sequence: number;
  url: string;
  title?: string;
  path: string;
  referrer?: string;
  utm: Record<string, string>;
  device: {
    class: "mobile" | "tablet" | "desktop";
    language?: string;
    userAgentClass?: string;
  };
  viewport: {
    width: number;
    height: number;
    devicePixelRatio: number;
  };
  consentMode: "essential" | "measurement";
  payload?: Record<string, unknown>;
  schemaVersion: 1;
  idempotencyKey: string;
};

type ReplayChunkPayload = {
  sessionKey: string;
  visitorKey?: string;
  sequence: number;
  startedAt: string;
  endedAt: string;
  path: string;
  url: string;
  masked: true;
  checksum: string;
  events: unknown[];
};

type SearchParamsReader = Pick<URLSearchParams, "get">;

const VISITOR_KEY_STORAGE_KEY = "elysia_analytics_visitor";
const SESSION_REPLAY_CHUNK_SIZE = 20;
const SESSION_REPLAY_FLUSH_MS = 10_000;
const TRACKABLE_CLICK_SELECTOR =
  "a,button,[role='button'],[data-analytics-cta]";
const CTA_IMPRESSION_SELECTOR = "[data-analytics-cta]";
const REPLAY_BLOCK_SELECTOR =
  "[data-analytics-block],[data-sensitive],[data-payment],.rr-block";
const REPLAY_MASK_TEXT_SELECTOR =
  "input,textarea,select,[contenteditable='true'],[data-analytics-mask],.rr-mask";

let inMemoryVisitorKey: string | null = null;

export function AnalyticsProvider() {
  const consent = useCookieConsentValue();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const path = useMemo(() => {
    if (!pathname) return "";

    return search ? `${pathname}?${search}` : pathname;
  }, [pathname, search]);
  const analyticsEnabled = consent !== "essential";
  const previousPathRef = useRef<string | null>(null);
  const eventSequenceRef = useRef(0);
  const replaySequenceRef = useRef(0);
  const replayBufferRef = useRef<unknown[]>([]);
  const replayChunkStartedAtRef = useRef<string | null>(null);
  const replayStopRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!analyticsEnabled || !path || isBlockedAnalyticsPath(path)) return;

    const previousPath = previousPathRef.current;

    if (previousPath === path) return;

    const referrer =
      previousPath ??
      (document.referrer &&
      new URL(document.referrer).origin !== location.origin
        ? document.referrer
        : undefined);
    previousPathRef.current = path;

    sendAnalyticsBatch([
      createClientEvent({
        consent,
        path,
        referrer,
        searchParams,
        sequence: eventSequenceRef.current++,
        type: previousPath ? "route_change" : "page_view",
      }),
    ]);
  }, [analyticsEnabled, consent, path, searchParams]);

  useEffect(() => {
    if (!analyticsEnabled || !path || isBlockedAnalyticsPath(path)) return;

    const sentDepths = new Set<number>();
    let frame = 0;
    const handleScroll = () => {
      if (frame) return;

      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const depth = getScrollDepth();

        for (const threshold of [25, 50, 75, 90]) {
          if (depth >= threshold && !sentDepths.has(threshold)) {
            sentDepths.add(threshold);
            sendAnalyticsBatch([
              createClientEvent({
                consent,
                path,
                searchParams,
                sequence: eventSequenceRef.current++,
                type: "scroll_depth",
                payload: { depth: threshold },
              }),
            ]);
          }
        }
      });
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      if (frame) window.cancelAnimationFrame(frame);

      window.removeEventListener("scroll", handleScroll);
    };
  }, [analyticsEnabled, consent, path, searchParams]);

  useEffect(() => {
    if (!analyticsEnabled || !path || isBlockedAnalyticsPath(path)) return;

    const sendEvent = (
      type: AnalyticsClientEventType,
      payload?: Record<string, unknown>,
    ) => {
      sendAnalyticsBatch([
        createClientEvent({
          consent,
          path,
          searchParams,
          sequence: eventSequenceRef.current++,
          type,
          payload,
        }),
      ]);
    };
    const startedForms = new WeakSet<HTMLFormElement>();
    const handleClick = (event: MouseEvent) => {
      const element = (event.target as Element | null)?.closest(
        TRACKABLE_CLICK_SELECTOR,
      ) as HTMLElement | null;

      if (!element) return;

      const link = element.closest("a");
      const href = link instanceof HTMLAnchorElement ? link.href : undefined;
      const payload = {
        id: element.id.length > 0 ? element.id : undefined,
        analyticsId: element.dataset.analyticsCta ?? undefined,
        label: getSafeElementLabel(element, path),
        href: sanitizeHref(href),
      };

      if (href && isOutboundHref(href)) {
        sendEvent("outbound_click", payload);
        return;
      }

      sendEvent("cta_click", payload);
    };
    const handleFocusIn = (event: FocusEvent) => {
      const form = (event.target as Element | null)?.closest("form");

      if (!form || startedForms.has(form)) return;

      startedForms.add(form);
      sendEvent("form_start", getSafeFormPayload(form, path));
    };
    const handleInvalid = (event: Event) => {
      const form = (event.target as Element | null)?.closest("form");

      if (!form) return;

      sendEvent("form_error", {
        ...getSafeFormPayload(form, path),
        reason: "invalid_field",
      });
    };
    const handleSubmit = (event: SubmitEvent) => {
      const form =
        event.target instanceof HTMLFormElement ? event.target : null;

      if (!form || form.checkValidity()) return;

      sendEvent("form_error", {
        ...getSafeFormPayload(form, path),
        reason: "submit_invalid",
        invalidFields: form.querySelectorAll(":invalid").length,
      });
    };

    document.addEventListener("click", handleClick, true);
    document.addEventListener("focusin", handleFocusIn, true);
    document.addEventListener("invalid", handleInvalid, true);
    document.addEventListener("submit", handleSubmit, true);

    return () => {
      document.removeEventListener("click", handleClick, true);
      document.removeEventListener("focusin", handleFocusIn, true);
      document.removeEventListener("invalid", handleInvalid, true);
      document.removeEventListener("submit", handleSubmit, true);
    };
  }, [analyticsEnabled, consent, path, searchParams]);

  useEffect(() => {
    if (!analyticsEnabled || !path || isBlockedAnalyticsPath(path)) return;
    if (!("IntersectionObserver" in window)) return;

    const observed = new WeakSet<Element>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting || observed.has(entry.target)) continue;

          observed.add(entry.target);
          observer.unobserve(entry.target);
          sendAnalyticsBatch([
            createClientEvent({
              consent,
              path,
              searchParams,
              sequence: eventSequenceRef.current++,
              type: "cta_impression",
              payload: {
                analyticsId:
                  entry.target instanceof HTMLElement
                    ? entry.target.dataset.analyticsCta
                    : undefined,
                label:
                  entry.target instanceof HTMLElement
                    ? getSafeElementLabel(entry.target, path)
                    : undefined,
              },
            }),
          ]);
        }
      },
      { threshold: 0.5 },
    );

    document
      .querySelectorAll(CTA_IMPRESSION_SELECTOR)
      .forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, [analyticsEnabled, consent, path, searchParams]);

  useEffect(() => {
    if (!analyticsEnabled || !path || isBlockedAnalyticsPath(path)) {
      replayStopRef.current?.();
      replayStopRef.current = null;
      replayBufferRef.current = [];
      replayChunkStartedAtRef.current = null;
      return;
    }

    let disposed = false;
    const sessionKey = safeGetCartSessionKey();

    if (!sessionKey) return;

    const flush = () => {
      flushReplayBuffer({
        path,
        replayBufferRef,
        replayChunkStartedAtRef,
        replaySequenceRef,
        sessionKey,
      });
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") flush();
    };

    void import("rrweb").then(({ record }) => {
      if (disposed) return;

      const stop = record({
        emit(event) {
          replayChunkStartedAtRef.current ??= new Date().toISOString();

          replayBufferRef.current.push(event);

          if (replayBufferRef.current.length >= SESSION_REPLAY_CHUNK_SIZE) {
            flush();
          }
        },
        blockSelector: REPLAY_BLOCK_SELECTOR,
        checkoutEveryNms: 15_000,
        maskAllInputs: true,
        maskTextSelector: getReplayMaskTextSelector(path),
      });

      replayStopRef.current = stop ?? null;
    });

    const intervalId = window.setInterval(flush, SESSION_REPLAY_FLUSH_MS);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      disposed = true;
      replayStopRef.current?.();
      replayStopRef.current = null;
      if (intervalId) window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      flush();
    };
  }, [analyticsEnabled, path]);

  return null;
}

function createClientEvent(input: {
  consent: CookieConsentValue | null | undefined;
  path: string;
  referrer?: string;
  searchParams: SearchParamsReader;
  sequence: number;
  type: AnalyticsClientEventType;
  payload?: Record<string, unknown>;
}): AnalyticsClientEventPayload {
  const visitorKey = getOrCreateVisitorKey();

  return {
    type: input.type,
    visitorKey,
    sessionKey: safeGetCartSessionKey(),
    source: "client",
    sequence: input.sequence,
    url: location.href,
    title: document.title,
    path: input.path,
    referrer: input.referrer,
    utm: readUtmParams(input.searchParams),
    device: {
      class: getDeviceClass(),
      language: navigator.language,
      userAgentClass: getUserAgentClass(),
    },
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio || 1,
    },
    consentMode: input.consent === "all" ? "measurement" : "essential",
    payload: input.payload,
    schemaVersion: 1,
    idempotencyKey: `${visitorKey}:${input.sequence}:${input.type}:${Date.now()}`,
  };
}

function getOrCreateVisitorKey() {
  if (inMemoryVisitorKey) return inMemoryVisitorKey;

  const created = createRandomKey();

  try {
    const existing = window.localStorage.getItem(VISITOR_KEY_STORAGE_KEY);

    if (existing && existing.length >= 8) {
      inMemoryVisitorKey = existing;
      return existing;
    }

    window.localStorage.setItem(VISITOR_KEY_STORAGE_KEY, created);
  } catch {
    // Strict privacy modes can block storage; keep a per-tab visitor key.
  }

  inMemoryVisitorKey = created;
  return created;
}

function createRandomKey() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function safeGetCartSessionKey() {
  try {
    return getOrCreateCartSessionKey();
  } catch {
    return undefined;
  }
}

function readUtmParams(searchParams: SearchParamsReader) {
  const utm: Record<string, string> = {};

  for (const key of ["source", "medium", "campaign", "term", "content"]) {
    const value = searchParams.get(`utm_${key}`);

    if (value) utm[key] = value.slice(0, 120);
  }

  return utm;
}

function getDeviceClass(): "mobile" | "tablet" | "desktop" {
  const width = window.innerWidth;

  if (width < 768) return "mobile";
  if (width < 1024) return "tablet";

  return "desktop";
}

function getUserAgentClass() {
  const userAgent = navigator.userAgent.toLowerCase();

  if (/bot|crawler|spider/.test(userAgent)) return "bot";
  if (/mobile|android|iphone/.test(userAgent)) return "mobile-browser";

  return "browser";
}

function getScrollDepth() {
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const viewportHeight = window.innerHeight;
  const documentHeight = Math.max(
    document.body.scrollHeight,
    document.documentElement.scrollHeight,
    document.body.offsetHeight,
    document.documentElement.offsetHeight,
  );
  const scrollable = Math.max(documentHeight - viewportHeight, 1);

  return Math.min(100, Math.round((scrollTop / scrollable) * 100));
}

function isOutboundHref(href: string) {
  try {
    const url = new URL(href);

    return url.origin !== location.origin && /^https?:$/.test(url.protocol);
  } catch {
    return false;
  }
}

function sanitizeHref(href?: string) {
  if (!href) return undefined;

  try {
    const url = new URL(href, location.href);

    if (!/^https?:$/.test(url.protocol)) return "[redacted]";

    return `${url.origin}${url.pathname}`.slice(0, 240);
  } catch {
    return undefined;
  }
}

function getSafeElementLabel(element: HTMLElement, path: string) {
  if (isSensitiveAnalyticsPath(path)) return "[masked]";

  const label =
    element.getAttribute("aria-label") ??
    element.getAttribute("title") ??
    element.textContent ??
    "";

  return label.replace(/\s+/g, " ").trim().slice(0, 120) || undefined;
}

function getSafeFormPayload(form: HTMLFormElement, path: string) {
  return {
    id: form.id.length > 0 ? form.id : undefined,
    name: isSensitiveAnalyticsPath(path)
      ? undefined
      : form.name.length > 0
        ? form.name
        : undefined,
    action: sanitizeHref(form.action),
    controls: form.elements.length,
  };
}

function isBlockedAnalyticsPath(path: string) {
  return /^\/admin(?:\/|$)/i.test(path);
}

function isSensitiveAnalyticsPath(path: string) {
  return /^\/(?:account|checkout|service)(?:\/|$)/i.test(path);
}

function getReplayMaskTextSelector(path: string) {
  if (isSensitiveAnalyticsPath(path)) {
    return "body";
  }

  return REPLAY_MASK_TEXT_SELECTOR;
}

function sendAnalyticsBatch(events: AnalyticsClientEventPayload[]) {
  const body = JSON.stringify({ events });

  try {
    if (navigator.sendBeacon) {
      const sent = navigator.sendBeacon(
        "/api/analytics/events",
        new Blob([body], { type: "application/json" }),
      );

      if (sent) return;
    }

    void fetch("/api/analytics/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {
      // First-party analytics must never break navigation.
    });
  } catch {
    // First-party analytics must never break navigation.
  }
}

function flushReplayBuffer(input: {
  path: string;
  replayBufferRef: MutableRefObject<unknown[]>;
  replayChunkStartedAtRef: MutableRefObject<string | null>;
  replaySequenceRef: MutableRefObject<number>;
  sessionKey: string;
}) {
  if (input.replayBufferRef.current.length === 0) return;

  const events = input.replayBufferRef.current.splice(0);
  const startedAt =
    input.replayChunkStartedAtRef.current ?? new Date().toISOString();
  const payloadBase = {
    sessionKey: input.sessionKey,
    visitorKey: getOrCreateVisitorKey(),
    sequence: input.replaySequenceRef.current++,
    startedAt,
    endedAt: new Date().toISOString(),
    path: input.path,
    url: location.href,
    masked: true as const,
    events,
  };

  input.replayChunkStartedAtRef.current = null;

  void createReplayChecksum(JSON.stringify(events))
    .then((checksum) => {
      sendReplayChunk({ ...payloadBase, checksum });
    })
    .catch(() => {
      // Replay must never affect the shopping experience.
    });
}

function sendReplayChunk(payload: ReplayChunkPayload) {
  const body = JSON.stringify(payload);

  try {
    if (body.length > 240 * 1024) return;

    if (navigator.sendBeacon) {
      const sent = navigator.sendBeacon(
        "/api/analytics/replay",
        new Blob([body], { type: "application/json" }),
      );

      if (sent) return;
    }

    void fetch("/api/analytics/replay", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {
      // Replay must never affect the shopping experience.
    });
  } catch {
    // Replay must never affect the shopping experience.
  }
}

async function createReplayChecksum(serializedEvents: string) {
  try {
    if (!crypto.subtle) return "client-unavailable";

    const digest = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(serializedEvents),
    );

    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  } catch {
    return "client-unavailable";
  }
}
