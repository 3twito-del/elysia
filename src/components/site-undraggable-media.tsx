"use client";

import { useEffect } from "react";

const undraggableMediaSelector =
  "img, video, svg, picture, canvas, [data-undraggable]";

export function SiteUndraggableMedia() {
  useEffect(() => {
    const handleDragStart = (event: DragEvent) => {
      const target = event.target;

      if (!(target instanceof Element)) return;

      if (target.closest(undraggableMediaSelector)) {
        event.preventDefault();
      }
    };

    document.addEventListener("dragstart", handleDragStart, true);

    return () => {
      document.removeEventListener("dragstart", handleDragStart, true);
    };
  }, []);

  return null;
}
