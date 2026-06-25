import { describe, expect, it } from "vitest";

import { summarizeDocuments } from "./document-management";

describe("summarizeDocuments", () => {
  it("counts active/archived documents and pending signatures", () => {
    const summary = summarizeDocuments([
      { status: "ACTIVE", signatureStatus: "PENDING" },
      { status: "ACTIVE", signatureStatus: "SIGNED" },
      { status: "ARCHIVED", signatureStatus: "NONE" },
      { status: "ACTIVE", signatureStatus: "PENDING" },
    ]);

    expect(summary).toEqual({ active: 3, archived: 1, pendingSignatures: 2 });
  });

  it("is all zero with no documents", () => {
    expect(summarizeDocuments([])).toEqual({
      active: 0,
      archived: 0,
      pendingSignatures: 0,
    });
  });
});
