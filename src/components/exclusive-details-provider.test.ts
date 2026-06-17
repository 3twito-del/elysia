import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("exclusive details provider", () => {
  it("is mounted globally and keeps details accordions single-open", () => {
    const layout = read("src/app/layout.tsx");
    const provider = read("src/components/exclusive-details-provider.tsx");

    expect(layout).toContain(
      'import { ExclusiveDetailsProvider } from "~/components/exclusive-details-provider";',
    );
    expect(layout).toContain("<ExclusiveDetailsProvider />");
    expect(provider).toContain('document.addEventListener("toggle"');
    expect(provider).toContain('document.removeEventListener("toggle"');
    expect(provider).toContain("closePeerDetails, true");
    expect(provider).toContain(
      "details.parentElement === activeDetails.parentElement",
    );
    expect(provider).toContain("[data-exclusive-details-group]");
    expect(provider).toContain("[data-footer-nav-disclosure]");
  });
});
