import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("admin service queue filter state", () => {
  it("normalizes service queue query params before calling backend services", () => {
    const source = read("src/app/admin/service/page.tsx");

    expect(source).toContain("function pageParam(");
    expect(source).toContain("function serviceStatusParam(");
    expect(source).toContain("page: pageParam(query.page)");
    expect(source).toContain("status: serviceStatusParam(query.status)");
    expect(source).not.toContain("Number(firstParam(query.page) ?? 1)");
    expect(source).not.toContain("optionalParam(query.status) as");
  });

  it("keeps filtered service queue states recoverable and distinct", () => {
    const source = read("src/app/admin/service/page.tsx");

    expect(source).toContain('data-testid="admin-service-active-filters"');
    expect(source).toContain("const activeFilterLabels = [");
    expect(source).toContain("נושא לא זמין");
    expect(source).toContain("אין פניות שירות מתאימות");
    expect(source).toContain("לא נמצאו פניות לפי הסינון הנוכחי");
    expect(source).toContain("פניות מהטופס הציבורי יופיעו כאן לטיפול ומעקב.");
    expect(source).toContain('<Link href="/admin/service">ניקוי סינון</Link>');
  });

  it("keeps service status terminology aligned with the shared lifecycle labels", () => {
    const source = read("src/app/admin/service/page.tsx");

    expect(source).toContain("serviceRequestStatuses.includes");
    expect(source).toContain("getServiceRequestStatusLabel(params.status)");
    expect(source).toContain("getServiceRequestStatusLabel(request.status)");
    expect(source).toContain("getServiceRequestStatusLabel(status)");
  });
});

function read(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}
