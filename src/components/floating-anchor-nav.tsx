"use client";

import { useEffect, useMemo, useState } from "react";

import { useResolvedReducedMotion } from "~/components/motion-preference";
import { cn } from "~/lib/utils";

export type FloatingAnchorItem = {
  id: string;
  label: string;
};

type FloatingAnchorNavProps = {
  className?: string;
  heroId?: string;
  items: FloatingAnchorItem[];
};

export function FloatingAnchorNav({
  className,
  heroId = "page-hero",
  items,
}: FloatingAnchorNavProps) {
  const shouldReduceMotion = useResolvedReducedMotion();
  const [activeId, setActiveId] = useState(items[0]?.id ?? "");
  const [isPastHero, setIsPastHero] = useState(false);
  const ids = useMemo(() => items.map((item) => item.id), [items]);
  const idsKey = ids.join("|");

  useEffect(() => {
    if (ids.length === 0) return;

    const frame = window.requestAnimationFrame(() => {
      const hash = decodeURIComponent(window.location.hash.replace("#", ""));
      setActiveId(hash && ids.includes(hash) ? hash : (ids[0] ?? ""));
    });

    return () => window.cancelAnimationFrame(frame);
  }, [ids, idsKey]);

  useEffect(() => {
    if (ids.length === 0 || !("IntersectionObserver" in window)) return;

    const sections = ids
      .map((id) => document.getElementById(id))
      .filter((node): node is HTMLElement => Boolean(node));

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!visibleEntry?.target.id) return;

        const nextId = visibleEntry.target.id;
        setActiveId(nextId);

        const nextHash = `#${encodeURIComponent(nextId)}`;
        const currentHash = decodeURIComponent(
          window.location.hash.replace("#", ""),
        );
        const ownsCurrentHash = !currentHash || ids.includes(currentHash);

        if (ownsCurrentHash && window.location.hash !== nextHash) {
          window.history.replaceState(
            null,
            "",
            `${window.location.pathname}${window.location.search}${nextHash}`,
          );
        }
      },
      {
        rootMargin: "-28% 0px -54% 0px",
        threshold: [0.02, 0.16, 0.32, 0.56, 0.8],
      },
    );

    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, [ids, idsKey]);

  useEffect(() => {
    const hero = document.getElementById(heroId);

    const syncVisibility = () => {
      if (!hero) {
        setIsPastHero(true);
        return;
      }

      const trigger = hero.offsetTop + Math.min(hero.offsetHeight * 0.42, 460);
      setIsPastHero(window.scrollY > trigger);
    };

    syncVisibility();
    window.addEventListener("scroll", syncVisibility, { passive: true });
    window.addEventListener("resize", syncVisibility);

    return () => {
      window.removeEventListener("scroll", syncVisibility);
      window.removeEventListener("resize", syncVisibility);
    };
  }, [heroId]);

  if (items.length === 0) return null;

  const renderItems = (scope: "desktop" | "mobile") =>
    items.map((item) => {
      const isActive = item.id === activeId;

      return (
        <a
          aria-current={isActive ? "true" : undefined}
          className="floating-anchor-nav-link"
          data-anchor-active={isActive}
          data-testid={`floating-anchor-link-${scope}`}
          href={`#${item.id}`}
          key={`${scope}-${item.id}`}
          onClick={(event) => {
            const target = document.getElementById(item.id);

            if (!target) return;

            event.preventDefault();
            target.scrollIntoView({
              behavior: shouldReduceMotion ? "auto" : "smooth",
              block: "start",
            });
            setActiveId(item.id);
            window.history.replaceState(
              null,
              "",
              `${window.location.pathname}${window.location.search}#${encodeURIComponent(
                item.id,
              )}`,
            );
          }}
        >
          <span className="floating-anchor-nav-dot" aria-hidden="true" />
          <span>{item.label}</span>
        </a>
      );
    });

  return (
    <div
      className={cn("floating-anchor-nav", className)}
      data-past-hero={isPastHero}
      data-testid="floating-anchor-nav"
    >
      <nav aria-label="ניווט בעמוד" className="floating-anchor-nav-mobile">
        {renderItems("mobile")}
      </nav>
      <nav aria-label="ניווט בעמוד" className="floating-anchor-nav-rail">
        {renderItems("desktop")}
      </nav>
    </div>
  );
}
