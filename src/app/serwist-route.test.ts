import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("Serwist route", () => {
  it("does not duplicate automatically discovered public icon assets in the precache list", () => {
    const source = read("src/app/serwist/[path]/route.ts");

    expect(source).toContain("additionalPrecacheEntries");
    expect(source).toContain('url: "/offline"');
    expect(source).not.toContain("/pwa/icons/");
  });
});

function read(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}
