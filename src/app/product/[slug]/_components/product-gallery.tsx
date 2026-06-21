"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import {
  useRef,
  useState,
  type KeyboardEvent,
  type MutableRefObject,
  type PointerEvent,
} from "react";
import {
  ChevronLeft,
  ChevronRight,
  ImageOff,
  Maximize2,
  ZoomIn,
  ZoomOut,
  X,
} from "lucide-react";

import { useResolvedReducedMotion } from "~/components/motion-preference";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { cn } from "~/lib/utils";

type ProductGalleryProps = {
  className?: string;
  images: string[];
  productName: string;
};

type ThumbnailRefs = Array<HTMLButtonElement | null>;

const viewerDragModes = {
  pan: { value: "pan" },
  swipe: { value: "swipe" },
} as const;
const viewerPointerTypes = {
  mouse: { value: "mouse" },
} as const;
const viewerDragExemptSelector = {
  value: "[data-gallery-drag-exempt]",
} as const;
const viewerCurrentMediaSelector = {
  value: "[data-gallery-viewer-current-media]",
} as const;
const viewerSwipeOffsetCssProperty = {
  value: "--viewer-swipe-offset",
} as const;
const viewerSwipePixelUnit = {
  value: "px",
} as const;
const viewerSwipeZeroOffset = {
  value: "0px",
} as const;
const viewerAdjacentMediaPositions = {
  next: { value: "next" },
  previous: { value: "previous" },
} as const;

type ViewerDragMode =
  (typeof viewerDragModes)[keyof typeof viewerDragModes]["value"];

type ViewerDragState = {
  hasMoved: boolean;
  mode: ViewerDragMode;
  pointerId: number;
  startScrollLeft: number;
  startScrollTop: number;
  startX: number;
  startY: number;
};

const mainGalleryImageSizes =
  "(min-width: 1280px) 58vw, (min-width: 1024px) 54vw, 100vw";
const galleryThumbnailImageSizes =
  "(min-width: 1024px) 5.5rem, (min-width: 640px) 5rem, 4.5rem";
const integratedGallerySecondaryImageSizes =
  "(min-width: 1280px) 16vw, (min-width: 1024px) 14vw, 0px";
const viewerGalleryImageSizes =
  "(min-width: 1280px) min(82vw, 72rem), (min-width: 640px) 92vw, 100vw";
const hoverFinePointerQuery = "(hover: hover) and (pointer: fine)";

