function readEnv(name: string) {
  const value = process.env[name]?.trim();

  return value === "" ? undefined : value;
}

export const publicContactEmail =
  readEnv("OPERATIONS_EMAIL") ??
  readEnv("STORE_FROM_EMAIL") ??
  "orders@aphrodite.local";

export const publicContactPhone = "03-5550101";

export const publicBusinessName = readEnv("LEGAL_BUSINESS_NAME") ?? "Aphrodite";

export const publicBusinessId =
  readEnv("LEGAL_BUSINESS_ID") ?? "יש לעדכן מספר עוסק/חברה";

export const publicBusinessAddress =
  readEnv("LEGAL_BUSINESS_ADDRESS") ?? "דיזנגוף 148, תל אביב";

export const publicAccessibilityCoordinatorName =
  readEnv("ACCESSIBILITY_COORDINATOR_NAME") ?? "רכז/ת הנגישות של Aphrodite";
