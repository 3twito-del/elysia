"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowUp,
  Circle,
  Diamond,
  Copy,
  Gift,
  Gem,
  Heart,
  Headphones,
  Ruler,
  Search,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type KeyboardEvent,
  type Ref,
  type SVGProps,
} from "react";
import { createPortal } from "react-dom";

import { cn } from "~/lib/utils";

type ContextMenuPoint = {
  x: number;
  y: number;
};

type ContextMenuItem = {
  href: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
};

const menuWidth = 304;
const viewportGutter = 12;
const excludedPathPrefixes = ["/admin", "/checkout"];
const nativeContextMenuSelector = [
  "input",
  "textarea",
  "select",
  "button",
  "[role='button']",
  "[role='textbox']",
  "[contenteditable='true']",
  "[data-native-context-menu]",
].join(",");

const primaryLinks = [
  { href: "/search", label: "חיפוש תכשיט", icon: Search },
  { href: "/search", label: "כל הקולקציה", icon: ShoppingBag },
  { href: "/gifts", label: "מתנות", icon: Gift },
  { href: "/wishlist", label: "מועדפים", icon: Heart },
] satisfies ContextMenuItem[];

const categoryLinks = [
  { href: "/category/rings", label: "טבעות", icon: Circle },
  { href: "/category/necklaces", label: "שרשראות", icon: Gem },
  { href: "/category/earrings", label: "עגילים", icon: Sparkles },
  { href: "/category/bracelets", label: "צמידים", icon: Diamond },
  { href: "/category/sets", label: "סטים", icon: Gift },
] satisfies ContextMenuItem[];

export function SiteContextMenu() {
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);
  const firstMenuItemRef = useRef<HTMLButtonElement>(null);
  const [menuPoint, setMenuPoint] = useState<ContextMenuPoint | null>(null);
  const [menuPosition, setMenuPosition] = useState<ContextMenuPoint | null>(
    null,
  );
  const [canScrollTop, setCanScrollTop] = useState(false);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied">("idle");
  const isProductPath = pathname.startsWith("/product/");
  const shouldDisableMenu = excludedPathPrefixes.some((prefix) =>
    pathname === prefix ? true : pathname.startsWith(`${prefix}/`),
  );
  const supportLabel = isProductPath ? "שירות אישי על הפריט" : "שירות לקוחות";
  const copyLabel =
    copyStatus === "copied"
      ? "הקישור הועתק"
      : isProductPath
        ? "קישור לתכשיט"
        : "העתקת קישור לעמוד";
  const supportLinks = useMemo(
    () =>
      [
        { href: "/size-guide", label: "מדריך מידות", icon: Ruler },
        { href: "/service", label: supportLabel, icon: Headphones },
      ] satisfies ContextMenuItem[],
    [supportLabel],
  );

  const closeMenu = useCallback(() => {
    setMenuPoint(null);
    setMenuPosition(null);
    setCopyStatus("idle");
  }, []);

  const openMenu = useCallback(
    (point: ContextMenuPoint) => {
      if (shouldDisableMenu) return;

      setCanScrollTop(window.scrollY > 80);
      setCopyStatus("idle");
      setMenuPoint(point);
      setMenuPosition(point);
    },
    [shouldDisableMenu],
  );

  useEffect(() => {
    if (!shouldDisableMenu) return;

    const frame = window.requestAnimationFrame(closeMenu);

    return () => window.cancelAnimationFrame(frame);
  }, [closeMenu, shouldDisableMenu]);

  useEffect(() => {
    const handleContextMenu = (event: MouseEvent) => {
      if (shouldDisableMenu || shouldUseNativeContextMenu(event)) return;

      event.preventDefault();
      openMenu({ x: event.clientX, y: event.clientY });
    };

    const handleKeyboardOpen = (event: globalThis.KeyboardEvent) => {
      const opensKeyboardMenu =
        event.key === "ContextMenu" || (event.shiftKey && event.key === "F10");

      if (!opensKeyboardMenu || shouldDisableMenu) return;

      const target = event.target instanceof Element ? event.target : null;

      if (target && shouldUseNativeContextMenuTarget(target)) return;
      if (hasSelectedText()) return;

      event.preventDefault();
      openMenu(getKeyboardMenuPoint(target));
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyboardOpen);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyboardOpen);
    };
  }, [openMenu, shouldDisableMenu]);

  useEffect(() => {
    if (!menuPoint) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (
        menuRef.current &&
        event.target instanceof Node &&
        menuRef.current.contains(event.target)
      ) {
        return;
      }

      closeMenu();
    };

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu();
      }
    };

    const handleViewportChange = () => closeMenu();

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, { passive: true });

    window.requestAnimationFrame(() => {
      firstMenuItemRef.current?.focus();
    });

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange);
    };
  }, [closeMenu, menuPoint]);

  useLayoutEffect(() => {
    if (!menuPoint || !menuRef.current) return;

    const rect = menuRef.current.getBoundingClientRect();
    const maxX = Math.max(
      viewportGutter,
      window.innerWidth - rect.width - viewportGutter,
    );
    const maxY = Math.max(
      viewportGutter,
      window.innerHeight - rect.height - viewportGutter,
    );

    setMenuPosition({
      x: Math.min(Math.max(menuPoint.x, viewportGutter), maxX),
      y: Math.min(Math.max(menuPoint.y, viewportGutter), maxY),
    });
  }, [menuPoint]);

  const copyPageLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {
      copyTextWithFallback(window.location.href);
    }

    setCopyStatus("copied");
    window.setTimeout(closeMenu, 650);
  };

  const scrollToTop = () => {
    window.scrollTo({ behavior: "smooth", top: 0 });
    closeMenu();
  };

  const handleMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;

    const items = Array.from(
      menuRef.current?.querySelectorAll<HTMLElement>("[role='menuitem']") ?? [],
    ).filter((item) => !item.hasAttribute("aria-disabled"));

    if (items.length === 0) return;

    event.preventDefault();

    const currentIndex = items.findIndex(
      (item) => item === document.activeElement,
    );
    const direction = event.key === "ArrowDown" ? 1 : -1;
    const nextIndex =
      currentIndex === -1
        ? 0
        : (currentIndex + direction + items.length) % items.length;

    items[nextIndex]?.focus();
  };

  if (!menuPosition || shouldDisableMenu) return null;

  return createPortal(
    <div
      aria-label={isProductPath ? "תפריט תכשיט של Elysia" : "תפריט Elysia"}
      className="fixed z-[95] w-[min(calc(100vw-1.5rem),19rem)] rounded-md border border-[var(--glass-border)] bg-[var(--background)] p-2 text-right text-sm text-[var(--foreground)] shadow-[0_18px_48px_var(--glass-shadow-deep)] outline-none"
      data-site-context-menu="true"
      dir="rtl"
      onKeyDown={handleMenuKeyDown}
      ref={menuRef}
      role="menu"
      style={{
        left: menuPosition.x,
        top: menuPosition.y,
        width: `min(calc(100vw - ${viewportGutter * 2}px), ${menuWidth}px)`,
      }}
    >
      <div className="border-b border-[var(--glass-border)] px-2 pt-1 pb-2">
        <p className="text-[0.7rem] font-medium text-[var(--muted-foreground)] uppercase">
          Elysia
        </p>
        <p className="mt-1 text-sm font-semibold">
          {isProductPath ? "פעולות לתכשיט" : "פעולות מהירות"}
        </p>
      </div>

      <div className="grid py-1">
        <ContextMenuButton
          icon={Copy}
          label={copyLabel}
          onClick={copyPageLink}
          buttonRef={firstMenuItemRef}
        />
        {canScrollTop ? (
          <ContextMenuButton
            icon={ArrowUp}
            label="חזרה למעלה"
            onClick={scrollToTop}
          />
        ) : null}
      </div>

      <MenuDivider />

      <div className="grid py-1">
        {primaryLinks.map((item) => (
          <ContextMenuLink
            closeMenu={closeMenu}
            item={item}
            key={`${item.href}-${item.label}`}
          />
        ))}
      </div>

      <MenuDivider />

      <div className="grid grid-cols-2 gap-1 py-1">
        {categoryLinks.map((item) => (
          <ContextMenuLink
            closeMenu={closeMenu}
            compact
            item={item}
            key={item.href}
          />
        ))}
      </div>

      <MenuDivider />

      <div className="grid py-1">
        {supportLinks.map((item) => (
          <ContextMenuLink closeMenu={closeMenu} item={item} key={item.href} />
        ))}
      </div>
    </div>,
    document.body,
  );
}

