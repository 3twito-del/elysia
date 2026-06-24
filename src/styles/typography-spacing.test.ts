import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();
const sourceRoots = ["src/app", "src/components", "src/styles"].map((dir) =>
  path.join(root, dir),
);
const allowedTrackingUtilities = new Map([
  ["src/components/ui/command.tsx", ["tracking-widest"]],
  ["src/components/ui/dropdown-menu.tsx", ["tracking-widest"]],
]);

describe("public typography spacing guardrails", () => {
  it("uses a rounded Hebrew UI font while keeping the graphic logo separate", () => {
    const layout = read("src/app/layout.tsx");
    const css = read("src/styles/globals.css");
    const home = read("src/app/page.tsx");
    const adminShell = read("src/app/admin/_components/admin-shell.tsx");

    expect(layout).not.toContain("next/font/google");
    expect(layout).not.toContain("Noto_Sans_Hebrew");
    expect(layout).not.toContain('variable: "--font-noto-hebrew"');
    expect(css).toContain("--font-hebrew-sans");
    expect(css).toContain("--font-rubik:");
    expect(css).toContain("var(--font-rubik)");
    expect(css).toContain("--font-cormorant-garamond:");
    expect(css).toContain("--font-rounded-heading:");
    expect(css).toContain('"Segoe UI Rounded"');
    expect(css).toContain('"Varela Round"');
    expect(css).toContain("--font-latin-brand");
    expect(css).toContain("var(--font-rounded-heading);");
    expect(css).toContain('--font-sans:\n    "Rubik"');
    expect(css).toContain('"Arial Hebrew"');
    expect(css).toContain("font-family: var(--font-hebrew-sans);");
    expect(css).toContain("font-family: var(--font-rounded-heading);");
    expect(css).toContain(".storefront-hero-statement");
    expect(css).toContain(".storefront-hero-title");
    expect(home).toContain('const homeHeroTitle = "Timeless Elegance";');
    expect(home).toContain("getHeroTextDirection(homeHeroTitle)");
    expect(home).toContain("data-hero-copy-direction={homeHeroDirection}");
    expect(home).toContain("dir={homeHeroDirection}");
    expect(home).toMatch(/data-testid="home-hero-statement"[\s\S]*dir="auto"/);
    expect(home).toMatch(
      /data-testid="home-hero-primary-cta"[\s\S]*dir="auto"/,
    );
    expect(home).toContain("dir={getHeroTextDirection(actionLabel)}");
    expect(home).not.toContain("text-right");
    expect(home).not.toContain('<h1 className="sr-only">Elysia</h1>');
    expect(home).not.toContain("home-hero-wordmark");
    expect(adminShell).toContain("admin-brand-mark");
  });

  it("defines shared spacing tokens for page, section, panel, card, and form surfaces", () => {
    const css = read("src/styles/globals.css");
    const card = read("src/components/ui/card.tsx");
    const adminShell = read("src/app/admin/_components/admin-shell.tsx");

    [
      "--ui-page-x",
      "--ui-page-x-wide",
      "--ui-section-y",
      "--ui-section-y-tight",
      "--ui-section-y-wide",
      "--ui-panel-padding",
      "--ui-card-padding",
      "--ui-card-padding-tight",
      "--ui-form-gap",
    ].forEach((token) => expect(css).toContain(token));

    expect(card).toContain("py-[var(--ui-card-padding)]");
    expect(card).toContain("p-[var(--ui-card-padding)]");
    expect(adminShell).toContain("px-[var(--ui-page-x)]");
    expect(adminShell).toContain("py-[var(--ui-section-y)]");
  });

  it("balances public text wrapping to avoid orphan words and overflow", () => {
    const css = read("src/styles/globals.css");

    expect(css).toContain("text-wrap: pretty;");
    expect(css).toContain("text-wrap: balance;");
    expect(css).toContain("overflow-wrap: anywhere;");
    expect(css).toContain('[data-slot="button"]');
    expect(css).toContain(":where(h1, h2, h3, h4, h5, h6, legend)");
  });

  it("keeps public text letter spacing normal except documented shortcut labels", () => {
    const violations = sourceRoots
      .flatMap(walk)
      .filter(isPublicSource)
      .flatMap((file) => {
        const source = readFileSync(file, "utf8");
        const relativePath = toPosixPath(path.relative(root, file));
        const allowed = allowedTrackingUtilities.get(relativePath) ?? [];

        return [
          ...findTrackingUtilityViolations(source, allowed).map(
            (value) => `${relativePath} uses ${value}`,
          ),
          ...findLetterSpacingViolations(source).map(
            (value) => `${relativePath} uses ${value}`,
          ),
        ];
      });

    expect(violations).toEqual([]);
  });
});

function read(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

function findTrackingUtilityViolations(source: string, allowed: string[]) {
  return Array.from(
    source.matchAll(/\btracking-(?!normal\b)[\w-[\]./]+/g),
    (match) => match[0],
  ).filter((utility) => !allowed.includes(utility));
}

function findLetterSpacingViolations(source: string) {
  return Array.from(
    source.matchAll(/letter-spacing\s*:\s*([^;]+);/g),
    (match) => match[0],
  ).filter((declaration) => !/letter-spacing\s*:\s*0\s*;/.test(declaration));
}

function walk(dir: string): string[] {
  if (!statSync(dir, { throwIfNoEntry: false })?.isDirectory()) return [];

  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(dir, entry.name);

    if (entry.isDirectory()) return walk(entryPath);
    if (entry.isFile()) return [entryPath];

    return [];
  });
}

function isPublicSource(file: string) {
  if (file.includes(`${path.sep}src${path.sep}app${path.sep}admin`)) {
    return false;
  }

  return /\.(?:css|tsx?)$/.test(file) && !file.includes(".test.");
}

function toPosixPath(filePath: string) {
  return filePath.split(path.sep).join("/");
}
