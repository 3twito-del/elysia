import { describe, expect, it } from "vitest";

import { sanitizeAdminRedirect } from "./admin-redirect";

describe("admin redirect sanitization", () => {
  it("keeps internal admin redirects", () => {
    expect(sanitizeAdminRedirect("/admin")).toBe("/admin");
    expect(sanitizeAdminRedirect("/admin?tab=orders")).toBe(
      "/admin?tab=orders",
    );
    expect(sanitizeAdminRedirect("/admin/orders?status=open")).toBe(
      "/admin/orders?status=open",
    );
  });

  it("rejects external, protocol-relative, and non-admin redirects", () => {
    expect(sanitizeAdminRedirect("https://evil.example/admin")).toBe("/admin");
    expect(sanitizeAdminRedirect("//evil.example/admin")).toBe("/admin");
    expect(sanitizeAdminRedirect("/administrator")).toBe("/admin");
    expect(sanitizeAdminRedirect("/admin.evil")).toBe("/admin");
    expect(sanitizeAdminRedirect("/account")).toBe("/admin");
    expect(sanitizeAdminRedirect(undefined)).toBe("/admin");
  });
});
