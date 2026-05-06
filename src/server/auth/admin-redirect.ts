export function sanitizeAdminRedirect(value: unknown) {
  if (typeof value !== "string") {
    return "/admin";
  }

  if (value === "/admin") {
    return value;
  }

  if (value.startsWith("/admin/") || value.startsWith("/admin?")) {
    return value;
  }

  return "/admin";
}
