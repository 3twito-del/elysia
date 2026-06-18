import { describe, expect, it } from "vitest";

import { createAdminLoginAuditMetadata } from "./admin-login-audit";

describe("admin login audit", () => {
  it("records normalized, non-raw identifiers for login events", () => {
    const first = createAdminLoginAuditMetadata({
      email: " Admin@Example.com ",
      outcome: "rate_limited",
      redirectTo: "/admin/orders",
      retryAfterSeconds: 42,
    });
    const second = createAdminLoginAuditMetadata({
      email: "admin@example.com",
      outcome: "rate_limited",
      redirectTo: "/admin/orders",
    });
    const serialized = JSON.stringify(first);

    expect(first.emailHash).toBe(second.emailHash);
    expect(first.emailHash).toMatch(/^[a-f0-9]{64}$/);
    expect(first).toMatchObject({
      outcome: "rate_limited",
      redirectTo: "/admin/orders",
      retryAfterSeconds: 42,
    });
    expect(serialized).not.toContain("Admin@Example.com");
    expect(serialized).not.toContain("admin@example.com");
  });

  it("records disabled admin login attempts without raw email", () => {
    const metadata = createAdminLoginAuditMetadata({
      email: "disabled-admin@example.com",
      outcome: "disabled",
      redirectTo: "/admin",
    });
    const serialized = JSON.stringify(metadata);

    expect(metadata).toMatchObject({
      outcome: "disabled",
      redirectTo: "/admin",
    });
    expect(metadata.emailHash).toMatch(/^[a-f0-9]{64}$/);
    expect(serialized).not.toContain("disabled-admin@example.com");
  });
});
