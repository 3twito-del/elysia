import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { getQaRouteInventory } from "../../scripts/qa-route-inventory";
import {
  PUBLIC_STRUCTURE_BENCHMARK_TOTAL_WEIGHT,
  PUBLIC_STRUCTURE_KEEP_THRESHOLD,
  PUBLIC_STRUCTURE_BENCHMARK_V4,
  anchorCtaPolicy,
  publicStructureBenchmarkCorpus,
  publicStructurePolicy,
  routeStructurePolicy,
  shouldRenderStructuralElement,
} from "./public-structure-policy";

describe("public structure benchmark v4 policy", () => {
  it("locks the benchmark artifact, corpus, and threshold", () => {
    expect(PUBLIC_STRUCTURE_BENCHMARK_V4).toBe("PUBLIC_STRUCTURE_BENCHMARK_V4");
    expect(publicStructureBenchmarkCorpus).toHaveLength(30);
    expect(
      publicStructureBenchmarkCorpus.reduce(
        (total, site) => total + site.weight,
        0,
      ),
    ).toBe(PUBLIC_STRUCTURE_BENCHMARK_TOTAL_WEIGHT);
    expect(PUBLIC_STRUCTURE_KEEP_THRESHOLD).toBe(18.75);
  });

  it("removes adjacent same-page hero anchor CTAs", () => {
    expect(publicStructurePolicy.adjacentSamePageHeroCta.status).toBe("remove");
    expect(anchorCtaPolicy.samePageHeroAnchor.status).toBe("remove");
    expect(anchorCtaPolicy.adjacentSectionJump.status).toBe("remove");
    expect(shouldRenderStructuralElement("adjacentSamePageHeroCta")).toBe(
      false,
    );
  });

  it("keeps PLP, gifts, PDP, checkout, and legal archetypes explicit", () => {
    expect(routeStructurePolicy["/gifts"].archetype).toBe("plp");
    expect(routeStructurePolicy["/category/[slug]"].archetype).toBe("plp");
    expect(routeStructurePolicy["/search"].archetype).toBe("plp");
    expect(routeStructurePolicy["/product/[slug]"].archetype).toBe("pdp");
    expect(routeStructurePolicy["/checkout"].archetype).toBe("checkout");
    expect(routeStructurePolicy["/terms"].archetype).toBe("legal");
    expect(routeStructurePolicy["/privacy"].archetype).toBe("legal");
    expect(routeStructurePolicy["/accessibility"].archetype).toBe("legal");
  });

  it("keeps mandatory floating chrome exceptions explicit", () => {
    expect(publicStructurePolicy.floatingChromeNoCommerceOverlap.status).toBe(
      "mandatory",
    );
    expect(
      publicStructurePolicy.floatingChromeNoCommerceOverlap
        .mandatoryExceptionReason,
    ).toBe("accessibility");
  });

  it("keeps public header split actions and sheet active states restrained", () => {
    const header = read("src/components/site-header.tsx");
    const mobileNav = read("src/components/mobile-nav.tsx");

    expect(header).toContain('triggerLabel="תפריט"');
    expect(header).toContain('triggerMode="label"');
    expect(header).toContain('aria-label="חיפוש"');
    expect(header).toContain('aria-label="צרו קשר"');
    expect(header).toContain('href="/account#account-wishlist"');
    expect(header).not.toContain("desktopNavItems.map");
    expect(header).not.toContain("<nav");
    expect(header).not.toContain('aria-current="page"');
    expect(header).not.toContain("bg-secondary");
    expect(header).not.toContain("shadow-");

    expect(mobileNav).toContain('aria-current={isActive ? "page" : undefined}');
    expect(mobileNav).toContain("currentPathname === item.href");
    expect(mobileNav).toContain("currentPathname.startsWith(`${item.href}/`)");
    expect(mobileNav).toContain("after:h-px");
    expect(mobileNav).not.toContain('aria-current="page"');
  });

  it("keeps header and mobile navigation labels unique and route-backed", () => {
    const header = read("src/components/site-header.tsx");
    const mobileNav = read("src/components/mobile-nav.tsx");
    const routeInventory = getQaRouteInventory({ includeAllProducts: true });
    const knownRoutes = new Set(
      routeInventory.flatMap((route) => [route.path, route.template]),
    );
    const headerLinks = extractConstHrefLabels(header, "navItems");
    const mobileSections = [
      extractConstHrefLabels(mobileNav, "quickActions"),
      extractConstHrefLabels(mobileNav, "serviceActions"),
      extractConstHrefLabels(mobileNav, "spotlightActions"),
    ];

    expect(headerLinks.map((item) => item.href)).toEqual([
      "/category/rings",
      "/category/necklaces",
      "/category/earrings",
      "/category/bracelets",
      "/gifts",
      "/about",
      "/service",
    ]);
    expect(header).toContain('triggerLabel="תפריט"');
    expect(mobileNav).toContain("const catalogItems = items.slice(0, 4)");
    expect(mobileNav).toContain(".slice(5)");

    for (const section of [headerLinks, ...mobileSections]) {
      expect(new Set(section.map((item) => item.href)).size).toBe(
        section.length,
      );
      expect(new Set(section.map((item) => item.label)).size).toBe(
        section.length,
      );
      expect(section.every((item) => knownRoutes.has(item.href))).toBe(true);
      expect(section.every((item) => !/[A-Za-z]/u.test(item.label))).toBe(true);
    }
  });

  it("keeps mobile navigation close and focus recovery delegated to the sheet primitive", () => {
    const mobileNav = read("src/components/mobile-nav.tsx");
    const sheet = read("src/components/ui/sheet.tsx");

    expect(mobileNav).toContain('data-testid="mobile-nav-trigger"');
    expect(mobileNav).toContain("closeOnMediaQuery");
    expect(mobileNav).toContain("onOpenChange={setOpen}");
    expect(mobileNav).toContain("open={open}");
    expect(mobileNav).toContain("<SheetTrigger asChild>");
    expect(mobileNav).toContain("<SheetClose asChild>");
    expect(mobileNav).toContain("const closeNav = () => setOpen(false)");
    expect(mobileNav).toContain("onClick={closeNav}");
    expect(mobileNav).toContain('href: "/search"');
    expect(mobileNav).toContain('href: "/service"');
    expect(mobileNav).toContain('href: "/account"');
    expect(mobileNav).toContain('href: "/checkout"');

    expect(sheet).toContain("Dialog as SheetPrimitive");
    expect(sheet).toContain("<SheetPrimitive.Root");
    expect(sheet).toContain("onOpenChange={handleOpenChange}");
    expect(sheet).toContain("<SheetPrimitive.Trigger");
    expect(sheet).toContain("<SheetPrimitive.Close");
    expect(sheet).toContain("popup-overlay fixed inset-0");
  });
});

function read(relativePath: string) {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

function extractConstHrefLabels(source: string, constName: string) {
  const match = new RegExp(
    `const ${constName}(?::[^=]+)? = \\[([\\s\\S]*?)\\](?: as const)?;`,
    "u",
  ).exec(source);

  expect(match?.[1]).toBeDefined();

  return Array.from(
    (match?.[1] ?? "").matchAll(
      /\{\s*href:\s*"(?<href>[^"]+)",\s*label:\s*"(?<label>[^"]+)"/gu,
    ),
  ).map((entry) => ({
    href: entry.groups?.href ?? "",
    label: entry.groups?.label ?? "",
  }));
}
