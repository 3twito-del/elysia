export const LEGAL_TERMS_VERSION = "2026-05-07";
export const LEGAL_PRIVACY_VERSION = "2026-05-07";

export const legalAcceptanceSchemaFields = {
  termsVersion: LEGAL_TERMS_VERSION,
  privacyVersion: LEGAL_PRIVACY_VERSION,
} as const;

export type LegalAcceptanceRecord = typeof legalAcceptanceSchemaFields & {
  acceptedAt: string;
};

export function createLegalAcceptanceRecord(): LegalAcceptanceRecord {
  return {
    ...legalAcceptanceSchemaFields,
    acceptedAt: new Date().toISOString(),
  };
}
