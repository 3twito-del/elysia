import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

describe("AI elements accessibility guardrails", () => {
  it("keeps the conversation log named and announced politely", () => {
    const source = readSource("src/components/ai-elements/conversation.tsx");

    expect(source).toContain('"aria-label": ariaLabel = "שיחת AI"');
    expect(source).toContain("aria-label={ariaLabel}");
    expect(source).toContain('aria-live="polite"');
    expect(source).toContain('aria-relevant="additions text"');
    expect(source).toContain('role="log"');
  });

  it("keeps icon-only conversation controls named with decorative icons hidden", () => {
    const source = readSource("src/components/ai-elements/conversation.tsx");

    expect(source).toContain('aria-label="גלילה לתחתית השיחה"');
    expect(source).toContain(
      '<ArrowDownIcon aria-hidden="true" className="size-4" />',
    );
    expect(source).toContain('aria-label="הורדת השיחה"');
    expect(source).toContain(
      '<DownloadIcon aria-hidden="true" className="size-4" />',
    );
  });

  it("keeps shared AI element defaults localized", () => {
    const source = readSource("src/components/ai-elements/conversation.tsx");

    expect(source).not.toMatch(/No messages yet|Start a conversation/);
    expect(source).toContain('title = "אין הודעות עדיין"');
    expect(source).toContain(
      'description = "התחילו שיחה כדי לראות כאן הודעות"',
    );
    expect(source).toContain('? "משתמש"');
    expect(source).toContain('? "עוזר"');
  });

  it("keeps prompt icon buttons accessible when only a tooltip is provided", () => {
    const source = readSource("src/components/ai-elements/prompt-input.tsx");

    expect(source).toContain("const inferredAriaLabel =");
    expect(source).toContain("aria-label={ariaLabel ?? inferredAriaLabel}");
    expect(source).toContain('"aria-label": ariaLabel = "פתיחת פעולות קלט"');
  });

  it("keeps stylist action icons decorative", () => {
    const source = readSource("src/app/stylist/_components/stylist-chat.tsx");

    expect(source).toContain('<Send aria-hidden="true" className="size-4" />');
    expect(source).toContain('<Check aria-hidden="true" className="size-4" />');
    expect(source).toContain('<X aria-hidden="true" className="size-4" />');
  });
});

function readSource(relativePath: string) {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}
