import { describe, expect, it } from "vitest";

import {
  slugify,
  validateFields,
  validateSubmission,
  type FormField,
} from "./forms";

describe("slugify", () => {
  it("keeps Hebrew letters and dashes spaces", () => {
    expect(slugify("טופס פנייה חדש")).toBe("טופס-פנייה-חדש");
    expect(slugify("Lead Intake!!")).toBe("lead-intake");
    expect(slugify("   ")).toBe("form");
  });
});

describe("validateFields", () => {
  it("requires at least one field", () => {
    expect(validateFields([])).toEqual(["יש להגדיר לפחות שדה אחד."]);
  });

  it("flags duplicate keys and SELECT without options", () => {
    expect(
      validateFields([
        { key: "a", label: "A", type: "TEXT" },
        { key: "a", label: "A2", type: "TEXT" },
        { key: "b", label: "B", type: "SELECT" },
      ]),
    ).toEqual([
      "שדה 2: מפתח כפול (a).",
      "שדה 3: שדה בחירה דורש אפשרויות.",
    ]);
  });

  it("accepts a valid schema", () => {
    expect(
      validateFields([
        { key: "name", label: "שם", type: "TEXT", required: true },
        { key: "tier", label: "דרגה", type: "SELECT", options: ["A", "B"] },
      ]),
    ).toEqual([]);
  });
});

describe("validateSubmission", () => {
  const fields: FormField[] = [
    { key: "name", label: "שם", type: "TEXT", required: true },
    { key: "age", label: "גיל", type: "NUMBER" },
    { key: "email", label: "דוא\"ל", type: "EMAIL" },
    { key: "tier", label: "דרגה", type: "SELECT", options: ["A", "B"] },
  ];

  it("normalises valid data", () => {
    const result = validateSubmission(fields, {
      name: "דני",
      age: "42",
      email: "d@e.com",
      tier: "A",
    });
    expect(result.ok).toBe(true);
    expect(result.values).toEqual({
      name: "דני",
      age: 42,
      email: "d@e.com",
      tier: "A",
    });
  });

  it("collects errors for required, number, email and select", () => {
    const result = validateSubmission(fields, {
      age: "abc",
      email: "nope",
      tier: "Z",
    });
    expect(result.ok).toBe(false);
    expect(result.errors).toEqual([
      "שדה חובה: שם.",
      "גיל חייב להיות מספר.",
      'דוא"ל חייב להיות דוא"ל תקין.',
      "דרגה: ערך לא חוקי.",
    ]);
  });
});
