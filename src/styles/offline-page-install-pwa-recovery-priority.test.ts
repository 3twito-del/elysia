import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("offline page install and PWA recovery priority", () => {
  it("keeps benchmark support evidence available", () => {
    const benchmark = read("docs/QA_EVIDENCE.md");

    expect(benchmark).toContain("I-037");
    expect(benchmark).toContain("Weighted Score`: 12.0");
    expect(benchmark).toContain("Decision`: Supported");
    expect(benchmark).toContain("Cartier");
    expect(benchmark).toContain("Tiffany");
  });

  it("keeps offline install context realistic and route-backed", () => {
    const offlinePage = read("src/app/offline/page.tsx");

    expect(offlinePage).toContain('data-testid="offline-install-context"');
    expect(offlinePage).toContain('data-testid="offline-recovery-actions"');
    expect(offlinePage).toContain('href="/search"');
    expect(offlinePage).not.toContain('href="/gifts"');
    expect(offlinePage).toContain('href="/size-guide"');
    expect(offlinePage).toContain('href="/service"');
    expect(offlinePage).toContain('href="/"');
    expect(offlinePage).not.toContain('href="/checkout"');

    expect(indexOf(offlinePage, 'href="/search"')).toBeLessThan(
      indexOf(offlinePage, 'href="/size-guide"'),
    );
    expect(indexOf(offlinePage, 'href="/size-guide"')).toBeLessThan(
      indexOf(offlinePage, 'href="/service"'),
    );
    expect(indexOf(offlinePage, 'href="/service"')).toBeLessThan(
      indexOf(offlinePage, 'href="/"'),
    );
  });

  it("keeps manifest shortcuts aligned to offline recovery priority", () => {
    const manifest = read("src/app/manifest.ts");

    expect(
      indexOf(manifest, 'url: "/search?source=pwa-shortcut"'),
    ).toBeLessThan(indexOf(manifest, 'url: "/size-guide?source=pwa-shortcut"'));
    expect(manifest).not.toContain('url: "/gifts?source=pwa-shortcut"');
    expect(
      indexOf(manifest, 'url: "/size-guide?source=pwa-shortcut"'),
    ).toBeLessThan(indexOf(manifest, 'url: "/service?source=pwa-shortcut"'));
    expect(manifest).not.toContain('url: "/checkout?source=pwa-shortcut"');
  });
});

function read(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

function indexOf(source: string, pattern: string) {
  const index = source.indexOf(pattern);

  expect(index, pattern).toBeGreaterThanOrEqual(0);

  return index;
}
