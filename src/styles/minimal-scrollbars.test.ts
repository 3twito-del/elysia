import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

const minimalScrollPrimitiveFiles = [
  "src/components/ui/sheet.tsx",
  "src/components/ui/scroll-area.tsx",
  "src/components/ui/command.tsx",
  "src/components/ui/dropdown-menu.tsx",
  "src/components/ui/select.tsx",
  "src/components/ui/table.tsx",
] as const;

describe("minimal independent scrolling", () => {
  it("defines a thin shared scrollbar treatment", () => {
    const css = read("src/styles/globals.css");

    expect(css).toContain("--scrollbar-size: 0.375rem;");
    expect(css).toContain("--scrollbar-thumb: rgb(91 101 106 / 24%);");
    expect(css).toContain("scrollbar-width: thin;");
    expect(css).toContain("overscroll-behavior: contain;");
    expect(css).toContain("::-webkit-scrollbar-button");
    expect(css).toContain("display: none;");
  });

  it("keeps shared scroll primitives on the minimal scroll contract", () => {
    const missing = minimalScrollPrimitiveFiles
      .filter((file) => !read(file).includes("minimal-scroll"))
      .map((file) => `${file}: missing minimal-scroll`);

    expect(missing).toEqual([]);
  });
});

function read(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}
