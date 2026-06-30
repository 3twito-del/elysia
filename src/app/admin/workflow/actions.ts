"use server";

import type { AdminPermission } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "~/server/auth";
import {
  getAdminFromSession,
  hasAdminPermission,
} from "~/server/auth/admin-access";
import {
  createBusinessRule,
  deleteBusinessRule,
  setBusinessRuleActive,
  upsertSlaPolicy,
} from "~/server/services/business-rules";
import { defineCustomField } from "~/server/services/custom-fields";
import { createForm, setFormActive, type FormField } from "~/server/services/forms";
import type { WorkflowAction } from "~/server/services/workflow-actions";
import {
  createWorkflow,
  deleteWorkflow,
  runWorkflow,
  setWorkflowActive,
} from "~/server/services/workflows";

const UNARY_OPS = new Set(["exists", "truthy", "falsy"]);

export async function createWorkflowAction(formData: FormData) {
  await requireAdmin("ERP_WRITE");

  const name = stringValue(formData.get("name")).trim();
  if (!name) throw new Error("שם התהליך הוא שדה חובה.");

  const triggerType = stringValue(formData.get("triggerType")) || "MANUAL";
  const triggerEvent = optionalString(formData.get("triggerEvent"));

  const conditionField = optionalString(formData.get("conditionField"));
  const conditionOp = stringValue(formData.get("conditionOp")) || "eq";
  const conditionValueRaw = stringValue(formData.get("conditionValue"));
  const conditionRule = conditionField
    ? UNARY_OPS.has(conditionOp)
      ? { field: conditionField, op: conditionOp }
      : {
          field: conditionField,
          op: conditionOp,
          value: coerceValue(conditionValueRaw),
        }
    : undefined;

  await createWorkflow({
    name,
    description: optionalString(formData.get("description")),
    triggerType,
    triggerEvent,
    conditionRule,
    actions: [buildAction(formData)],
  });

  revalidatePath("/admin/workflow");
}

function buildAction(formData: FormData): WorkflowAction {
  const type = stringValue(formData.get("actionType")) || "LOG";
  const title = optionalString(formData.get("actionTitle"));
  const message = optionalString(formData.get("actionMessage"));

  if (type === "CREATE_APPROVAL") {
    return {
      type,
      config: { title: title ?? message ?? "בקשת אישור אוטומטית" },
    };
  }
  if (type === "WEBHOOK") {
    return { type, config: { url: message ?? "" } };
  }
  return { type, config: { message: message ?? title ?? "" } };
}

export async function toggleWorkflowAction(formData: FormData) {
  await requireAdmin("ERP_WRITE");

  const workflowId = stringValue(formData.get("workflowId"));
  if (!workflowId) throw new Error("חסר מזהה תהליך.");

  await setWorkflowActive({
    workflowId,
    isActive: formData.get("isActive") === "1",
  });

  revalidatePath("/admin/workflow");
}

export async function runWorkflowAction(formData: FormData) {
  await requireAdmin("ERP_WRITE");

  const workflowId = stringValue(formData.get("workflowId"));
  if (!workflowId) throw new Error("חסר מזהה תהליך.");

  await runWorkflow({ workflowId, context: {} });

  revalidatePath("/admin/workflow");
}

export async function deleteWorkflowAction(formData: FormData) {
  await requireAdmin("ERP_WRITE");

  const workflowId = stringValue(formData.get("workflowId"));
  if (!workflowId) throw new Error("חסר מזהה תהליך.");

  await deleteWorkflow({ workflowId });

  revalidatePath("/admin/workflow");
}

export async function createFormAction(formData: FormData) {
  await requireAdmin("ERP_WRITE");

  const name = stringValue(formData.get("name")).trim();
  if (!name) throw new Error("שם הטופס הוא שדה חובה.");

  const fields = parseFieldsSpec(stringValue(formData.get("fieldsSpec")));
  if (fields.length === 0) {
    throw new Error("יש להגדיר לפחות שדה אחד (key|label|type|required).");
  }

  await createForm({
    name,
    description: optionalString(formData.get("description")),
    fields,
  });

  revalidatePath("/admin/workflow");
}

export async function toggleFormAction(formData: FormData) {
  await requireAdmin("ERP_WRITE");

  const formId = stringValue(formData.get("formId"));
  if (!formId) throw new Error("חסר מזהה טופס.");

  await setFormActive({ formId, isActive: formData.get("isActive") === "1" });

  revalidatePath("/admin/workflow");
}

