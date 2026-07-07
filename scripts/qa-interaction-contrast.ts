import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import {
  chromium,
  type BrowserContext,
  type ElementHandle,
} from "@playwright/test";

import { getVisualQaRouteEntries } from "./qa-route-inventory";

/**
 * Interaction-state contrast gate.
 *
 * axe and any resting-DOM scan only evaluate the current computed state — they
 * never synthesise :hover / :focus-visible. A contrast failure that appears
 * only in an interaction state (e.g. a hover fill that turns light while the
 * icon stays light in night mode) slips through entirely. This check drives
 * :hover and :focus-visible on every icon-bearing control across the public
 * routes, in light AND dark, and re-measures the icon contrast against the
 * background it actually sits on.
 *
 * Measurement is icon-centric to avoid false positives:
 *  - foreground = the icon's currentColor (what lucide/brand SVGs actually
 *    paint), not the outer <svg> element's default fill;
 *  - background = the nearest covering fill walking up *from the icon*, so a
 *    glyph on its own ::before pill is measured against that pill, not the
 *    card behind it;
 *  - if we cross a background-image before an opaque colour, contrast is
 *    indeterminate (content over media) and the element is skipped.
 */

type ThemeName = "light" | "dark";

type Measurement =
  | { bg: string; c: number; fg: string; sel: string }
  | { indeterminate: true }
  | null;

type Collapse = {
  bg: string;
  contrast: number;
  fg: string;
  route: string;
  selector: string;
  state: "hover" | "focus";
  theme: ThemeName;
};

type CliOptions = {
  baseUrl: string;
  failThreshold: number;
  maxPerRoute: number;
  outDir: string;
  routes: string[];
};

const noop = () => undefined;

const FALLBACK_ROUTES = [
  "/",
  "/category/earrings",
  "/product/elysia-mila-bracelet-silver-ii-093",
  "/gifts",
  "/service",
  "/faq",
  "/search?q=venus",
  "/wishlist",
  "/blog",
  "/branches",
  "/size-guide",
  "/about",
];

function parseArgs(argv: string[]): CliOptions {
  const get = (flag: string) => {
    const index = argv.indexOf(flag);
    return index >= 0 ? argv[index + 1] : undefined;
  };
  const baseUrl = (get("--base-url") ?? process.env.QA_BASE_URL ?? "").replace(
    /\/$/,
    "",
  );
  // Default to a curated representative set — one of every interactive surface
  // (home, category, PDP, gifts, service, faq, search, wishlist, blog,
  // branches, size-guide, about) — so the gate stays fast and predictable.
  // `--all-routes` widens to the full public/dynamic visual-QA inventory.
  const useAllRoutes = argv.includes("--all-routes");
  const inventoryRoutes = getVisualQaRouteEntries()
    .filter(
      (route) =>
        !route.requiresAuth &&
        (route.kind === "public" || route.kind === "dynamic") &&
        !route.expectedStatuses.includes(404),
    )
    .map((route) => route.path);
  const routes = Array.from(
    new Set(useAllRoutes ? inventoryRoutes : FALLBACK_ROUTES),
  );

  return {
    baseUrl,
    failThreshold: Number(get("--threshold") ?? 3),
    maxPerRoute: Number(get("--max-per-route") ?? 45),
    outDir: get("--out-dir") ?? "",
    routes,
  };
}

