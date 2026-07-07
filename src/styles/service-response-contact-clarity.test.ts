import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("service response and contact clarity", () => {
  it("keeps the I-026 benchmark gate attached to the service implementation", () => {
    const benchmark = read(
      "docs/qa/service-response-contact-clarity-benchmark.md",
    );

    expect(benchmark).toContain("`Backlog Item`: I-026");
    expect(benchmark).toContain("`Weighted Score`: 16.5");
    expect(benchmark).toContain("`Decision`: Supported");
    expect(benchmark).toContain("phone, email");
  });

  it("keeps service response expectations compact and channel-backed", () => {
    const servicePage = read("src/app/service/page.tsx");

    expect(servicePage).toContain("const serviceResponseExpectations");
    expect(servicePage).toContain(
      'data-testid="service-response-expectations"',
    );
    expect(servicePage).toContain("מענה עד יום עסקים");
    expect(servicePage).toContain("פרטים שכדאי לצרף");
    expect(servicePage).toContain("href={contact.phoneHref}");
    expect(servicePage).toContain("mailto:${contact.email}");
    expect(servicePage).toContain('data-testid="service-whatsapp-link"');
    expect(servicePage).toContain("contact.whatsappHref");
    expect(servicePage).toContain("עד 24 שעות");
    expect(servicePage).not.toContain("LiveChat");
  });

  it("shows selected-topic guidance inside the existing service form", () => {
    const serviceForm = read(
      "src/app/service/_components/service-request-form.tsx",
    );

    expect(serviceForm).toContain(
      'const topicGuidanceId = "service-topic-guidance"',
    );
    expect(serviceForm).toContain("selectedTopicDescription");
    expect(serviceForm).toContain(
      "onChange={(event) => setSelectedTopicSlug(event.target.value)}",
    );
    expect(serviceForm).toContain(
      'aria-describedby={`${getFieldErrorId("topicSlug")} ${topicGuidanceId}`}',
    );
    expect(serviceForm).toContain('data-testid="service-topic-guidance"');
    expect(serviceForm).toContain('aria-live="polite"');
    expect(serviceForm).toContain("בחרי את הנושא הקרוב ביותר");
  });

  it("confirms response expectations with a clear business-day SLA", () => {
    const serviceActions = read("src/app/service/actions.ts");
    const serviceForm = read(
      "src/app/service/_components/service-request-form.tsx",
    );

    expect(serviceActions).toContain("יחזור עד 24 שעות ביום עסקים");
    expect(serviceForm).toContain("שמרי את המספר להמשך מעקב");
    expect(serviceForm).toContain("עד 24");
    expect(serviceForm).toContain("שעות ביום עסקים");
  });
});

function read(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}
