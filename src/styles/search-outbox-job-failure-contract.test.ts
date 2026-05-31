import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("search reindex and outbox job failure contract", () => {
  it("keeps reindex and outbox API failures behind shared redacted helpers", () => {
    const reindexRoute = read("src/app/api/search/reindex/route.ts");
    const outboxRoute = read("src/app/api/jobs/outbox/route.ts");

    expect(reindexRoute).toContain(
      'serviceUnavailableJson("Search reindex provider is unavailable.")',
    );
    expect(reindexRoute).toContain(
      'serviceUnavailableJson("Search reindex audit is unavailable.")',
    );
    expect(reindexRoute).toContain("audit: {");

    expect(outboxRoute).toContain(
      'serviceUnavailableJson("Outbox job processor is unavailable.")',
    );
    expect(outboxRoute).toContain("createOutboxJobSummary(result)");
    expect(outboxRoute).toContain('"retryable-failures"');
  });

  it("keeps provider-backed job errors sanitized before admin storage", () => {
    const jobsService = read("src/server/services/jobs.ts");
    const integrationsPage = read("src/app/admin/integrations/page.tsx");

    expect(jobsService).toContain("getPublicOutboxJobFailureMessage");
    expect(jobsService).toContain("lastError: publicMessage");
    expect(jobsService).not.toContain("lastError: message");

    expect(integrationsPage).toContain("outboxStatusRecoveryCopy");
    expect(integrationsPage).toContain("jobRunStatusRecoveryCopy");
    expect(integrationsPage).toContain("Recovery");
  });
});

const root = process.cwd();

function read(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}
