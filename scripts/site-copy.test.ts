import { describe, expect, it } from "vitest";

import {
  applyApprovedCopyToText,
  checkCopyMapEntries,
  extractCopyEntriesFromText,
  mergeEntriesWithExisting,
  parseCopyMap,
  renderCopyMap,
  type CopyEntry,
} from "./site-copy";

function entryBySource(entries: CopyEntry[], source: string) {
  const entry = entries.find((candidate) => candidate.source === source);

  expect(entry).toBeDefined();

  return entry!;
}

describe("site copy tooling", () => {
  it("extracts Hebrew and English JSX text, attributes, strings, metadata, and templates", () => {
    const source = `
      export const metadata = {
        title: "Elysia",
        description: "Fine jewellery for everyday light",
      };

      export function Demo({ count }: { count: number }) {
        const error = "Full name is required.";
        const hebrew = "שלום";

        return (
          <main aria-label="Content area">
            <h1>Main headline</h1>
            <p>{\`Found \${count} items\`}</p>
            <span title="More details">Opening note</span>
          </main>
        );
      }
    `;

    const entries = extractCopyEntriesFromText("src/app/demo/page.tsx", source);
    const sources = entries.map((entry) => entry.source);

    expect(sources).toContain("Elysia");
    expect(sources).toContain("Fine jewellery for everyday light");
    expect(sources).toContain("Full name is required.");
    expect(sources).toContain("שלום");
    expect(sources).toContain("Content area");
    expect(sources).toContain("Main headline");
    expect(sources).toContain("Found ${count} items");
    expect(sources).toContain("More details");
    expect(sources).toContain("Opening note");
    expect(entryBySource(entries, "Content area").kind).toBe("jsx-attribute");
    expect(
      entryBySource(entries, "Fine jewellery for everyday light").kind,
    ).toBe("metadata");
  });

  it("does not extract import paths, export paths, or TypeScript literal types", () => {
    const source = `
      import { helper } from "not-site-copy";
      export { helper } from "also-not-site-copy";

      type Tone = "quiet" | "bold";

      export const label = "Visible label";
    `;

    const entries = extractCopyEntriesFromText("src/app/demo/page.tsx", source);
    const sources = entries.map((entry) => entry.source);

    expect(sources).not.toContain("not-site-copy");
    expect(sources).not.toContain("also-not-site-copy");
    expect(sources).not.toContain("quiet");
    expect(sources).not.toContain("bold");
    expect(sources).toContain("Visible label");
  });

  it("excludes admin-editable product copy without excluding surrounding UI labels", () => {
    const source = `
      export const productDraft = {
        shortDescription: "Admin managed product description",
        deliveryPromise: "Admin managed delivery promise",
        ctaLabel: "Save product",
      };
    `;

    const entries = extractCopyEntriesFromText(
      "src/server/services/admin-commerce.ts",
      source,
    );
    const sources = entries.map((entry) => entry.source);

    expect(sources).not.toContain("Admin managed product description");
    expect(sources).not.toContain("Admin managed delivery promise");
    expect(sources).toContain("Save product");
  });

  it("renders locator metadata and parses the new and previous copy headings", () => {
    const [entry] = extractCopyEntriesFromText(
      "src/app/demo/page.tsx",
      'export const label = "Save";',
    );

    expect(entry).toBeDefined();

    const markdown = renderCopyMap([entry!]);

    expect(markdown).toContain('locator="scope:label');
    expect(markdown).toContain("#### טקסט נוכחי");
    expect(markdown).toContain("#### טקסט מוצע");

    const parsed = parseCopyMap(markdown);
    const parsedEntry = parsed.get(entry!.id);

    expect(parsedEntry?.source).toBe("Save");
    expect(parsedEntry?.approved).toBe("Save");
    expect(parsedEntry?.locator).toBe(entry!.locator);

    const previousHeadingMarkdown = markdown
      .replaceAll("טקסט נוכחי", "טקסט באתר")
      .replaceAll("טקסט מוצע", "נוסח מאושר");
    const parsedPrevious = parseCopyMap(previousHeadingMarkdown);

    expect(parsedPrevious.get(entry!.id)?.source).toBe("Save");
    expect(parsedPrevious.get(entry!.id)?.approved).toBe("Save");
  });

  it("reports stale source text", () => {
    const [entry] = extractCopyEntriesFromText(
      "src/app/demo/page.tsx",
      'export const label = "Save";',
    );

    expect(entry).toBeDefined();

    const markdown = renderCopyMap([entry!]);
    const parsed = parseCopyMap(markdown);
    const changedEntry = {
      ...entry!,
      source: "Save now",
      sourceHash: "changed",
    };
    const result = checkCopyMapEntries([changedEntry], parsed);

    expect(result.errors).toContain(
      `Source text is out of sync for ${entry!.id} (src/app/demo/page.tsx:1)`,
    );
  });

  it("reports copy-map entries whose source path no longer exists", () => {
    const [entry] = extractCopyEntriesFromText(
      "src/app/demo/page.tsx",
      'export const label = "Save";',
    );

    expect(entry).toBeDefined();

    const retiredEntry = {
      ...entry!,
      id: "copy.src-app-retired-page.label",
      path: "src/app/retired/page.tsx",
    };
    const markdown = renderCopyMap([retiredEntry]);
    const parsed = parseCopyMap(markdown);
    const result = checkCopyMapEntries([entry!], parsed);

    expect(result.errors).toContain(
      `Missing copy map entry: ${entry!.id} (src/app/demo/page.tsx:1)`,
    );
    expect(result.errors).toContain(
      "Stale copy map entry: copy.src-app-retired-page.label (src/app/retired/page.tsx)",
    );
    expect(result.errors).toContain(
      "Stale copy map source path: src/app/retired/page.tsx (copy.src-app-retired-page.label)",
    );
  });

  it("fails strict checks when proposed copy is pending", () => {
    const [entry] = extractCopyEntriesFromText(
      "src/app/demo/page.tsx",
      'export const label = "Save";',
    );

    expect(entry).toBeDefined();

    const markdown = renderCopyMap([
      {
        ...entry!,
        approved: "Save now",
      },
    ]);
    const result = checkCopyMapEntries([entry!], parseCopyMap(markdown));

    expect(result.errors).toEqual([]);
    expect(result.pendingApprovedChanges).toBe(1);
  });

  it("applies proposed copy back to source text ranges", () => {
    const source = `
      export const label = "Save";
      export function Demo() {
        return <p>Opening note</p>;
      }
    `;
    const entries = extractCopyEntriesFromText("src/app/demo/page.tsx", source);
    const changedEntries = entries.map((entry) => ({
      ...entry,
      approved:
        entry.source === "Save"
          ? "Save now"
          : entry.source === "Opening note"
            ? "Opening note updated"
            : entry.approved,
    }));

    const updatedSource = applyApprovedCopyToText(source, changedEntries);

    expect(updatedSource).toContain('"Save now"');
    expect(updatedSource).toContain("<p>Opening note updated</p>");
  });

  it("keeps template placeholders unchanged during copy:apply", () => {
    const source = "export const message = `Found ${count} items`;";
    const [entry] = extractCopyEntriesFromText("src/app/demo/page.tsx", source);

    expect(entry).toBeDefined();
    expect(entry!.source).toBe("Found ${count} items");

    const updatedSource = applyApprovedCopyToText(source, [
      {
        ...entry!,
        approved: "Showing ${count} items",
      },
    ]);

    expect(updatedSource).toBe(
      "export const message = `Showing ${count} items`;",
    );
    expect(() =>
      applyApprovedCopyToText(source, [
        {
          ...entry!,
          approved: "Showing items",
        },
      ]),
    ).toThrow("Template placeholders changed");
  });

  it("normalizes CRLF inside template entries for stable copy-map checks", () => {
    const source =
      "export const message = `Found ${format(\r\n  count,\r\n)} items`;";
    const [entry] = extractCopyEntriesFromText("src/app/demo/page.tsx", source);

    expect(entry).toBeDefined();
    expect(entry!.source).toBe("Found ${format(\n  count,\n)} items");

    const result = checkCopyMapEntries(
      [entry!],
      parseCopyMap(renderCopyMap([entry!])),
    );

    expect(result.errors).toEqual([]);
  });

  it("escapes hidden Unicode separators in locators", () => {
    const source = 'const HTML_ESCAPES = { "\\u2028": "\\\\u2028" };';
    const entries = extractCopyEntriesFromText("src/lib/json-ld.ts", source);

    expect(entries.some((entry) => entry.locator.includes("\\u2028"))).toBe(
      true,
    );
    expect(
      checkCopyMapEntries(entries, parseCopyMap(renderCopyMap(entries))).errors,
    ).toEqual([]);
  });

  it("keeps existing ids and proposed copy when a new entry is inserted earlier", () => {
    const originalSource = `
      export const copy = {
        first: "First",
        second: "Second",
      };
    `;
    const originalEntries = extractCopyEntriesFromText(
      "src/app/demo/page.tsx",
      originalSource,
    );
    const originalSecond = entryBySource(originalEntries, "Second");
    const existingMarkdown = renderCopyMap(
      originalEntries.map((entry) => ({
        ...entry,
        approved: entry.source === "Second" ? "Second revised" : entry.approved,
      })),
    );
    const nextEntries = extractCopyEntriesFromText(
      "src/app/demo/page.tsx",
      `
        export const copy = {
          inserted: "Inserted",
          first: "First",
          second: "Second",
        };
      `,
    );

    const merged = mergeEntriesWithExisting(
      nextEntries,
      parseCopyMap(existingMarkdown),
    );
    const nextSecond = entryBySource(merged, "Second");

    expect(nextSecond.id).toBe(originalSecond.id);
    expect(nextSecond.approved).toBe("Second revised");
  });
});
