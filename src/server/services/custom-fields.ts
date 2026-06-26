import { Prisma } from "@prisma/client";

import { db } from "~/server/db";

/**
 * Custom fields on any entity without a schema change (WFL-002). A definition is
 * keyed by (entityType, key); values are stored as strings against an entity row
 * and coerced/validated by the field's type. The coercion is pure + tested.
 */

export const CUSTOM_FIELD_TYPES = [
  "TEXT",
  "NUMBER",
  "BOOLEAN",
  "DATE",
  "SELECT",
] as const;

export type CustomFieldType = (typeof CUSTOM_FIELD_TYPES)[number];

function normalizeType(value: string | undefined): CustomFieldType {
  return value && (CUSTOM_FIELD_TYPES as readonly string[]).includes(value)
    ? (value as CustomFieldType)
    : "TEXT";
}

function parseOptions(value: Prisma.JsonValue | null | undefined): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((option) => String(option));
}

export type CoercionResult = {
  ok: boolean;
  value: string | null;
  error?: string;
};

/** Validates + normalises a raw value to its stored string form. Pure. */
export function coerceFieldValue(
  field: { fieldType: string; required: boolean; options?: string[] | null },
  raw: unknown,
): CoercionResult {
  const isEmpty =
    raw === undefined ||
    raw === null ||
    (typeof raw === "string" && raw.trim() === "");

  if (isEmpty) {
    if (field.required) return { ok: false, value: null, error: "שדה חובה." };
    return { ok: true, value: null };
  }

  switch (field.fieldType) {
    case "NUMBER": {
      const num = Number(raw);
      return Number.isFinite(num)
        ? { ok: true, value: String(num) }
        : { ok: false, value: null, error: "ערך חייב להיות מספר." };
    }
    case "BOOLEAN":
      return {
        ok: true,
        value: raw === true || raw === "true" || raw === "1" ? "true" : "false",
      };
    case "DATE": {
      const time = new Date(String(raw)).getTime();
      return Number.isNaN(time)
        ? { ok: false, value: null, error: "תאריך לא תקין." }
        : { ok: true, value: String(raw) };
    }
    case "SELECT":
      return field.options?.includes(String(raw))
        ? { ok: true, value: String(raw) }
        : { ok: false, value: null, error: "ערך לא חוקי." };
    default:
      return { ok: true, value: String(raw) };
  }
}

const asJson = (value: unknown) => value as Prisma.InputJsonValue;

/** Defines (or updates) a custom field on an entity type. */
export async function defineCustomField(input: {
  entityType: string;
  key: string;
  label: string;
  fieldType?: string;
  required?: boolean;
  options?: string[];
}) {
  const entityType = input.entityType.trim();
  const key = input.key.trim();
  if (!entityType || !key) throw new Error("סוג ישות ומפתח הם שדות חובה.");
  if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(key)) {
    throw new Error("מפתח חייב להתחיל באות ולהכיל אותיות/ספרות/קו-תחתון בלבד.");
  }
  if (!input.label.trim()) throw new Error("תווית היא שדה חובה.");

  const fieldType = normalizeType(input.fieldType);
  if (fieldType === "SELECT" && (input.options?.length ?? 0) === 0) {
    throw new Error("שדה בחירה דורש אפשרויות.");
  }

  return db.customFieldDefinition.upsert({
    where: { entityType_key: { entityType, key } },
    create: {
      entityType,
      key,
      label: input.label.trim(),
      fieldType,
      required: input.required ?? false,
      ...(input.options ? { options: asJson(input.options) } : {}),
    },
    update: {
      label: input.label.trim(),
      fieldType,
      required: input.required ?? false,
      ...(input.options ? { options: asJson(input.options) } : {}),
    },
  });
}

export async function setCustomFieldActive(input: {
  fieldId: string;
  isActive: boolean;
}) {
  return db.customFieldDefinition.update({
    where: { id: input.fieldId },
    data: { isActive: input.isActive },
  });
}

/** Sets a custom field's value on a specific entity row (coerced + validated). */
export async function setCustomFieldValue(input: {
  fieldId: string;
  entityId: string;
  value: unknown;
}) {
  const field = await db.customFieldDefinition.findUnique({
    where: { id: input.fieldId },
  });
  if (!field) throw new Error("שדה מותאם לא נמצא.");

  const coerced = coerceFieldValue(
    {
      fieldType: field.fieldType,
      required: field.required,
      options: parseOptions(field.options),
    },
    input.value,
  );
  if (!coerced.ok) throw new Error(`${field.label}: ${coerced.error}`);

  return db.customFieldValue.upsert({
    where: { fieldId_entityId: { fieldId: field.id, entityId: input.entityId } },
    create: {
      fieldId: field.id,
      entityType: field.entityType,
      entityId: input.entityId,
      value: coerced.value,
    },
    update: { value: coerced.value },
  });
}

/** Active custom fields for an entity type (for rendering a form). */
export async function listCustomFields(entityType?: string) {
  const fields = await db.customFieldDefinition.findMany({
    where: { ...(entityType ? { entityType } : {}), isActive: true },
    orderBy: [{ entityType: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      entityType: true,
      key: true,
      label: true,
      fieldType: true,
      required: true,
      options: true,
      _count: { select: { values: true } },
    },
  });

  return fields.map((field) => ({
    id: field.id,
    entityType: field.entityType,
    key: field.key,
    label: field.label,
    fieldType: field.fieldType,
    required: field.required,
    options: parseOptions(field.options),
    valueCount: field._count.values,
  }));
}

/** Resolves all custom field values for one entity row, with their labels. */
export async function getCustomFieldValues(entityType: string, entityId: string) {
  const fields = await db.customFieldDefinition.findMany({
    where: { entityType, isActive: true },
    orderBy: { createdAt: "asc" },
    include: {
      values: { where: { entityId }, take: 1 },
    },
  });

  return fields.map((field) => ({
    fieldId: field.id,
    key: field.key,
    label: field.label,
    fieldType: field.fieldType,
    value: field.values[0]?.value ?? null,
  }));
}

export async function getCustomFieldsSummary() {
  const [fields, values, entityGroups] = await Promise.all([
    db.customFieldDefinition.count({ where: { isActive: true } }),
    db.customFieldValue.count(),
    db.customFieldDefinition.groupBy({
      by: ["entityType"],
      where: { isActive: true },
    }),
  ]);

  return { fields, values, entityTypes: entityGroups.length };
}
