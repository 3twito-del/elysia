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
    expect(benchmark).toContain(
      "Keep phone, email, and the form as the only visible contact paths",
    );
  });

  it("keeps service response expectations compact and channel-backed", () => {
    const servicePage = read("src/app/service/page.tsx");

    expect(servicePage).toContain("const serviceResponseExpectations");
    expect(servicePage).toContain(
      'data-testid="service-response-expectations"',
    );
    expect(servicePage).toContain("חוזרים בדרך שנוחה לך");
    expect(servicePage).toContain("פרטים שמקצרים את הדרך");
    expect(servicePage).toContain("href={phoneHref}");
    expect(servicePage).toContain("mailto:${profile.settings.serviceEmail}");
    expect(servicePage).not.toContain("wa.me");
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
    expect(serviceForm).toContain("בחרו את הנושא הכי קרוב");
  });

  it("confirms response expectations without adding a hard SLA", () => {
    const serviceActions = read("src/app/service/actions.ts");
    const serviceForm = read(
      "src/app/service/_components/service-request-form.tsx",
    );

    expect(serviceActions).toContain("יחזור לאחר בדיקת הפרטים");
    expect(serviceForm).toContain("שמרו את המספר לעדכון");
    expect(serviceActions).not.toContain("24 שעות");
    expect(serviceForm).not.toContain("24 שעות");
  });
});

function read(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}
