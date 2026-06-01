import { describe, expect, it } from "vitest";

import {
  applyApprovedCopyToText,
  checkCopyMapEntries,
  extractCopyEntriesFromText,
  parseCopyMap,
  renderCopyMap,
  type CopyEntry,
} from "./site-copy";

describe("site copy tooling", () => {
  it("extracts Hebrew JSX text, attributes, strings, and templates", () => {
    const source = `
      export function Demo({ count }: { count: number }) {
        const error = "יש להזין שם מלא.";

        return (
          <main aria-label="אזור תוכן">
            <h1>טקסט ראשי</h1>
            <p>{\`נמצאו \${count} פריטים\`}</p>
            <span title="מידע נוסף">פתיחה</span>
          </main>
        );
      }
    `;

    const entries = extractCopyEntriesFromText("src/app/demo/page.tsx", source);
    const sources = entries.map((entry) => entry.source);

    expect(sources).toContain("יש להזין שם מלא.");
    expect(sources).toContain("אזור תוכן");
    expect(sources).toContain("טקסט ראשי");
    expect(sources.some((source) => source.includes("${count}"))).toBe(true);
    expect(sources).toContain("מידע נוסף");
    expect(sources).toContain("פתיחה");
  });

  it("excludes admin-editable product copy without excluding surrounding UI labels", () => {
    const source = `
      export const productDraft = {
        shortDescription: "תיאור מוצר שמנוהל באדמין",
        deliveryPromise: "מסירה שמנוהלת באדמין",
        ctaLabel: "שמירת מוצר",
      };
    `;

    const entries = extractCopyEntriesFromText(
      "src/server/services/admin-commerce.ts",
      source,
    );
    const sources = entries.map((entry) => entry.source);

    expect(sources).not.toContain("תיאור מוצר שמנוהל באדמין");
    expect(sources).not.toContain("מסירה שמנוהלת באדמין");
    expect(sources).toContain("שמירת מוצר");
  });

  it("parses rendered markdown and reports stale source text", () => {
    const [entry] = extractCopyEntriesFromText(
      "src/app/demo/page.tsx",
      "export const label = 'שמירה';",
    );

    expect(entry).toBeDefined();

    const markdown = renderCopyMap([entry as CopyEntry]);
    const parsed = parseCopyMap(markdown);
    const changedEntry = { ...(entry as CopyEntry), source: "שמירה חדשה" };
    const result = checkCopyMapEntries([changedEntry], parsed);

    expect(result.errors).toEqual([
      "Source text is out of sync for copy.src-app-demo-page.001 (src/app/demo/page.tsx:1)",
    ]);
  });

  it("reports copy-map entries whose source path no longer exists", () => {
    const [entry] = extractCopyEntriesFromText(
      "src/app/demo/page.tsx",
      "export const label = '׳©׳׳™׳¨׳”';",
    );

    expect(entry).toBeDefined();

    const markdown = renderCopyMap([
      {
        ...(entry as CopyEntry),
        id: "copy.src-app-retired-page.001",
        path: "src/app/retired/page.tsx",
      },
    ]);
    const parsed = parseCopyMap(markdown);
    const result = checkCopyMapEntries([entry as CopyEntry], parsed);

    expect(result.errors).toEqual([
      "Missing copy map entry: copy.src-app-demo-page.001 (src/app/demo/page.tsx:1)",
      "Stale copy map entry: copy.src-app-retired-page.001 (src/app/retired/page.tsx)",
      "Stale copy map source path: src/app/retired/page.tsx (copy.src-app-retired-page.001)",
    ]);
  });

  it("applies approved copy back to source text ranges", () => {
    const source = `
      export const label = "שמירה";
      export function Demo() {
        return <p>פתיחה</p>;
      }
    `;
    const entries = extractCopyEntriesFromText("src/app/demo/page.tsx", source);
    const changedEntries = entries.map((entry) => ({
      ...entry,
      approved:
        entry.source === "שמירה"
          ? "שמירה עכשיו"
          : entry.source === "פתיחה"
            ? "פתיחה עכשיו"
            : entry.approved,
    }));

    const updatedSource = applyApprovedCopyToText(source, changedEntries);

    expect(updatedSource).toContain('"שמירה עכשיו"');
    expect(updatedSource).toContain("<p>פתיחה עכשיו</p>");
  });
});
