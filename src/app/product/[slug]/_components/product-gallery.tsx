"use client";

import Image from "next/image";
import { useState } from "react";

import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";

type ProductGalleryProps = {
  className?: string;
  images: string[];
  productName: string;
};

export function ProductGallery({
  className,
  images,
  productName,
}: ProductGalleryProps) {
  const galleryImages = Array.from(new Set(images)).filter(Boolean);
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = galleryImages[activeIndex] ?? galleryImages[0];

  if (!activeImage) return null;

  return (
    <div className={cn("group/gallery grid gap-3", className)}>
      <div className="maison-frame product-tile-image bg-secondary relative aspect-[4/5] overflow-hidden lg:aspect-[5/6]">
        <Image
          alt={productName}
          className="media-color-rich object-cover"
          fill
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
          src={activeImage}
        />
        {galleryImages.length > 1 ? (
          <Badge
            className="product-tile-kicker absolute top-3 left-3 rounded-none"
            variant="secondary"
          >
            {activeIndex + 1}/{galleryImages.length}
          </Badge>
        ) : null}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/28 to-transparent p-5 text-white opacity-0 transition-opacity duration-300 group-hover/gallery:opacity-100" />
      </div>

      {galleryImages.length > 1 ? (
        <div
          aria-label="תמונות מוצר"
          className="grid grid-cols-4 gap-2 sm:grid-cols-5 lg:grid-cols-3"
        >
          {galleryImages.map((image, index) => (
            <button
              aria-label={`הצגת תמונה ${index + 1} של ${productName}`}
              aria-pressed={activeIndex === index}
              className={cn(
                "bg-secondary relative aspect-square overflow-hidden border transition focus-visible:ring-3 focus-visible:ring-[var(--glass-focus)] focus-visible:outline-none",
                activeIndex === index
                  ? "border-[var(--glass-border-strong)] ring-2 ring-[var(--glass-focus)]"
                  : "hover:border-[var(--glass-border-strong)]",
              )}
              key={image}
              onClick={() => setActiveIndex(index)}
              type="button"
            >
              <Image
                alt=""
                className="media-color object-cover"
                fill
                sizes="(min-width: 1024px) 16vw, 25vw"
                src={image}
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
