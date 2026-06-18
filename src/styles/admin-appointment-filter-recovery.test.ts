import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("admin appointment filter recovery", () => {
  it("keeps appointment filters recoverable and distinct", () => {
    const appointmentsPage = read("src/app/admin/appointments/page.tsx");

    expect(appointmentsPage).toContain("const activeFilterLabels = [");
    expect(appointmentsPage).toContain(
      'data-testid="admin-appointment-active-filters"',
    );
    expect(appointmentsPage).toContain("getAppointmentSortLabel");
    expect(appointmentsPage).toContain("אין תורים שמתאימים לסינון");
    expect(appointmentsPage).toContain("אין תיאומי שירות");
    expect(appointmentsPage).toContain(
      '<Link href="/admin/appointments">ניקוי סינון</Link>',
    );
    expect(appointmentsPage).toContain('basePath="/admin/appointments"');
    expect(
      indexOf(appointmentsPage, 'action="/admin/appointments"'),
    ).toBeLessThan(
      indexOf(
        appointmentsPage,
        'data-testid="admin-appointment-active-filters"',
      ),
    );
  });
});

function read(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

function indexOf(source: string, pattern: string) {
  const index = source.indexOf(pattern);

  expect(index, pattern).toBeGreaterThanOrEqual(0);

  return index;
}