export async function defineCustomFieldAction(formData: FormData) {
  await requireAdmin("ERP_WRITE");

  const entityType = stringValue(formData.get("entityType")).trim();
  const key = stringValue(formData.get("key")).trim();
  const label = stringValue(formData.get("label")).trim();
  if (!entityType || !key || !label) {
    throw new Error("סוג ישות, מפתח ותווית הם שדות חובה.");
  }

  const optionsRaw = stringValue(formData.get("options")).trim();
  const options = optionsRaw
    ? optionsRaw
        .split(",")
        .map((option) => option.trim())
        .filter(Boolean)
    : undefined;

  await defineCustomField({
    entityType,
    key,
    label,
    fieldType: stringValue(formData.get("fieldType")) || "TEXT",
    required: formData.get("required") === "1",
    options,
  });

  revalidatePath("/admin/workflow");
}

/** Parses `key|label|type|required` lines into a field schema. */
function parseFieldsSpec(spec: string): FormField[] {
  return spec
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split("|").map((part) => part.trim());
      const key = parts[0] ?? "";
      const label = parts[1] ?? "";
      const type = parts[2] ?? "";
      const required = parts[3] ?? "";
      return {
        key,
        label: label.length > 0 ? label : key,
        type: (type.length > 0 ? type : "TEXT").toUpperCase() as FormField["type"],
        required: required === "1" || required === "true" || required === "כן",
      };
    })
    .filter((field) => field.key.length > 0);
}

function coerceValue(raw: string): unknown {
  if (raw === "") return "";
  if (raw === "true") return true;
  if (raw === "false") return false;
  const num = Number(raw);
  if (raw.trim() !== "" && Number.isFinite(num)) return num;
  return raw;
}

export async function createBusinessRuleAction(formData: FormData) {
  await requireAdmin("ERP_WRITE");

  const name = stringValue(formData.get("name")).trim();
  const entityType = stringValue(formData.get("entityType")).trim();
  if (!name || !entityType) throw new Error("שם וסוג ישות הם שדות חובה.");

  const field = optionalString(formData.get("conditionField"));
  const op = stringValue(formData.get("conditionOp")) || "eq";
  const valueRaw = stringValue(formData.get("conditionValue"));
  const conditionRule = field
    ? UNARY_OPS.has(op)
      ? { field, op }
      : { field, op, value: coerceValue(valueRaw) }
    : {};

  const actionType = stringValue(formData.get("actionType")) || "FLAG";
  const detail = optionalString(formData.get("actionDetail"));

  await createBusinessRule({
    name,
    entityType,
    conditionRule,
    action: { type: actionType, config: detail ? { label: detail } : undefined },
    priority: Number(stringValue(formData.get("priority"))) || 100,
  });

  revalidatePath("/admin/workflow");
}

export async function toggleBusinessRuleAction(formData: FormData) {
  await requireAdmin("ERP_WRITE");

  const ruleId = stringValue(formData.get("ruleId"));
  if (!ruleId) throw new Error("חסר מזהה חוק.");

  await setBusinessRuleActive({
    ruleId,
    isActive: formData.get("isActive") === "1",
  });

  revalidatePath("/admin/workflow");
}

export async function deleteBusinessRuleAction(formData: FormData) {
  await requireAdmin("ERP_WRITE");

  const ruleId = stringValue(formData.get("ruleId"));
  if (!ruleId) throw new Error("חסר מזהה חוק.");

  await deleteBusinessRule({ ruleId });

  revalidatePath("/admin/workflow");
}

export async function upsertSlaPolicyAction(formData: FormData) {
  await requireAdmin("ERP_WRITE");

  const name = stringValue(formData.get("name")).trim();
  const entityType = stringValue(formData.get("entityType")).trim();
  if (!name || !entityType) throw new Error("שם וסוג ישות הם שדות חובה.");

  await upsertSlaPolicy({
    name,
    entityType,
    tier: stringValue(formData.get("tier")) || "STANDARD",
    responseMinutes: Number(stringValue(formData.get("responseMinutes"))) || 60,
    resolutionMinutes:
      Number(stringValue(formData.get("resolutionMinutes"))) || 240,
  });

  revalidatePath("/admin/workflow");
}

async function requireAdmin(permission: AdminPermission) {
  const session = await auth();

  if (!session?.user) {
    redirect("/admin/login?next=/admin/workflow");
  }

  const admin = await getAdminFromSession(session);

  if (!admin || !hasAdminPermission(admin, permission)) {
    throw new Error("אין הרשאה לבצע את הפעולה המבוקשת.");
  }

  return admin;
}

function optionalString(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function stringValue(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value : "";
}
