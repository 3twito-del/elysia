type AdminUserStatusRecord = {
  disabledAt?: Date | null;
  passwordHash?: string | null;
};

type EnabledAdminUserStatusRecord = AdminUserStatusRecord & {
  disabledAt?: null;
  passwordHash: string;
};

export const inactiveAdminLoginMessage =
  "פרטי ההתחברות אינם תואמים לאדמין פעיל.";

export function isAdminUserEnabled(
  admin: AdminUserStatusRecord | null,
): admin is EnabledAdminUserStatusRecord {
  return Boolean(admin?.passwordHash && !admin.disabledAt);
}
