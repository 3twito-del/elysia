import { AI_RUN_KIND } from "~/server/ai/constants";
import type { AiActionContext } from "~/server/ai/commerce-actions";
import type { AiPlanningContext } from "~/server/ai/planner";

export type AiToolPolicyContext = AiActionContext & {
  planning?: AiPlanningContext;
};

export type AiCommerceToolName =
  | "searchCatalog"
  | "saveStyleProfile"
  | "createTryOnSession"
  | "orderSupport";

export class AiToolPolicyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiToolPolicyError";
  }
}

export function assertAiToolPolicy(input: {
  toolName: AiCommerceToolName;
  toolInput: unknown;
  context: AiToolPolicyContext;
}) {
  const planning = input.context.planning;

  if (!planning) return;

  if (input.toolName === "searchCatalog") {
    if (planning.shouldUseCatalog) return;

    throw new AiToolPolicyError(
      "Catalog search is only allowed for catalog, gift, style, or try-on intents.",
    );
  }

  if (input.toolName === "saveStyleProfile") {
    if (planning.kind === AI_RUN_KIND.styleProfile) return;

    throw new AiToolPolicyError(
      "Style profile writes are only allowed for explicit style profile intents.",
    );
  }

  if (input.toolName === "createTryOnSession") {
    if (planning.kind === AI_RUN_KIND.tryOn) return;

    throw new AiToolPolicyError(
      "Try-on session creation is only allowed for explicit try-on intents.",
    );
  }

  if (input.toolName === "orderSupport") {
    if (
      planning.kind === AI_RUN_KIND.orderSupport &&
      hasOrderSupportInput(input.toolInput)
    ) {
      return;
    }

    throw new AiToolPolicyError(
      "Order support lookup requires explicit order support intent, order number, and email.",
    );
  }
}

function hasOrderSupportInput(value: unknown) {
  if (!value || typeof value !== "object") return false;

  const record = value as Record<string, unknown>;

  return (
    typeof record.orderNumber === "string" &&
    record.orderNumber.trim().length >= 3 &&
    typeof record.email === "string" &&
    record.email.includes("@")
  );
}
