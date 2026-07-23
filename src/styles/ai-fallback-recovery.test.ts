import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("AI fallback recovery UI", () => {
  it("keeps fallback recovery routed to existing discovery and service paths", () => {
    const recovery = read("src/app/ai/_components/ai-fallback-recovery.tsx");
    const fallback = read("src/app/ai/_lib/ai-fallback.ts");

    expect(recovery).toContain(
      "data-testid={`ai-fallback-recovery-${source}`}",
    );
    expect(recovery).toContain('href: "/search"');
    expect(recovery).toContain('href: "/category/rings"');
    expect(recovery).toContain('href: "/size-guide"');
    expect(recovery).toContain("createAiFallbackServiceHref");
    expect(fallback).toContain('topic: "general"');
  });

  it("uses the shared fallback in the elys-ai chat", () => {
    const stylistChat = read("src/app/elys-ai/_components/elys-ai-chat.tsx");

    expect(stylistChat).toContain("AiFallbackRecovery");
    expect(stylistChat).toContain('source="elys-ai"');
  });

  it("keeps benchmark support evidence available after backlog replacement", () => {
    const benchmark = read("docs/QA_EVIDENCE.md");

    expect(benchmark).toContain("Weighted Score`: 12.0");
    expect(benchmark).toContain("Decision`: Supported");
    expect(benchmark).toContain("Cartier");
    expect(benchmark).toContain("Boucheron");
  });
});

function read(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}
