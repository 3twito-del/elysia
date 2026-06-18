import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { sanitizeAdminRedirect } from "./admin-redirect";

describe("admin redirect sanitization", () => {
  it("keeps internal admin redirects", () => {
    expect(sanitizeAdminRedirect("/admin")).toBe("/admin");
    expect(sanitizeAdminRedirect(" /admin ")).toBe("/admin");
    expect(sanitizeAdminRedirect("%2Fadmin%2Forders")).toBe("/admin/orders");
    expect(sanitizeAdminRedirect("/admin?tab=orders")).toBe(
      "/admin?tab=orders",
    );
    expect(sanitizeAdminRedirect("/admin/orders?status=open")).toBe(
      "/admin/orders?status=open",
    );
  });

  it("rejects external, protocol-relative, and non-admin redirects", () => {
    expect(sanitizeAdminRedirect("https://evil.example/admin")).toBe("/admin");
    expect(sanitizeAdminRedirect(" https://evil.example/admin ")).toBe(
      "/admin",
    );
    expect(sanitizeAdminRedirect("javascript:alert(1)")).toBe("/admin");
    expect(sanitizeAdminRedirect("//evil.example/admin")).toBe("/admin");
    expect(sanitizeAdminRedirect("%2F%2Fevil.example%2Fadmin")).toBe("/admin");
    expect(sanitizeAdminRedirect("https%3A%2F%2Fevil.example%2Fadmin")).toBe(
      "/admin",
    );
    expect(sanitizeAdminRedirect("/admin%0A//evil.example")).toBe("/admin");
    expect(sanitizeAdminRedirect("/administrator")).toBe("/admin");
    expect(sanitizeAdminRedirect("/admin.evil")).toBe("/admin");
    expect(sanitizeAdminRedirect("/account")).toBe("/admin");
    expect(sanitizeAdminRedirect(undefined)).toBe("/admin");
  });

  it("keeps the QA evidence note aligned with the sanitizer coverage", () => {
    const evidence = read("docs/qa/admin-login-redirect-evidence.md");
    const loginPage = read("src/app/admin/login/page.tsx");

    expect(evidence).toContain("sanitizeAdminRedirect");
    expect(evidence).toContain("protocol-relative");
    expect(evidence).toContain("control-character");
    expect(evidence).toContain("/admin/...");
    expect(loginPage).toContain("sanitizeAdminRedirect");
  });
});

function read(relativePath: string) {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}
