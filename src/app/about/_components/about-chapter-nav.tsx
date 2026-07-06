"use client";

import { useEffect, useState } from "react";

export type AboutChapter = {
  id: string;
  index: string;
  label: string;
};

/**
 * Sticky in-page chapter navigation for the About page. A small
 * IntersectionObserver marks the chapter currently in view; all styling and
 * the active underline live in CSS (`.about-chapter-*`), so reduced-motion
 * users simply see an instant state change.
 */
export function AboutChapterNav({ chapters }: { chapters: AboutChapter[] }) {
  const [activeId, setActiveId] = useState(chapters[0]?.id ?? "");

  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;

    const sections = chapters
      .map((chapter) => document.getElementById(chapter.id))
      .filter((section): section is HTMLElement => Boolean(section));

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (first, second) =>
              first.boundingClientRect.top - second.boundingClientRect.top,
          );

        const nextId = visible[0]?.target.id;

        if (nextId) setActiveId(nextId);
      },
      { rootMargin: "-32% 0px -58% 0px" },
    );

    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, [chapters]);

  return (
    <nav
      aria-label="פרקי העמוד"
      className="about-chapter-nav"
      data-testid="about-chapter-nav"
      dir="rtl"
    >
      <div className="about-chapter-nav-track">
        {chapters.map((chapter) => (
          <a
            aria-current={activeId === chapter.id ? "true" : undefined}
            className="about-chapter-link"
            href={`#${chapter.id}`}
            key={chapter.id}
          >
            <span aria-hidden="true" className="about-chapter-index">
              {chapter.index}
            </span>
            <span>{chapter.label}</span>
          </a>
        ))}
      </div>
    </nav>
  );
}
