import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("service topic routing and attachment review", () => {
  it("keeps benchmark support evidence available", () => {
    const benchmark = read(
      "docs/QA_EVIDENCE.md",
    );

    expect(benchmark).toContain("I-040");
    expect(benchmark).toContain("Weighted Score`: 16.5");
    expect(benchmark).toContain("Decision`: Supported");
    expect(benchmark).toContain("Cartier");
    expect(benchmark).toContain("Tiffany");
  });

  it("adds selected-topic routing review inside the existing service form", () => {
    const serviceForm = read(
      "src/app/service/_components/service-request-form.tsx",
    );

    expect(serviceForm).toContain("selectedTopicLabel");
    expect(serviceForm).toContain('data-testid="service-topic-routing-review"');
    expect(serviceForm).toContain('data-testid="service-topic-guidance"');
    expect(serviceForm).toContain(
      "onChange={(event) => setSelectedTopicSlug(event.target.value)}",
    );
    expect(
      indexOf(serviceForm, 'data-testid="service-topic-guidance"'),
    ).toBeLessThan(
      indexOf(serviceForm, 'data-testid="service-topic-routing-review"'),
    );
  });

  it("adds attachment review without changing validation limits", () => {
    const serviceForm = read(
      "src/app/service/_components/service-request-form.tsx",
    );
    const validation = read("src/lib/service-validation.ts");

    expect(serviceForm).toContain("selectedAttachmentCount");
    expect(serviceForm).toContain("setSelectedAttachmentCount");
    expect(serviceForm).toContain('data-testid="service-attachment-review"');
    expect(serviceForm).toContain("event.currentTarget.files?.length ?? 0");
    expect(serviceForm).toContain("attachmentPolicy.maxFiles");
    expect(serviceForm).toContain("maxFileSizeMb");
    expect(validation).toContain("maxServiceRequestFiles = 5");
    expect(validation).toContain("10 * 1024 * 1024");
  });
});

function read(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

function indexOf(source: string, pattern: string) {
  const index = source.indexOf(pattern);

  expect(index, pattern).toBeGreaterThanOrEqual(0);

  return index;
}
