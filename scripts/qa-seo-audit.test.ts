import { afterEach, describe, expect, it, vi } from "vitest";

import { runSeoAudit } from "./qa-seo-audit";

function htmlFor(title: string, description: string) {
  return `<html><head><title>${title}</title><meta name="description" content="${description}"/><link rel="canonical" href="https://example.com/x"/></head><body></body></html>`;
}

describe("qa-seo-audit", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("passes when every real route has a unique title and description", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        const path = new URL(url).pathname;

        return {
          status: 200,
          text: async () => htmlFor(`Title for ${path}`, `Description for ${path}`),
        } as Response;
      }),
    );

    const audit = await runSeoAudit("http://localhost:3000");

    expect(audit.ok).toBe(true);
    expect(audit.duplicateTitles).toHaveLength(0);
    expect(audit.duplicateDescriptions).toHaveLength(0);
    expect(audit.missingTitle).toHaveLength(0);
  });

  it("fails when two real (200-status) routes share a title or description", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        return {
          status: 200,
          text: async () => htmlFor("Same Title", "Same description"),
        } as Response;
      }),
    );

    const audit = await runSeoAudit("http://localhost:3000");

    expect(audit.ok).toBe(false);
    expect(audit.duplicateTitles.length).toBeGreaterThan(0);
    expect(audit.duplicateDescriptions.length).toBeGreaterThan(0);
  });

  it("does not count shared fallback metadata on 404 routes as a duplicate-metadata failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        const path = new URL(url).pathname;
        // Every real route gets unique metadata; every not-found route falls
        // back to the same generic site default -- exactly what a real
        // Next.js not-found response does, and not a bug to flag.
        const isProduct = path.startsWith("/product/");

        return {
          status: isProduct ? 404 : 200,
          text: async () =>
            isProduct
              ? htmlFor("Elysia", "Site default description")
              : htmlFor(`Title for ${path}`, `Description for ${path}`),
        } as Response;
      }),
    );

    const audit = await runSeoAudit("http://localhost:3000");

    expect(audit.ok).toBe(true);
    expect(audit.unexpectedStatus.length).toBeGreaterThan(0);
  });

  it("flags a route missing a title, description, or canonical", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        return {
          status: 200,
          text: async () =>
            '<html><head></head><body>no metadata here</body></html>',
        } as Response;
      }),
    );

    const audit = await runSeoAudit("http://localhost:3000");

    expect(audit.ok).toBe(false);
    expect(audit.missingTitle.length).toBeGreaterThan(0);
    expect(audit.missingDescription.length).toBeGreaterThan(0);
    expect(audit.missingCanonical.length).toBeGreaterThan(0);
  });
});
