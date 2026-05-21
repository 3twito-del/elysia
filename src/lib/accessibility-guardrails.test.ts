import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const SOURCE_ROOTS = ["src/app", "src/components"] as const;

function listTsxFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const absolutePath = path.join(directory, entry);
    const stats = statSync(absolutePath);

    if (stats.isDirectory()) return listTsxFiles(absolutePath);
    if (!absolutePath.endsWith(".tsx")) return [];

    return [absolutePath];
  });
}

function getLineNumber(source: string, index: number) {
  return source.slice(0, index).split("\n").length;
}

describe("accessibility guardrails", () => {
  it("keeps shared focus ring tokens visible across themes", () => {
    const css = readFileSync(
      path.join(process.cwd(), "src/styles/globals.css"),
      "utf8",
    );

    expect(css).toContain("--brand-aqua-ring: rgb(66 201 190 / 34%);");
    expect(css).toContain("--glass-focus: rgb(16 24 28 / 16%);");
    expect(css).toContain("--glass-focus: rgb(226 232 236 / 42%);");
    expect(css).toContain("--glass-focus: oklch(0 0 0 / 52%);");
  });

  it("keeps literal icon-sized buttons accessible by name", () => {
    const offenders = SOURCE_ROOTS.flatMap((root) =>
      listTsxFiles(path.join(process.cwd(), root)),
    ).flatMap((file) => {
      const source = readFileSync(file, "utf8");
      const iconButtons =
        source.matchAll(
          /<Button(?=[^>]*\bsize="icon")[^>]*>[\s\S]*?<\/Button>/g,
        ) ?? [];

      return Array.from(iconButtons)
        .filter((match) => {
          const button = match[0];

          return !(
            /\baria-label=|\baria-labelledby=/.test(button) ||
            /<span[^>]*className="[^"]*\bsr-only\b/.test(button) ||
            /<CartCountLink\b/.test(button)
          );
        })
        .map((match) => ({
          file: path.relative(process.cwd(), file).replaceAll(path.sep, "/"),
          line: getLineNumber(source, match.index),
        }));
    });

    expect(offenders).toEqual([]);
  });

  it("keeps menu and select highlighted states visually distinct", () => {
    const files = [
      "src/components/ui/dropdown-menu.tsx",
      "src/components/ui/select.tsx",
    ];
    const offenders = files.filter((file) => {
      const source = readFileSync(path.join(process.cwd(), file), "utf8");

      return (
        !source.includes("data-[highlighted]:bg-accent") ||
        source.includes("focus:bg-[oklch(0.18_0_0_/_5%)]")
      );
    });

    expect(offenders).toEqual([]);
  });

  it("keeps select scroll buttons named and their icons decorative", () => {
    const source = readFileSync(
      path.join(process.cwd(), "src/components/ui/select.tsx"),
      "utf8",
    );

    expect(source).toContain('"aria-label": ariaLabel = "גלילה למעלה"');
    expect(source).toContain('"aria-label": ariaLabel = "גלילה למטה"');
    expect(source).toContain('<ChevronUpIcon aria-hidden="true" />');
    expect(source).toContain('<ChevronDownIcon aria-hidden="true" />');
  });
});
