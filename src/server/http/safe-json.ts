export type SafeJsonResult =
  | { ok: true; data: unknown }
  | { ok: false; error: "empty" | "invalid" | "too-large" };

export type SafeJsonError = Extract<SafeJsonResult, { ok: false }>["error"];

export type SafeTextResult =
  | { ok: true; text: string }
  | { ok: false; error: "empty" | "too-large" };

export type SafeBodyOptions = {
  allowEmpty?: boolean;
  maxBytes?: number;
};

export type SafeJsonFailureCopy = Partial<Record<SafeJsonError, string>>;

export type SafeJsonFailureContract = {
  status: 400 | 413;
  body: {
    ok: false;
    error: string;
  };
};

const DEFAULT_MAX_BODY_BYTES = 64 * 1024;
const defaultSafeJsonFailureCopy = {
  empty: "Invalid request body.",
  invalid: "Invalid request body.",
  "too-large": "Request body is too large.",
} satisfies Record<SafeJsonError, string>;

export async function readSafeText(
  req: Request,
  options: SafeBodyOptions = {},
): Promise<SafeTextResult> {
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BODY_BYTES;
  const contentLength = parseContentLength(req.headers.get("content-length"));

  if (contentLength !== null && contentLength > maxBytes) {
    return { ok: false, error: "too-large" };
  }

  if (!req.body) {
    return options.allowEmpty
      ? { ok: true, text: "" }
      : { ok: false, error: "empty" };
  }

  const reader = req.body.getReader();
  const decoder = new TextDecoder();
  const chunks: string[] = [];
  let byteLength = 0;

  while (true) {
    const { done, value } = await reader.read();

    if (done) break;

    byteLength += value.byteLength;

    if (byteLength > maxBytes) {
      await reader.cancel();

      return { ok: false, error: "too-large" };
    }

    chunks.push(decoder.decode(value, { stream: true }));
  }

  chunks.push(decoder.decode());

  const text = chunks.join("");

  if (!options.allowEmpty && !text.trim()) {
    return { ok: false, error: "empty" };
  }

  return { ok: true, text };
}

export async function readSafeJson(
  req: Request,
  options: SafeBodyOptions = {},
): Promise<SafeJsonResult> {
  const body = await readSafeText(req, options);

  if (!body.ok) return body;

  try {
    return { ok: true, data: JSON.parse(body.text) as unknown };
  } catch {
    return { ok: false, error: "invalid" };
  }
}

export function getSafeJsonFailureContract(
  error: SafeJsonError,
  copy: SafeJsonFailureCopy = {},
): SafeJsonFailureContract {
  return {
    status: error === "too-large" ? 413 : 400,
    body: {
      ok: false,
      error: copy[error] ?? defaultSafeJsonFailureCopy[error],
    },
  };
}

function parseContentLength(value: string | null) {
  if (!value) return null;

  const parsed = Number(value);

  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : null;
}