function ContextMenuLink({
  closeMenu,
  compact = false,
  item,
}: {
  closeMenu: () => void;
  compact?: boolean;
  item: ContextMenuItem;
}) {
  const Icon = item.icon;

  return (
    <Link
      className={cn(
        "flex min-h-10 items-center gap-2 rounded-md px-2.5 py-2 text-sm transition-colors outline-none hover:bg-[var(--glass-inset-bg)] focus-visible:ring-3 focus-visible:ring-[var(--glass-focus)]",
        compact && "min-h-9 text-xs",
      )}
      href={item.href}
      onClick={closeMenu}
      prefetch={false}
      role="menuitem"
    >
      <Icon aria-hidden="true" className="size-4 shrink-0" />
      <span className="min-w-0 truncate">{item.label}</span>
    </Link>
  );
}

const ContextMenuButton = ({
  buttonRef,
  icon: Icon,
  label,
  onClick,
}: {
  buttonRef?: Ref<HTMLButtonElement>;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
  onClick: () => void;
}) => (
  <button
    className="flex min-h-10 items-center gap-2 rounded-md px-2.5 py-2 text-right text-sm transition-colors outline-none hover:bg-[var(--glass-inset-bg)] focus-visible:ring-3 focus-visible:ring-[var(--glass-focus)]"
    onClick={onClick}
    ref={buttonRef}
    role="menuitem"
    type="button"
  >
    <Icon aria-hidden="true" className="size-4 shrink-0" />
    <span className="min-w-0 truncate">{label}</span>
  </button>
);

function MenuDivider() {
  return <div className="my-1 h-px bg-[var(--glass-border)]" role="none" />;
}

function shouldUseNativeContextMenu(event: MouseEvent) {
  if (event.defaultPrevented || event.ctrlKey || event.shiftKey) return true;
  if (hasSelectedText()) return true;

  const target = event.target instanceof Element ? event.target : null;

  return target ? shouldUseNativeContextMenuTarget(target) : false;
}

function shouldUseNativeContextMenuTarget(target: Element) {
  return Boolean(target.closest(nativeContextMenuSelector));
}

function hasSelectedText() {
  return Boolean(window.getSelection()?.toString().trim());
}

function getKeyboardMenuPoint(target: Element | null): ContextMenuPoint {
  const rect = target?.getBoundingClientRect();

  if (rect && rect.width > 0 && rect.height > 0) {
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
  }

  return {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
  };
}

function copyTextWithFallback(text: string) {
  const textarea = document.createElement("textarea");

  textarea.value = text;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.append(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}
