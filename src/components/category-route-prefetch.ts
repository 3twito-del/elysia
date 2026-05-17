"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

type CategoryRoutePrefetchOptions = {
  prefetchOnHomeIdle?: boolean;
};

type NavigatorConnection = {
  effectiveType?: string;
  saveData?: boolean;
};

export function useCategoryRoutePrefetch(
  hrefs: readonly string[],
  { prefetchOnHomeIdle = false }: CategoryRoutePrefetchOptions = {},
) {
  const pathname = usePathname();
  const router = useRouter();
  const prefetchedHrefs = useRef(new Set<string>());

  const prefetch = useCallback(
    (href: string) => {
      if (!isCategoryHref(href)) return;
      if (href === pathname) return;
      if (!canSpeculativePrefetch()) return;
      if (prefetchedHrefs.current.has(href)) return;

      prefetchedHrefs.current.add(href);
      router.prefetch(href);
    },
    [pathname, router],
  );

  const prefetchAll = useCallback(() => {
    for (const href of hrefs) {
      prefetch(href);
    }
  }, [hrefs, prefetch]);

  useEffect(() => {
    if (!prefetchOnHomeIdle || pathname !== "/") return;
    if (!canSpeculativePrefetch()) return;

    let cancelled = false;
    const run = () => {
      if (!cancelled) prefetchAll();
    };

    if (typeof window.requestIdleCallback === "function") {
      const idleId = window.requestIdleCallback(run, { timeout: 1800 });

      return () => {
        cancelled = true;
        window.cancelIdleCallback(idleId);
      };
    }

    const timeoutId = window.setTimeout(run, 900);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [pathname, prefetchAll, prefetchOnHomeIdle]);

  return { prefetch, prefetchAll };
}

export function isCategoryHref(href: string) {
  return href.startsWith("/category/");
}

function canSpeculativePrefetch() {
  const connection = (
    navigator as Navigator & { connection?: NavigatorConnection }
  ).connection;

  if (connection?.saveData) return false;
  if (
    connection?.effectiveType &&
    ["slow-2g", "2g"].includes(connection.effectiveType)
  ) {
    return false;
  }

  return true;
}
