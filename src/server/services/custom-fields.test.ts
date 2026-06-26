import { describe, expect, it } from "vitest";

import { coerceFieldValue } from "./custom-fields";

describe("coerceFieldValue", () => {
  it("rejects an empty required value but allows empty optional", () => {
    expect(coerceFieldValue({ fieldType: "TEXT", required: true }, "")).toEqual({
      ok: false,
      value: null,
      error: "שדה חובה.",
    });
    expect(coerceFieldValue({ fieldType: "TEXT", required: false }, "")).toEqual({
      ok: true,
      value: null,
    });
  });

  it("coerces numbers and rejects non-numeric", () => {
    expect(coerceFieldValue({ fieldType: "NUMBER", required: false }, "12")).toEqual({
      ok: true,
      value: "12",
    });
    expect(coerceFieldValue({ fieldType: "NUMBER", required: false }, "x")).toEqual({
      ok: false,
      value: null,
      error: "ערך חייב להיות מספר.",
    });
  });

  it("normalises booleans", () => {
    expect(coerceFieldValue({ fieldType: "BOOLEAN", required: false }, "1")).toEqual({
      ok: true,
      value: "true",
    });
    expect(
      coerceFieldValue({ fieldType: "BOOLEAN", required: false }, false),
    ).toEqual({ ok: true, value: "false" });
  });

  it("validates SELECT against options", () => {
    const field = { fieldType: "SELECT", required: false, options: ["A", "B"] };
    expect(coerceFieldValue(field, "A")).toEqual({ ok: true, value: "A" });
    expect(coerceFieldValue(field, "Z")).toEqual({
      ok: false,
      value: null,
      error: "ערך לא חוקי.",
    });
  });

  it("rejects an invalid date", () => {
    expect(
      coerceFieldValue({ fieldType: "DATE", required: false }, "not-a-date"),
    ).toEqual({ ok: false, value: null, error: "תאריך לא תקין." });
  });
});
