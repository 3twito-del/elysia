export type AccountServiceHrefInput = {
  message?: string;
  orderNumber?: string | null;
  productReference?: string | null;
  topic: "accessibility-privacy" | "order" | "returns" | "sizing";
};

export function createAccountServiceHref(input: AccountServiceHrefInput) {
  const params = new URLSearchParams({ topic: input.topic });

  appendOptionalParam(params, "orderNumber", input.orderNumber);
  appendOptionalParam(params, "productReference", input.productReference);
  appendOptionalParam(params, "message", input.message);

  return `/service?${params.toString()}`;
}

function appendOptionalParam(
  params: URLSearchParams,
  key: string,
  value: string | null | undefined,
) {
  const normalized = value?.trim();

  if (normalized) {
    params.set(key, normalized);
  }
}
