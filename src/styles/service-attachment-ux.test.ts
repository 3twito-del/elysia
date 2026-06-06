import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("service attachment UX", () => {
  it("keeps attachment constraints visible and connected to the file input", () => {
    const form = read("src/app/service/_components/service-request-form.tsx");
    const validation = read("src/lib/service-validation.ts");

    expect(form).toContain(
      'const attachmentGuidanceId = "service-attachment-guidance"',
    );
    expect(form).toContain(
      'const attachmentOfflineGuidanceId = "service-attachment-offline-guidance"',
    );
    expect(form).toContain(
      "aria-describedby={`${attachmentGuidanceId} ${attachmentOfflineGuidanceId}`}",
    );
    expect(form).toContain("getServiceRequestAttachmentPolicy");
    expect(form).toContain(
      'accept={attachmentPolicy.acceptedFileTypes.join(",")}',
    );
    expect(form).toContain("attachmentPolicy.maxFiles");
    expect(form).toContain("attachmentPolicy.maxFileSizeMb");
    expect(form).toContain("attachmentPolicy.acceptedFileTypeLabel");

    expect(validation).toContain('"image/jpeg"');
    expect(validation).toContain('"image/png"');
    expect(validation).toContain('"image/webp"');
    expect(validation).toContain('"image/gif"');
    expect(validation).toContain('"application/pdf"');
    expect(validation).toContain(
      'serviceRequestAcceptedFileTypeLabel = "JPG, PNG, WebP, GIF או PDF"',
    );
    expect(validation).toContain("getServiceRequestAttachmentPolicy");
    expect(validation).toContain("maxServiceRequestFiles = 5");
    expect(validation).toContain("10 * 1024 * 1024");
  });

  it("keeps offline attachment recovery copy near the attachment input", () => {
    const form = read("src/app/service/_components/service-request-form.tsx");

    expect(form).toContain("queueOfflineServiceRequest");
    expect(form).toContain("אם השליחה לא הצליחה");
    expect(form).toContain("בדקו את החיבור ונסו שוב");
  });
});

const root = process.cwd();

function read(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}
