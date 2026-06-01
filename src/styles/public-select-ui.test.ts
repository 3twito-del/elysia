import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("public select UI", () => {
  it("uses the bespoke select surface for public search filters", () => {
    const searchControls = read("src/app/search/_components/search-controls.tsx");
    const css = read("src/styles/globals.css");

    expect(searchControls).not.toContain("<select");
    expect(searchControls).not.toContain("SelectTrigger");
    expect(searchControls).not.toContain("SelectContent");
    expect(searchControls).toContain("publicSelectEmptyValue");
    expect(searchControls).toContain('className="public-select-shell"');
    expect(searchControls).toContain('className="public-select-content"');
    expect(searchControls).toContain('className="public-select-backdrop"');
    expect(searchControls).toContain('aria-haspopup="listbox"');
    expect(searchControls).toContain('role="listbox"');
    expect(searchControls).toContain('role="option"');
    expect(searchControls).toContain('type="hidden" value={currentValue}');
    expect(read("src/components/ui/select.tsx")).not.toContain(
      'data-[size=field]:h-11',
    );
    expect(css).toContain(".public-select-shell");
    expect(css).toContain(".public-select-trigger");
    expect(css).toContain(".public-select-content");
    expect(css).toContain(".public-select-option");
    expect(css).not.toContain("width: var(--radix-select-trigger-width);");
    expect(css).toContain("top: calc(100% + 0.375rem);");
    expect(css).toContain("width: 100%;");
    expect(css).toContain("height: 2.75rem;");
    expect(css).toContain('[aria-selected="true"]');
  });
});

function read(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}
