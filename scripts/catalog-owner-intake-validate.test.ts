import { describe, expect, it } from "vitest";

import { parseCatalogOwnerIntakeValidateArgs } from "./catalog-owner-intake-validate";

describe("catalog owner intake validation CLI", () => {
  it("parses file, output directory, and strict mode", () => {
    expect(
      parseCatalogOwnerIntakeValidateArgs([
        "--file",
        "artifacts/qa/catalog-owner-intake.csv",
        "--out-dir",
        "artifacts/qa/catalog-owner-intake-validation",
        "--strict",
      ]),
    ).toEqual({
      filePath: "artifacts/qa/catalog-owner-intake.csv",
      outDir: "artifacts/qa/catalog-owner-intake-validation",
      strict: true,
    });
  });
});
