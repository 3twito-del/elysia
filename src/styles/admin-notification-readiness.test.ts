import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("admin notification readiness", () => {
  it("keeps push readiness and disabled-send copy visible", () => {
    const page = read("src/app/admin/notifications/page.tsx");
    const form = read(
      "src/app/admin/notifications/admin-push-campaign-form.tsx",
    );

    expect(page).toContain('data-testid="admin-notification-readiness"');
    expect(page).toContain(
      'data-testid="admin-notification-send-disabled-copy"',
    );
    expect(page).toContain("<AdminPushCampaignForm configured={configured} />");
    expect(page).toContain("campaign.lastError");
    expect(form).toContain("type AdminPushCampaignFormProps");
    expect(form).toContain("configured: boolean");
    expect(form).toContain('data-testid="admin-push-send-now-readiness"');
    expect(form).toContain("disabled={!configured}");
    expect(form).toContain("זמין אחרי הגדרת VAPID");
  });
});

function read(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}