export function ProductGallery({
  className,
  images,
  productName,
}: ProductGalleryProps) {
  const galleryImages = Array.from(new Set(images)).filter(Boolean);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHoverZoomActive, setIsHoverZoomActive] = useState(false);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [isViewerZoomed, setIsViewerZoomed] = useState(false);
  const galleryFrameRef = useRef<HTMLDivElement | null>(null);
  const viewerTriggerRef = useRef<HTMLButtonElement | null>(null);
  const thumbnailRefs = useRef<ThumbnailRefs>([]);
  const viewerThumbnailRefs = useRef<ThumbnailRefs>([]);
  const viewerDragStateRef = useRef<ViewerDragState | null>(null);
  const viewerDragSuppressClickRef = useRef(false);
  const viewerSwipeReleaseTimeoutRef = useRef<number | null>(null);
  const shouldReduceMotion = useResolvedReducedMotion();
  const activeImageIndex = Math.min(activeIndex, galleryImages.length - 1);
  const activeImage = galleryImages[activeImageIndex];
  const activeImagePosition = activeImageIndex + 1;
  const galleryImageCount = galleryImages.length;
  const previousViewerImageIndex = getLoopedGalleryIndex(
    activeImageIndex - 1,
    galleryImageCount,
  );
  const nextViewerImageIndex = getLoopedGalleryIndex(
    activeImageIndex + 1,
    galleryImageCount,
  );
  const secondaryGalleryImages = getSecondaryGalleryImages({
    activeImageIndex,
    galleryImageCount,
  });
  const hiddenGalleryImageCount = Math.max(galleryImageCount - 3, 0);

  function activateThumbnail(
    nextIndex: number,
    options: {
      refs?: MutableRefObject<ThumbnailRefs>;
      shouldFocus?: boolean;
    } = {},
  ) {
    if (galleryImages.length === 0) return;

    const boundedIndex =
      (nextIndex + galleryImages.length) % galleryImages.length;

    setActiveIndex(boundedIndex);
    setIsViewerZoomed(false);

    if (options.shouldFocus && options.refs) {
      window.requestAnimationFrame(() => {
        options.refs?.current[boundedIndex]?.focus();
      });
    }
  }

  function handleThumbnailKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
    refs: MutableRefObject<ThumbnailRefs>,
  ) {
    const nextKeyMap: Partial<Record<string, number>> = {
      ArrowDown: index + 1,
      ArrowRight: index + 1,
      ArrowLeft: index - 1,
      ArrowUp: index - 1,
      End: galleryImages.length - 1,
      Home: 0,
    };
    const nextIndex = nextKeyMap[event.key];

    if (nextIndex === undefined) return;

    event.preventDefault();
    activateThumbnail(nextIndex, { refs, shouldFocus: true });
  }

  function handleViewerKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const nextKeyMap: Partial<Record<string, number>> = {
      ArrowDown: activeImageIndex + 1,
      ArrowRight: activeImageIndex + 1,
      ArrowLeft: activeImageIndex - 1,
      ArrowUp: activeImageIndex - 1,
      End: galleryImages.length - 1,
      Home: 0,
    };
    const nextIndex = nextKeyMap[event.key];

    if (nextIndex === undefined) return;

    event.preventDefault();
    activateThumbnail(nextIndex);
  }

  function handleViewerPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!event.isPrimary) return;
    if (
      event.pointerType === viewerPointerTypes.mouse.value &&
      event.button !== 0
    ) {
      return;
    }
    if (isViewerDragExemptTarget(event.target)) return;
    if (!isViewerZoomed && galleryImageCount <= 1) return;

    clearViewerSwipeReleaseTimeout();
    resetViewerSwipeTracking(event.currentTarget);
    viewerDragSuppressClickRef.current = false;
    viewerDragStateRef.current = {
      hasMoved: false,
      mode: isViewerZoomed
        ? viewerDragModes.pan.value
        : viewerDragModes.swipe.value,
      pointerId: event.pointerId,
      startScrollLeft: event.currentTarget.scrollLeft,
      startScrollTop: event.currentTarget.scrollTop,
      startX: event.clientX,
      startY: event.clientY,
    };
  }

  function handleViewerPointerMove(event: PointerEvent<HTMLDivElement>) {
    const dragState = viewerDragStateRef.current;

    if (dragState?.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - dragState.startX;
    const deltaY = event.clientY - dragState.startY;

    if (!dragState.hasMoved && Math.hypot(deltaX, deltaY) > 6) {
      dragState.hasMoved = true;
      viewerDragSuppressClickRef.current = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      event.currentTarget.dataset.galleryDragging = String(true);
    }

    if (dragState.mode === viewerDragModes.pan.value) {
      event.preventDefault();
      event.currentTarget.scrollLeft = dragState.startScrollLeft - deltaX;
      event.currentTarget.scrollTop = dragState.startScrollTop - deltaY;
      return;
    }

    if (Math.abs(deltaX) > 8 && Math.abs(deltaX) > Math.abs(deltaY)) {
      event.preventDefault();
      syncViewerSwipeOffset(event.currentTarget, deltaX);
    }
  }

  function finishViewerPointerDrag(
    event: PointerEvent<HTMLDivElement>,
    options: { cancelled?: boolean } = {},
  ) {
    const dragState = viewerDragStateRef.current;

    if (dragState?.pointerId !== event.pointerId) return;

    const stage = event.currentTarget;
    const deltaX = event.clientX - dragState.startX;
    const deltaY = event.clientY - dragState.startY;
    const shouldCommitSwipe =
      !options.cancelled &&
      dragState.mode === viewerDragModes.swipe.value &&
      dragState.hasMoved &&
      Math.abs(deltaX) >= getViewerSwipeThreshold(stage) &&
      Math.abs(deltaX) > Math.abs(deltaY) * 1.2;

    if (stage.hasPointerCapture(event.pointerId)) {
      stage.releasePointerCapture(event.pointerId);
    }
    delete stage.dataset.galleryDragging;
    viewerDragStateRef.current = null;

    if (shouldCommitSwipe) {
      const nextIndex = activeImageIndex + (deltaX < 0 ? 1 : -1);
      const commitOffset =
        deltaX < 0
          ? -getViewerSwipeCommitDistance(stage)
          : getViewerSwipeCommitDistance(stage);

      stage.dataset.gallerySwipeSettling = String(true);
      syncViewerSwipeOffset(stage, commitOffset);
      viewerSwipeReleaseTimeoutRef.current = window.setTimeout(
        () => {
          viewerSwipeReleaseTimeoutRef.current = null;
          activateThumbnail(nextIndex);
          resetViewerSwipeTracking(stage);
        },
        shouldReduceMotion ? 0 : 150,
      );
    } else if (dragState.mode === viewerDragModes.swipe.value) {
      stage.dataset.gallerySwipeSettling = String(true);
      syncViewerSwipeOffset(stage, 0);
      viewerSwipeReleaseTimeoutRef.current = window.setTimeout(
        () => {
          viewerSwipeReleaseTimeoutRef.current = null;
          resetViewerSwipeTracking(stage);
        },
        shouldReduceMotion ? 0 : 180,
      );
    }

    if (dragState.hasMoved) {
      window.setTimeout(() => {
        viewerDragSuppressClickRef.current = false;
      }, 0);
    }
  }

  function handleViewerMediaClick() {
    if (viewerDragSuppressClickRef.current) {
      viewerDragSuppressClickRef.current = false;
      return;
    }

    setIsViewerZoomed((currentZoom) => !currentZoom);
  }

  function handleViewerOpenChange(nextOpen: boolean) {
    clearViewerSwipeReleaseTimeout();
    setIsViewerOpen(nextOpen);
    resetGalleryHoverZoom();

    if (!nextOpen) {
      setIsViewerZoomed(false);
      window.requestAnimationFrame(() => {
        viewerTriggerRef.current?.focus();
      });
    }
  }

  function canUseGalleryHoverZoom(event: PointerEvent<HTMLDivElement>) {
    if (shouldReduceMotion || event.pointerType === "touch") return false;

    const target = event.target;
    if (
      target instanceof Element &&
      target.closest("[data-gallery-hover-zoom-exempt]")
    ) {
      return false;
    }

    return window.matchMedia(hoverFinePointerQuery).matches;
  }

  function syncGalleryHoverZoom(event: PointerEvent<HTMLDivElement>) {
    if (!canUseGalleryHoverZoom(event)) {
      resetGalleryHoverZoom(event.currentTarget);
      return;
    }

    const frame = event.currentTarget;
    const rect = frame.getBoundingClientRect();

    if (rect.width <= 0 || rect.height <= 0) return;

    const originX = clamp(
      ((event.clientX - rect.left) / rect.width) * 100,
      8,
      92,
    );
    const originY = clamp(
      ((event.clientY - rect.top) / rect.height) * 100,
      8,
      92,
    );

    frame.style.setProperty("--gallery-hover-origin-x", `${originX}%`);
    frame.style.setProperty("--gallery-hover-origin-y", `${originY}%`);

    if (!isHoverZoomActive) {
      setIsHoverZoomActive(true);
    }
  }

  function resetGalleryHoverZoom(frame = galleryFrameRef.current) {
    frame?.style.setProperty("--gallery-hover-origin-x", "50%");
    frame?.style.setProperty("--gallery-hover-origin-y", "50%");
    setIsHoverZoomActive(false);
  }

  function openViewerFromSecondaryTile(index: number) {
    clearViewerSwipeReleaseTimeout();
    activateThumbnail(index);
    setIsViewerZoomed(false);
    setIsViewerOpen(true);
  }

  function clearViewerSwipeReleaseTimeout() {
    if (viewerSwipeReleaseTimeoutRef.current === null) return;

    window.clearTimeout(viewerSwipeReleaseTimeoutRef.current);
    viewerSwipeReleaseTimeoutRef.current = null;
  }

  function syncViewerSwipeOffset(stage: HTMLElement, deltaX: number) {
    const offset = clamp(
      deltaX,
      -getViewerSwipeMotionLimit(stage),
      getViewerSwipeMotionLimit(stage),
    );

    stage.style.setProperty(
      viewerSwipeOffsetCssProperty.value,
      String(Math.round(offset)).concat(viewerSwipePixelUnit.value),
    );
    stage.dataset.gallerySwipeOffset = String(Math.round(offset));
    stage.dataset.gallerySwipeTracking = String(Math.abs(offset) > 0);
  }

  function resetViewerSwipeTracking(stage: HTMLElement | null) {
    if (!stage) return;

    stage.style.setProperty(
      viewerSwipeOffsetCssProperty.value,
      viewerSwipeZeroOffset.value,
    );
    delete stage.dataset.gallerySwipeOffset;
    delete stage.dataset.gallerySwipeSettling;
    delete stage.dataset.gallerySwipeTracking;
  }

  function renderViewerAdjacentMedia(input: {
    index: number;
    position: (typeof viewerAdjacentMediaPositions)[keyof typeof viewerAdjacentMediaPositions]["value"];
  }) {
    const image = galleryImages[input.index];
    if (!image) return null;

    return (
      <div
        aria-hidden="true"
        className="product-gallery-viewer-media-shell product-gallery-viewer-media-shell-adjacent relative"
        data-gallery-adjacent-media={input.position}
        key={`${input.position}-${image}`}
      >
        <Image
          alt=""
          className="media-color object-contain"
          draggable={false}
          fill
          sizes={viewerGalleryImageSizes}
          src={image}
        />
      </div>
    );
  }

  function renderSecondaryGalleryStack() {
    if (secondaryGalleryImages.length === 0) return null;

    return (
      <div
        aria-label="\u05ea\u05de\u05d5\u05e0\u05d5\u05ea \u05e0\u05d5\u05e1\u05e4\u05d5\u05ea \u05e9\u05dc \u05d4\u05ea\u05db\u05e9\u05d9\u05d8"
        className="product-gallery-secondary-stack hidden min-h-0 min-w-0 gap-3 lg:grid"
        data-testid="product-gallery-secondary-stack"
        dir="rtl"
      >
        {secondaryGalleryImages.map((index, tilePosition) => {
          const image = galleryImages[index];
          if (!image) return null;

          const isMoreImagesTile =
            hiddenGalleryImageCount > 0 &&
            tilePosition === secondaryGalleryImages.length - 1;

          return (
            <button
              aria-label={
                isMoreImagesTile
                  ? `\u05e4\u05ea\u05d9\u05d7\u05ea \u05e2\u05d5\u05d3 ${hiddenGalleryImageCount} \u05ea\u05de\u05d5\u05e0\u05d5\u05ea \u05e9\u05dc ${productName}`
                  : `\u05d4\u05e6\u05d2\u05ea \u05ea\u05de\u05d5\u05e0\u05d4 ${index + 1} \u05e9\u05dc ${productName}`
              }
              aria-pressed={activeImageIndex === index}
              className={cn(
                "product-gallery-secondary-tile motion-thumbnail-button group relative min-h-0 overflow-hidden rounded-md border transition focus-visible:ring-3 focus-visible:ring-[var(--glass-focus)] focus-visible:outline-none",
                isMoreImagesTile && "product-gallery-more-images-trigger",
              )}
              data-gallery-selected={
                activeImageIndex === index ? "true" : "false"
              }
              data-testid={
                isMoreImagesTile
                  ? "product-gallery-more-images-trigger"
                  : "product-gallery-secondary-tile"
              }
              key={`${image}-${index}`}
              onClick={() =>
                isMoreImagesTile
                  ? openViewerFromSecondaryTile(index)
                  : activateThumbnail(index)
              }
              type="button"
            >
              <Image
                alt=""
                className="media-color object-cover transition-transform duration-[700ms] ease-[var(--ease-motion-standard)] group-hover:scale-[1.018]"
                fill
                loading="lazy"
                sizes={integratedGallerySecondaryImageSizes}
                src={image}
              />
              {isMoreImagesTile ? (
                <span
                  aria-hidden="true"
                  className="product-gallery-more-images-veil absolute inset-0 grid place-items-center px-4 text-center"
                >
                  <span className="product-gallery-more-images-label rounded-full px-4 py-2 text-sm font-medium">
                    {"\u05e2\u05d5\u05d3"} {hiddenGalleryImageCount}{" "}
                    {"\u05ea\u05de\u05d5\u05e0\u05d5\u05ea"}
                  </span>
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    );
  }

  function renderThumbnailRail(input: {
    refs: MutableRefObject<ThumbnailRefs>;
    testId: string;
    thumbnailTestId: string;
    variant?: "inline" | "viewer";
  }) {
    if (galleryImageCount <= 1) return null;

    const isViewerRail = input.variant === "viewer";

    return (
      <div
        className={cn(
          "grid min-w-0 gap-2",
          isViewerRail &&
            "product-gallery-viewer-filmstrip min-h-0 content-center",
        )}
        data-gallery-rail-variant={isViewerRail ? "viewer" : "inline"}
      >
        <p
          className={cn(
            "text-muted-foreground text-xs",
            isViewerRail && "sr-only",
          )}
          data-testid={`${input.testId}-summary`}
        >
          תמונה {activeImagePosition} מתוך {galleryImageCount}
        </p>
        <div
          aria-label="תמונות תכשיט"
          className={cn(
            "product-gallery-thumbnail-rail minimal-scroll flex max-w-full min-w-0 gap-2 overflow-x-auto overscroll-x-contain pb-1",
            isViewerRail &&
              "product-gallery-viewer-thumbnail-rail mx-auto justify-start px-1 pb-0",
          )}
          data-testid={input.testId}
        >
          {galleryImages.map((image, index) => (
            <button
              aria-label={`הצגת תמונה ${index + 1} של ${productName}`}
              aria-current={activeImageIndex === index}
              aria-pressed={activeImageIndex === index}
              className={cn(
                "motion-thumbnail-button border-border bg-card relative aspect-[4/5] shrink-0 overflow-hidden rounded-md border transition focus-visible:ring-3 focus-visible:ring-[var(--glass-focus)] focus-visible:outline-none",
                isViewerRail
                  ? "product-gallery-viewer-thumbnail w-[3.5rem] sm:w-[4.75rem]"
                  : "w-[4.5rem] sm:w-20 lg:w-[5.5rem]",
                activeImageIndex === index
                  ? "border-foreground ring-foreground ring-1"
                  : "hover:border-foreground/60",
              )}
              data-gallery-selected={
                activeImageIndex === index ? "true" : "false"
              }
              data-testid={input.thumbnailTestId}
              key={image}
              onClick={() => activateThumbnail(index)}
              onKeyDown={(event) =>
                handleThumbnailKeyDown(event, index, input.refs)
              }
              ref={(node) => {
                input.refs.current[index] = node;
              }}
              type="button"
            >
              <Image
                alt=""
                className="media-color object-cover"
                fill
                loading="lazy"
                sizes={galleryThumbnailImageSizes}
                src={image}
              />
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (!activeImage) {
    return (
      <div className={cn("grid min-w-0 gap-4", className)}>
        <div
          className="brand-surface flex aspect-[4/5] items-center justify-center rounded-md p-8 text-center sm:aspect-[5/4] lg:aspect-[4/3]"
          data-testid="product-gallery-empty"
        >
          <div className="grid justify-items-center gap-4">
            <span className="border-border flex size-12 items-center justify-center rounded-full border">
              <ImageOff className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="font-medium">תמונת תכשיט תעלה בקרוב</p>
              <p className="text-muted-foreground mt-2 text-sm">
                פרטי התכשיט, המחיר וההתאמה עדיין מוצגים בעמוד.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      aria-label={`גלריית תכשיט עבור ${productName}`}
      className={cn("grid min-w-0 gap-4", className)}
      role="group"
    >
      <div
        className="product-gallery-integrated-layout grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(9rem,0.36fr)] lg:gap-3"
        data-testid="product-gallery-integrated-layout"
        dir="rtl"
      >
        <div
          className="brand-gallery-frame product-gallery-main-frame relative aspect-[4/5] max-h-[min(82vh,46rem)] w-full min-w-0 overflow-hidden rounded-md bg-[var(--secondary)] sm:aspect-[5/4] lg:aspect-auto lg:max-h-none lg:min-h-[min(72vh,42rem)]"
          data-gallery-hover-zoom={isHoverZoomActive ? "true" : "false"}
          data-motion-gallery="product"
          data-testid="product-gallery"
          onPointerCancel={(event) =>
            resetGalleryHoverZoom(event.currentTarget)
          }
          onPointerEnter={syncGalleryHoverZoom}
          onPointerLeave={(event) => resetGalleryHoverZoom(event.currentTarget)}
          onPointerMove={syncGalleryHoverZoom}
          ref={galleryFrameRef}
        >
          <AnimatePresence initial={false} mode="popLayout">
            <motion.div
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0"
              exit={
                shouldReduceMotion
                  ? { opacity: 1, scale: 1 }
                  : { opacity: 0, scale: 0.996 }
              }
              initial={
                shouldReduceMotion ? false : { opacity: 0, scale: 1.006 }
              }
              key={activeImage}
              transition={{
                duration: shouldReduceMotion ? 0 : 0.38,
                ease: [0.2, 0, 0, 1],
              }}
            >
              <div
                className="product-gallery-hover-zoom-layer absolute inset-0"
                data-testid="product-gallery-hover-zoom-layer"
              >
                <Image
                  alt={`${productName}, תמונה ${activeImagePosition} מתוך ${galleryImageCount}`}
                  className="media-color product-gallery-hover-zoom-image object-cover"
                  data-testid="product-gallery-main-image"
                  fill
                  loading={activeImageIndex === 0 ? undefined : "lazy"}
                  priority={activeImageIndex === 0}
                  sizes={mainGalleryImageSizes}
                  src={activeImage}
                />
              </div>
            </motion.div>
          </AnimatePresence>
          {galleryImageCount > 1 ? (
            <Badge
              aria-live="polite"
              className="bg-background text-foreground absolute bottom-5 left-4 rounded-full px-3"
              data-testid="product-gallery-selection-status"
              variant="secondary"
            >
              <span className="sr-only">
                מוצגת תמונה {activeImagePosition} מתוך {galleryImageCount} של{" "}
                {productName}
              </span>
              <span aria-hidden="true">
                {activeImagePosition}/{galleryImageCount}
              </span>
            </Badge>
          ) : null}
          <Dialog open={isViewerOpen} onOpenChange={handleViewerOpenChange}>
            <div
              className="absolute right-4 bottom-5 z-10 flex gap-2 sm:top-4 sm:right-4 sm:bottom-auto"
              data-gallery-hover-zoom-exempt="true"
            >
              <DialogTrigger asChild>
                <Button
                  aria-label={`פתיחת גלריית מסך מלא עבור ${productName}`}
                  className="bg-background text-foreground hover:bg-background size-9 rounded-full p-0 shadow-sm"
                  data-icon-tooltip="מסך מלא"
                  data-testid="product-gallery-fullscreen-trigger"
                  onClick={(event) => {
                    viewerTriggerRef.current = event.currentTarget;
                    event.currentTarget.focus();
                    setIsViewerZoomed(false);
                  }}
                  type="button"
                  variant="secondary"
                >
                  <Maximize2 aria-hidden="true" className="size-3.5" />
                  <span className="sr-only">מסך מלא</span>
                </Button>
              </DialogTrigger>
              <Button
                aria-label={`הגדלת תמונת התכשיט עבור ${productName}`}
                className="bg-background text-foreground hover:bg-background rounded-full shadow-sm sm:hidden"
                data-icon-tooltip="הגדלה"
                data-testid="product-gallery-touch-zoom-trigger"
                onClick={(event) => {
                  viewerTriggerRef.current = event.currentTarget;
                  event.currentTarget.focus();
                  setIsViewerZoomed(true);
                  setIsViewerOpen(true);
                }}
                size="icon-sm"
                type="button"
                variant="secondary"
              >
                <ZoomIn aria-hidden="true" className="size-4" />
                <span className="sr-only">הגדלה</span>
              </Button>
            </div>
            <DialogContent
              className="product-gallery-viewer-dialog bg-background fixed !inset-0 !top-0 !left-0 z-[100] grid !h-auto !w-auto !max-w-none !translate-x-0 !translate-y-0 grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden !rounded-none !border-0 !p-0 sm:!max-w-none"
              data-testid="product-gallery-fullscreen-dialog"
              dir="rtl"
              onKeyDown={handleViewerKeyDown}
              showCloseButton={false}
              style={{ animation: "none", transform: "none" }}
            >
              <DialogTitle className="sr-only">
                גלריית תמונות של {productName}
              </DialogTitle>
              <DialogDescription className="sr-only">
                ניתן לעבור בין תמונות התכשיט ולחזור לעמוד המוצר.
              </DialogDescription>

              <div
                className="product-gallery-viewer-header flex items-center justify-between gap-3"
                dir="ltr"
              >
                <div className="grid min-w-0 gap-0.5 text-right" dir="rtl">
                  <p className="product-gallery-viewer-title min-w-0 truncate">
                    {productName}
                  </p>
                  <p
                    aria-label={`תמונה ${activeImagePosition} מתוך ${galleryImageCount} של ${productName}`}
                    aria-live="polite"
                    className="product-gallery-viewer-status min-w-0 truncate text-right"
                    data-testid="product-gallery-fullscreen-status"
                    dir="rtl"
                  >
                    {activeImagePosition}/{galleryImageCount}
                  </p>
                </div>
                <div className="product-gallery-viewer-actions flex shrink-0 items-center gap-1.5">
                  <Button
                    aria-label={
                      isViewerZoomed
                        ? "ביטול הגדלת תמונת התכשיט"
                        : "הגדלת תמונת התכשיט"
                    }
                    aria-pressed={isViewerZoomed}
                    data-icon-tooltip={isViewerZoomed ? "ביטול הגדלה" : "הגדלה"}
                    data-testid="product-gallery-fullscreen-zoom-toggle"
                    onClick={() => setIsViewerZoomed((current) => !current)}
                    size="icon-sm"
                    type="button"
                    variant="ghost"
                  >
                    {isViewerZoomed ? (
                      <ZoomOut aria-hidden="true" className="size-4" />
                    ) : (
                      <ZoomIn aria-hidden="true" className="size-4" />
                    )}
                  </Button>
                  <DialogClose asChild>
                    <Button
                      aria-label="סגירת גלריית מסך מלא"
                      data-icon-tooltip="סגירה"
                      data-testid="product-gallery-fullscreen-close"
                      size="icon-sm"
                      type="button"
                      variant="ghost"
                    >
                      <X aria-hidden="true" className="size-4" />
                    </Button>
                  </DialogClose>
                </div>
              </div>

              <div
                className={cn(
                  "product-gallery-viewer-stage relative box-border grid min-h-0 w-full max-w-[100dvw] min-w-0 place-items-center",
                  isViewerZoomed
                    ? "product-gallery-viewer-stage-zoomed overflow-auto overscroll-contain"
                    : "overflow-hidden",
                )}
                data-gallery-drag-mode={
                  isViewerZoomed
                    ? viewerDragModes.pan.value
                    : viewerDragModes.swipe.value
                }
                data-gallery-zoomed={isViewerZoomed ? "true" : "false"}
                data-testid="product-gallery-fullscreen-stage"
                onPointerCancel={(event) =>
                  finishViewerPointerDrag(event, { cancelled: true })
                }
                onPointerDown={handleViewerPointerDown}
                onPointerMove={handleViewerPointerMove}
                onPointerUp={finishViewerPointerDrag}
              >
                <div
                  className={cn(
                    isViewerZoomed
                      ? "contents"
                      : "product-gallery-viewer-swipe-window",
                  )}
                  data-testid={
                    isViewerZoomed
                      ? undefined
                      : "product-gallery-fullscreen-swipe-window"
                  }
                  dir={isViewerZoomed ? undefined : "ltr"}
                >
                  <div
                    className={cn(
                      isViewerZoomed
                        ? "contents"
                        : "product-gallery-viewer-swipe-track",
                    )}
                    data-testid={
                      isViewerZoomed
                        ? undefined
                        : "product-gallery-fullscreen-swipe-track"
                    }
                  >
                    {!isViewerZoomed
                      ? renderViewerAdjacentMedia({
                          index: previousViewerImageIndex,
                          position: viewerAdjacentMediaPositions.previous.value,
                        })
                      : null}
                    <AnimatePresence initial={false} mode="popLayout">
                      <motion.button
                        animate={{ opacity: 1, scale: 1 }}
                        aria-label={
                          isViewerZoomed
                            ? "ביטול הגדלת תמונת התכשיט"
                            : "הגדלת תמונת התכשיט"
                        }
                        aria-pressed={isViewerZoomed}
                        className={cn(
                          "product-gallery-viewer-media-shell relative",
                          !isViewerZoomed &&
                            "product-gallery-viewer-media-shell-current",
                          isViewerZoomed &&
                            "product-gallery-viewer-media-shell-zoomed",
                        )}
                        data-gallery-viewer-current-media={String(true)}
                        data-testid="product-gallery-fullscreen-media"
                        draggable={false}
                        exit={
                          shouldReduceMotion
                            ? { opacity: 1, scale: 1 }
                            : { opacity: 0, scale: 0.996 }
                        }
                        initial={
                          shouldReduceMotion
                            ? false
                            : { opacity: 0, scale: 1.006 }
                        }
                        key={`viewer-${activeImage}`}
                        onDragStart={(event) => event.preventDefault()}
                        onClick={handleViewerMediaClick}
                        transition={{
                          duration: shouldReduceMotion ? 0 : 0.28,
                          ease: [0.2, 0, 0, 1],
                        }}
                        type="button"
                      >
                        <Image
                          alt={`${productName}, תמונה במסך מלא ${activeImagePosition} מתוך ${galleryImageCount}`}
                          className="media-color object-contain"
                          draggable={false}
                          fill
                          sizes={viewerGalleryImageSizes}
                          src={activeImage}
                        />
                      </motion.button>
                    </AnimatePresence>
                    {!isViewerZoomed
                      ? renderViewerAdjacentMedia({
                          index: nextViewerImageIndex,
                          position: viewerAdjacentMediaPositions.next.value,
                        })
                      : null}
                  </div>
                </div>

                {galleryImageCount > 1 ? (
                  <>
                    <Button
                      aria-label="התמונה הקודמת"
                      className="product-gallery-viewer-nav product-gallery-viewer-nav-previous"
                      data-gallery-drag-exempt="true"
                      data-testid="product-gallery-previous"
                      onClick={() => activateThumbnail(activeImageIndex - 1)}
                      size="icon-lg"
                      type="button"
                      variant="secondary"
                    >
                      <ChevronRight aria-hidden="true" className="size-5" />
                    </Button>
                    <Button
                      aria-label="התמונה הבאה"
                      className="product-gallery-viewer-nav product-gallery-viewer-nav-next"
                      data-gallery-drag-exempt="true"
                      data-testid="product-gallery-next"
                      onClick={() => activateThumbnail(activeImageIndex + 1)}
                      size="icon-lg"
                      type="button"
                      variant="secondary"
                    >
                      <ChevronLeft aria-hidden="true" className="size-5" />
                    </Button>
                  </>
                ) : null}
              </div>

              <div className="product-gallery-viewer-filmstrip-shell">
                {renderThumbnailRail({
                  refs: viewerThumbnailRefs,
                  testId: "product-gallery-fullscreen-thumbnail-rail",
                  thumbnailTestId: "product-gallery-fullscreen-thumbnail",
                  variant: "viewer",
                })}
              </div>
            </DialogContent>
          </Dialog>
        </div>
        {renderSecondaryGalleryStack()}
      </div>

      <div className="min-w-0 lg:hidden">
        {renderThumbnailRail({
          refs: thumbnailRefs,
          testId: "product-gallery-thumbnail-rail",
          thumbnailTestId: "product-gallery-thumbnail",
        })}
      </div>
    </div>
  );
}

function getSecondaryGalleryImages(input: {
  activeImageIndex: number;
  galleryImageCount: number;
}) {
  if (input.galleryImageCount <= 1) return [];

  return Array.from({ length: input.galleryImageCount - 1 }, (_, offset) => {
    return (input.activeImageIndex + offset + 1) % input.galleryImageCount;
  }).slice(0, 2);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getViewerSwipeThreshold(element: HTMLElement) {
  const width = element.getBoundingClientRect().width;

  return Math.min(96, Math.max(42, width * 0.08));
}

function getLoopedGalleryIndex(index: number, count: number) {
  if (count <= 0) return 0;

  return (index + count) % count;
}

function getViewerCurrentMediaWidth(stage: HTMLElement) {
  const currentMedia = stage.querySelector<HTMLElement>(
    viewerCurrentMediaSelector.value,
  );

  return (
    currentMedia?.getBoundingClientRect().width ??
    stage.getBoundingClientRect().width
  );
}

function getViewerSwipeMotionLimit(stage: HTMLElement) {
  return getViewerCurrentMediaWidth(stage) * 0.72;
}

function getViewerSwipeCommitDistance(stage: HTMLElement) {
  return getViewerCurrentMediaWidth(stage) * 0.92;
}

function isViewerDragExemptTarget(target: EventTarget | null) {
  return (
    target instanceof Element &&
    Boolean(target.closest(viewerDragExemptSelector.value))
  );
}
