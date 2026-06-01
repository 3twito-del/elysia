export function sanitizeAdminRedirect(value: unknown) {
  if (typeof value !== "string") {
    return "/admin";
  }

  const normalizedValue = normalizeRedirectValue(value);

  if (normalizedValue === "/admin") {
    return normalizedValue;
  }

  if (
    normalizedValue.startsWith("/admin/") ||
    normalizedValue.startsWith("/admin?")
  ) {
    return normalizedValue;
  }

  return "/admin";
}

function normalizeRedirectValue(value: string) {
  const trimmed = value.trim();
  const decoded = decodeRedirectValue(trimmed).trim();

  if (hasUnsafeRedirectSyntax(decoded)) {
    return "/admin";
  }

  return decoded;
}

function decodeRedirectValue(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function hasUnsafeRedirectSyntax(value: string) {
  return (
    value === "" ||
    /[\u0000-\u001f\u007f]/u.test(value) ||
    value.startsWith("//") ||
    value.startsWith("\\\\") ||
    /^[a-z][a-z0-9+.-]*:/iu.test(value)
  );
}
