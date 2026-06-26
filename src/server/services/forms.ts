import { Prisma } from "@prisma/client";

import { db } from "~/server/db";

/**
 * No-code form builder (WFL-002): define a form over a field schema and collect
 * submissions, with no schema migration per form. The schema + submission
 * validators are pure and unit-tested.
 */

export const FIELD_TYPES = [
  "TEXT",
  "TEXTAREA",
  "NUMBER",
  "BOOLEAN",
  "DATE",
  "SELECT",
  "EMAIL",
] as const;

export type FieldType = (typeof FIELD_TYPES)[number];

export type FormField = {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[];
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Builds a URL-safe slug from a name (keeps Hebrew letters). Pure. */
export function slugify(input: string): string {
  const base = input
    .trim()
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
  return base || "form";
}

function parseFields(value: Prisma.JsonValue | null | undefined): FormField[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (field) => !!field && typeof field === "object" && !Array.isArray(field),
  ) as unknown as FormField[];
}

/** Validates a field schema, returning human errors. Pure. */
export function validateFields(fields: unknown): string[] {
  if (!Array.isArray(fields) || fields.length === 0) {
    return ["יש להגדיר לפחות שדה אחד."];
  }

  const errors: string[] = [];
  const seen = new Set<string>();
  fields.forEach((raw, index) => {
    const position = index + 1;
    if (!raw || typeof raw !== "object") {
      errors.push(`שדה ${position}: מבנה לא תקין.`);
      return;
    }
    const field = raw as FormField;
    if (!field.key || typeof field.key !== "string") {
      errors.push(`שדה ${position}: חסר מפתח (key).`);
    } else if (seen.has(field.key)) {
      errors.push(`שדה ${position}: מפתח כפול (${field.key}).`);
    } else {
      seen.add(field.key);
    }
    if (!field.label || typeof field.label !== "string") {
      errors.push(`שדה ${position}: חסרה תווית.`);
    }
    if (!(FIELD_TYPES as readonly string[]).includes(field.type)) {
      errors.push(`שדה ${position}: סוג לא נתמך (${String(field.type)}).`);
    }
    if (
      field.type === "SELECT" &&
      (!Array.isArray(field.options) || field.options.length === 0)
    ) {
      errors.push(`שדה ${position}: שדה בחירה דורש אפשרויות.`);
    }
  });
  return errors;
}

export type SubmissionResult = {
  ok: boolean;
  errors: string[];
  values: Record<string, unknown>;
};

/** Validates and normalises a submission against a field schema. Pure. */
export function validateSubmission(
  fields: FormField[],
  data: Record<string, unknown>,
): SubmissionResult {
  const errors: string[] = [];
  const values: Record<string, unknown> = {};

  for (const field of fields) {
    const raw = data[field.key];
    const isEmpty =
      raw === undefined ||
      raw === null ||
      (typeof raw === "string" && raw.trim() === "");

    if (isEmpty) {
      if (field.required) errors.push(`שדה חובה: ${field.label}.`);
      continue;
    }

    switch (field.type) {
      case "NUMBER": {
        const num = Number(raw);
        if (!Number.isFinite(num)) {
          errors.push(`${field.label} חייב להיות מספר.`);
        } else {
          values[field.key] = num;
        }
        break;
      }
      case "BOOLEAN":
        values[field.key] = raw === true || raw === "true" || raw === "1";
        break;
      case "DATE": {
        const time = new Date(String(raw)).getTime();
        if (Number.isNaN(time)) {
          errors.push(`${field.label} חייב להיות תאריך תקין.`);
        } else {
          values[field.key] = String(raw);
        }
        break;
      }
      case "SELECT":
        if (!field.options?.includes(String(raw))) {
          errors.push(`${field.label}: ערך לא חוקי.`);
        } else {
          values[field.key] = String(raw);
        }
        break;
      case "EMAIL":
        if (!emailRegex.test(String(raw))) {
          errors.push(`${field.label} חייב להיות דוא"ל תקין.`);
        } else {
          values[field.key] = String(raw);
        }
        break;
      default:
        values[field.key] = String(raw);
    }
  }

  return { ok: errors.length === 0, errors, values };
}

const asJson = (value: unknown) => value as Prisma.InputJsonValue;

/** Creates a form with a validated field schema and a unique slug. */
export async function createForm(input: {
  name: string;
  description?: string;
  fields: FormField[];
}) {
  if (!input.name.trim()) throw new Error("שם הטופס הוא שדה חובה.");

  const fieldErrors = validateFields(input.fields);
  if (fieldErrors.length > 0) throw new Error(fieldErrors.join(" "));

  const base = slugify(input.name);
  let slug = base;
  let suffix = 1;
  while (await db.formDefinition.findUnique({ where: { slug } })) {
    suffix += 1;
    slug = `${base}-${suffix}`;
  }

  return db.formDefinition.create({
    data: {
      slug,
      name: input.name.trim(),
      description: input.description,
      fields: asJson(input.fields),
    },
  });
}

export async function setFormActive(input: {
  formId: string;
  isActive: boolean;
}) {
  return db.formDefinition.update({
    where: { id: input.formId },
    data: { isActive: input.isActive },
  });
}

/** Records a submission after validating it against the form schema. */
export async function submitForm(input: {
  formId: string;
  data: Record<string, unknown>;
  submittedById?: string;
}) {
  const form = await db.formDefinition.findUnique({
    where: { id: input.formId },
    select: { id: true, isActive: true, fields: true },
  });
  if (!form) throw new Error("טופס לא נמצא.");
  if (!form.isActive) throw new Error("הטופס אינו פעיל.");

  const result = validateSubmission(parseFields(form.fields), input.data);
  if (!result.ok) throw new Error(result.errors.join(" "));

  return db.formSubmission.create({
    data: {
      formId: form.id,
      data: asJson(result.values),
      submittedById: input.submittedById,
    },
  });
}

export async function listForms(limit = 20) {
  const forms = await db.formDefinition.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      slug: true,
      name: true,
      fields: true,
      isActive: true,
      _count: { select: { submissions: true } },
    },
  });

  return forms.map((form) => ({
    id: form.id,
    slug: form.slug,
    name: form.name,
    fieldCount: parseFields(form.fields).length,
    isActive: form.isActive,
    submissionCount: form._count.submissions,
  }));
}

export async function getFormsSummary() {
  const [forms, submissions, active] = await Promise.all([
    db.formDefinition.count(),
    db.formSubmission.count(),
    db.formDefinition.count({ where: { isActive: true } }),
  ]);

  return { forms, active, submissions };
}