// Serialised into the page by Playwright. Returns the icon contrast for `el`
// in its current interaction state, or `{ indeterminate: true }` when the
// background is over media (contrast can't be judged against an image).
function measureIconContrast(el: Element): Measurement {
  type RGB = { a: number; b: number; g: number; r: number };
  // Normalise any CSS colour to rgba via the browser's own colour engine.
  // Computed styles come back in mixed formats (rgb, but also lab()/oklch() for
  // Tailwind v4 tokens); a regex that only reads rgb() would silently drop the
  // rest and mis-resolve the background.
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const paintCtx = canvas.getContext("2d", { willReadFrequently: true });
  const parse = (value: string | null): RGB | null => {
    if (!value || value === "transparent" || value === "none") return null;
    const match = /^rgba?\(([^)]+)\)$/.exec(value);
    if (match?.[1]) {
      const parts = match[1]
        .split(",")
        .map((piece) => parseFloat(piece.trim()));
      if (parts.length >= 3) {
        return {
          a: parts.length > 3 ? (parts[3] ?? 1) : 1,
          b: parts[2] ?? 0,
          g: parts[1] ?? 0,
          r: parts[0] ?? 0,
        };
      }
    }
    if (!paintCtx) return null;
    paintCtx.clearRect(0, 0, 1, 1);
    paintCtx.fillStyle = "#000";
    paintCtx.fillStyle = value;
    paintCtx.fillRect(0, 0, 1, 1);
    const data = paintCtx.getImageData(0, 0, 1, 1).data;
    return {
      a: (data[3] ?? 255) / 255,
      b: data[2] ?? 0,
      g: data[1] ?? 0,
      r: data[0] ?? 0,
    };
  };
  const channel = (value: number) => {
    const v = value / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  const lum = (color: RGB) =>
    0.2126 * channel(color.r) +
    0.7152 * channel(color.g) +
    0.0722 * channel(color.b);
  const contrast = (a: RGB, b: RGB) => {
    const l1 = lum(a);
    const l2 = lum(b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  };
  const compose = (fg: RGB, bg: RGB): RGB =>
    fg.a >= 1
      ? fg
      : {
          a: 1,
          b: fg.b * fg.a + bg.b * (1 - fg.a),
          g: fg.g * fg.a + bg.g * (1 - fg.a),
          r: fg.r * fg.a + bg.r * (1 - fg.a),
        };

  // Skip controls the app marks as sitting over media (e.g. the header over the
  // hero): contrast there depends on image pixels, not a resolvable colour.
  if (
    el.closest('[data-header-state="transparent"], [data-over-media="true"]')
  ) {
    return { indeterminate: true };
  }

  const icon =
    el.querySelector("svg") ?? (el.tagName.toLowerCase() === "svg" ? el : null);
  const iconStyle = getComputedStyle(icon ?? el);
  // Foreground = the glyph's currentColor. lucide strokes currentColor and the
  // brand logo fills currentColor via a child <g>; the outer <svg>'s own
  // fill/stroke is usually the black default and not what is painted, so the
  // color property is the reliable proxy for the icon's visible colour.
  const fg = parse(iconStyle.color);
  if (!fg) return null;

  // Background = nearest covering fill, walking up from the icon. A
  // background-image encountered first means the icon sits over media.
  let node: Element | null = icon?.parentElement ?? el;
  let bg: RGB | null = null;
  while (node && node !== document.documentElement) {
    const style = getComputedStyle(node);
    if (
      style.backgroundImage &&
      style.backgroundImage !== "none" &&
      !style.backgroundImage.includes("gradient")
    ) {
      return { indeterminate: true };
    }
    const own = parse(style.backgroundColor);
    if (own && own.a > 0.9) {
      bg = own;
      break;
    }
    for (const pseudo of ["::before", "::after"]) {
      const pseudoStyle = getComputedStyle(node, pseudo);
      if (pseudoStyle.content && pseudoStyle.content !== "none") {
        const pseudoBg = parse(pseudoStyle.backgroundColor);
        const covering =
          pseudoStyle.transform === "none" ||
          !/(matrix\(0[,)]|scale\(0)/.test(pseudoStyle.transform);
        if (pseudoBg && pseudoBg.a > 0.9 && covering) {
          bg = pseudoBg;
          break;
        }
      }
    }
    if (bg) break;
    // A transparent fixed/sticky element floats over arbitrary page content
    // (e.g. the site header over the hero image) — its contrast can't be judged
    // statically, so treat it as indeterminate rather than measuring against
    // whatever opaque ancestor happens to sit further up the tree.
    if (
      (style.position === "fixed" || style.position === "sticky") &&
      (!own || own.a < 0.9)
    ) {
      return { indeterminate: true };
    }
    if (own && own.a > 0.4) {
      bg = own;
      break;
    }
    node = node.parentElement;
  }
  bg ??= parse(getComputedStyle(document.body).backgroundColor) ?? {
    a: 1,
    b: 15,
    g: 17,
    r: 20,
  };

  const name = (target: Element) => {
    let selector = target.tagName.toLowerCase();
    const classes = (target.getAttribute("class") ?? "")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 3);
    if (classes.length) selector += `.${classes.join(".")}`;
    const label =
      target.getAttribute("aria-label") ??
      target.getAttribute("data-icon-tooltip");
    if (label) selector += ` ["${label.slice(0, 26)}"]`;
    return selector.slice(0, 130);
  };

  const rounded = (color: RGB) =>
    `rgb(${Math.round(color.r)},${Math.round(color.g)},${Math.round(color.b)})`;
  return {
    bg: rounded(bg),
    c: Math.round(contrast(compose(fg, bg), bg) * 100) / 100,
    fg: rounded(fg),
    sel: name(el),
  };
}

async function scanRoute(
  ctx: BrowserContext,
  route: string,
  theme: ThemeName,
  options: CliOptions,
  collapses: Collapse[],
) {
  const page = await ctx.newPage();
  try {
    await page.goto(route, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle", { timeout: 6_000 }).catch(noop);
    await page
      .evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += innerHeight) {
          scrollTo(0, y);
          await new Promise((resolve) => setTimeout(resolve, 40));
        }
        scrollTo(0, 0);
      })
      .catch(noop);
    await page.waitForTimeout(300);

    const handles = await page.$$(
      'a:has(svg), button:has(svg), [role="button"]:has(svg), [data-icon-tooltip]:has(svg)',
    );
    for (const handle of handles.slice(0, options.maxPerRoute)) {
      const usable = await handle
        .evaluate((el) => {
          const rect = el.getBoundingClientRect();
          const style = getComputedStyle(el);
          return (
            rect.width > 8 &&
            rect.height > 8 &&
            style.visibility !== "hidden" &&
            style.display !== "none" &&
            Number(style.opacity) > 0.1
          );
        })
        .catch(() => false);
      if (!usable) continue;
      await handle.scrollIntoViewIfNeeded({ timeout: 800 }).catch(noop);

      for (const state of ["hover", "focus"] as const) {
        try {
          if (state === "hover")
            await handle.hover({ force: true, timeout: 600 });
          else await handle.evaluate((el) => (el as HTMLElement).focus());
          await page.waitForTimeout(420); // past the ~260ms colour/fill transitions
          const measured = await (handle as ElementHandle<Element>)
            .evaluate(measureIconContrast)
            .catch(() => null);
          if (
            measured &&
            !("indeterminate" in measured) &&
            measured.c < options.failThreshold
          ) {
            collapses.push({
              bg: measured.bg,
              contrast: measured.c,
              fg: measured.fg,
              route,
              selector: measured.sel,
              state,
              theme,
            });
          }
        } catch {
          // element detached or not hoverable — ignore
        }
      }
      await page.mouse.move(1, 1).catch(noop);
    }
  } finally {
    await page.close();
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (!options.baseUrl) {
    console.error(
      "qa-interaction-contrast: --base-url <url> (or QA_BASE_URL) is required.",
    );
    process.exitCode = 1;
    return;
  }

  const collapses: Collapse[] = [];
  const browser = await chromium.launch();
  try {
    for (const theme of ["light", "dark"] as const) {
      const ctx = await browser.newContext({
        baseURL: options.baseUrl,
        colorScheme: theme,
        locale: "he-IL",
        serviceWorkers: "block",
        viewport: { height: 900, width: 1440 },
      });
      // tsx/esbuild wraps this file's functions (and their nested helpers) with
      // a `__name` call for name preservation. When Playwright serialises a
      // function into the page, those `__name(...)` calls run in the browser,
      // where the helper doesn't exist — throwing and silently failing every
      // measurement. Shim it (as a raw string so it isn't itself compiled).
      await ctx.addInitScript(
        "globalThis.__name = globalThis.__name || function (value) { return value; };",
      );
      await ctx.addInitScript(
        `try{localStorage.setItem("elysia.theme-preference","${theme}");localStorage.setItem("elysia_cookie_consent",JSON.stringify({value:"essential",updatedAt:new Date().toISOString()}))}catch(e){}`,
      );
      const queue = [...options.routes];
      await Promise.all(
        Array.from({ length: 4 }, async () => {
          while (queue.length > 0) {
            const route = queue.shift();
            if (route) await scanRoute(ctx, route, theme, options, collapses);
          }
        }),
      );
      await ctx.close();
    }
  } finally {
    await browser.close();
  }

  const seen = new Set<string>();
  const unique = collapses
    .filter((collapse) => {
      const key = `${collapse.theme}|${collapse.state}|${collapse.selector}|${collapse.contrast}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => a.contrast - b.contrast);

  if (options.outDir) {
    mkdirSync(options.outDir, { recursive: true });
    writeFileSync(
      path.join(options.outDir, "interaction-contrast.json"),
      `${JSON.stringify(
        {
          baseUrl: options.baseUrl,
          collapses: unique,
          failThreshold: options.failThreshold,
          generatedAt: new Date().toISOString(),
        },
        null,
        2,
      )}\n`,
    );
  }

  console.log(
    `Interaction-state contrast: ${options.routes.length} routes × {light,dark} × {hover,focus}, fail < ${options.failThreshold}:1`,
  );
  if (unique.length === 0) {
    console.log("PASS — no interaction-state contrast collapses.");
    return;
  }

  console.error(
    `FAIL — ${unique.length} interaction-state contrast collapse(s):`,
  );
  for (const collapse of unique) {
    console.error(
      `  [${collapse.theme}/${collapse.state} ${collapse.contrast}:1] ${collapse.route} :: ${collapse.selector}  (${collapse.fg} on ${collapse.bg})`,
    );
  }
  process.exitCode = 1;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
