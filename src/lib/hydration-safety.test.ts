import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const CLIENT_SURFACE_ROOTS = ["src/app", "src/components"] as const;

function listSourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const absolutePath = path.join(directory, entry);
    const stats = statSync(absolutePath);

    if (stats.isDirectory()) return listSourceFiles(absolutePath);
    if (!absolutePath.endsWith(".tsx")) return [];

    return [absolutePath];
  });
}

describe("hydration safety", () => {
  it("does not initialize client-rendered state from the wall clock", () => {
    const unsafeInitializers =
      /\buse(?:State|Memo|Ref)(?:<[^>]+>)?\(\s*(?:\(\)\s*=>\s*)?(?:Date\.now\(\)|new Date\()/;
    const offenders = CLIENT_SURFACE_ROOTS.flatMap((root) =>
      listSourceFiles(path.join(process.cwd(), root)),
    ).filter((file) => {
      const source = readFileSync(file, "utf8");

      return source.includes('"use client"') && unsafeInitializers.test(source);
    });

    expect(offenders.map((file) => path.relative(process.cwd(), file))).toEqual(
      [],
    );
  });
});
