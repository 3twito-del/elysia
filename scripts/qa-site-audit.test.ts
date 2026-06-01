import { describe, expect, it } from "vitest";

import {
  consoleErrorBudget,
  isIgnorableConsoleError,
  qaArtifactStandard,
} from "./qa-site-audit";

describe("QA site audit contracts", () => {
  it("standardizes audit artifacts and required metadata", () => {
    expect(qaArtifactStandard.root).toBe("artifacts/qa");
    expect(qaArtifactStandard.directoryPattern).toContain("<iso-timestamp>");
    expect(qaArtifactStandard.files).toEqual(
      expect.arrayContaining([
        "qa-artifact-manifest.json",
        "route-inventory.json",
        "route-inventory.md",
        "site-audit.json",
        "site-audit.md",
        "design-review.md",
      ]),
    );
    expect(qaArtifactStandard.requiredMetadata).toEqual(
      expect.arrayContaining([
        "generatedAt",
        "baseUrl",
        "browsers",
        "viewports",
        "routeSet",
        "repeats",
        "screenshotMode",
      ]),
    );
  });

  it("keeps production console errors at a zero-error budget", () => {
    expect(consoleErrorBudget.production).toBe("zero-console-errors");
    expect(
      isIgnorableConsoleError(
        "Download the React DevTools for a better development experience",
        "https://elysia-jewellery.com",
      ),
    ).toBe(false);
    expect(
      isIgnorableConsoleError(
        "Download the React DevTools for a better development experience",
        "http://localhost:3000",
      ),
    ).toBe(true);
    expect(
      isIgnorableConsoleError(
        "TypeError: checkout failed",
        "http://localhost:3000",
      ),
    ).toBe(false);
  });
});
