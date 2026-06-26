import { describe, expect, it } from "vitest";

import {
  describeAction,
  interpolateConfig,
  interpolateString,
  planActions,
  validateActions,
} from "./workflow-actions";

describe("interpolateString", () => {
  it("substitutes dotted tokens", () => {
    expect(
      interpolateString("הזמנה {{order.id}} בסך {{order.total}}", {
        order: { id: "A1", total: 500 },
      }),
    ).toBe("הזמנה A1 בסך 500");
  });

  it("renders missing tokens as empty", () => {
    expect(interpolateString("שלום {{missing}}!", {})).toBe("שלום !");
  });
});

describe("interpolateConfig", () => {
  it("interpolates only string values", () => {
    expect(
      interpolateConfig({ title: "ל-{{name}}", amount: 100 }, { name: "דני" }),
    ).toEqual({ title: "ל-דני", amount: 100 });
  });
});

describe("validateActions", () => {
  it("requires at least one action", () => {
    expect(validateActions([])).toEqual(["יש להגדיר לפחות פעולה אחת."]);
  });

  it("requires a title for CREATE_APPROVAL", () => {
    expect(validateActions([{ type: "CREATE_APPROVAL", config: {} }])).toEqual([
      "פעולה 1: בקשת אישור דורשת כותרת.",
    ]);
  });

  it("flags an unknown action type", () => {
    expect(validateActions([{ type: "NUKE" }])).toEqual([
      "פעולה 1: סוג לא נתמך (NUKE).",
    ]);
  });

  it("accepts a valid set", () => {
    expect(
      validateActions([
        { type: "CREATE_APPROVAL", config: { title: "אישור" } },
        { type: "LOG", config: { message: "ok" } },
      ]),
    ).toEqual([]);
  });
});

describe("describeAction", () => {
  it("describes an approval action", () => {
    expect(
      describeAction({ type: "CREATE_APPROVAL", config: { title: "החזר" } }),
    ).toBe("פתיחת בקשת אישור: החזר");
  });
});

describe("planActions", () => {
  it("interpolates config and builds descriptions", () => {
    const plan = planActions(
      [{ type: "NOTIFY", config: { message: "סכום {{amount}}" } }],
      { amount: 999 },
    );
    expect(plan).toEqual([
      {
        type: "NOTIFY",
        config: { message: "סכום 999" },
        description: "שליחת התראה: סכום 999",
      },
    ]);
  });
});
