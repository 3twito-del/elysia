export function sanitizeAdminRedirect(value: unknown) {
  if (typeof value !== "string") {
    return "/admin";
  }

  if (!value.startsWith("/admin") || value.startsWith("//")) {
    return "/admin";
  }

  return value;
}
