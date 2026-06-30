/**
 * Safely converts an unknown value (e.g. a JSON field, a rule leaf, a form
 * value) to a display string without ever producing "[object Object]". Used by
 * the rule engine, report builder, no-code forms and custom fields.
 */
export function toDisplayString(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "bigint"
  ) {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map((item) => toDisplayString(item)).join(", ");
  }
  return JSON.stringify(value);
}
